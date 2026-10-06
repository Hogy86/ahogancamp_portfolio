#!/usr/bin/env node
// Implements docs/mobile/architecture/mobile-architecture.md §7.5.3, extended by
// Amendment A8 / review-v1b N3 (§14.1 row N3): CI tracked-secret check. Scope is the
// WHOLE git repository, not just scaffold/ - `git ls-files -z` is run from the git
// top-level (found via `git rev-parse --show-toplevel`, no PATH assumption beyond a
// working `git` binary, which CI and this local run both have). Fails with the
// offending file (and line, for the line-based rules) if any of rules S1-S7 match.
// Runs first in the `build` job, before `npm ci` (§10.3), and locally via
// `npm run check:secrets`.
//
// docs/mobile/security/review-v1b.md "Addendum 1" (code-review-round1.md C3): S1's
// path-only match on `.env*` files is a false positive on committed `.env.example`/
// `.env.sample`/`.env.template` TEMPLATE files - a real project convention with no
// secret VALUES. S1 still fails every other `.env*` path (only the three exact
// basenames below are exempt), and S6 (below) content-scans every exempt file, so
// the whole-repository/fail-closed-on-content guarantee (N3) is unchanged.

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Addendum 1 item 1: case-sensitive, checked against the basename only. A frozen
// ARRAY, not a `Set` - `Object.freeze` on a `Set` freezes the binding, not the
// collection, so `.add()`/`.delete()` still silently succeed on a "frozen" Set
// (code-review-round3 L3). `Object.freeze` on an array makes every mutating
// method (`.push`, `.splice`, index assignment, etc.) throw in strict mode / no-op
// otherwise, so `Object.isFrozen()` here actually reflects the exemption list's
// immutability. Exported so a test can assert its exact membership instead of
// re-declaring its own copy of this list and testing that copy.
export const S1_TEMPLATE_BASENAMES = Object.freeze([
  '.env.example',
  '.env.sample',
  '.env.template',
]);

const RULES = [
  {
    id: 'S1',
    description: 'key/secret file tracked',
    // path matches, not content matches - checked against the repo-relative path itself.
    // review-v2 V2-L3: also cloud-credential files (the AWS console's `*accessKeys*.csv`
    // download, `credentials[.csv]`, Terraform state/vars) and a Firebase config
    // (`google-services.json`, V2-L4: adding one needs a security + Data safety review).
    pathPattern:
      /\.(jks|keystore|p12|pepk|pem|aab|apk)$|(^|\/)(keystore|key|signing)\.properties$|(^|\/)\.env(\.[^/]*)?$|(^|\/)[^/]*accessKeys[^/]*\.csv$|(^|\/)credentials(\.csv)?$|\.tfstate(\.|$)|terraform\.tfvars$|(^|\/)google-services\.json$/i,
  },
  {
    id: 'S2',
    description: 'password literal in Gradle',
    filePattern: /\.(gradle|gradle\.kts)$/,
    linePattern: /^\s*(storePassword|keyPassword)\s*=?\s*["']/,
  },
  {
    id: 'S3',
    description: 'signing values in a gradle.properties file',
    filePattern: /(^|\/)gradle\.properties$/,
    linePattern: /(storePassword|keyPassword|storeFile|keyAlias|android\.injected\.signing)/i,
  },
  {
    id: 'S4',
    description: 'debug key referenced for release signing',
    // Exact-file match, per §14.1 N3: a suffix match on android/app/build.gradle.
    filePattern: /(^|\/)android\/app\/build\.gradle$/,
    linePattern: /signingConfigs\.debug/,
  },
  {
    id: 'S5',
    description: 'Capacitor keystore options in capacitor.config.*',
    filePattern: /(^|\/)capacitor\.config\.[^/]+$/,
    linePattern: /keystore(Path|Password|Alias|AliasPassword)/i,
  },
];

// Addendum 1 item 2(a): secret-shaped content anywhere in the file, comments included.
const S6_CONTENT_PATTERNS = [
  /-----BEGIN [A-Z ]*(PRIVATE KEY|CERTIFICATE)-----/,
  /AKIA[0-9A-Z]{16}/,
  /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /xox[abprs]-[A-Za-z0-9-]{10,}/,
  /AIza[0-9A-Za-z_-]{35}/,
];

// Addendum 1 item 2(b): a KEY=VALUE line whose key looks secret-shaped.
const S6_SECRET_KEY_PATTERN =
  /(SECRET|PASSWORD|PASSWD|PASSPHRASE|TOKEN|API_?KEY|PRIVATE_?KEY|ACCESS_?KEY|CLIENT_?SECRET|CREDENTIAL|KEYSTORE|STORE_?PASS|KEY_?PASS|SIGNING)/i;
const S6_KEY_VALUE_LINE = /^([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*(.*)$/;

// review-v2 V2-L3, rule S7: the S6a content patterns run over every tracked text file
// under this size, so an AKIA key or PEM block pasted into any file (or a renamed
// credential file) still fails. Larger files are assumed to be assets, not source.
export const S7_MAX_BYTES = 1024 * 1024;

// Documented dummy values that appear in this repo's own security docs and tests, and
// so are not secrets. Exact strings only: a real key never equals one of these.
export const S7_KNOWN_DUMMY_VALUES = Object.freeze([
  'AKIAABCDEFGHIJKLMNOP',
  'AKIAIOSFODNN7EXAMPLE',
]);

// scikit-learn's notebook HTML output has CSS names such as `.sk-toggleable__label-arrow`
// with the shape of the `sk-` API-token pattern. They are all letters with no digit (a real
// 20+ character key virtually always has digits), so only digit-free `sk-` words are ignored
// by S7. There is deliberately no broader CSS-selector exception: a `#sk-proj-...` or
// `.sk-...` key that contains digits must still fail (code-review-round16 L1).
const SK_WORD_WITHOUT_DIGITS = /\bsk-[A-Za-z_-]+(?![A-Za-z0-9_-])/g;

function withoutKnownFalsePositives(line) {
  let cleaned = line.replace(SK_WORD_WITHOUT_DIGITS, '');
  for (const dummy of S7_KNOWN_DUMMY_VALUES) cleaned = cleaned.split(dummy).join('');
  return cleaned;
}

/** S7: returns "line (description)" strings for every line matching an S6a pattern.
 * Pure over the text, so it is unit-tested with inline fixtures. Files containing a
 * NUL byte are binary and yield nothing. */
export function scanTextForSecrets(text) {
  if (text.includes('\0')) return [];
  const failures = [];
  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = withoutKnownFalsePositives(rawLine);
    if (S6_CONTENT_PATTERNS.some((pattern) => pattern.test(line))) {
      failures.push(`${index + 1} (secret-shaped content in a tracked text file)`);
    }
  });
  return failures;
}

function stripSurroundingQuotes(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

/** Addendum 1 item 2: scans one exempt `.env.example`-shaped file's TEXT for
 * secret-shaped content. Exported as a pure function (item 4) so it is unit-tested
 * with inline string fixtures only - no committed `.env.*` fixtures. */
export function scanEnvTemplate(text) {
  const failures = [];
  // (a) round 2: splitting on `\n` alone left every line of a CRLF file ending in a
  // trailing `\r`, which the trailing `$` anchors in S6_KEY_VALUE_LINE's `(.*)$` never
  // match against (`.` does not match `\r`) - every line silently fell through to "not
  // a KEY=VALUE line" on a CRLF file, disabling rules (b) and (c) entirely.
  const lines = text.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;

    for (const pattern of S6_CONTENT_PATTERNS) {
      if (pattern.test(rawLine)) {
        failures.push(`${lineNumber} (a: env template contains secret-shaped content)`);
        return; // one failure per line is enough; (b)/(c) also key off KEY=VALUE shape.
      }
    }

    // (b)/(c) both key off a `KEY=VALUE` line, after stripping leading whitespace, at
    // most one leading `#`, then all whitespace after it (round 2: the old
    // `/^\s*#\s?/` stripped only ONE space after `#`, so `#  API_KEY=abc` (two
    // spaces), `#\t\tX_TOKEN=...`, and an indented `  API_KEY=abc` with no `#` at all
    // used to pass unscanned).
    const uncommented = rawLine.replace(/^\s*#?\s*/, '');
    const kvMatch = S6_KEY_VALUE_LINE.exec(uncommented);
    if (!kvMatch) return;
    const [, key, rawValue] = kvMatch;
    const value = rawValue.trim();
    if (value === '') return; // `API_KEY=` / `API_KEY=""` pass (empty after quote-strip below).
    const unquoted = stripSurroundingQuotes(value);
    if (unquoted === '') return;

    if (S6_SECRET_KEY_PATTERN.test(key)) {
      failures.push(`${lineNumber} (b: env template contains secret-shaped content)`);
      return;
    }
    // (c) round 2: applies to the trimmed-and-unquoted value regardless of whether it
    // was quoted - `FOO="<40-char token>"` used to pass by comparing the RAW
    // (still-quoted) value against `unquoted` and only scanning when they were equal;
    // quoting a secret must not defeat the scan (the check "fails closed on content").
    if (/[A-Za-z0-9+/=_-]{32,}/.test(unquoted)) {
      failures.push(`${lineNumber} (c: env template contains secret-shaped content)`);
    }
  });

  return failures;
}

/** Addendum 1 item 4(e): a pure classifier over a repo-relative path, independent of
 * the filesystem/`main()` - so a test can assert `.env`, `.env.local`,
 * `.env.example.bak`, `foo/.env.production` and `x.pem` all still resolve to
 * `'s1-fail'` (i.e. they are NOT exempt), and that the three real basenames resolve
 * to `'s6-scan'`, WITHOUT re-declaring its own copy of the exemption set (which is
 * what the round-1 tests did, and why they never actually exercised this script's
 * own `S1_TEMPLATE_BASENAMES`/`pathPattern`). */
export function classifyTrackedPath(relPath) {
  const s1 = RULES[0];
  if (s1.pathPattern.test(relPath)) {
    return S1_TEMPLATE_BASENAMES.includes(path.posix.basename(relPath)) ? 's6-scan' : 's1-fail';
  }
  const hasLineRule = RULES.slice(1).some((rule) => rule.filePattern.test(relPath));
  return hasLineRule ? 'line-rules' : 'none';
}

function gitTopLevel() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
}

function listTrackedFiles(repoRoot) {
  const raw = execFileSync('git', ['ls-files', '-z', '--full-name', '--', ':/'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return raw.split('\0').filter(Boolean);
}

/** Addendum 1 item 4(f): `readFile` is injectable (default: the real
 * `fs.readFileSync`) so a test can simulate an unreadable exempt file without
 * touching the real filesystem, and so this function has no direct `git`/`fs`
 * dependency of its own beyond what its caller passes in. */
export function processFiles(
  repoRoot,
  files,
  readFile = (absPath) => readFileSync(absPath, 'utf8'),
  fileSize = (absPath) => statSync(absPath).size,
) {
  const failures = [];
  const exemptionNotices = [];

  for (const relPath of files) {
    const kind = classifyTrackedPath(relPath);

    if (kind === 's1-fail') {
      failures.push(`S1: ${relPath} (${RULES[0].description})`);
      continue;
    }

    if (kind === 's6-scan') {
      // Addendum 1 item 1: a narrow, basename-only exemption for committed env
      // TEMPLATE files - S6 (item 2) still content-scans them, so this never stops
      // checking the file, only which rule catches a real secret in it.
      let content;
      try {
        content = readFile(path.join(repoRoot, relPath));
      } catch (error) {
        // Item 2/4(f): an unreadable exempt file fails - unlike the line-rule files
        // below, this one has no OTHER rule left to catch a real secret in it.
        failures.push(`S6: ${relPath} (unreadable: ${error.message})`);
        continue;
      }
      const s6Failures = scanEnvTemplate(content);
      if (s6Failures.length > 0) {
        for (const failure of s6Failures) failures.push(`S6: ${relPath}:${failure}`);
      } else {
        exemptionNotices.push(
          `check-no-secrets: S1 template exemption, content scanned clean: ${relPath}`,
        );
      }
      continue;
    }

    // Every other tracked file: S2-S5 line rules (when the path matches one) plus S7
    // over the whole text. Unreadable files (e.g. a tracked symlink to a missing
    // target) and files over S7_MAX_BYTES are skipped - not this script's concern.
    const absPath = path.join(repoRoot, relPath);
    let size;
    try {
      size = fileSize(absPath);
    } catch {
      continue;
    }
    if (size > S7_MAX_BYTES) continue;
    let content;
    try {
      content = readFile(absPath);
    } catch {
      continue;
    }

    if (kind === 'line-rules') {
      const lines = content.split(/\r?\n/);
      const lineRules = RULES.slice(1).filter((rule) => rule.filePattern.test(relPath));
      for (const rule of lineRules) {
        lines.forEach((line, index) => {
          if (rule.linePattern.test(line)) {
            failures.push(`${rule.id}: ${relPath}:${index + 1} (${rule.description})`);
          }
        });
      }
    }

    for (const failure of scanTextForSecrets(content)) failures.push(`S7: ${relPath}:${failure}`);
  }

  return { failures, exemptionNotices };
}

function main() {
  const repoRoot = gitTopLevel();
  const files = listTrackedFiles(repoRoot);
  const { failures, exemptionNotices } = processFiles(repoRoot, files);

  // Item 3: exemptions show in CI logs regardless of overall pass/fail.
  for (const notice of exemptionNotices) console.log(notice);

  if (failures.length > 0) {
    console.error('check-no-secrets: found tracked secret-shaped content:');
    for (const failure of failures) console.error(`  ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('check-no-secrets: no tracked secret-shaped content found.');
}

// Item 4: guarded so `scanEnvTemplate` can be unit-tested with inline fixtures
// without this script also running its CLI (which shells out to `git`).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

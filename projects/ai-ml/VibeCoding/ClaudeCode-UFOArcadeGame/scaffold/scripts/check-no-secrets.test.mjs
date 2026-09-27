// Implements docs/mobile/security/review-v1b.md "Addendum 1" item 4: unit tests for
// `scanEnvTemplate` (S6) with inline string fixtures only - no committed `.env.*`
// fixtures. Also covers the S1 basename-exemption boundary (item 1) through the
// script's OWN `classifyTrackedPath`/`S1_TEMPLATE_BASENAMES` (round 2 (e): the
// round-1 tests re-declared their own copy of the exemption set and tested THAT,
// which never actually exercised this script's real logic).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  scanEnvTemplate,
  classifyTrackedPath,
  processFiles,
  S1_TEMPLATE_BASENAMES,
} from './check-no-secrets.mjs';

// vitest (via `npm run test`/`npm test`) always runs with cwd = the `scaffold/`
// project root (vitest.config's root), the same directory `scripts/` and `android/`
// both live directly under - matching how `main()` resolves paths from
// `git rev-parse --show-toplevel` at runtime, just without the git dependency here.
const SCAFFOLD_ROOT = process.cwd();

describe('scanEnvTemplate (S6)', () => {
  it('(i) passes the CURRENT Cursor .env.example verbatim (code-review-round2 C3(d))', () => {
    // Inlined byte-for-byte (except line endings, which are normalized to LF
    // here) from
    // projects/ai-ml/VibeCoding/Cursor-UFOArcadeGame/UFO_Arcade_Game/.env.example
    // - the actual file this exemption exists for, not a paraphrase with
    // different keys/values (round 1 used a paraphrase and never actually
    // proved this file passes). Addendum 1 item 4 requires inline string
    // fixtures only, so this is a template literal, not a file read: reading
    // the sibling project's file from disk made the suite fail in the build
    // mirror, which never has that sibling checkout (code-review-round3 H1).
    const text = `# Copy to .env and adjust. Paths below are relative to this repo root.

TLS_MODE=https
# TLS_MODE=http

HTTPS_PORT=443
HTTP_PORT=80

# Paths inside the container (defaults match mkcert-style filenames)
TLS_CERT_PATH=/certs/localhost.pem
TLS_KEY_PATH=/certs/localhost-key.pem

# Host folder mounted read-only to /certs in the container
HOST_CERT_DIR=./certs

ENV=prod
LOG_LEVEL=info

# Vite build-time flags (optional): create .env with VITE_DEV_MODE=true for seeded RNG
# VITE_DEV_MODE=true
# VITE_TELEMETRY=true
`;
    expect(scanEnvTemplate(text)).toEqual([]);
  });

  it('(ii) fails on DB_PASSWORD=hunter2 (b: secret-shaped key with a value)', () => {
    const failures = scanEnvTemplate('DB_PASSWORD=hunter2');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('b:');
  });

  it('(iii) fails on a commented-out secret-shaped key with a value', () => {
    const failures = scanEnvTemplate('# API_KEY=abc');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('b:');
  });

  it('(iii) fails on a commented-out secret-shaped key with TWO spaces after #', () => {
    // Round 2 (b): the old `/^\s*#\s?/` stripped only one space, so this used to
    // pass unscanned.
    const failures = scanEnvTemplate('#  API_KEY=abc');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('b:');
  });

  it('(iii) fails on a commented-out secret-shaped key with tabs after #', () => {
    const failures = scanEnvTemplate('#\t\tX_TOKEN=abc');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('b:');
  });

  it('(iii) fails on an INDENTED secret-shaped key with no # at all', () => {
    // Round 2 (b): an indented, non-commented `  API_KEY=abc` also used to pass
    // unscanned, since the old regex required a literal `#`.
    const failures = scanEnvTemplate('  API_KEY=abc');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('b:');
  });

  it('(iv) passes API_KEY= (empty value)', () => {
    expect(scanEnvTemplate('API_KEY=')).toEqual([]);
  });

  it('(iv) passes API_KEY="" (empty quoted value)', () => {
    expect(scanEnvTemplate('API_KEY=""')).toEqual([]);
  });

  it('(v) fails on a PEM private-key header (a: content pattern)', () => {
    const failures = scanEnvTemplate('-----BEGIN PRIVATE KEY-----');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('a:');
  });

  it('(vi) fails on an AWS access key ID shape (a: content pattern)', () => {
    const failures = scanEnvTemplate('AKIAABCDEFGHIJKLMNOP');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('a:');
  });

  it('(vii) fails on a 32+ char unquoted value under an innocuous key (c)', () => {
    const failures = scanEnvTemplate('FOO=abcdefghijklmnopqrstuvwxyz012345678901234567890');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('c:');
  });

  it('passes a short unquoted value under an innocuous key', () => {
    expect(scanEnvTemplate('FOO=bar')).toEqual([]);
  });

  it('round 2 (c): a 32+ char QUOTED value now ALSO fails - quoting must not defeat the scan', () => {
    const failures = scanEnvTemplate('FOO="abcdefghijklmnopqrstuvwxyz0123456789"');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('c:');
  });

  it('reports the correct line number for a failure past line 1', () => {
    const failures = scanEnvTemplate('FOO=bar\nDB_PASSWORD=hunter2\nBAZ=qux');
    expect(failures[0]).toMatch(/^2 /);
  });

  it('round 2 (a): a CRLF file is scanned exactly like an LF file', () => {
    const failures = scanEnvTemplate('FOO=bar\r\nDB_PASSWORD=hunter2\r\nBAZ=qux\r\n');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/^2 /);
    expect(failures[0]).toContain('b:');
  });
});

describe('S1_TEMPLATE_BASENAMES (Addendum 1 item 1/4(e))', () => {
  it('is frozen and has exactly the three documented basenames', () => {
    expect(Object.isFrozen(S1_TEMPLATE_BASENAMES)).toBe(true);
    expect([...S1_TEMPLATE_BASENAMES].sort()).toEqual(['.env.example', '.env.sample', '.env.template']);
  });

  it('round 3 L3: is actually immutable (a frozen array, not a frozen Set binding) - '
    + 'mutation throws and the list is unchanged', () => {
    // This module is ESM (always strict mode), so a mutating call on a frozen array
    // throws a TypeError rather than silently no-op'ing. A `Set` would have let `.add()`
    // succeed even after `Object.freeze()`, since freeze only locks the variable
    // binding, not the Set's internal storage.
    expect(() => S1_TEMPLATE_BASENAMES.push('.env.extra')).toThrow(TypeError);
    expect([...S1_TEMPLATE_BASENAMES].sort()).toEqual(['.env.example', '.env.sample', '.env.template']);
  });
});

describe('classifyTrackedPath (Addendum 1 item 4(e)): exercises the SCRIPT\'S OWN S1 pathPattern/exemption set', () => {
  it.each([
    ['.env.example', 's6-scan'],
    ['.env.sample', 's6-scan'],
    ['.env.template', 's6-scan'],
    ['some/dir/.env.example', 's6-scan'],
  ])('%s -> %s (exempt from S1, still content-scanned by S6)', (relPath, expected) => {
    expect(classifyTrackedPath(relPath)).toBe(expected);
  });

  it.each([
    ['.env', 's1-fail'],
    ['.env.local', 's1-fail'],
    ['.env.example.bak', 's1-fail'],
    ['foo/.env.production', 's1-fail'],
    ['x.pem', 's1-fail'],
  ])('%s -> %s (still fails S1 - NOT exempt)', (relPath, expected) => {
    expect(classifyTrackedPath(relPath)).toBe(expected);
  });

  it.each([
    ['android/app/build.gradle', 'line-rules'],
    ['gradle.properties', 'line-rules'],
    ['capacitor.config.ts', 'line-rules'],
  ])('%s -> %s (a line-rule file, not S1/S6)', (relPath, expected) => {
    expect(classifyTrackedPath(relPath)).toBe(expected);
  });

  it('an ordinary source file classifies as none', () => {
    expect(classifyTrackedPath('src/main.ts')).toBe('none');
  });
});

describe('processFiles (Addendum 1 item 4(f)): an unreadable exempt file fails', () => {
  it('reports S6 unreadable, not a crash, when the injected reader throws', () => {
    const readFile = () => {
      throw new Error('EACCES: permission denied');
    };
    const { failures } = processFiles('/repo', ['.env.example'], readFile);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('S6: .env.example (unreadable: EACCES');
  });

  it('a non-exempt S1 match fails without ever calling the reader', () => {
    const readFile = () => {
      throw new Error('should not be called');
    };
    const { failures } = processFiles('/repo', ['.env.local'], readFile);
    expect(failures).toEqual(['S1: .env.local (key/secret file tracked)']);
  });

  it('a clean exempt file produces an exemption notice and no failure', () => {
    const readFile = () => 'ENV=production\n';
    const { failures, exemptionNotices } = processFiles('/repo', ['.env.example'], readFile);
    expect(failures).toEqual([]);
    expect(exemptionNotices).toEqual([
      'check-no-secrets: S1 template exemption, content scanned clean: .env.example',
    ]);
  });
});

describe('S4 regression: the real committed android/app/build.gradle', () => {
  // A comment explaining the S4 rule ("never signs with the debug key") previously
  // reused the rule's own banned substring (`signingConfigs.debug`), so the checker
  // flagged its own explanatory comment as a violation (validation-report round-1
  // F1). This runs the actual S4 rule against the real, currently-committed file
  // content - not a paraphrase - so that specific class of bug (a fix's own comment
  // reintroducing the matched text) cannot recur silently.
  it('android/app/build.gradle produces no S4 failure', () => {
    const relPath = 'android/app/build.gradle';
    expect(classifyTrackedPath(relPath)).toBe('line-rules');

    const readFile = (absPath) => readFileSync(absPath, 'utf8');
    const { failures } = processFiles(SCAFFOLD_ROOT, [relPath], readFile);

    const s4Failures = failures.filter((failure) => failure.startsWith('S4:'));
    expect(s4Failures).toEqual([]);
  });
});

// Implements docs/mobile/security/review-v1b.md "Addendum 1" item 4: unit tests for
// `scanEnvTemplate` (S6) with inline string fixtures only - no committed `.env.*`
// fixtures. Also covers the S1 basename-exemption boundary (item 1) through the
// script's OWN `classifyTrackedPath`/`S1_TEMPLATE_BASENAMES` (round 2 (e): the
// round-1 tests re-declared their own copy of the exemption set and tested THAT,
// which never actually exercised this script's real logic).
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  scanEnvTemplate,
  classifyTrackedPath,
  processFiles,
  S1_TEMPLATE_BASENAMES,
  S7_KNOWN_DUMMY_VALUES,
  S7_MAX_BYTES,
  scanTextForSecrets,
} from './check-no-secrets.mjs';

// vitest (via `npm run test`/`npm test`) always runs with cwd = the `scaffold/`
// project root - `package.json`'s scripts run from the directory they live in, and
// `vitest.config.ts` sets no `root` override of its own - the same directory
// `scripts/` and `android/` both live directly under, matching how `main()` resolves
// paths from `git rev-parse --show-toplevel` at runtime, just without the git
// dependency here. code-review-round6.md L1: this is only a CONVENTION, not something
// enforced here - see the `existsSync` assertion below, which is what actually makes
// the S4 regression test fail (rather than silently pass) if it is ever violated.
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
    // Built from two pieces so this test file does not itself trip S7.
    const failures = scanEnvTemplate('-----BEGIN ' + 'PRIVATE KEY-----');
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
    expect([...S1_TEMPLATE_BASENAMES].sort()).toEqual([
      '.env.example',
      '.env.sample',
      '.env.template',
    ]);
  });

  it(
    'round 3 L3: is actually immutable (a frozen array, not a frozen Set binding) - ' +
      'mutation throws and the list is unchanged',
    () => {
      // This module is ESM (always strict mode), so a mutating call on a frozen array
      // throws a TypeError rather than silently no-op'ing. A `Set` would have let `.add()`
      // succeed even after `Object.freeze()`, since freeze only locks the variable
      // binding, not the Set's internal storage.
      expect(() => S1_TEMPLATE_BASENAMES.push('.env.extra')).toThrow(TypeError);
      expect([...S1_TEMPLATE_BASENAMES].sort()).toEqual([
        '.env.example',
        '.env.sample',
        '.env.template',
      ]);
    },
  );
});

describe("classifyTrackedPath (Addendum 1 item 4(e)): exercises the SCRIPT'S OWN S1 pathPattern/exemption set", () => {
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

    // code-review-round6.md L1: `processFiles`'s line-rules branch swallows a missing
    // file silently (`check-no-secrets.mjs`'s `catch { continue; }`, by design - a
    // deleted tracked file isn't this checker's problem), so a bare `readFileSync`
    // reader that never actually reached the real file would make this test PASS with
    // zero failures for the wrong reason (reproduced: running this file with
    // `cwd` one directory too high gave exactly that). Assert the file was actually
    // found first, so a future cwd/path regression fails LOUDLY here instead of
    // silently proving nothing.
    const absPath = path.join(SCAFFOLD_ROOT, relPath);
    expect(
      existsSync(absPath),
      `expected ${absPath} to exist - is cwd the scaffold/ project root?`,
    ).toBe(true);

    const readFile = (p) => readFileSync(p, 'utf8');
    const { failures } = processFiles(SCAFFOLD_ROOT, [relPath], readFile);

    const s4Failures = failures.filter((failure) => failure.startsWith('S4:'));
    expect(s4Failures).toEqual([]);
  });
});

describe('S1 credential-file paths (review-v2 V2-L3, V2-L4)', () => {
  it.each([
    'terraform-deploy_accessKeys.csv',
    'infra/my_AccessKeys (1).csv',
    'credentials',
    'aws/credentials.csv',
    'infra/terraform.tfstate',
    'infra/terraform.tfstate.backup',
    'infra/terraform.tfvars',
    'android/app/google-services.json',
  ])('%s is an S1 failure', (relPath) => {
    expect(classifyTrackedPath(relPath)).toBe('s1-fail');
  });

  it.each(['docs/credentials-policy.md', 'src/tfstate-notes.md', 'docs/accessKeys-guide.md'])(
    '%s is not an S1 failure',
    (relPath) => {
      expect(classifyTrackedPath(relPath)).not.toBe('s1-fail');
    },
  );

  it('processFiles reports S1 for a tracked credentials.csv without reading it', () => {
    const readFile = () => {
      throw new Error('must not be read');
    };
    const { failures } = processFiles('/repo', ['aws/credentials.csv'], readFile);
    expect(failures).toEqual(['S1: aws/credentials.csv (key/secret file tracked)']);
  });
});

describe('S7: S6a content patterns over every tracked text file (review-v2 V2-L3)', () => {
  // Fixtures are assembled from pieces so this file does not itself trip S7.
  const awsKey = 'AKIA' + '1234567890ABCDEF';
  const pemHeader = '-----BEGIN ' + 'RSA PRIVATE KEY-----';
  const githubToken = 'ghp_' + 'abcdefghijklmnopqrstuvwxyz0123';

  // Maps the absolute path processFiles builds back to the fixture key, on any OS.
  const run = (files) => {
    const contentFor = (absPath) => {
      const key = Object.keys(files).find((k) => absPath.endsWith(k.split('/').join(path.sep)));
      return files[key];
    };
    return processFiles('/repo', Object.keys(files), contentFor, () => 100);
  };

  it('fails on an AWS key ID in an ordinary markdown file, with the file and line', () => {
    const { failures } = run({ 'docs/notes.md': `line one\nkey: ${awsKey}\n` });
    expect(failures).toEqual([
      'S7: docs/notes.md:2 (secret-shaped content in a tracked text file)',
    ]);
  });

  it('fails on a PEM header and a GitHub token in a source file (CRLF safe)', () => {
    const { failures } = run({ 'src/a.ts': `// ${pemHeader}\r\nconst t = '${githubToken}';\r\n` });
    expect(failures).toEqual([
      'S7: src/a.ts:1 (secret-shaped content in a tracked text file)',
      'S7: src/a.ts:2 (secret-shaped content in a tracked text file)',
    ]);
  });

  it('runs alongside the line rules on a Gradle file', () => {
    const { failures } = run({ 'android/app/build.gradle': `storePassword "x"\n// ${awsKey}\n` });
    expect(failures.map((f) => f.split(':')[0])).toEqual(['S2', 'S7']);
  });

  it('passes clean text, the documented dummy values and CSS names like .sk-toggleable__content and short ids like #sk-container-id-1', () => {
    expect(S7_KNOWN_DUMMY_VALUES.length).toBeGreaterThan(0);
    const dummies = S7_KNOWN_DUMMY_VALUES.join(' ');
    const { failures } = run({
      'a.md': `nothing here\n${dummies}\n`,
      'b.html': '<style>#sk-container-id-1 div.sk-toggleable__content {color: black;}</style>',
    });
    expect(failures).toEqual([]);
  });

  it('still fails on an sk- key with digits after a # comment marker or a dot (round16 L1)', () => {
    const key = 'sk-proj-' + 'Ab3dEf6hIj9lMn2pQr5tUv8x';
    const { failures } = run({
      'a.py': `#${key}
`,
      'b.md': `see .${key} for details
`,
    });
    expect(failures).toEqual([
      'S7: a.py:1 (secret-shaped content in a tracked text file)',
      'S7: b.md:1 (secret-shaped content in a tracked text file)',
    ]);
  });

  it('skips files over the size limit without reading them', () => {
    const readFile = () => {
      throw new Error('must not be read');
    };
    const { failures } = processFiles('/repo', ['big.txt'], readFile, () => S7_MAX_BYTES + 1);
    expect(failures).toEqual([]);
  });

  it('skips binary content (NUL byte) and unreadable files', () => {
    expect(scanTextForSecrets(`\0${awsKey}`)).toEqual([]);
    const unreadable = () => {
      throw new Error('EACCES');
    };
    expect(processFiles('/repo', ['x.txt'], unreadable, () => 10).failures).toEqual([]);
  });

  it('an S1 template exemption file is still scanned by S6 only (no duplicate S7 line)', () => {
    const { failures } = run({ '.env.example': `TOKEN=${awsKey}\n` });
    expect(failures.every((f) => f.startsWith('S6:'))).toBe(true);
  });
});

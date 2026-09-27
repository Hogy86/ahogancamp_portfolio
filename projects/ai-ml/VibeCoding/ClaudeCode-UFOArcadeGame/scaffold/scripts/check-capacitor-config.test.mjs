// Implements code-review-round1.md H5: fixture tests for every rule (1-7) on both the
// `.ts` text-match path and the generated `.json` path, including a missing
// scheme/hostname in the JSON (M7.4 - the shipped-origin case is the one that must
// fail closed on MISSING, not just on a wrong value).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { checkGeneratedJsonText, checkSourceTsText } from './check-capacitor-config.mjs';

const GOOD_JSON = JSON.stringify({
  server: { androidScheme: 'https', hostname: 'localhost' },
  android: {},
});

const GOOD_TS = `
const config = {
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
  },
  android: {},
};
export default config;
`;

describe('checkGeneratedJsonText (capacitor.config.json)', () => {
  it('passes a compliant config', () => {
    expect(checkGeneratedJsonText(GOOD_JSON)).toEqual([]);
  });

  it('rule 1: fails on server.url present', () => {
    const failures = checkGeneratedJsonText(
      JSON.stringify({ server: { url: 'http://evil', androidScheme: 'https', hostname: 'localhost' } }),
    );
    expect(failures.some((f) => f.includes('server.url'))).toBe(true);
  });

  it('rule 2: fails on server.cleartext: true', () => {
    const failures = checkGeneratedJsonText(
      JSON.stringify({ server: { cleartext: true, androidScheme: 'https', hostname: 'localhost' } }),
    );
    expect(failures.some((f) => f.includes('cleartext'))).toBe(true);
  });

  it('rule 3: fails on android.webContentsDebuggingEnabled: true', () => {
    const failures = checkGeneratedJsonText(
      JSON.stringify({
        server: { androidScheme: 'https', hostname: 'localhost' },
        android: { webContentsDebuggingEnabled: true },
      }),
    );
    expect(failures.some((f) => f.includes('webContentsDebuggingEnabled'))).toBe(true);
  });

  it('rule 3: fails on top-level webContentsDebuggingEnabled: true', () => {
    const failures = checkGeneratedJsonText(
      JSON.stringify({
        server: { androidScheme: 'https', hostname: 'localhost' },
        webContentsDebuggingEnabled: true,
      }),
    );
    expect(failures.some((f) => f.includes('webContentsDebuggingEnabled'))).toBe(true);
  });

  it('rule 4: fails on android.allowMixedContent: true', () => {
    const failures = checkGeneratedJsonText(
      JSON.stringify({
        server: { androidScheme: 'https', hostname: 'localhost' },
        android: { allowMixedContent: true },
      }),
    );
    expect(failures.some((f) => f.includes('allowMixedContent'))).toBe(true);
  });

  it('rule 5: fails when androidScheme is MISSING from the shipped JSON', () => {
    const failures = checkGeneratedJsonText(JSON.stringify({ server: { hostname: 'localhost' } }));
    expect(failures.some((f) => f.includes('androidScheme'))).toBe(true);
  });

  it('rule 5: fails when androidScheme is not https', () => {
    const failures = checkGeneratedJsonText(
      JSON.stringify({ server: { androidScheme: 'http', hostname: 'localhost' } }),
    );
    expect(failures.some((f) => f.includes('androidScheme'))).toBe(true);
  });

  it('rule 6: fails when hostname is MISSING from the shipped JSON', () => {
    const failures = checkGeneratedJsonText(JSON.stringify({ server: { androidScheme: 'https' } }));
    expect(failures.some((f) => f.includes('hostname'))).toBe(true);
  });

  it('rule 6: fails when hostname is not localhost', () => {
    const failures = checkGeneratedJsonText(
      JSON.stringify({ server: { androidScheme: 'https', hostname: 'example.com' } }),
    );
    expect(failures.some((f) => f.includes('hostname'))).toBe(true);
  });

  it('rule 7: fails on any server.allowNavigation, even an empty array', () => {
    const failures = checkGeneratedJsonText(
      JSON.stringify({ server: { androidScheme: 'https', hostname: 'localhost', allowNavigation: [] } }),
    );
    expect(failures.some((f) => f.includes('allowNavigation'))).toBe(true);
  });
});

describe('checkSourceTsText (capacitor.config.ts)', () => {
  it('passes a compliant config', () => {
    expect(checkSourceTsText(GOOD_TS)).toEqual([]);
  });

  it('rule 1: fails on server.url present', () => {
    const ts = `const config = { server: { url: 'http://evil', androidScheme: 'https', hostname: 'localhost' } };`;
    expect(checkSourceTsText(ts).some((f) => f.includes('server.url'))).toBe(true);
  });

  it('L8: rule 1 fails on a quoted server key ("server") too', () => {
    const ts = `const config = { "server": { "url": 'http://evil' } };`;
    expect(checkSourceTsText(ts).some((f) => f.includes('server.url'))).toBe(true);
  });

  it('rule 2: fails on cleartext: true', () => {
    const ts = `const config = { server: { cleartext: true } };`;
    expect(checkSourceTsText(ts).some((f) => f.includes('cleartext'))).toBe(true);
  });

  it('L8: rule 2 fails on a quoted cleartext key', () => {
    const ts = `const config = { server: { 'cleartext': true } };`;
    expect(checkSourceTsText(ts).some((f) => f.includes('cleartext'))).toBe(true);
  });

  it('rule 3: fails on webContentsDebuggingEnabled: true', () => {
    const ts = `const config = { android: { webContentsDebuggingEnabled: true } };`;
    expect(checkSourceTsText(ts).some((f) => f.includes('webContentsDebuggingEnabled'))).toBe(true);
  });

  it('rule 4: fails on allowMixedContent: true', () => {
    const ts = `const config = { android: { allowMixedContent: true } };`;
    expect(checkSourceTsText(ts).some((f) => f.includes('allowMixedContent'))).toBe(true);
  });

  it('rule 5: fails when androidScheme is present but not https', () => {
    const ts = `const config = { server: { androidScheme: 'http' } };`;
    expect(checkSourceTsText(ts).some((f) => f.includes('androidScheme'))).toBe(true);
  });

  it('rule 5: an absent androidScheme in the .ts source is not itself a failure (relies on Capacitor defaults; the generated JSON check still fails closed on missing)', () => {
    const ts = `const config = { server: { hostname: 'localhost' } };`;
    expect(checkSourceTsText(ts).some((f) => f.includes('androidScheme'))).toBe(false);
  });

  it('rule 6: fails when hostname is present but not localhost', () => {
    const ts = `const config = { server: { hostname: 'example.com' } };`;
    expect(checkSourceTsText(ts).some((f) => f.includes('hostname'))).toBe(true);
  });

  it('rule 7: fails on any allowNavigation key', () => {
    const ts = `const config = { server: { allowNavigation: [] } };`;
    expect(checkSourceTsText(ts).some((f) => f.includes('allowNavigation'))).toBe(true);
  });

  it('L8: rule 7 fails on a quoted allowNavigation key', () => {
    const ts = `const config = { server: { 'allowNavigation': [] } };`;
    expect(checkSourceTsText(ts).some((f) => f.includes('allowNavigation'))).toBe(true);
  });
});

describe('checkSourceTsText - H4 (round 2): the REAL capacitor.config.ts, not just fixture strings', () => {
  it('passes the real file with no failures, and pins androidScheme/hostname explicitly (§9.2)', () => {
    // path.resolve (not `new URL(relative, import.meta.url)`, which Vite's dev
    // server intercepts as an asset-URL macro under Vitest).
    const thisDir = path.dirname(fileURLToPath(import.meta.url));
    const raw = readFileSync(path.resolve(thisDir, '../capacitor.config.ts'), 'utf8');
    expect(checkSourceTsText(raw)).toEqual([]);
    expect(/androidScheme\s*:\s*'https'/.test(raw)).toBe(true);
    expect(/hostname\s*:\s*'localhost'/.test(raw)).toBe(true);
  });
});

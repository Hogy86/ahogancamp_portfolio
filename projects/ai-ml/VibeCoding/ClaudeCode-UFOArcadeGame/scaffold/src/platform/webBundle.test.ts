// @vitest-environment node
// Tests PRD addendum v7 F27 AC2 (code-review-round21 L4, A14 §10.1): the website bundle
// (`npm run build` -> dist/) carries no Android top banner. The banner is Android-only
// presentation (src/platform/android/topBanner.ts, loaded behind main.ts's
// `MODE === 'android'` dynamic import), so the web build must tree-shake it away. Both
// builds run in memory (`write: false`), so dist/ and dist-android/ on disk are untouched.
// The Android build is the positive control: it proves the search can see the banner.
// Node environment: Vite's build runs under Node, not jsdom.

import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { build, type Rollup } from 'vite';

/** Every emitted JS/CSS/HTML file's text for one build mode. */
async function bundleTexts(mode: 'production' | 'android'): Promise<Map<string, string>> {
  const result = await build({
    configFile: path.resolve(process.cwd(), 'vite.config.ts'),
    mode,
    logLevel: 'silent',
    build: { write: false, sourcemap: false },
  });
  const outputs = (Array.isArray(result) ? result : [result]) as Rollup.RollupOutput[];
  const texts = new Map<string, string>();
  for (const { output } of outputs) {
    for (const item of output) {
      const text = item.type === 'chunk' ? item.code : String(item.source);
      if (/\.(js|css|html)$/.test(item.fileName)) texts.set(item.fileName, text);
    }
  }
  return texts;
}

const filesContaining = (texts: Map<string, string>, needle: string): string[] =>
  [...texts].filter(([, text]) => text.includes(needle)).map(([name]) => name);

describe('F27 AC2: the web bundle has no Android top banner', () => {
  it('web build output contains no "top-banner"', async () => {
    const web = await bundleTexts('production');
    expect(web.size).toBeGreaterThan(0);
    expect(filesContaining(web, 'top-banner')).toEqual([]);
  }, 60_000);

  it('android build output does contain it (the search is not blind)', async () => {
    const android = await bundleTexts('android');
    expect(filesContaining(android, 'top-banner').length).toBeGreaterThan(0);
  }, 60_000);
});

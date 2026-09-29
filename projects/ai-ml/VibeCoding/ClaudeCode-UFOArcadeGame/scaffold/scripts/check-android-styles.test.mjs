// Regression guard fixtures for validation-report-round2 F1 (unqualified/unsafe
// "always" below API 30) and code-review-round7.md L1-L3 (fail-closed on a missing res
// dir, tolerant cutout-item matching, and three-folder parity).
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkStylesParity,
  extractValuesVersion,
  findUnsafeCutoutModeAlways,
  run,
} from './check-android-styles.mjs';

const REAL_RES_DIR = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

function readRealResTree(resDir) {
  const filesByFolder = {};
  for (const entry of readdirSync(resDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const stylesPath = path.join(resDir, entry.name, 'styles.xml');
    try {
      filesByFolder[entry.name] = readFileSync(stylesPath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return filesByFolder;
}

describe('extractValuesVersion', () => {
  it('resolves the unqualified base folder to version 0', () => {
    expect(extractValuesVersion('values')).toBe(0);
  });

  it('resolves a values-vNN folder to N', () => {
    expect(extractValuesVersion('values-v28')).toBe(28);
    expect(extractValuesVersion('values-v30')).toBe(30);
  });

  it('returns null for folders this check does not track (e.g. values-land, values-v28-land)', () => {
    expect(extractValuesVersion('values-land')).toBeNull();
    expect(extractValuesVersion('values-v28-land')).toBeNull();
    expect(extractValuesVersion('drawable-v24')).toBeNull();
  });
});

describe('findUnsafeCutoutModeAlways', () => {
  it('flags an unqualified values/styles.xml that sets "always"', () => {
    const failures = findUnsafeCutoutModeAlways({
      values: '<resources><style name="AppTheme">' +
        '<item name="android:windowLayoutInDisplayCutoutMode">always</item>' +
        '</style></resources>',
    });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/values\/styles\.xml/);
    expect(failures[0]).toMatch(/"always"/);
  });

  it('flags a values-v28 (or any < v30) folder that sets "always"', () => {
    const failures = findUnsafeCutoutModeAlways({
      'values-v28': '<resources><style name="AppTheme">' +
        '<item name="android:windowLayoutInDisplayCutoutMode">always</item>' +
        '</style></resources>',
      'values-v29': '<resources><style name="AppTheme">' +
        '<item name="android:windowLayoutInDisplayCutoutMode">always</item>' +
        '</style></resources>',
    });
    expect(failures).toHaveLength(2);
  });

  it('does not flag values-v30+ setting "always"', () => {
    const failures = findUnsafeCutoutModeAlways({
      'values-v30': '<resources><style name="AppTheme">' +
        '<item name="android:windowLayoutInDisplayCutoutMode">always</item>' +
        '</style></resources>',
      'values-v36': '<resources><style name="AppTheme">' +
        '<item name="android:windowLayoutInDisplayCutoutMode">always</item>' +
        '</style></resources>',
    });
    expect(failures).toEqual([]);
  });

  it('does not flag "shortEdges" (or any non-"always" value) below v30', () => {
    const failures = findUnsafeCutoutModeAlways({
      'values-v28': '<resources><style name="AppTheme">' +
        '<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>' +
        '</style></resources>',
    });
    expect(failures).toEqual([]);
  });

  it('does not flag a folder with no cutout-mode item at all', () => {
    const failures = findUnsafeCutoutModeAlways({
      values: '<resources><style name="AppTheme">' +
        '<item name="colorPrimary">@color/colorPrimary</item>' +
        '</style></resources>',
    });
    expect(failures).toEqual([]);
  });

  it('ignores folders this check does not track (e.g. values-land) even if they set "always"', () => {
    const failures = findUnsafeCutoutModeAlways({
      'values-land': '<resources><style name="AppTheme">' +
        '<item name="android:windowLayoutInDisplayCutoutMode">always</item>' +
        '</style></resources>',
    });
    expect(failures).toEqual([]);
  });

  it('catches multiple unsafe items within the same file (all three app themes)', () => {
    const failures = findUnsafeCutoutModeAlways({
      values: '<resources>' +
        '<style name="AppTheme"><item name="android:windowLayoutInDisplayCutoutMode">always</item></style>' +
        '<style name="AppTheme.NoActionBar"><item name="android:windowLayoutInDisplayCutoutMode">always</item></style>' +
        '<style name="AppTheme.NoActionBarLaunch"><item name="android:windowLayoutInDisplayCutoutMode">always</item></style>' +
        '</resources>',
    });
    expect(failures).toHaveLength(3);
  });

  // code-review-round7.md L2: the old exact-match regex missed realistic variants.
  it('catches the Android Studio quick-fix form with an extra tools:targetApi attribute', () => {
    const failures = findUnsafeCutoutModeAlways({
      values: '<resources><style name="AppTheme">' +
        '<item name="android:windowLayoutInDisplayCutoutMode" tools:targetApi="o_mr1">always</item>' +
        '</style></resources>',
    });
    expect(failures).toHaveLength(1);
  });

  it('catches a single-quoted attribute value', () => {
    const failures = findUnsafeCutoutModeAlways({
      values: "<resources><style name='AppTheme'>" +
        "<item name='android:windowLayoutInDisplayCutoutMode'>always</item>" +
        '</style></resources>',
    });
    expect(failures).toHaveLength(1);
  });
});

describe('checkStylesParity (code-review-round7.md L3)', () => {
  const clean = {
    values: '<resources><style name="AppTheme" parent="Base">' +
      '<item name="colorPrimary">@color/x</item></style></resources>',
    'values-v28': '<resources><style name="AppTheme" parent="Base">' +
      '<item name="colorPrimary">@color/x</item>' +
      '<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item></style></resources>',
    'values-v30': '<resources><style name="AppTheme" parent="Base">' +
      '<item name="colorPrimary">@color/x</item>' +
      '<item name="android:windowLayoutInDisplayCutoutMode">always</item></style></resources>',
  };

  it('passes a clean three-folder set', () => {
    expect(checkStylesParity(clean)).toEqual([]);
  });

  it('fails when values-v28/styles.xml is missing entirely (a silent fall-back to the unsafe/no-op default)', () => {
    const { 'values-v28': _drop, ...rest } = clean;
    const failures = checkStylesParity(rest);
    expect(failures.some((f) => f.includes('values-v28/styles.xml is missing'))).toBe(true);
  });

  it('fails when a non-cutout item has a different VALUE between folders', () => {
    const drifted = {
      ...clean,
      'values-v28': clean['values-v28'].replace('@color/x', '@color/DIFFERENT'),
    };
    const failures = checkStylesParity(drifted);
    expect(failures.some((f) => f.includes('item "colorPrimary"'))).toBe(true);
  });

  it('fails when a non-cutout item is missing from one folder entirely', () => {
    const drifted = {
      ...clean,
      'values-v28': clean['values-v28'].replace('<item name="colorPrimary">@color/x</item>', ''),
    };
    const failures = checkStylesParity(drifted);
    expect(failures.some((f) => f.includes('different items'))).toBe(true);
  });

  it('fails when values-v28 does not positively set "shortEdges"', () => {
    const wrong = {
      ...clean,
      'values-v28': clean['values-v28'].replace('shortEdges', 'never'),
    };
    const failures = checkStylesParity(wrong);
    expect(failures.some((f) => f.includes('expected "shortEdges"'))).toBe(true);
  });

  it('fails when the base values/ folder sets the cutout item at all', () => {
    const wrong = {
      ...clean,
      values: clean.values.replace(
        '</style>',
        '<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item></style>',
      ),
    };
    const failures = checkStylesParity(wrong);
    expect(failures.some((f) => f.includes('must omit it entirely'))).toBe(true);
  });

  it('has no opinion on the real android/ tree bypassing this specific fixture set', () => {
    // Guards against accidentally hard-coding the fixture above as gospel - the real
    // tree is checked separately below.
    expect(checkStylesParity(clean)).toEqual([]);
  });

  // code-review-round8.md L2: the strict ITEM_RE used to silently drop any <item> with
  // an extra attribute from the comparison entirely, so drift like this passed clean.
  it('fails when an item gains an extra attribute (e.g. tools:targetApi) in only one folder', () => {
    const drifted = {
      ...clean,
      'values-v30': clean['values-v30'].replace(
        '<item name="colorPrimary">@color/x</item>',
        '<item name="colorPrimary" tools:targetApi="s">@color/DIFFERENT</item>',
      ),
    };
    const failures = checkStylesParity(drifted);
    expect(failures.some((f) => f.includes('item "colorPrimary"'))).toBe(true);
  });

  // code-review-round8.md L2: a commented-out style/item must not be mistaken for a
  // live one that would otherwise mask real drift.
  it('ignores styles and items inside XML comments', () => {
    const withComment = {
      ...clean,
      values: clean.values.replace(
        '</resources>',
        '<!-- <style name="Unused"><item name="foo">bar</item></style> --></resources>',
      ),
    };
    expect(checkStylesParity(withComment)).toEqual([]);
  });
});

describe('run() (code-review-round7.md L1: fails CLOSED, not open)', () => {
  it('returns code 2 (not 0) when the res dir itself does not exist', () => {
    const result = run(path.join(process.cwd(), 'scripts', '__does-not-exist__'));
    expect(result.code).toBe(2);
    expect(result.messages.join('\n')).toMatch(/res dir not found/);
  });

  it('returns code 2 when the res dir exists but has no values/styles.xml', () => {
    // `scripts/` itself exists but has no `values` subfolder.
    const result = run(path.join(process.cwd(), 'scripts'));
    expect(result.code).toBe(2);
    expect(result.messages.join('\n')).toMatch(/no values\/styles\.xml found/);
  });

  it('returns code 0 on the real, currently-clean android/ tree', () => {
    const result = run(REAL_RES_DIR);
    expect(result.code).toBe(0);
  });
});

describe('the real android/ tree stays regression-free', () => {
  it('has no values/ or < v30 values-vNN/ styles.xml setting "always"', () => {
    expect(findUnsafeCutoutModeAlways(readRealResTree(REAL_RES_DIR))).toEqual([]);
  });

  it('values-v30/styles.xml exists and does use "always" (the confirmed-safe range)', () => {
    const stylesPath = path.join(REAL_RES_DIR, 'values-v30', 'styles.xml');
    const content = readFileSync(stylesPath, 'utf8');
    expect(content).toMatch(/android:windowLayoutInDisplayCutoutMode">always</);
  });

  // code-review-round7.md L3, option (a): a REAL-TREE parity test, not just fixtures -
  // the three actual committed `styles.xml` files must stay in lockstep.
  it('the three real styles.xml folders (values, values-v28, values-v30) are in parity', () => {
    expect(checkStylesParity(readRealResTree(REAL_RES_DIR))).toEqual([]);
  });
});

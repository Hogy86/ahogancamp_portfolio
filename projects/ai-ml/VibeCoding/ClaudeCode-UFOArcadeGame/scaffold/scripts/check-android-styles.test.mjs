// Regression guard fixtures for validation-report-round2 F1: an unqualified (or < v30)
// `android:windowLayoutInDisplayCutoutMode="always"` crashes real API 28-29 devices.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractValuesVersion, findUnsafeCutoutModeAlways } from './check-android-styles.mjs';

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
});

describe('the real android/ tree stays regression-free', () => {
  it('has no values/ or < v30 values-vNN/ styles.xml setting "always"', () => {
    const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
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
    expect(findUnsafeCutoutModeAlways(filesByFolder)).toEqual([]);
  });

  it('values-v30/styles.xml exists and does use "always" (the confirmed-safe range)', () => {
    const stylesPath = path.join(
      process.cwd(),
      'android',
      'app',
      'src',
      'main',
      'res',
      'values-v30',
      'styles.xml',
    );
    const content = readFileSync(stylesPath, 'utf8');
    expect(content).toMatch(/android:windowLayoutInDisplayCutoutMode">always</);
  });
});

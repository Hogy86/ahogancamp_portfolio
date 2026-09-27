// Implements code-review-round1.md H3/H5: fixture tests for check-android-manifest.mjs.
// (a) grant-uri-permission/FILE_PROVIDER_PATHS children fire even under the
//     allowlisted provider name; (b) R1 is an exact match, not endsWith; (c) a real
//     bundletool-style XML manifest parses and passes; (d) MainActivity/allowed
//     receiver are exact-matched, and the receiver's DUMP permission guard is checked.
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { checkManifest, parseAapt2Tree, parseBundletoolXmlTree } from './check-android-manifest.mjs';

const PACKAGE = 'io.github.hogy86.shieldvsrobots';

/** A minimal, compliant aapt2 `dump xmltree`-shaped fixture (real aapt2 output
 * indents 2 spaces per nesting level). */
function compliantAapt2Text({
  activityName = '.MainActivity',
  receiverPermission = 'android.permission.DUMP',
  providerExtraLines = '',
  providerName = 'androidx.startup.InitializationProvider',
  providerExportedLine = 'A: android:exported(0x01010010)=(type 0x12)0x0',
  providerGrantUriPermissionsLine = '',
  permissionName = `${PACKAGE}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`,
  extraTopLevelLines = '',
} = {}) {
  return `
E: manifest (line=2)
  A: package="${PACKAGE}" (Raw: "${PACKAGE}")
  E: uses-sdk (line=3)
    A: android:minSdkVersion(0x0101020c)=0x18
    A: android:targetSdkVersion(0x01010270)=0x24
  E: application (line=5)
    A: android:allowBackup(0x01010280)=(type 0x12)0x0
    A: android:usesCleartextTraffic(0x0101059a)=(type 0x12)0x0
    E: activity (line=6)
      A: android:name(0x01010003)="${activityName}"
      A: android:exported(0x01010010)=(type 0x12)0xffffffff
      E: intent-filter (line=7)
        E: action (line=8)
          A: android:name(0x01010003)="android.intent.action.MAIN"
        E: category (line=9)
          A: android:name(0x01010003)="android.intent.category.LAUNCHER"
${extraTopLevelLines}
    E: provider (line=10)
      A: android:name(0x01010003)="${providerName}"
      ${providerExportedLine}
      ${providerGrantUriPermissionsLine}
${providerExtraLines}
    E: receiver (line=11)
      A: android:name(0x01010003)="androidx.profileinstaller.ProfileInstallReceiver"
      A: android:exported(0x01010010)=(type 0x12)0xffffffff
      A: android:permission(0x01010009)="${receiverPermission}"
  E: uses-permission (line=12)
    A: android:name(0x01010003)="${permissionName}"
`;
}

describe('checkManifest - baseline', () => {
  it('passes a fully compliant debug manifest', () => {
    const tree = parseAapt2Tree(compliantAapt2Text());
    expect(checkManifest(tree, 'debug', false)).toEqual([]);
  });
});

describe('checkManifest - H3(a): provider child checks fire even on the allowlisted name', () => {
  it('fails on a <grant-uri-permission> child of the allowlisted provider', () => {
    const text = compliantAapt2Text({
      providerExtraLines: `      E: grant-uri-permission (line=10)\n        A: android:path(0x01010405)="/"\n`,
    });
    const tree = parseAapt2Tree(text);
    const failures = checkManifest(tree, 'debug', false);
    expect(failures.some((f) => f.includes('grant-uri-permission'))).toBe(true);
  });

  it('fails on a FILE_PROVIDER_PATHS meta-data child of the allowlisted provider', () => {
    const text = compliantAapt2Text({
      providerExtraLines: `      E: meta-data (line=10)\n        A: android:name(0x01010003)="android.support.FILE_PROVIDER_PATHS"\n`,
    });
    const tree = parseAapt2Tree(text);
    const failures = checkManifest(tree, 'debug', false);
    expect(failures.some((f) => f.includes('FILE_PROVIDER_PATHS'))).toBe(true);
  });
});

describe('checkManifest - H3(b): R1 is an exact match', () => {
  it('fails on a different package spoofing the allowed permission suffix', () => {
    const text = compliantAapt2Text({ permissionName: 'com.evil.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION' });
    const tree = parseAapt2Tree(text);
    const failures = checkManifest(tree, 'debug', false);
    expect(failures.some((f) => f.startsWith('R1:'))).toBe(true);
  });

  it('passes the real, exact package-qualified permission', () => {
    const tree = parseAapt2Tree(compliantAapt2Text());
    expect(checkManifest(tree, 'debug', false).some((f) => f.startsWith('R1:'))).toBe(false);
  });
});

describe('checkManifest - H3(d): exact class/permission matches on exported components', () => {
  it('fails when the exported "MainActivity" belongs to a different package', () => {
    const text = compliantAapt2Text({ activityName: 'com.evil.MainActivity' });
    const tree = parseAapt2Tree(text);
    const failures = checkManifest(tree, 'debug', false);
    expect(failures.some((f) => f.includes('unexpected exported component activity'))).toBe(true);
  });

  it('fails when the allowed receiver is missing its android.permission.DUMP guard', () => {
    const text = compliantAapt2Text({ receiverPermission: '' });
    const tree = parseAapt2Tree(text);
    const failures = checkManifest(tree, 'debug', false);
    expect(failures.some((f) => f.includes('DUMP'))).toBe(true);
  });
});

describe('checkManifest - H3(c): real bundletool-style XML', () => {
  it('parses and passes a compliant bundletool dump manifest XML', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${PACKAGE}">
  <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="36"/>
  <application android:allowBackup="false" android:usesCleartextTraffic="false">
    <activity android:name=".MainActivity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
    <provider android:name="androidx.startup.InitializationProvider" android:exported="false"/>
    <receiver android:name="androidx.profileinstaller.ProfileInstallReceiver" android:exported="true" android:permission="android.permission.DUMP"/>
  </application>
  <uses-permission android:name="${PACKAGE}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"/>
</manifest>`;
    const { window } = new JSDOM();
    const tree = parseBundletoolXmlTree(xml, window.DOMParser);
    expect(checkManifest(tree, 'release', false)).toEqual([]);
  });
});

describe('checkManifest - H4 (round 2): R5 provider fixtures (b)-(g)', () => {
  it('(b) fails on a template FileProvider subclass', () => {
    const text = compliantAapt2Text({ providerName: 'androidx.core.content.FileProvider' });
    const tree = parseAapt2Tree(text);
    const failures = checkManifest(tree, 'debug', false);
    expect(failures.some((f) => f.includes('looks like a FileProvider'))).toBe(true);
  });

  it('(c) fails when the allowlisted provider has exported="true"', () => {
    const text = compliantAapt2Text({ providerExportedLine: 'A: android:exported(0x01010010)=(type 0x12)0xffffffff' });
    const tree = parseAapt2Tree(text);
    const failures = checkManifest(tree, 'debug', false);
    expect(failures.some((f) => f.includes('must have android:exported="false"'))).toBe(true);
  });

  it('(d) fails when the allowlisted provider has grantUriPermissions="true"', () => {
    const text = compliantAapt2Text({
      providerGrantUriPermissionsLine: 'A: android:grantUriPermissions(0x1)=(type 0x12)0xffffffff',
    });
    const tree = parseAapt2Tree(text);
    const failures = checkManifest(tree, 'debug', false);
    expect(failures.some((f) => f.includes('grantUriPermissions="true"'))).toBe(true);
  });

  it('(f) fails when the allowlisted provider has no exported attribute at all', () => {
    const text = compliantAapt2Text({ providerExportedLine: '' });
    const tree = parseAapt2Tree(text);
    const failures = checkManifest(tree, 'debug', false);
    expect(failures.some((f) => f.includes('must have android:exported="false"'))).toBe(true);
  });

  it('(g) fails on a provider that is not on the allowlist at all', () => {
    const text = compliantAapt2Text({ providerName: 'com.example.SomeOtherProvider' });
    const tree = parseAapt2Tree(text);
    const failures = checkManifest(tree, 'debug', false);
    expect(failures.some((f) => f.includes('not on the allowlist'))).toBe(true);
  });
});

describe('checkManifest - H4/M4 (round 2): exported activity-alias', () => {
  it('fails on an exported activity-alias', () => {
    const text = compliantAapt2Text({
      extraTopLevelLines: `    E: activity-alias (line=6b)\n      A: android:name(0x01010003)=".AliasActivity"\n      A: android:exported(0x01010010)=(type 0x12)0xffffffff\n`,
    });
    const tree = parseAapt2Tree(text);
    const failures = checkManifest(tree, 'debug', false);
    expect(failures.some((f) => f.includes('unexpected exported component activity-alias'))).toBe(true);
  });
});

describe('checkManifest - H4 (round 2): bundletool XML form covers (a)-(g) too, not just aapt2', () => {
  function bundletoolXml({
    providerName = 'androidx.startup.InitializationProvider',
    providerExported = 'false',
    providerGrantUri,
    providerChild = '',
    aliasExported,
  } = {}) {
    const grantUriAttr = providerGrantUri ? ` android:grantUriPermissions="${providerGrantUri}"` : '';
    const alias = aliasExported
      ? `<activity-alias android:name=".AliasActivity" android:targetActivity=".MainActivity" android:exported="${aliasExported}"/>`
      : '';
    return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${PACKAGE}">
  <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="36"/>
  <application android:allowBackup="false" android:usesCleartextTraffic="false">
    <activity android:name=".MainActivity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
    ${alias}
    <provider android:name="${providerName}" android:exported="${providerExported}"${grantUriAttr}>
      ${providerChild}
    </provider>
    <receiver android:name="androidx.profileinstaller.ProfileInstallReceiver" android:exported="true" android:permission="android.permission.DUMP"/>
  </application>
  <uses-permission android:name="${PACKAGE}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"/>
</manifest>`;
  }

  function checkXml(xml, variant = 'release') {
    const { window } = new JSDOM();
    const tree = parseBundletoolXmlTree(xml, window.DOMParser);
    return checkManifest(tree, variant, false);
  }

  it('(a) grant-uri-permission child fires even on the allowlisted provider', () => {
    const xml = bundletoolXml({ providerChild: '<grant-uri-permission android:path="/"/>' });
    expect(checkXml(xml).some((f) => f.includes('grant-uri-permission'))).toBe(true);
  });

  it('(a) FILE_PROVIDER_PATHS meta-data child fires even on the allowlisted provider '
    + '(code-review-round3 L5: the bundletool XML form of the aapt2 fixture above)', () => {
    const xml = bundletoolXml({
      providerChild: '<meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths"/>',
    });
    expect(checkXml(xml).some((f) => f.includes('FILE_PROVIDER_PATHS'))).toBe(true);
  });

  it('(b) fails on a template FileProvider subclass', () => {
    const xml = bundletoolXml({ providerName: 'androidx.core.content.FileProvider' });
    expect(checkXml(xml).some((f) => f.includes('looks like a FileProvider'))).toBe(true);
  });

  it('(c) fails when the allowlisted provider has exported="true"', () => {
    const xml = bundletoolXml({ providerExported: 'true' });
    expect(checkXml(xml).some((f) => f.includes('must have android:exported="false"'))).toBe(true);
  });

  it('(d) fails when the allowlisted provider has grantUriPermissions="true"', () => {
    const xml = bundletoolXml({ providerGrantUri: 'true' });
    expect(checkXml(xml).some((f) => f.includes('grantUriPermissions="true"'))).toBe(true);
  });

  it('(e) passes the fully compliant shape', () => {
    expect(checkXml(bundletoolXml())).toEqual([]);
  });

  it('(f) fails when the allowlisted provider has no exported attribute at all', () => {
    const xml = bundletoolXml().replace(' android:exported="false"', '');
    expect(checkXml(xml).some((f) => f.includes('must have android:exported="false"'))).toBe(true);
  });

  it('(g) fails on a provider that is not on the allowlist at all', () => {
    const xml = bundletoolXml({ providerName: 'com.example.SomeOtherProvider' });
    expect(checkXml(xml).some((f) => f.includes('not on the allowlist'))).toBe(true);
  });

  it('fails on an exported activity-alias', () => {
    const xml = bundletoolXml({ aliasExported: 'true' });
    expect(checkXml(xml).some((f) => f.includes('unexpected exported component activity-alias'))).toBe(true);
  });
});

describe('checkManifest - H4 (round 2): real aapt2 36.0.0 boolean form (=true/=false, not (type 0x12))', () => {
  it('parses and passes real aapt2-36-shaped boolean attributes', () => {
    // Taken from `aapt2 dump xmltree` against the mirror build's real debug APK
    // (docs/mobile/tooling-setup-log.md, step 7 round 2): aapt2 36 prints boolean
    // attributes as a bare `=true`/`=false` token, not the `(type 0x12)0x...` form
    // the hand-written fixtures above use.
    const text = `
E: manifest (line=2)
  A: package="${PACKAGE}" (Raw: "${PACKAGE}")
  E: uses-sdk (line=3)
    A: android:minSdkVersion(0x0101020c)=0x18
    A: android:targetSdkVersion(0x01010270)=0x24
  E: application (line=5)
    A: android:allowBackup(0x01010280)=false
    A: android:usesCleartextTraffic(0x0101059a)=false
    E: activity (line=6)
      A: android:name(0x01010003)=".MainActivity"
      A: android:exported(0x01010010)=true
      E: intent-filter (line=7)
        E: action (line=8)
          A: android:name(0x01010003)="android.intent.action.MAIN"
        E: category (line=9)
          A: android:name(0x01010003)="android.intent.category.LAUNCHER"
    E: provider (line=10)
      A: android:name(0x01010003)="androidx.startup.InitializationProvider"
      A: android:exported(0x01010010)=false
    E: receiver (line=11)
      A: android:name(0x01010003)="androidx.profileinstaller.ProfileInstallReceiver"
      A: android:exported(0x01010010)=true
      A: android:permission(0x01010009)="android.permission.DUMP"
  E: uses-permission (line=12)
    A: android:name(0x01010003)="${PACKAGE}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
`;
    const tree = parseAapt2Tree(text);
    expect(checkManifest(tree, 'debug', false)).toEqual([]);
  });
});

describe('checkManifest - M4 (round 2): --variant validation', () => {
  it('rejects an unrecognized --variant (code-review-round3 L4: exercises the '
    + "script's OWN validateArgs, not a re-implementation of its check)", async () => {
    const { parseArgs, validateArgs } = await import('./check-android-manifest.mjs');
    const args = parseArgs(['--variant', 'relase', '--apk', 'x.apk']);
    const error = validateArgs(args);
    expect(error).toBe('check-android-manifest: --variant must be "debug" or "release", got "relase"');
  });

  it('accepts --variant debug and --variant release', async () => {
    const { parseArgs, validateArgs } = await import('./check-android-manifest.mjs');
    expect(validateArgs(parseArgs(['--variant', 'debug', '--apk', 'x.apk']))).toBeNull();
    expect(validateArgs(parseArgs(['--variant', 'release', '--apk', 'x.apk']))).toBeNull();
  });

  it('rejects a missing --apk/--manifest-xml', async () => {
    const { parseArgs, validateArgs } = await import('./check-android-manifest.mjs');
    const error = validateArgs(parseArgs(['--variant', 'debug']));
    expect(error).toMatch(/^Usage: check-android-manifest\.mjs/);
  });
});

describe('checkManifest - release-only rules', () => {
  function releaseAapt2Text({ debuggable = false, testOnly = false } = {}) {
    return compliantAapt2Text().replace(
      'A: android:allowBackup(0x01010280)=(type 0x12)0x0',
      `A: android:allowBackup(0x01010280)=(type 0x12)0x0\n    A: android:debuggable(0x0101000f)=(type 0x12)${
        debuggable ? '0xffffffff' : '0x0'
      }\n    A: android:testOnly(0x01010272)=(type 0x12)${testOnly ? '0xffffffff' : '0x0'}`,
    );
  }

  it('R2: fails on a debuggable release build', () => {
    const tree = parseAapt2Tree(releaseAapt2Text({ debuggable: true }));
    expect(checkManifest(tree, 'release', false).some((f) => f.startsWith('R2:'))).toBe(true);
  });

  it('R6: fails on a testOnly release build', () => {
    const tree = parseAapt2Tree(releaseAapt2Text({ testOnly: true }));
    expect(checkManifest(tree, 'release', false).some((f) => f.startsWith('R6:'))).toBe(true);
  });
});

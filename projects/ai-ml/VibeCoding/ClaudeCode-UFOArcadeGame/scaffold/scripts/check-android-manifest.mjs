#!/usr/bin/env node
// Implements docs/mobile/architecture/mobile-architecture.md §10.3 (M-ADR-0012,
// amended by A8/review-v1b N1): the release-manifest CI gate. Replaces v1's
// check-android-permissions.mjs. Rules R1-R7, run against the debug APK, the unsigned
// release APK (both via `aapt2 dump xmltree --file AndroidManifest.xml`), and, at
// step 15, the signed release AAB (via `bundletool dump manifest`, real XML).
//
// code-review-round1.md H3: unlike v1, this parses a real PARENT/CHILD TREE (not a
// flat list) - the `<grant-uri-permission>`/`FILE_PROVIDER_PATHS` checks need to know
// which `<provider>` a child belongs to, and both are checked even for the one
// allowlisted provider name. Permission/class matches are EXACT (`${package}.Name`),
// never `endsWith`, per the H3(b)/(d) fixture findings.
//
// Usage: node scripts/check-android-manifest.mjs --variant debug|release
//          (--apk <path> | --manifest-xml <path>) [--allow-internet]

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ALLOWED_PERMISSION = 'DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION';
// §10.3 R5 implementation notes (A8, review-v1b N1, review-v1 L1): named constants,
// matched on the EXACT, fully qualified class name only. Adding an entry needs a
// security review.
const ALLOWED_PROVIDER_CLASS = 'androidx.startup.InitializationProvider';
const ALLOWED_RECEIVER_CLASS = 'androidx.profileinstaller.ProfileInstallReceiver';
const FILE_PROVIDER_PATHS_META = 'android.support.FILE_PROVIDER_PATHS';

export function parseArgs(argv) {
  const args = { variant: null, apk: null, manifestXml: null, allowInternet: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--variant') args.variant = argv[++i];
    else if (arg === '--apk') args.apk = argv[++i];
    else if (arg === '--manifest-xml') args.manifestXml = argv[++i];
    else if (arg === '--allow-internet') args.allowInternet = true;
  }
  return args;
}

function loadXmltreeText(args) {
  // aapt2 (a native Windows binary in this pipeline) emits CRLF line endings; strip
  // the \r so per-line regexes below (which anchor `$` to end-of-line) match reliably
  // on every OS this check runs on (local Windows dev machine and Linux CI).
  if (args.manifestXml) return readFileSync(args.manifestXml, 'utf8').replace(/\r/g, '');
  const aapt2 = process.env.AAPT2_PATH ?? 'aapt2';
  const text = execFileSync(aapt2, ['dump', 'xmltree', args.apk, '--file', 'AndroidManifest.xml'], {
    encoding: 'utf8',
  });
  return text.replace(/\r/g, '');
}

function parseAttrValue(raw) {
  const rawMatch = /\(Raw:\s*"(.*)"\)/.exec(raw);
  if (rawMatch) return rawMatch[1];
  if (raw === '"true"' || raw === 'true') return true;
  if (raw === '"false"' || raw === 'false') return false;
  if (/^\(type 0x12\)0xffffffff$/.test(raw)) return true;
  if (/^\(type 0x12\)0x0+$/.test(raw)) return false;
  // A bare aapt2 integer attribute (minSdkVersion, targetSdkVersion, ...): hex text,
  // no surrounding type annotation or quotes - decode to the actual number so R7's
  // `Number(...)` comparison works instead of falling through to NaN.
  if (/^0x[0-9a-fA-F]+$/.test(raw)) return parseInt(raw, 16);
  return raw.replace(/^"|"$/g, '');
}

/** H3(a): a real tree (children[]/parent), not a flat list - `checkManifest` needs to
 * know which `<provider>` a `<grant-uri-permission>`/`<meta-data>` child belongs to.
 * Real aapt2 output does NOT use a uniform "2 spaces per level" step (verified against
 * a real debug APK): sibling elements indent by a consistent amount relative to their
 * OWN parent element, but that step size varies (e.g. +4 for `<intent-filter>` under
 * `<activity>`, but attribute lines are always +2 from their owning element) - so depth
 * is tracked by comparing each line's raw indent width against what is already on the
 * stack (pop while the top of the stack is at the same or deeper indent), not by
 * dividing indent by a fixed constant. */
export function parseAapt2Tree(xmltreeText) {
  const root = { tag: '#root', attrs: {}, children: [], parent: null, indent: -1 };
  const stack = [root];
  let current = null;
  for (const line of xmltreeText.split('\n')) {
    const elementMatch = /^(\s*)E:\s*([\w.-]+)/.exec(line);
    if (elementMatch) {
      const indent = elementMatch[1].length;
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
      const parent = stack[stack.length - 1];
      current = { tag: elementMatch[2], attrs: {}, children: [], parent, indent };
      parent.children.push(current);
      stack.push(current);
      continue;
    }
    if (!current) continue;
    // Attribute lines look like either `A: package="..."` or, when namespaced,
    // `A: http://schemas.android.com/apk/res/android:name(0x...)=...`. The greedy
    // `.*:` consumes everything up to the LAST colon (the one right before the
    // actual attribute name), which correctly skips over the `http://...:` prefix.
    const attrMatch = /A:\s*(?:.*:)?([\w.-]+)(?:\([^)]*\))?=(.*)$/.exec(line);
    if (!attrMatch) continue;
    const [, name, rawValue] = attrMatch;
    current.attrs[name] = parseAttrValue(rawValue.trim());
  }
  return root;
}

/** H3(c): `bundletool dump manifest` emits real XML, not aapt2's indentation-based
 * text - step 15 feeds this checker that form, and it must parse it correctly rather
 * than fail closed on every release. Booleans there are literal `"true"`/`"false"`
 * attribute strings (parseAttrValue already handles that form). Uses jsdom's
 * DOMParser (an existing devDependency, already used for the Vitest jsdom
 * environment) rather than adding a new XML-parsing package. */
export function parseBundletoolXmlTree(xmlText, DOMParserImpl) {
  const doc = new DOMParserImpl().parseFromString(xmlText, 'application/xml');
  const parserError = doc.getElementsByTagName('parsererror')[0];
  if (parserError) throw new Error(`check-android-manifest: invalid --manifest-xml: ${parserError.textContent}`);

  const root = { tag: '#root', attrs: {}, children: [], parent: null, depth: -1 };
  function walk(domNode, parent, depth) {
    for (const child of Array.from(domNode.children ?? [])) {
      const node = { tag: child.tagName, attrs: {}, children: [], parent, depth };
      for (const attr of Array.from(child.attributes ?? [])) {
        // Strip the `android:` namespace prefix, matching aapt2's own attribute names
        // (`android:exported` -> `exported`), and the `package` attribute (no prefix)
        // stays as-is.
        const name = attr.name.includes(':') ? attr.name.split(':').pop() : attr.name;
        node.attrs[name] = parseAttrValue(attr.value);
      }
      parent.children.push(node);
      walk(child, node, depth + 1);
    }
  }
  walk(doc, root, 0);
  return root;
}

function flatten(node, acc = []) {
  if (node.tag !== '#root') acc.push(node);
  for (const child of node.children) flatten(child, acc);
  return acc;
}

function resolveClassName(name, packageName) {
  if (name && name.startsWith('.')) return `${packageName}${name}`;
  return name;
}

export function checkManifest(root, variant, allowInternet) {
  const failures = [];
  const elements = flatten(root);
  const manifestEl = elements.find((el) => el.tag === 'manifest');
  const packageName = manifestEl?.attrs.package ?? '';
  const allowedPermissionName = `${packageName}.${ALLOWED_PERMISSION}`;

  // R1: permissions. Exact match only (H3(b)) - `endsWith` let
  // `com.evil.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` through.
  for (const el of elements) {
    if (el.tag !== 'uses-permission' && el.tag !== 'uses-permission-sdk-23') continue;
    const name = String(el.attrs.name ?? '');
    if (name === allowedPermissionName) continue;
    if (allowInternet && name === 'android.permission.INTERNET') continue;
    failures.push(`R1: disallowed permission ${name}`);
  }

  if (variant === 'release') {
    // R2: debuggable.
    const app = elements.find((el) => el.tag === 'application');
    if (app?.attrs.debuggable === true) failures.push('R2: android:debuggable="true" on a release build');
    // R6: testOnly.
    if (app?.attrs.testOnly === true) failures.push('R6: android:testOnly="true" on a release build');
  }

  // R3: cleartext / network security config.
  const app = elements.find((el) => el.tag === 'application');
  if (app?.attrs.usesCleartextTraffic !== false) {
    failures.push('R3: android:usesCleartextTraffic is not explicitly false');
  }
  if (app?.attrs.networkSecurityConfig) {
    failures.push('R3: a networkSecurityConfig is present');
  }

  // R4: backup.
  if (app?.attrs.allowBackup !== false) {
    failures.push('R4: android:allowBackup is not explicitly false');
  }

  // R5: components.
  for (const el of elements) {
    if (el.tag === 'provider') {
      const className = resolveClassName(String(el.attrs.name ?? ''), packageName);
      const isAllowedName = className === ALLOWED_PROVIDER_CLASS;
      const isFileProviderShaped =
        className === 'androidx.core.content.FileProvider' || className.endsWith('FileProvider');
      const exported = el.attrs.exported;
      const grantsUriAttr = el.attrs.grantUriPermissions === true;

      // H3(a): these two checks run for EVERY provider, including the allowlisted
      // one - a `<grant-uri-permission>` child or a FILE_PROVIDER_PATHS meta-data
      // child is dead FileProvider-shaped attack surface regardless of class name.
      const grantUriChild = el.children.some((child) => child.tag === 'grant-uri-permission');
      const fileProviderMeta = el.children.some(
        (child) => child.tag === 'meta-data' && String(child.attrs.name ?? '') === FILE_PROVIDER_PATHS_META,
      );
      if (grantUriChild) {
        failures.push(`R5: provider ${className} has a <grant-uri-permission> child - not allowed`);
      }
      if (fileProviderMeta) {
        failures.push(`R5: provider ${className} has a FILE_PROVIDER_PATHS meta-data child - not allowed`);
      }

      if (isFileProviderShaped) {
        failures.push(`R5: provider ${className} looks like a FileProvider - not allowed`);
        continue;
      }
      if (grantsUriAttr) {
        failures.push(`R5: provider ${className} has grantUriPermissions="true" - not allowed`);
        continue;
      }
      if (!isAllowedName) {
        failures.push(`R5: unexpected provider ${className} - not on the allowlist`);
        continue;
      }
      if (exported !== false) {
        failures.push(`R5: ${ALLOWED_PROVIDER_CLASS} must have android:exported="false" explicitly`);
      }
    }
    // M4 (round 2): `activity-alias` is its own exportable component tag - aapt2/the
    // merged manifest never folds it into `activity` - so it was silently skipped by
    // this list before, and an exported alias passed unnoticed.
    if (el.tag === 'receiver' || el.tag === 'service' || el.tag === 'activity' || el.tag === 'activity-alias') {
      const className = resolveClassName(String(el.attrs.name ?? ''), packageName);
      const exported = el.attrs.exported === true;
      if (!exported) continue;
      // H3(d): EXACT class match (`${package}.MainActivity`), never `endsWith` -
      // `com.evil.MainActivity` (a different app's activity name) must not pass.
      const isMainActivity = el.tag === 'activity' && className === `${packageName}.MainActivity`;
      const isAllowedReceiver = el.tag === 'receiver' && className === ALLOWED_RECEIVER_CLASS;
      if (isMainActivity) {
        const hasLauncherFilter = el.children.some(
          (filter) =>
            filter.tag === 'intent-filter' &&
            filter.children.some((c) => c.tag === 'action' && c.attrs.name === 'android.intent.action.MAIN') &&
            filter.children.some((c) => c.tag === 'category' && c.attrs.name === 'android.intent.category.LAUNCHER'),
        );
        if (!hasLauncherFilter) {
          failures.push(`R5: ${className} is exported but has no MAIN/LAUNCHER intent-filter`);
        }
        continue;
      }
      if (isAllowedReceiver) {
        if (el.attrs.permission !== 'android.permission.DUMP') {
          failures.push(`R5: ${ALLOWED_RECEIVER_CLASS} must guard with android:permission="android.permission.DUMP"`);
        }
        continue;
      }
      failures.push(`R5: unexpected exported component ${el.tag} ${className}`);
    }
    if (el.tag === 'data' && el.attrs.scheme) {
      failures.push(`R5: unexpected <data android:scheme="${el.attrs.scheme}"> intent filter`);
    }
  }

  // R7: SDK levels.
  const usesSdk = elements.find((el) => el.tag === 'uses-sdk');
  const minSdk = Number(usesSdk?.attrs.minSdkVersion);
  const targetSdk = Number(usesSdk?.attrs.targetSdkVersion);
  if (minSdk !== 24) failures.push(`R7: minSdkVersion is ${minSdk}, expected 24`);
  if (targetSdk !== 36) failures.push(`R7: targetSdkVersion is ${targetSdk}, expected 36`);

  return failures;
}

async function loadTree(args) {
  if (args.manifestXml) {
    const text = readFileSync(args.manifestXml, 'utf8');
    // bundletool emits real XML (`<?xml ...?>`); aapt2's own `--manifest-xml`
    // fixture path (tests only) stays on the text form for convenience.
    if (/^\s*<\?xml/.test(text) || /^\s*<manifest/.test(text)) {
      const { JSDOM } = await import('jsdom');
      const { window } = new JSDOM();
      return parseBundletoolXmlTree(text, window.DOMParser);
    }
    return parseAapt2Tree(text.replace(/\r/g, ''));
  }
  return parseAapt2Tree(loadXmltreeText(args));
}

// code-review-round3 L4: exported so a test exercises this script's OWN validation
// logic (rather than re-implementing the same check inside the test and testing
// THAT copy, which is the round-2 C3(e) tautology this fix closes). Returns `null`
// when `args` is valid, or the exact message `main()` prints to stderr otherwise -
// `main()` below is the only caller that also sets `process.exitCode`.
export function validateArgs(args) {
  if (!args.variant || (!args.apk && !args.manifestXml)) {
    return 'Usage: check-android-manifest.mjs --variant debug|release (--apk <path> | --manifest-xml <path>) [--allow-internet]';
  }
  // M4 (round 2): an unrecognized --variant (e.g. a typo like "relase") used to fall
  // through silently, skipping R2/R6 (which run only `if (variant === 'release')`)
  // without any indication the check ran against the wrong thing.
  if (args.variant !== 'debug' && args.variant !== 'release') {
    return `check-android-manifest: --variant must be "debug" or "release", got "${args.variant}"`;
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const error = validateArgs(args);
  if (error) {
    console.error(error);
    process.exitCode = 2;
    return;
  }
  const tree = await loadTree(args);
  const failures = checkManifest(tree, args.variant, args.allowInternet);

  if (failures.length > 0) {
    console.error(`check-android-manifest (${args.variant}): FAILED`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`check-android-manifest (${args.variant}): PASSED`);
}

// H5: guarded so `checkManifest`/`parseAapt2Tree`/`parseBundletoolXmlTree` can be
// unit-tested with inline fixtures without invoking `aapt2`/exiting the process.
// `pathToFileURL` (not a hand-built `file://` string) keeps this correct on Windows
// (drive letters, backslashes).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

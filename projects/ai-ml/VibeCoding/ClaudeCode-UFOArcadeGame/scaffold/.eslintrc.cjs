/* ESLint config for the TypeScript source tree. Documents the linter per
 * solution-architecture.md's request to name the specific linter/formatter used.
 *
 * code-review-round1.md H7 / docs/mobile/architecture/mobile-architecture.md §4,
 * §14.1 row L4b: the platform-boundary and dangerous-sink rules below are BINDING
 * security gates, not just convention - the reviewer must find them here, enforced,
 * not merely absent-because-nobody-happened-to-write-the-code-yet.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    browser: true,
    es2020: true,
  },
  rules: {
    // Simulation code must never use wall-clock timers (ADR-0002 decision 5,
    // binding security finding #3). Enforced as a lint rule, not just convention.
    'no-restricted-globals': [
      'error',
      { name: 'setTimeout', message: 'Sim code must use the fixed-timestep remaining-duration pattern, not setTimeout (ADR-0002).' },
      { name: 'setInterval', message: 'Sim code must use the fixed-timestep remaining-duration pattern, not setInterval (ADR-0002).' },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Base rule off - superseded by `@typescript-eslint/no-restricted-imports` below,
    // which can distinguish `import type` from value imports (Platform.ts row).
    'no-restricted-imports': 'off',
    // docs/mobile/architecture/mobile-architecture.md §4 (M-ADR-0002): game logic
    // never branches on platform. Only src/main.ts and src/platform/android/** may
    // import Capacitor or each other's Android-only modules; only src/main.ts and
    // src/platform/web/** may import the web platform module; everywhere else may
    // import src/platform/Platform.ts only via `import type` (never as a value -
    // it has no runtime exports to begin with, but this makes that a build-time
    // guarantee instead of a convention).
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        patterns: [
          { group: ['@capacitor/*'], message: 'Capacitor may only be imported from src/main.ts or src/platform/android/** (M-ADR-0002).' },
          { group: ['**/platform/android/*', '**/platform/android'], message: 'src/platform/android/** may only be imported from src/main.ts (M-ADR-0002).' },
          { group: ['**/platform/web/*', '**/platform/web'], message: 'src/platform/web/** may only be imported from src/main.ts (M-ADR-0002).' },
          { group: ['**/platform/Platform'], allowTypeImports: true, message: 'Platform.ts may only be imported with `import type` (M-ADR-0002) - it has no runtime exports.' },
        ],
      },
    ],
    // H7 / §4: `import.meta` (Vite's `import.meta.env.MODE` platform switch) may
    // only appear in src/main.ts - the ONE place that picks a Platform.
    'no-restricted-syntax': [
      'error',
      {
        selector: "MetaProperty[meta.name='import'][property.name='meta']",
        message: 'import.meta may only be used in src/main.ts (M-ADR-0002) - it is the one place that picks a Platform.',
      },
      // L4b: dangerous DOM/eval sinks, banned everywhere. ui/dom.ts's textContent-only
      // helpers are the one sanctioned way to write DOM text (security binding
      // constraint #2).
      {
        selector: "NewExpression[callee.name='Function']",
        message: 'new Function(...) is banned (L4b) - it is a code-injection sink.',
      },
      {
        selector: "CallExpression[callee.name='Function']",
        message: 'Function(...) is banned (L4b) - it is a code-injection sink.',
      },
      {
        selector: "MemberExpression[object.name='navigator'][property.name='userAgent']",
        message: 'navigator.userAgent may only be read inside src/platform/android/** (M-ADR-0002) - game logic never branches on platform.',
      },
      {
        selector: "CallExpression[callee.object.name='Capacitor'][callee.property.name='getPlatform']",
        message: 'Capacitor.getPlatform() may only be called inside src/platform/android/** (M-ADR-0002) - game logic never branches on platform.',
      },
    ],
    // L4b: innerHTML/outerHTML/insertAdjacentHTML/document.write are banned sinks -
    // ui/dom.ts's textContent-only helpers are the one sanctioned way to write DOM text.
    'no-restricted-properties': [
      'error',
      { property: 'innerHTML', message: 'innerHTML is banned (L4b) - use ui/dom.ts\'s textContent-only helpers.' },
      { property: 'outerHTML', message: 'outerHTML is banned (L4b) - use ui/dom.ts\'s textContent-only helpers.' },
      { property: 'insertAdjacentHTML', message: 'insertAdjacentHTML is banned (L4b) - use ui/dom.ts\'s textContent-only helpers.' },
      { object: 'document', property: 'write', message: 'document.write is banned (L4b).' },
    ],
    // L4b: eval (no-restricted-syntax above already covers the `Function` constructor).
    'no-eval': 'error',
  },
  // H2 (round 2): 'android' was unanchored, so it matched EVERY directory named
  // "android" anywhere in the tree - including src/platform/android/**, which
  // silently exempted that whole directory from every lint rule (the H7 gate).
  // Anchored to the repo root, it only ever matches the top-level generated
  // Capacitor project.
  ignorePatterns: ['dist', 'dist-android', 'node_modules', '/android/', '*.cjs'],
  overrides: [
    {
      // The Android platform module and the composition root are the one place
      // each of the platform-boundary import restrictions above is allowed.
      files: ['src/platform/android/**/*.ts', 'src/main.ts'],
      rules: {
        '@typescript-eslint/no-restricted-imports': 'off',
      },
    },
    {
      // H2 (round 2): src/main.ts is the one file allowed to use `import.meta` (it
      // is the Vite build-mode switch, M-ADR-0002) - but it must keep the OTHER
      // no-restricted-syntax bans (the code-injection sinks, and the
      // userAgent/getPlatform platform-branch bans, since main.ts is not under
      // src/platform/android/** and game logic never branches on platform there
      // either). Only the MetaProperty selector is dropped, not the whole rule.
      files: ['src/main.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "NewExpression[callee.name='Function']",
            message: 'new Function(...) is banned (L4b) - it is a code-injection sink.',
          },
          {
            selector: "CallExpression[callee.name='Function']",
            message: 'Function(...) is banned (L4b) - it is a code-injection sink.',
          },
          {
            selector: "MemberExpression[object.name='navigator'][property.name='userAgent']",
            message: 'navigator.userAgent may only be read inside src/platform/android/** (M-ADR-0002) - game logic never branches on platform.',
          },
          {
            selector: "CallExpression[callee.object.name='Capacitor'][callee.property.name='getPlatform']",
            message: 'Capacitor.getPlatform() may only be called inside src/platform/android/** (M-ADR-0002) - game logic never branches on platform.',
          },
        ],
      },
    },
    {
      // L4b bans innerHTML/outerHTML as WRITE sinks; a handful of tests READ
      // `.innerHTML` (never assign it) specifically to assert "no markup was
      // written, only textContent" - the security property L4b exists to protect.
      // Scoped to *.test.ts only, so production code stays fully covered.
      files: ['src/**/*.test.ts'],
      rules: {
        'no-restricted-properties': 'off',
      },
    },
    {
      // H2 (round 2): src/platform/android/** is the one place userAgent/
      // getPlatform platform-branching is allowed - but it must keep the
      // MetaProperty (`import.meta`) ban, since the spec allows `import.meta` only
      // in src/main.ts, not anywhere under src/platform/android/**. Re-declaring
      // the rule without that selector (as this override did before round 2)
      // silently re-opened `import.meta` here once H2's ignorePatterns fix made
      // this directory actually linted.
      files: ['src/platform/android/**/*.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "MetaProperty[meta.name='import'][property.name='meta']",
            message: 'import.meta may only be used in src/main.ts (M-ADR-0002) - it is the one place that picks a Platform.',
          },
          {
            selector: "NewExpression[callee.name='Function']",
            message: 'new Function(...) is banned (L4b) - it is a code-injection sink.',
          },
          {
            selector: "CallExpression[callee.name='Function']",
            message: 'Function(...) is banned (L4b) - it is a code-injection sink.',
          },
        ],
      },
    },
  ],
};

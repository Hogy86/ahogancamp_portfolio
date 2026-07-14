/* ESLint config for the TypeScript source tree. Documents the linter per
 * solution-architecture.md's request to name the specific linter/formatter used. */
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
  },
  ignorePatterns: ['dist', 'node_modules', '*.cjs'],
};

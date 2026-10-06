import { defineConfig } from 'vitest/config';

// Test-only config (jsdom is a devDependency, never shipped to the player - it
// provides `window`/`KeyboardEvent`/etc for InputManager and GameStateMachine's
// window.close() path). Does not affect vite.config.ts's zero-plugin runtime build.
export default defineConfig({
  test: {
    environment: 'jsdom',
    // H5: widened to cover the CI checker scripts' own fixture tests
    // (scripts/*.test.mjs) alongside the game's src/**/*.test.ts suite.
    include: ['src/**/*.{test,spec}.ts', 'scripts/**/*.{test,spec}.mjs'],
  },
});

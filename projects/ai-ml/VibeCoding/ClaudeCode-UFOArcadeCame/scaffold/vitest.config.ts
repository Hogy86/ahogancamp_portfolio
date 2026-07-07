import { defineConfig } from 'vitest/config';

// Test-only config (jsdom is a devDependency, never shipped to the player - it
// provides `window`/`KeyboardEvent`/etc for InputManager and GameStateMachine's
// window.close() path). Does not affect vite.config.ts's zero-plugin runtime build.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
  },
});

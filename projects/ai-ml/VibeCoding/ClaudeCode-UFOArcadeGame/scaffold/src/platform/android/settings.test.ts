// Implements docs/mobile/architecture/mobile-architecture.md §9.2, binding
// constraint L4c (H6): fail-closed parsing and the `__proto__`-pollution guard.

import { beforeEach, describe, expect, it } from 'vitest';
import { loadSettings, saveSettings, SETTINGS_STORAGE_KEY } from './settings';

describe('settings - fail-closed loading (§9.2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual({ swapControls: false, helpSeen: false });
  });

  it('defaults on invalid JSON', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{not json');
    expect(loadSettings()).toEqual({ swapControls: false, helpSeen: false });
  });

  it('defaults on a non-object JSON value', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '42');
    expect(loadSettings()).toEqual({ swapControls: false, helpSeen: false });
  });

  it('defaults a field with a non-boolean value while keeping the other valid field', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ swapControls: 'yes', helpSeen: true }),
    );
    expect(loadSettings()).toEqual({ swapControls: false, helpSeen: true });
  });

  it('L4c: a malicious __proto__ key never pollutes a shared prototype and still defaults safely', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{"__proto__":{"swapControls":true},"v":1}');
    const settings = loadSettings();
    expect(settings).toEqual({ swapControls: false, helpSeen: false });
    // The named-field read must never have polluted Object.prototype.
    expect(({} as Record<string, unknown>).swapControls).toBeUndefined();
  });

  it('round-trips a real saved value', () => {
    saveSettings({ swapControls: true, helpSeen: true });
    expect(loadSettings()).toEqual({ swapControls: true, helpSeen: true });
  });
});

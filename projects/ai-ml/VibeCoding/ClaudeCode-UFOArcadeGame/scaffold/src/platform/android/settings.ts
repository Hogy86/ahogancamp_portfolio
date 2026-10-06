// Implements docs/mobile/PRD-mobile.md M7.3 (Swap controls / help-seen persistence),
// docs/mobile/architecture/mobile-architecture.md §9.2, and binding constraint L4c
// (review-v1 L4): the parsed value is read field-by-field, BY NAME, into a fresh object
// literal - never spread, `Object.assign`d, or otherwise merged - so a malicious
// `__proto__` key in stored JSON can never pollute a shared prototype.

import { safeGetItem, safeSetItem } from '../../persistence/safeStorage';

export const SETTINGS_STORAGE_KEY = 'vvs:settings';
const SETTINGS_SCHEMA_VERSION = 1;

export interface AndroidSettings {
  swapControls: boolean;
  helpSeen: boolean;
}

const DEFAULT_SETTINGS: AndroidSettings = { swapControls: false, helpSeen: false };

function readField(source: unknown, key: 'swapControls' | 'helpSeen'): boolean {
  if (typeof source !== 'object' || source === null) return DEFAULT_SETTINGS[key];
  // Read the named field directly off the parsed value - never spread/Object.assign it
  // (L4c). An own `__proto__` key on `source` has no special effect here: this is a
  // plain property read, not a merge/assignment onto a fresh object.
  const value = (source as Record<string, unknown>)[key];
  return typeof value === 'boolean' ? value : DEFAULT_SETTINGS[key];
}

/** Fails closed to defaults on anything that isn't valid JSON, isn't a plain object, or
 * has non-boolean fields (M7.5). A version other than the one this code knows (e.g. a
 * downgrade install seeing a future v2) is still read field-by-field with the same
 * per-field validation - never overwritten until the player changes a setting. */
export function loadSettings(): AndroidSettings {
  const raw = safeGetItem(SETTINGS_STORAGE_KEY);
  if (raw === null) return { ...DEFAULT_SETTINGS };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    swapControls: readField(parsed, 'swapControls'),
    helpSeen: readField(parsed, 'helpSeen'),
  };
}

export function saveSettings(settings: AndroidSettings): void {
  safeSetItem(SETTINGS_STORAGE_KEY, JSON.stringify({ v: SETTINGS_SCHEMA_VERSION, ...settings }));
}

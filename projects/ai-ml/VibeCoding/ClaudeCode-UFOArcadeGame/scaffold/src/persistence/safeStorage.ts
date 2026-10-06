// Implements F20 AC9/AC10 (fail-closed persistence), M7.5 (docs/mobile/PRD-mobile.md),
// M-ADR-0006 §9.1: the website and the Android app (Capacitor WebView, origin pinned to
// https://localhost) both read/write the SAME `localStorage` API through this one shared
// module - there is no platform branch here (storage is not a listed platform-specific
// area, .claude/CLAUDE.md §One codebase). A blocked/throwing localStorage (quota, private
// mode, disabled storage) must never interrupt gameplay: every call is wrapped, and a
// per-key in-memory fallback keeps the current page/app session usable even when the
// underlying store is unavailable for the whole session.

const memoryFallback = new Map<string, string>();

/** Reads a raw stored string. Never throws - storage errors read as "not set" (null),
 * matching the fail-closed contract each caller (bestScore, settings) validates against. */
export function safeGetItem(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    if (value !== null) return value;
  } catch {
    // Storage inaccessible this session - fall through to the in-memory copy, if any.
  }
  return memoryFallback.get(key) ?? null;
}

/** Writes a raw string. Never throws and never delays/blocks the caller - a write
 * failure is silently absorbed (F20 AC10), with the value kept in memory for the rest
 * of this page/app session so "current session" reads (e.g. Best: N) stay correct. */
export function safeSetItem(key: string, value: string): void {
  memoryFallback.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // Quota exceeded, storage disabled, or a private-mode restriction - best-effort only.
  }
}

// Implements docs/PRD-addendum-v3.md F20 AC9/AC10, docs/mobile/PRD-mobile.md M7.5 (H6):
// a blocked/throwing localStorage must never throw past this module, and a write
// failure keeps the value available for the rest of the session via the in-memory
// fallback.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { safeGetItem, safeSetItem } from './safeStorage';

describe('safeStorage - normal operation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a value through real localStorage', () => {
    safeSetItem('k', 'v');
    expect(safeGetItem('k')).toBe('v');
  });

  it('returns null for a key that was never set', () => {
    expect(safeGetItem('missing')).toBeNull();
  });
});

describe('safeStorage - write-throw fail-closed (F20 AC10)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('safeSetItem never throws when localStorage.setItem throws (quota/private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded');
    });
    expect(() => safeSetItem('k', 'v')).not.toThrow();
  });

  it('a value that failed to persist is still readable from the in-memory fallback this session', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded');
    });
    safeSetItem('k', 'v');
    vi.restoreAllMocks(); // even once storage recovers, getItem never got the real write
    expect(safeGetItem('k')).toBe('v');
  });
});

describe('safeStorage - read-throw fail-closed', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('safeGetItem never throws when localStorage.getItem throws (storage disabled)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('storage disabled');
    });
    expect(() => safeGetItem('k')).not.toThrow();
  });

  it('reads null (not throw) for an untracked key while storage is disabled', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('storage disabled');
    });
    expect(safeGetItem('never-set')).toBeNull();
  });
});

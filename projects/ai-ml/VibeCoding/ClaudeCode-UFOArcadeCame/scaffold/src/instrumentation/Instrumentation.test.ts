// Tests the binding security constraint from docs/security/security-review-v1.md
// [MEDIUM] finding #1: the localStorage read path must validate/sanitize and fail
// closed on any malformed or adversarial content, never throwing into the emit()
// caller (which would defeat ADR-0005's "never breaks the game loop" guarantee).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emit } from './Instrumentation';
import { INSTRUMENTATION_STORAGE_KEY } from '../config/constants';

describe('Instrumentation - localStorage read path fails closed (security finding #1)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('never throws when localStorage contains corrupted (non-JSON) content', () => {
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, 'not-json{{{');
    expect(() => emit('sessionStart')).not.toThrow();
  });

  it('reinitializes (fails closed) rather than propagating corrupted JSON into the counters', () => {
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, 'not-json{{{');
    emit('sessionStart');
    const stored = JSON.parse(localStorage.getItem(INSTRUMENTATION_STORAGE_KEY)!);
    expect(stored).toEqual({ sessionStart: 1 }); // fresh counter map, not poisoned
  });

  it('never throws when localStorage contains the literal string "null"', () => {
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, 'null');
    expect(() => emit('sessionStart')).not.toThrow();
    const stored = JSON.parse(localStorage.getItem(INSTRUMENTATION_STORAGE_KEY)!);
    expect(stored).toEqual({ sessionStart: 1 });
  });

  it('never throws when localStorage contains a JSON array instead of an object', () => {
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, '[1,2,3]');
    expect(() => emit('sessionStart')).not.toThrow();
    const stored = JSON.parse(localStorage.getItem(INSTRUMENTATION_STORAGE_KEY)!);
    expect(stored).toEqual({ sessionStart: 1 });
  });

  it('never throws when localStorage contains a JSON primitive (number/string/bool)', () => {
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, '42');
    expect(() => emit('sessionStart')).not.toThrow();
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, '"hello"');
    expect(() => emit('sessionStart')).not.toThrow();
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, 'true');
    expect(() => emit('sessionStart')).not.toThrow();
  });

  it('discards a counter map with non-numeric (string) values rather than trusting them', () => {
    localStorage.setItem(
      INSTRUMENTATION_STORAGE_KEY,
      JSON.stringify({ sessionStart: 'DROP TABLE' }),
    );
    emit('sessionStart');
    const stored = JSON.parse(localStorage.getItem(INSTRUMENTATION_STORAGE_KEY)!);
    // Fails closed to a fresh map - the adversarial string value must not survive
    // or be coerced into the arithmetic increment path.
    expect(stored).toEqual({ sessionStart: 1 });
  });

  it('discards a counter map with non-finite (NaN/Infinity) numeric values', () => {
    // JSON itself cannot encode NaN/Infinity, but a hand-crafted value that parses
    // to one via a nested structure is not possible either - assert the validator
    // directly rejects a map shape that *would* decode to non-finite via a stand-in
    // string that a lenient implementation might Number()-coerce.
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, JSON.stringify({ sessionStart: '1e999' }));
    emit('sessionStart');
    const stored = JSON.parse(localStorage.getItem(INSTRUMENTATION_STORAGE_KEY)!);
    expect(stored).toEqual({ sessionStart: 1 });
  });

  it('discards a counter map with non-integer (float) numeric values', () => {
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, JSON.stringify({ sessionStart: 1.5 }));
    emit('sessionStart');
    const stored = JSON.parse(localStorage.getItem(INSTRUMENTATION_STORAGE_KEY)!);
    expect(stored).toEqual({ sessionStart: 1 }); // reinitialized, 1.5 not preserved/incremented
  });

  it('discards a counter map containing a nested object value (adversarial deep shape)', () => {
    localStorage.setItem(
      INSTRUMENTATION_STORAGE_KEY,
      JSON.stringify({ sessionStart: { evil: true } }),
    );
    emit('sessionStart');
    const stored = JSON.parse(localStorage.getItem(INSTRUMENTATION_STORAGE_KEY)!);
    expect(stored).toEqual({ sessionStart: 1 });
  });

  it('preserves and correctly increments a valid, well-formed counter map (positive path)', () => {
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, JSON.stringify({ sessionStart: 4 }));
    emit('sessionStart');
    const stored = JSON.parse(localStorage.getItem(INSTRUMENTATION_STORAGE_KEY)!);
    expect(stored).toEqual({ sessionStart: 5 });
  });

  it('never throws and degrades to console-only when localStorage.getItem throws (private mode/quota)', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: storage disabled');
    });
    expect(() => emit('sessionStart')).not.toThrow();
    getItemSpy.mockRestore();
  });

  it('never throws when localStorage.setItem throws (quota exceeded)', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => emit('sessionStart')).not.toThrow();
    setItemSpy.mockRestore();
  });

  it('handles an empty string stored under the key without throwing', () => {
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, '');
    expect(() => emit('sessionStart')).not.toThrow();
  });

  it('produces a per-level counter key for levelReached events', () => {
    emit('levelReached', { level: 3 });
    const stored = JSON.parse(localStorage.getItem(INSTRUMENTATION_STORAGE_KEY)!);
    expect(stored).toEqual({ levelReached_3: 1 });
  });
});

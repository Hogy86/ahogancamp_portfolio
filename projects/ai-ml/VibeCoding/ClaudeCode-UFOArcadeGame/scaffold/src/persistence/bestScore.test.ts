// Implements docs/PRD-addendum-v3.md F20 AC9/AC10 (H6): fail-closed parsing of the
// stored best score, and the "current session" fallback when storage is unavailable
// for the whole session (write-throw, AC10).
//
// `bestScore` is F20 AC15's single shared module-level instance - its in-memory
// `sessionBest` (AC10) deliberately never resets on its own (that IS the "current
// session" guarantee), so it carries across tests within this file even though
// `localStorage.clear()` resets the PERSISTED value each time. Tests that care about
// an exact absolute value read a fresh baseline via `bestScore.get()` first and then
// commit strictly above it, rather than assuming a clean-slate 0.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bestScore, BEST_SCORE_STORAGE_KEY } from './bestScore';
import { createNewRunWorld } from '../core/world';

describe('bestScore - F20 AC9: fails closed to 0 on anything not a valid whole number', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(['abc', '-5', '1.5', '{}', 'null', '1e400', ''])('raw stored value %j -> 0', (raw) => {
    if (raw !== '') localStorage.setItem(BEST_SCORE_STORAGE_KEY, raw);
    expect(bestScore.get()).toBe(0);
  });

  it('a valid saved integer round-trips', () => {
    localStorage.setItem(BEST_SCORE_STORAGE_KEY, '150');
    expect(bestScore.get()).toBe(150);
  });
});

describe('bestScore - commit (F20 AC5/AC8)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('never lowers the saved value', () => {
    bestScore.commit(100);
    const result = bestScore.commit(40);
    expect(result.best).toBe(100);
    expect(bestScore.get()).toBe(100);
  });

  it('isNewBest is true only when strictly greater than the previous best AND > 0', () => {
    const base = bestScore.get() + 1000; // strictly above whatever prior tests left behind
    bestScore.commit(base);
    expect(bestScore.commit(base).isNewBest).toBe(false); // tie, not strictly greater
    expect(bestScore.commit(0).isNewBest).toBe(false); // never for a final score of 0
    expect(bestScore.commit(base + 1).isNewBest).toBe(true);
  });
});

describe('bestScore - F20 AC10: write-throw keeps the current session usable', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a persistently throwing localStorage still reports the in-session best', () => {
    const base = bestScore.get() + 1000; // strictly above whatever prior tests left behind

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('storage disabled');
    });

    const result = bestScore.commit(base);
    expect(result.best).toBe(base);
    // Even though every read/write to the real store fails, "Best: N" still shows
    // the highest score reached THIS session (AC10) via the in-memory fallback.
    expect(bestScore.get()).toBe(base);

    const lower = bestScore.commit(base - 65);
    expect(lower.best).toBe(base); // still never lowers, even mid-outage
  });
});

describe('bestScore - commitIfRunActive (F20 AC4(e), M7.2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('commits while PLAYING', () => {
    const world = createNewRunWorld();
    world.state = 'PLAYING';
    world.score = 33;
    bestScore.commitIfRunActive(world);
    expect(bestScore.get()).toBeGreaterThanOrEqual(33);
  });

  it('commits while PAUSED (mid-run interruption)', () => {
    const world = createNewRunWorld();
    world.state = 'PAUSED';
    world.score = 12;
    bestScore.commitIfRunActive(world);
    expect(bestScore.get()).toBeGreaterThanOrEqual(12);
  });

  it('does not commit from TITLE/GAMEOVER/VICTORY (already committed at their own call sites)', () => {
    const base = bestScore.get() + 1000;
    bestScore.commit(base); // establish a real prior best strictly above the run below
    const world = createNewRunWorld();
    world.state = 'GAMEOVER';
    // A HIGHER in-run score must NOT be swept in from a non-active state - GAMEOVER
    // has already committed its own score via its own F20 AC4 call site.
    world.score = base + 5000;
    bestScore.commitIfRunActive(world);
    expect(bestScore.get()).toBe(base);
  });
});

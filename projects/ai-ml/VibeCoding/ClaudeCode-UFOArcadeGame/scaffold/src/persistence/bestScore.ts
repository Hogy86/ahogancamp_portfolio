// Implements docs/PRD-addendum-v3.md F20 AC1-AC15 (saved best score) and
// docs/mobile/PRD-mobile.md M7.1/M7.2/M7.5, per M-ADR-0006 §9.2-9.3: ONE
// implementation, used unchanged by the website and the Android app (F20 AC15).
// Only the AC4(e) "page hidden" (web) / "app backgrounded" (Android) trigger is
// platform-specific lifecycle code (src/platform/*), which calls
// `bestScore.commitIfRunActive(world)` - everything else here is shared.

import { safeGetItem, safeSetItem } from './safeStorage';
import type { World } from '../core/types';

/** Namespaced localStorage/WebView-storage key (F22 AC13: never renamed by the F22 rename). */
export const BEST_SCORE_STORAGE_KEY = 'vvs:best';

export interface CommitResult {
  previous: number;
  best: number;
  isNewBest: boolean;
}

export interface BestScoreStore {
  /** Validated saved best, or the in-session best if storage is unavailable (F20 AC9/AC10). */
  get(): number;
  /** max(previous, score); never lowers the saved value (F20 AC5/AC8). */
  commit(score: number): CommitResult;
  /** F20 AC4(e) / M7.2: call when the run is interrupted (page hidden / app backgrounded). */
  commitIfRunActive(world: World): void;
}

/**
 * F20 AC9: fails closed to 0 on anything that is not valid JSON, not a number, not an
 * integer, negative, non-finite, or larger than Number.MAX_SAFE_INTEGER. Required test
 * inputs (per F20 AC9): "abc", "-5", "1.5", "{}", "null", "1e400", "" - every one of
 * these parses to something other than a valid whole number and falls through to 0.
 */
function parseStoredBest(raw: string | null): number {
  if (raw === null || raw === '') return 0;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return 0;
  }
  if (
    typeof parsed !== 'number' ||
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < 0 ||
    parsed > Number.MAX_SAFE_INTEGER
  ) {
    return 0;
  }
  return parsed;
}

class LocalBestScoreStore implements BestScoreStore {
  /** F20 AC10: "Best: N" shows the highest score reached in the current session even
   * if every persisted read/write this session has failed (storage blocked/disabled). */
  private sessionBest = 0;

  get(): number {
    const stored = parseStoredBest(safeGetItem(BEST_SCORE_STORAGE_KEY));
    return Math.max(stored, this.sessionBest);
  }

  commit(score: number): CommitResult {
    const previous = this.get();
    const best = Math.max(previous, score);
    this.sessionBest = best;
    safeSetItem(BEST_SCORE_STORAGE_KEY, JSON.stringify(best));
    // F20 AC3: "strictly greater" than the best saved BEFORE this run ended, and never
    // for a final score of 0.
    return { previous, best, isNewBest: score > previous && score > 0 };
  }

  commitIfRunActive(world: World): void {
    // F20 AC4(e) / M7.2: only a run that is still live (or paused mid-run) can have a
    // current score worth saving; TITLE/GAMEOVER/VICTORY have already been committed by
    // their own AC4(a)/(b)/(c)/(d) call sites.
    if (world.state === 'PLAYING' || world.state === 'PAUSED') {
      this.commit(world.score);
    }
  }
}

/** F20 AC15: the one shared instance every call site (website and Android) uses. */
export const bestScore: BestScoreStore = new LocalBestScoreStore();

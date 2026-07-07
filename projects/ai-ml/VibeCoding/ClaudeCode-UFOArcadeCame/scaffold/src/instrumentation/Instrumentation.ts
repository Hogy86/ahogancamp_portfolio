// Implements PRD §NFR-8 (instrumentation hooks), ADR-0005 (client-side best-effort
// instrumentation). Security binding constraint (security-review-v1.md MEDIUM #1):
// the localStorage read path wraps JSON.parse separately from the storage-access
// try/catch, validates the parsed shape is a plain object of finite integer
// counters, and fails closed (reinitializes) on any invalid shape - never trusts
// the shape of externally-controllable localStorage content.

import { INSTRUMENTATION_STORAGE_KEY } from '../config/constants';

export type InstrumentationEvent =
  | 'sessionStart'
  | 'levelReached'
  | 'runRestart'
  | 'powerUpCaught'
  | 'gameOver'
  | 'victory';

type CounterMap = Record<string, number>;

function isFiniteIntegerCounterMap(value: unknown): value is CounterMap {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v !== 'number' || !Number.isFinite(v) || !Number.isInteger(v)) return false;
  }
  return true;
}

/** Fails closed to a fresh counter object on any invalid/untrusted shape (security finding #1). */
function readCounters(): CounterMap {
  let raw: string | null;
  try {
    raw = localStorage.getItem(INSTRUMENTATION_STORAGE_KEY);
  } catch {
    // Storage inaccessible (private mode/quota/disabled) - degrade silently (ADR-0005 Risk R7).
    return {};
  }

  if (raw === null) return {};

  let parsed: unknown;
  try {
    // JSON.parse failure is handled independently of the storage-access try/catch above,
    // per the binding security finding - malformed content must not throw into the caller.
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  // Never trust the parsed shape - validate before use, fail closed otherwise.
  if (!isFiniteIntegerCounterMap(parsed)) return {};
  return parsed;
}

function writeCounters(counters: CounterMap): void {
  try {
    localStorage.setItem(INSTRUMENTATION_STORAGE_KEY, JSON.stringify(counters));
  } catch {
    // Best-effort only - a write failure must never affect gameplay (ADR-0005).
  }
}

function counterKey(event: InstrumentationEvent, payload?: Record<string, unknown>): string {
  if (event === 'levelReached' && payload && typeof payload.level === 'number') {
    return `levelReached_${payload.level}`;
  }
  return event;
}

/**
 * Emits an instrumentation event: always logs to console (structured, namespaced),
 * and best-effort increments an anonymous integer counter in localStorage. Never
 * throws into the caller - this function is fire-and-forget by contract (ADR-0005).
 */
export function emit(event: InstrumentationEvent, payload?: Record<string, unknown>): void {
  try {
    // eslint-disable-next-line no-console -- intentional structured dev/playtest log (ADR-0005).
    console.log(`[vvs] ${event}`, payload ?? {});
  } catch {
    // Console can theoretically be unavailable/overridden in exotic embeds; never throw.
  }

  try {
    const counters = readCounters();
    const key = counterKey(event, payload);
    const current = counters[key];
    counters[key] = (typeof current === 'number' && Number.isFinite(current) ? current : 0) + 1;
    writeCounters(counters);
  } catch {
    // Fire-and-forget: any unexpected failure here must never break the game loop.
  }
}

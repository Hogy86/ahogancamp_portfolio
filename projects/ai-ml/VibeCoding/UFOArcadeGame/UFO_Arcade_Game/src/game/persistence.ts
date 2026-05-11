import type { PowerUpKind } from './constants';

const KEY_SETTINGS = 'arcade_ufo_settings_v1';
const KEY_LEADER = 'arcade_ufo_leader_v1';
const KEY_LAST_LEVEL = 'arcade_ufo_last_level_v1';

export interface Settings {
  sfx: boolean;
  reducedMotion: boolean;
}

export interface LeaderEntry {
  score: number;
  level: number;
  ts: number;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return { sfx: true, reducedMotion: false };
    const o = JSON.parse(raw) as Partial<Settings>;
    return {
      sfx: o.sfx !== false,
      reducedMotion: !!o.reducedMotion,
    };
  } catch {
    return { sfx: true, reducedMotion: false };
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
}

export function loadLeaderboard(): LeaderEntry[] {
  try {
    const raw = localStorage.getItem(KEY_LEADER);
    if (!raw) return [];
    const arr = JSON.parse(raw) as LeaderEntry[];
    return Array.isArray(arr) ? arr.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function pushScore(score: number, level: number): LeaderEntry[] {
  const list = [...loadLeaderboard(), { score, level, ts: Date.now() }];
  list.sort((a, b) => b.score - a.score);
  const top = list.slice(0, 10);
  localStorage.setItem(KEY_LEADER, JSON.stringify(top));
  return top;
}

export function clearLeaderboard(): void {
  localStorage.removeItem(KEY_LEADER);
}

export function saveLastCompletedLevel(level: number): void {
  localStorage.setItem(KEY_LAST_LEVEL, String(level));
}

export function loadLastCompletedLevel(): number {
  const v = parseInt(localStorage.getItem(KEY_LAST_LEVEL) ?? '0', 10);
  return Number.isFinite(v) ? v : 0;
}

export function isTelemetryEnabled(): boolean {
  return import.meta.env.VITE_TELEMETRY === 'true';
}

export function logTelemetry(
  event: string,
  detail: Record<string, string | number | boolean | PowerUpKind | undefined>,
): void {
  if (!isTelemetryEnabled()) return;
  console.info('[telemetry]', new Date().toISOString(), event, detail);
}

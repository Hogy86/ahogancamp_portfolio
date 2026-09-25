// Implements PRD §F7 AC1 (>=1 guaranteed power-up drop per level). Tracks the
// per-level guaranteed-drop budget as module-scoped state, reset whenever a level
// starts (LevelSystem.startLevel). This is presentation/balance bookkeeping only -
// not part of World - because it does not affect pause/resume correctness
// (a level always restarts this counter fresh, so there is nothing to
// pause/resume-drift here per ADR-0002's timer-drift concerns).

import { getLevelConfig } from '../config/levelConfig';

let guaranteedDropsRemaining = 0;

export function resetGuaranteedDrops(level: number): void {
  guaranteedDropsRemaining = getLevelConfig(level).guaranteedPowerUpDrops;
}

export function getGuaranteedDropsRemaining(): number {
  return guaranteedDropsRemaining;
}

export function consumeGuaranteedDrop(): void {
  guaranteedDropsRemaining = Math.max(0, guaranteedDropsRemaining - 1);
}

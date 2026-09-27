// Implements docs/mobile/architecture/mobile-architecture.md §5.2 (M-ADR-0003): the
// pure classifier behind the "continuous per-pointer tracking over one movement zone"
// input model. PRD-mobile M3.3a rules 1-6. Unit-tested in isolation from any real
// PointerEvent so the 40/40 slide test (§10.2) only needs to prove TouchControls wires
// this correctly, not re-derive the classification rules.

export type MoveDirection = 'left' | 'right' | 'none';

export interface MoveZoneRects {
  left: DOMRectLike;
  right: DOMRectLike;
  /** The ≥8dp gap between ◀ and ▶, same vertical band (§5.2 step 2). */
  gap: DOMRectLike;
}

export interface DOMRectLike {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** §6.2: hysteresis-only vertical expansion applied to an already-tracked pointer, so a
 * finger drifting slightly above/below the button band mid-slide isn't dropped. A fresh
 * pointerdown is always tested against the exact rect (§5.2 step 2). */
export const MOVE_TRACK_VERTICAL_SLOP_DP = 12;

function within(x: number, y: number, rect: DOMRectLike, verticalSlop: number): boolean {
  return (
    x >= rect.left && x <= rect.right && y >= rect.top - verticalSlop && y <= rect.bottom + verticalSlop
  );
}

/**
 * Reclassifies one tracked pointer's direction from its CURRENT position (never its
 * original touch-down target, M3.3a rule 3 "no stick"). `lastDir` is `null` for a
 * pointer that has never yet been inside ◀ or ▶.
 */
export function classifyMovePointer(
  pos: { x: number; y: number },
  rects: MoveZoneRects,
  lastDir: MoveDirection | null,
  options: { isFreshTouch: boolean } = { isFreshTouch: false },
): { dir: MoveDirection; lastDir: MoveDirection | null } {
  const slop = options.isFreshTouch ? 0 : MOVE_TRACK_VERTICAL_SLOP_DP;

  if (within(pos.x, pos.y, rects.left, slop)) {
    return { dir: 'left', lastDir: 'left' };
  }
  if (within(pos.x, pos.y, rects.right, slop)) {
    return { dir: 'right', lastDir: 'right' };
  }
  if (within(pos.x, pos.y, rects.gap, slop)) {
    // M3.3a rule 2 "no drop": the gap carries on whatever direction the finger just
    // left. A pointer that lands in the gap first (lastDir null) causes no movement.
    return { dir: lastDir ?? 'none', lastDir };
  }
  // M3.3a rule 4: anywhere else (outward, up, down, onto the playfield) stops
  // movement and clears lastDir - re-entering ◀/▶ later resumes from a clean slate.
  return { dir: 'none', lastDir: null };
}

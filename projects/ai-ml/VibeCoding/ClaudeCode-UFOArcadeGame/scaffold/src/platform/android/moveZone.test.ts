// Implements docs/mobile/architecture/mobile-architecture.md §5.2 (M3.3a rules 1-4,
// H6): the pure move-zone pointer classifier, tested without any real PointerEvent.

import { describe, expect, it } from 'vitest';
import { classifyMovePointer, MOVE_TRACK_VERTICAL_SLOP_DP, type MoveZoneRects } from './moveZone';

const RECTS: MoveZoneRects = {
  left: { left: 0, right: 56, top: 100, bottom: 156 },
  right: { left: 64, right: 120, top: 100, bottom: 156 },
  gap: { left: 56, right: 64, top: 100, bottom: 156 },
};

describe('classifyMovePointer - M3.3a rule 1/6: direction from the current rect', () => {
  it('inside the left button -> left', () => {
    const result = classifyMovePointer({ x: 28, y: 128 }, RECTS, null, { isFreshTouch: true });
    expect(result).toEqual({ dir: 'left', lastDir: 'left' });
  });

  it('inside the right button -> right', () => {
    const result = classifyMovePointer({ x: 90, y: 128 }, RECTS, null, { isFreshTouch: true });
    expect(result).toEqual({ dir: 'right', lastDir: 'right' });
  });
});

describe('classifyMovePointer - M3.3a rule 2: no drop in the gap', () => {
  it('carries the last direction forward while in the gap', () => {
    const result = classifyMovePointer({ x: 60, y: 128 }, RECTS, 'left', { isFreshTouch: false });
    expect(result).toEqual({ dir: 'left', lastDir: 'left' });
  });

  it('a pointer that lands in the gap FIRST (lastDir null) causes no movement', () => {
    const result = classifyMovePointer({ x: 60, y: 128 }, RECTS, null, { isFreshTouch: true });
    expect(result).toEqual({ dir: 'none', lastDir: null });
  });
});

describe('classifyMovePointer - M3.3a rule 3: no stick (current position only)', () => {
  it('a pointer that started on left but has since moved onto right reports right', () => {
    const result = classifyMovePointer({ x: 90, y: 128 }, RECTS, 'left', { isFreshTouch: false });
    expect(result).toEqual({ dir: 'right', lastDir: 'right' });
  });
});

describe('classifyMovePointer - M3.3a rule 4: elsewhere clears direction/lastDir', () => {
  it('outward (beyond the right button) clears both', () => {
    const result = classifyMovePointer({ x: 500, y: 128 }, RECTS, 'right', { isFreshTouch: false });
    expect(result).toEqual({ dir: 'none', lastDir: null });
  });

  it('re-entering a button afterward resumes (lastDir was cleared, not stuck)', () => {
    const away = classifyMovePointer({ x: 500, y: 128 }, RECTS, 'right', { isFreshTouch: false });
    const back = classifyMovePointer({ x: 28, y: 128 }, RECTS, away.lastDir, {
      isFreshTouch: false,
    });
    expect(back).toEqual({ dir: 'left', lastDir: 'left' });
  });
});

describe('classifyMovePointer - vertical hysteresis (§5.2 step 2)', () => {
  it('a fresh touch just outside the exact rect (no slop) is NOT inside the button', () => {
    const result = classifyMovePointer({ x: 28, y: 160 }, RECTS, null, { isFreshTouch: true });
    expect(result.dir).toBe('none');
  });

  it('an already-tracked pointer drifting within the slop band stays on the button', () => {
    const y = RECTS.left.bottom + MOVE_TRACK_VERTICAL_SLOP_DP - 1;
    const result = classifyMovePointer({ x: 28, y }, RECTS, 'left', { isFreshTouch: false });
    expect(result.dir).toBe('left');
  });

  it('an already-tracked pointer drifting beyond the slop band clears', () => {
    const y = RECTS.left.bottom + MOVE_TRACK_VERTICAL_SLOP_DP + 5;
    const result = classifyMovePointer({ x: 28, y }, RECTS, 'left', { isFreshTouch: false });
    expect(result).toEqual({ dir: 'none', lastDir: null });
  });
});

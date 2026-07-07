// Tests PRD §F3 (enemy formation & movement) AC2-AC6.
// F3 AC1 (spawns in rows x cols per level table) is covered in world.test.ts /
// levelConfig.test.ts (spawnFormation + LEVEL_CONFIGS).

import { describe, expect, it } from 'vitest';
import { updateFormation } from './FormationSystem';
import { FORMATION_STEP_DOWN, FIXED_DT, PLAYFIELD_WIDTH, PLAYER_Y } from '../config/constants';
import { makePlayingWorld } from '../test-utils/worldFactory';

describe('FormationSystem (F3)', () => {
  it('F3 AC2: the formation moves horizontally as a single rigid block', () => {
    const world = makePlayingWorld(1);
    const before = world.enemies.map((e) => ({ id: e.id, x: e.x }));
    updateFormation(world, FIXED_DT);
    // offsetX applies uniformly; per-enemy x fields themselves are untouched (fixed grid,
    // F3 AC4) - the shared transform is what moves.
    expect(world.formation.offsetX).not.toBe(0);
    for (const e of world.enemies) {
      const orig = before.find((b) => b.id === e.id)!;
      expect(e.x).toBe(orig.x); // per-enemy x unchanged; only the shared offset moves.
    }
  });

  it('F3 AC2: on reaching the right screen edge, the formation steps down and reverses direction', () => {
    const world = makePlayingWorld(1);
    expect(world.formation.direction).toBe(1);
    const initialOffsetY = world.formation.offsetY;

    // Drive the formation far enough right to hit the edge.
    for (let i = 0; i < 2000 && world.formation.direction === 1; i += 1) {
      updateFormation(world, FIXED_DT);
    }

    expect(world.formation.direction).toBe(-1);
    expect(world.formation.offsetY).toBeGreaterThan(initialOffsetY);
    expect(world.formation.offsetY - initialOffsetY).toBe(FORMATION_STEP_DOWN);
  });

  it('F3 AC2: on reaching the left screen edge (after reversal), the formation steps down again and reverses back', () => {
    const world = makePlayingWorld(1);
    // Drive right to trigger the first reversal.
    for (let i = 0; i < 2000 && world.formation.direction === 1; i += 1) {
      updateFormation(world, FIXED_DT);
    }
    expect(world.formation.direction).toBe(-1);
    const afterFirstStepDown = world.formation.offsetY;

    // Drive left to trigger the second reversal.
    for (let i = 0; i < 2000 && world.formation.direction === -1; i += 1) {
      updateFormation(world, FIXED_DT);
    }
    expect(world.formation.direction).toBe(1);
    expect(world.formation.offsetY).toBe(afterFirstStepDown + FORMATION_STEP_DOWN);
  });

  it('F3 AC3: formation speed scales up as fewer enemies remain (last enemy moves faster than full formation)', () => {
    const worldFull = makePlayingWorld(1);
    updateFormation(worldFull, FIXED_DT);
    const fullFormationDelta = Math.abs(worldFull.formation.offsetX);

    const worldThin = makePlayingWorld(1);
    // Kill all but one enemy.
    let survivorFound = false;
    for (const e of worldThin.enemies) {
      if (!survivorFound) {
        survivorFound = true;
        continue;
      }
      e.alive = false;
    }
    updateFormation(worldThin, FIXED_DT);
    const thinFormationDelta = Math.abs(worldThin.formation.offsetX);

    expect(thinFormationDelta).toBeGreaterThan(fullFormationDelta);
  });

  it('F3 AC4: destroyed enemies leave gaps - remaining enemies keep their original fixed grid positions', () => {
    const world = makePlayingWorld(1);
    const target = world.enemies[5]!;
    const originalX = target.x;
    const originalY = target.y;
    world.enemies[3]!.alive = false; // kill a different enemy, leaving a gap

    updateFormation(world, FIXED_DT);

    expect(target.x).toBe(originalX);
    expect(target.y).toBe(originalY);
    expect(world.enemies[3]!.alive).toBe(false); // gap persists, not re-flowed/removed from array
  });

  it('F3 AC5 precondition: formation.lowestY advances toward the player row over many ticks', () => {
    const world = makePlayingWorld(1);
    const initialLowestY = world.formation.lowestY;
    for (let i = 0; i < 5000; i += 1) {
      updateFormation(world, FIXED_DT);
    }
    expect(world.formation.lowestY).toBeGreaterThan(initialLowestY);
  });

  it('F3 AC6: the formation warning activates once the lowest living enemy crosses the warning threshold', () => {
    const world = makePlayingWorld(1);
    expect(world.formationWarningActive).toBe(false);

    // Drive the formation down toward the player's row over many step-downs.
    for (let i = 0; i < 20000 && !world.formationWarningActive; i += 1) {
      updateFormation(world, FIXED_DT);
    }

    expect(world.formationWarningActive).toBe(true);
    // The warning must fire before (or exactly at) the formation reaching the player's row.
    expect(world.formation.lowestY).toBeLessThanOrEqual(PLAYER_Y);
  });

  it('formation never proposes a position outside the playfield width bounds after edge-snap', () => {
    const world = makePlayingWorld(1);
    for (let i = 0; i < 3000; i += 1) {
      updateFormation(world, FIXED_DT);
      expect(world.formation.leftmostX).toBeGreaterThanOrEqual(-1); // small epsilon tolerance
      expect(world.formation.rightmostX).toBeLessThanOrEqual(PLAYFIELD_WIDTH + 1);
    }
  });
});

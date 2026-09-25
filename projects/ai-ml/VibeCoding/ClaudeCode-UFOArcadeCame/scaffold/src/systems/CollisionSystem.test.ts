// Tests PRD §F15 (shield bounce geometry - zone classification + per-zone outcome),
// §F16 (shield never harms the player; catch = +1 life on actual collision only;
// shield only ever deflects off enemies), §F11 (single active-temporary-effect slot -
// same-type refresh, cross-type replacement, permanent multiplier exemption),
// §F8 AC2/AC3 (laser hits cost a life unless invulnerable), §F10 AC2/AC3 (score per
// kill scaled by level, power-up catch bonus).
//
// Note: CollisionSystem only flips `.active = false` on consumed shields/power-ups
// that stop; removing inactive entries from the array is partly done inline here too
// (resolveShieldHits/resolveShieldCatches both filter world.shields at the end of
// their own pass) - tests assert array contents/length directly against that
// observable behavior.

import { describe, expect, it } from 'vitest';
import { updateCollisions } from './CollisionSystem';
import {
  HIT_POWER_MULTIPLIER,
  PERMANENT_MULTIPLIER_PER_CATCH,
  POST_HIT_INVULN_SECONDS,
  POWERUP_DURATION_SECONDS,
  SCORE_PER_KILL_BASE,
  SCORE_PER_KILL_PER_LEVEL,
  SCORE_POWERUP_BONUS,
  SHIELD_SPEED,
} from '../config/constants';
import { resetGuaranteedDrops } from './levelRuntimeState';
import { makePlayingWorld } from '../test-utils/worldFactory';
import type { Enemy, ShieldProjectile } from '../core/types';

function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 1,
    col: 0,
    row: 0,
    x: 100,
    y: 100,
    width: 36,
    height: 28,
    hitsToKill: 1,
    hitsTaken: 0,
    isBoss: false,
    alive: true,
    ...overrides,
  };
}

function makeShield(overrides: Partial<ShieldProjectile> = {}): ShieldProjectile {
  return {
    id: 1,
    x: 0,
    y: 0,
    radius: 8,
    active: true,
    vx: 0,
    vy: -SHIELD_SPEED,
    lifetimeRemaining: 6,
    lastHitEnemyId: null,
    trail: [],
    ...overrides,
  };
}

const DIAGONAL = SHIELD_SPEED * Math.SQRT1_2;

describe('CollisionSystem - shield bounce zone geometry (F15)', () => {
  // Enemy fixed at x=100,y=100,w=36,h=28 for every zone case below. Positions are
  // chosen (per the documented penetration-depth + outer-30%-is-a-corner algorithm)
  // so exactly one face has the minimum overlap and the contact point falls
  // unambiguously inside the intended zone - see the authoritative table in
  // docs/PRD-addendum-v2.md F15 and the approved plan's "Shield bounce
  // zone-classification algorithm" section.
  const enemy = () => makeEnemy({ hitsToKill: 99, x: 100, y: 100, width: 36, height: 28 });

  it('F15 AC3: bottom-center (direct hit) applies damage and stops/removes the shield - no bounce', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const target = enemy();
    world.enemies = [target];
    world.shields = [makeShield({ x: 118, y: 135 })]; // bottom face, mid-width (fraction 0.5)

    updateCollisions(world);

    expect(target.hitsTaken).toBe(1);
    expect(world.shields).toHaveLength(0);
  });

  it('F15 AC3: top-center (direct hit) applies damage and stops/removes the shield - no bounce', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const target = enemy();
    world.enemies = [target];
    world.shields = [makeShield({ x: 118, y: 93 })]; // top face, mid-width

    updateCollisions(world);

    expect(target.hitsTaken).toBe(1);
    expect(world.shields).toHaveLength(0);
  });

  it('F15 AC5/AC6: left-center (side hit) applies damage and bounces purely due left, at unchanged speed', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const target = enemy();
    world.enemies = [target];
    world.shields = [makeShield({ x: 93, y: 114 })]; // left face, mid-height

    updateCollisions(world);

    expect(target.hitsTaken).toBe(1);
    expect(world.shields).toHaveLength(1);
    expect(world.shields[0]!.vx).toBeCloseTo(-SHIELD_SPEED, 5);
    expect(world.shields[0]!.vy).toBeCloseTo(0, 5);
  });

  it('F15 AC5/AC6: right-center (side hit) applies damage and bounces purely due right, at unchanged speed', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const target = enemy();
    world.enemies = [target];
    world.shields = [makeShield({ x: 143, y: 114 })]; // right face, mid-height

    updateCollisions(world);

    expect(target.hitsTaken).toBe(1);
    expect(world.shields).toHaveLength(1);
    expect(world.shields[0]!.vx).toBeCloseTo(SHIELD_SPEED, 5);
    expect(world.shields[0]!.vy).toBeCloseTo(0, 5);
  });

  it('F15 AC4: bottom-left corner applies damage and bounces 45deg down-left', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const target = enemy();
    world.enemies = [target];
    world.shields = [makeShield({ x: 103.6, y: 135 })]; // bottom face, 10% along width (< 30% corner threshold)

    updateCollisions(world);

    expect(target.hitsTaken).toBe(1);
    expect(world.shields[0]!.vx).toBeCloseTo(-DIAGONAL, 5);
    expect(world.shields[0]!.vy).toBeCloseTo(DIAGONAL, 5);
  });

  it('F15 AC4: bottom-right corner applies damage and bounces 45deg down-right', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const target = enemy();
    world.enemies = [target];
    world.shields = [makeShield({ x: 132.4, y: 135 })]; // bottom face, 90% along width (> 70%)

    updateCollisions(world);

    expect(target.hitsTaken).toBe(1);
    expect(world.shields[0]!.vx).toBeCloseTo(DIAGONAL, 5);
    expect(world.shields[0]!.vy).toBeCloseTo(DIAGONAL, 5);
  });

  it('F15 AC4: top-left corner applies damage and bounces 45deg up-left', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const target = enemy();
    world.enemies = [target];
    world.shields = [makeShield({ x: 103.6, y: 93 })]; // top face, 10% along width

    updateCollisions(world);

    expect(target.hitsTaken).toBe(1);
    expect(world.shields[0]!.vx).toBeCloseTo(-DIAGONAL, 5);
    expect(world.shields[0]!.vy).toBeCloseTo(-DIAGONAL, 5);
  });

  it('F15 AC4: top-right corner applies damage and bounces 45deg up-right (this is also the "hitting the top corner acts like a side" case)', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const target = enemy();
    world.enemies = [target];
    world.shields = [makeShield({ x: 132.4, y: 93 })]; // top face, 90% along width

    updateCollisions(world);

    expect(target.hitsTaken).toBe(1);
    expect(world.shields[0]!.vx).toBeCloseTo(DIAGONAL, 5);
    expect(world.shields[0]!.vy).toBeCloseTo(-DIAGONAL, 5);
  });

  it('F15 AC1: every contact applies exactly one hit of damage, regardless of whether the shield stops or bounces', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const target = enemy();
    world.enemies = [target];
    world.shields = [makeShield({ x: 93, y: 114 })]; // left-center: bounces, does not stop

    updateCollisions(world);

    expect(target.hitsTaken).toBe(1);
  });

  it('F15 AC2: a shield may damage multiple different enemies over its lifetime, one hit per distinct enemy contact (the "hits a neighbor in the same row" scenario)', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const enemyA = makeEnemy({ id: 1, hitsToKill: 99, x: 100, y: 100 });
    const enemyB = makeEnemy({ id: 2, hitsToKill: 99, x: 200, y: 100 }); // same row
    world.enemies = [enemyA, enemyB];
    // Contact A's right-center face -> bounces due right, exactly the horizontal
    // deflection that (per the addendum's resolved geometry) travels down A's row.
    world.shields = [makeShield({ x: 143, y: 114 })];

    updateCollisions(world);

    expect(enemyA.hitsTaken).toBe(1);
    expect(enemyB.hitsTaken).toBe(0);
    expect(world.shields[0]!.vx).toBeCloseTo(SHIELD_SPEED, 5);

    // Simulate the shield having travelled along that row (ProjectileSystem's job)
    // until it reaches B's left-center face.
    world.shields[0]!.x = 193;
    world.shields[0]!.y = 114;

    updateCollisions(world);

    expect(enemyA.hitsTaken).toBe(1); // unchanged - debounced against a stale contact
    expect(enemyB.hitsTaken).toBe(1); // a different enemy - not blocked by A's debounce
  });

  it('F15 AC2: at most one hit per contact event - continuous overlap with the same enemy across ticks does not multi-hit', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const target = enemy();
    world.enemies = [target];
    world.shields = [makeShield({ x: 93, y: 114 })]; // left-center: bounces, stays in play

    updateCollisions(world); // first contact
    expect(target.hitsTaken).toBe(1);

    updateCollisions(world); // still overlapping the same position/enemy - debounced
    expect(target.hitsTaken).toBe(1);
  });

  it('F15 AC2: separation clears the debounce - the shield can damage the same enemy again after fully separating from it', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const target = enemy();
    world.enemies = [target];
    world.shields = [makeShield({ x: 93, y: 114 })];

    updateCollisions(world);
    expect(target.hitsTaken).toBe(1);
    expect(world.shields[0]!.lastHitEnemyId).toBe(target.id);

    // Move the shield far away (simulating it having flown off and separated).
    world.shields[0]!.x = -500;
    world.shields[0]!.y = -500;
    updateCollisions(world);
    expect(world.shields[0]!.lastHitEnemyId).toBeNull(); // debounce cleared on separation

    // Move it back to overlap the same enemy - this is now a genuinely new contact.
    world.shields[0]!.x = 93;
    world.shields[0]!.y = 114;
    updateCollisions(world);
    expect(target.hitsTaken).toBe(2);
  });

  it('killing an enemy (hitsTaken reaches hitsToKill) marks it dead and awards score scaled by level (F10 AC2)', () => {
    const world = makePlayingWorld(3);
    resetGuaranteedDrops(world.level);
    const target = makeEnemy({ hitsToKill: 1, x: 100, y: 100 });
    world.enemies = [target];
    world.shields = [makeShield({ x: 118, y: 135 })]; // bottom-center: kills in one hit
    world.score = 0;

    updateCollisions(world);

    expect(target.alive).toBe(false);
    expect(world.score).toBe(SCORE_PER_KILL_BASE + SCORE_PER_KILL_PER_LEVEL * (3 - 1));
  });
});

describe('CollisionSystem - shield lifecycle: no self-harm, catch = +1 life (F16)', () => {
  it('F16 AC1: a shield overlapping the player never reduces lives, regardless of its velocity direction', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;

    // Freshly-thrown, still travelling up (vy < 0) and overlapping the player.
    world.shields = [makeShield({ x: px, y: py, vx: 0, vy: -SHIELD_SPEED })];
    updateCollisions(world);
    expect(world.lives).toBeGreaterThanOrEqual(3); // never decreases
  });

  it('F16 AC2: catching an in-flight (returning) shield removes it from play and grants exactly +1 life', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.shields = [makeShield({ x: px, y: py, vx: 0, vy: SHIELD_SPEED })]; // returning (vy > 0)

    updateCollisions(world);

    expect(world.lives).toBe(4);
    expect(world.shields).toHaveLength(0);
  });

  it('F16 AC9: catching a shield fires the catch-confirmation cue timer', () => {
    const world = makePlayingWorld();
    world.lifeCatchFlashRemaining = 0;
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.shields = [makeShield({ x: px, y: py, vx: 0, vy: SHIELD_SPEED })];

    updateCollisions(world);

    expect(world.lifeCatchFlashRemaining).toBeGreaterThan(0);
  });

  it('F16 AC2/Item D: a shield merely near the player (no overlap) grants no life - proximity alone never counts as a catch', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    world.shields = [makeShield({ x: -9999, y: -9999, vx: 0, vy: SHIELD_SPEED })];

    updateCollisions(world);

    expect(world.lives).toBe(3);
    expect(world.shields).toHaveLength(1);
  });

  it('F16 AC2: a shield that has already stopped (inactive) near the player grants no life even if positioned exactly on the player', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.shields = [makeShield({ x: px, y: py, active: false, vy: SHIELD_SPEED })];

    updateCollisions(world);

    expect(world.lives).toBe(3);
  });

  it('F16: a freshly-thrown shield overlapping the player at spawn (still moving up, vy<0) does not self-trigger a catch', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y; // the actual v2 spawn point (ProjectileSystem.updateThrow)
    world.shields = [makeShield({ x: px, y: py, vx: 0, vy: -SHIELD_SPEED })];

    updateCollisions(world);

    expect(world.lives).toBe(3);
    expect(world.shields).toHaveLength(1);
  });

  it('F16 AC6: the shield does not interact with enemy lasers - a laser occupying the same position as the shield is untouched and the shield is untouched', () => {
    const world = makePlayingWorld();
    world.shields = [makeShield({ x: 300, y: 300, vx: 7, vy: -7 })]; // sentinel velocity to detect any mutation
    world.enemyLasers = [{ id: 1, x: 300, y: 300, radius: 6, active: true }];

    updateCollisions(world);

    expect(world.shields[0]!.vx).toBe(7);
    expect(world.shields[0]!.vy).toBe(-7);
    expect(world.shields[0]!.active).toBe(true);
    expect(world.enemyLasers[0]!.active).toBe(true); // laser only interacts with the player, not the shield
  });

  it('F16 AC6: the shield does not interact with falling power-ups', () => {
    const world = makePlayingWorld();
    world.shields = [makeShield({ x: 300, y: 300, vx: 7, vy: -7 })];
    world.powerUps = [{ id: 1, type: 'SHIELD', x: 300, y: 300, radius: 12, active: true }];

    updateCollisions(world);

    expect(world.shields[0]!.vx).toBe(7);
    expect(world.shields[0]!.vy).toBe(-7);
    expect(world.powerUps[0]!.active).toBe(true); // power-up catches only ever check the player
  });

  it("F16 AC7: an active Indestructible Shield power-up effect does not alter the thrown shield projectile's flight/bounce", () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    world.effects = { type: 'SHIELD', remaining: 5 };
    const target = makeEnemy({ hitsToKill: 99, x: 100, y: 100 });
    world.enemies = [target];
    world.shields = [makeShield({ x: 93, y: 114 })]; // left-center

    updateCollisions(world);

    expect(world.shields[0]!.vx).toBeCloseTo(-SHIELD_SPEED, 5);
    expect(world.shields[0]!.vy).toBeCloseTo(0, 5);
  });
});

describe('CollisionSystem - laser vs player (F8 AC2/AC3)', () => {
  it('F8 AC2: an enemy laser hitting a non-invulnerable player reduces lives by exactly 1', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    world.player.postHitInvulnRemaining = 0;
    world.effects = { type: null, remaining: 0 };
    world.enemyLasers = [
      {
        id: 1,
        x: world.player.x + world.player.width / 2,
        y: world.player.y,
        radius: 6,
        active: true,
      },
    ];

    updateCollisions(world);

    expect(world.lives).toBe(2);
  });

  it('F8 AC9: a laser hit grants post-hit invulnerability for the tunable window', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    world.player.postHitInvulnRemaining = 0;
    world.enemyLasers = [
      {
        id: 1,
        x: world.player.x + world.player.width / 2,
        y: world.player.y,
        radius: 6,
        active: true,
      },
    ];

    updateCollisions(world);

    expect(world.player.postHitInvulnRemaining).toBe(POST_HIT_INVULN_SECONDS);
  });

  it('F8 AC3: while post-hit i-frames are active, a laser hit deals no life loss', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    world.player.postHitInvulnRemaining = 1.0;
    world.enemyLasers = [
      {
        id: 1,
        x: world.player.x + world.player.width / 2,
        y: world.player.y,
        radius: 6,
        active: true,
      },
    ];

    updateCollisions(world);

    expect(world.lives).toBe(3);
  });

  it('F7 AC6 / F8 AC3: while Indestructible Shield is active (F11 single-slot), a laser hit deals no life loss', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    world.player.postHitInvulnRemaining = 0;
    world.effects = { type: 'SHIELD', remaining: 5 };
    world.enemyLasers = [
      {
        id: 1,
        x: world.player.x + world.player.width / 2,
        y: world.player.y,
        radius: 6,
        active: true,
      },
    ];

    updateCollisions(world);

    expect(world.lives).toBe(3);
  });

  it('a laser that does not overlap the player deals no damage', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    world.enemyLasers = [{ id: 1, x: -9999, y: -9999, radius: 6, active: true }];

    updateCollisions(world);

    expect(world.lives).toBe(3);
  });
});

describe('CollisionSystem - power-up catch / single active-temporary-effect slot (F11)', () => {
  function withPowerUp(type: 'HIT_POWER' | 'SPEED' | 'SHIELD' | 'PERMANENT_MULTIPLIER') {
    const world = makePlayingWorld();
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.powerUps = [{ id: 1, type, x: px, y: py, radius: 12, active: true }];
    return world;
  }

  it('F7 AC3: catching a power-up (colliding with it) activates its effect and deactivates the drop', () => {
    const world = withPowerUp('SHIELD');
    updateCollisions(world);
    expect(world.powerUps[0]!.active).toBe(false);
    expect(world.effects.type).toBe('SHIELD');
    expect(world.effects.remaining).toBeGreaterThan(0);
  });

  it('F11 AC2: catching a temporary power-up while no effect is active activates it for the full 8s duration', () => {
    const world = withPowerUp('HIT_POWER');
    updateCollisions(world);
    expect(world.effects).toEqual({ type: 'HIT_POWER', remaining: POWERUP_DURATION_SECONDS });
  });

  it('F11 AC4: catching a power-up of the SAME type currently active discards the old remaining time and restarts at a full 8s (never cumulative)', () => {
    const world = makePlayingWorld();
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.effects = { type: 'SHIELD', remaining: 3 }; // partway through an active Shield effect

    world.powerUps = [{ id: 2, type: 'SHIELD', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);

    // Refreshed to a full 8s, not 3 + 8 = 11s (no stacking of duration).
    expect(world.effects).toEqual({ type: 'SHIELD', remaining: POWERUP_DURATION_SECONDS });
  });

  it('F11 AC1/AC3: catching a DIFFERENT-type power-up cancels the current effect (its remaining time is discarded) and activates the new one at a full 8s', () => {
    const world = makePlayingWorld();
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.effects = { type: 'HIT_POWER', remaining: 7.5 }; // barely used, lots of time left

    world.powerUps = [{ id: 2, type: 'SPEED', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);

    // The old effect's 7.5s remaining is gone entirely - not merged, not queued.
    expect(world.effects).toEqual({ type: 'SPEED', remaining: POWERUP_DURATION_SECONDS });
  });

  it('F11 AC1: it is never possible for two temporary effects to be simultaneously active - the slot always holds at most one type', () => {
    const world = makePlayingWorld();
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;

    world.powerUps = [{ id: 1, type: 'HIT_POWER', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);
    expect(world.effects.type).toBe('HIT_POWER');

    world.powerUps = [{ id: 2, type: 'SHIELD', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);
    expect(world.effects.type).toBe('SHIELD'); // replaced, not additive - only one type ever

    world.powerUps = [{ id: 3, type: 'SPEED', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);
    expect(world.effects.type).toBe('SPEED');
  });

  it('F7 AC7: Permanent Hit-Power Multiplier multiplies permanentMultiplier by 1.8 and persists (no timer, does not occupy the temp slot)', () => {
    const world = withPowerUp('PERMANENT_MULTIPLIER');
    updateCollisions(world);
    expect(world.permanentMultiplier).toBeCloseTo(PERMANENT_MULTIPLIER_PER_CATCH, 10);
    expect(world.effects.type).toBeNull();
  });

  it('F7 AC7: two permanent-multiplier catches stack multiplicatively (1.8 x 1.8 = 3.24)', () => {
    const world = makePlayingWorld();
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.powerUps = [
      { id: 1, type: 'PERMANENT_MULTIPLIER', x: px, y: py, radius: 12, active: true },
    ];
    updateCollisions(world);
    world.powerUps = [
      { id: 2, type: 'PERMANENT_MULTIPLIER', x: px, y: py, radius: 12, active: true },
    ];
    updateCollisions(world);
    expect(world.permanentMultiplier).toBeCloseTo(1.8 * 1.8, 10);
  });

  it('F11 AC5: catching the permanent multiplier never cancels an active temporary effect', () => {
    const world = makePlayingWorld();
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.effects = { type: 'SPEED', remaining: 4.5 };

    world.powerUps = [
      { id: 1, type: 'PERMANENT_MULTIPLIER', x: px, y: py, radius: 12, active: true },
    ];
    updateCollisions(world);

    expect(world.effects).toEqual({ type: 'SPEED', remaining: 4.5 });
    expect(world.permanentMultiplier).toBeCloseTo(1.8, 10);
  });

  it('F11 AC5: an active temporary effect never blocks a permanent-multiplier catch', () => {
    const world = makePlayingWorld();
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.effects = { type: 'HIT_POWER', remaining: 8 };
    world.permanentMultiplier = 1;

    world.powerUps = [
      { id: 1, type: 'PERMANENT_MULTIPLIER', x: px, y: py, radius: 12, active: true },
    ];
    updateCollisions(world);

    expect(world.permanentMultiplier).toBeCloseTo(1.8, 10);
  });

  it('F7 AC9: temporary 5x Hit Power composes with the permanent multiplier (permanent x1.8 x temporary x5 = x9)', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.powerUps = [
      { id: 1, type: 'PERMANENT_MULTIPLIER', x: px, y: py, radius: 12, active: true },
    ];
    updateCollisions(world);
    expect(world.permanentMultiplier).toBeCloseTo(1.8, 10);

    world.powerUps = [{ id: 2, type: 'HIT_POWER', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);
    expect(world.effects.type).toBe('HIT_POWER');

    // A tough enemy should take round(1.8 * 5) = 9 rounded hit power in one shield hit
    // (bottom-center: a direct hit, so the outcome/stop-vs-bounce logic doesn't interfere).
    const enemy = makeEnemy({ id: 99, hitsToKill: 100, x: 100, y: 100 });
    world.enemies = [enemy];
    world.shields = [makeShield({ x: 118, y: 135 })];
    updateCollisions(world);

    expect(enemy.hitsTaken).toBe(Math.round(1.8 * HIT_POWER_MULTIPLIER));
  });

  it('F10 AC3: catching a power-up awards the flat catch bonus to the score', () => {
    const world = withPowerUp('SPEED');
    world.score = 0;
    updateCollisions(world);
    expect(world.score).toBe(SCORE_POWERUP_BONUS);
  });

  it('an uncaught power-up (no player overlap) is left untouched with no effect applied', () => {
    const world = makePlayingWorld();
    world.powerUps = [{ id: 1, type: 'SHIELD', x: -9999, y: -9999, radius: 12, active: true }];
    updateCollisions(world);
    expect(world.powerUps).toHaveLength(1);
    expect(world.powerUps[0]!.active).toBe(true);
    expect(world.effects.type).toBeNull();
  });
});

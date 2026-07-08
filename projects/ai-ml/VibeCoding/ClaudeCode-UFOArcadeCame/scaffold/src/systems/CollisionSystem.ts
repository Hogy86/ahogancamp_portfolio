// Implements PRD §F15 (shield bounce geometry - zone classification + per-zone outcome),
// §F16 (shield never harms the player; a returning shield caught by the player grants +1
// life; shields only deflect off enemy hitboxes), §F4 AC6 (damage-state tracking via
// hitsTaken), §F7 AC9 (hit-power composition), §F11 (single active-temporary-effect slot -
// any catch overwrites it), §F8 AC2/AC3 (laser hits cost a life unless invulnerable), §F10
// AC2/AC3 (score per kill + power-up catch bonus).

import {
  EXTRA_DROP_CHANCE,
  HIT_POWER_MULTIPLIER,
  LIFE_CATCH_FLASH_SECONDS,
  PERMANENT_MULTIPLIER_PER_CATCH,
  POST_HIT_INVULN_SECONDS,
  POWERUP_DURATION_SECONDS,
  POWERUP_RADIUS,
  SCORE_PER_KILL_BASE,
  SCORE_PER_KILL_PER_LEVEL,
  SCORE_POWERUP_BONUS,
  SHIELD_CORNER_ZONE_FRACTION,
  SHIELD_SPEED,
} from '../config/constants';
import type { Enemy, PowerUpType, ShieldProjectile, World } from '../core/types';
import { emit } from '../instrumentation/Instrumentation';
import { consumeGuaranteedDrop, getGuaranteedDropsRemaining } from './levelRuntimeState';

const POWERUP_TYPES: PowerUpType[] = ['HIT_POWER', 'SPEED', 'SHIELD', 'PERMANENT_MULTIPLIER'];

function circleRectOverlap(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

function circleCircleOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy <= rr * rr;
}

/** F7 AC9/F11: current hit power composes the permanent (stacked) multiplier with the
 * single active-temporary-effect slot's 5x Hit Power, when that is the active effect. */
function currentHitPower(world: World): number {
  const base = world.permanentMultiplier;
  return world.effects.type === 'HIT_POWER' ? base * HIT_POWER_MULTIPLIER : base;
}

/** F10 AC2: points per kill scale with the current level. */
function scoreForKill(level: number): number {
  return SCORE_PER_KILL_BASE + SCORE_PER_KILL_PER_LEVEL * (level - 1);
}

/** F7 AC1: guaranteed drop per level from a random enemy death, plus a low-probability
 * extra-drop roll on every other death (tunable default per UX-N4). Returns true if this
 * death consumed the level's guaranteed-drop budget. */
function maybeDropPowerUp(world: World, enemy: Enemy, guaranteedRemaining: number): boolean {
  const shouldGuarantee = guaranteedRemaining > 0;
  const rolledExtra = Math.random() < EXTRA_DROP_CHANCE;
  if (!shouldGuarantee && !rolledExtra) return false;

  const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)] as PowerUpType;
  world.powerUps.push({
    id: world.nextEntityId++,
    type,
    x: enemy.x + world.formation.offsetX + enemy.width / 2,
    y: enemy.y + world.formation.offsetY + enemy.height / 2,
    radius: POWERUP_RADIUS,
    active: true,
  });
  return shouldGuarantee;
}

/**
 * F15: the 8 contact zones of an enemy's rectangular hitbox. Each maps to a fixed,
 * deterministic bounce outcome (F15 AC7) via outcomeForZone below.
 */
type Zone =
  | 'TOP_CENTER'
  | 'BOTTOM_CENTER'
  | 'LEFT_CENTER'
  | 'RIGHT_CENTER'
  | 'TOP_LEFT'
  | 'TOP_RIGHT'
  | 'BOTTOM_LEFT'
  | 'BOTTOM_RIGHT';

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * F15: classifies which of the 8 zones a shield-circle/enemy-rect contact struck.
 * Step 1 finds which face (top/bottom/left/right) was hit by taking the minimum
 * penetration depth across all 4 faces - the shallowest overlap identifies the face the
 * shield just crossed. Step 2 locates where along that face the contact point falls: the
 * outer SHIELD_CORNER_ZONE_FRACTION of the face's length from each end is a corner, the
 * middle band is the flat center/side (F15 AC7).
 */
function classifyZone(
  shieldX: number,
  shieldY: number,
  shieldR: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): Zone {
  const leftOverlap = shieldX + shieldR - rx;
  const rightOverlap = rx + rw + shieldR - shieldX;
  const topOverlap = shieldY + shieldR - ry;
  const bottomOverlap = ry + rh + shieldR - shieldY;

  const minOverlap = Math.min(leftOverlap, rightOverlap, topOverlap, bottomOverlap);

  if (minOverlap === topOverlap || minOverlap === bottomOverlap) {
    const isTop = minOverlap === topOverlap;
    const fraction = clamp01((shieldX - rx) / rw);
    if (fraction < SHIELD_CORNER_ZONE_FRACTION) return isTop ? 'TOP_LEFT' : 'BOTTOM_LEFT';
    if (fraction > 1 - SHIELD_CORNER_ZONE_FRACTION) return isTop ? 'TOP_RIGHT' : 'BOTTOM_RIGHT';
    return isTop ? 'TOP_CENTER' : 'BOTTOM_CENTER';
  }

  const isLeft = minOverlap === leftOverlap;
  const fraction = clamp01((shieldY - ry) / rh);
  if (fraction < SHIELD_CORNER_ZONE_FRACTION) return isLeft ? 'TOP_LEFT' : 'TOP_RIGHT';
  if (fraction > 1 - SHIELD_CORNER_ZONE_FRACTION) return isLeft ? 'BOTTOM_LEFT' : 'BOTTOM_RIGHT';
  return isLeft ? 'LEFT_CENTER' : 'RIGHT_CENTER';
}

/**
 * F15 AC3-AC6: the final, owner-corrected geometry table. Center-face hits (top or bottom)
 * stop the shield; corners bounce 45 degrees diagonally away from the enemy's center
 * through that corner; sides bounce purely horizontal (perpendicular to the face hit).
 * Directions are absolute screen directions, applied at the shield's constant speed
 * magnitude (a bounce never speeds up or slows down the shield).
 */
function outcomeForZone(zone: Zone): { stop: boolean; vx: number; vy: number } {
  const diagonal = SHIELD_SPEED * Math.SQRT1_2; // 45-degree component magnitude.
  switch (zone) {
    case 'TOP_CENTER':
    case 'BOTTOM_CENTER':
      return { stop: true, vx: 0, vy: 0 };
    case 'LEFT_CENTER':
      return { stop: false, vx: -SHIELD_SPEED, vy: 0 };
    case 'RIGHT_CENTER':
      return { stop: false, vx: SHIELD_SPEED, vy: 0 };
    case 'BOTTOM_LEFT':
      return { stop: false, vx: -diagonal, vy: diagonal };
    case 'BOTTOM_RIGHT':
      return { stop: false, vx: diagonal, vy: diagonal };
    case 'TOP_LEFT':
      return { stop: false, vx: -diagonal, vy: -diagonal };
    case 'TOP_RIGHT':
      return { stop: false, vx: diagonal, vy: -diagonal };
  }
}

/** Clears a shield's hit debounce once it has separated from the enemy it last damaged, so
 * a later, genuinely new contact (even with the same enemy) can damage it again (F15 AC2). */
function clearDebounceIfSeparated(world: World, shield: ShieldProjectile): void {
  if (shield.lastHitEnemyId === null) return;

  const lastHitEnemy = world.enemies.find((e) => e.id === shield.lastHitEnemyId);
  const stillOverlapping =
    lastHitEnemy !== undefined &&
    lastHitEnemy.alive &&
    circleRectOverlap(
      shield.x,
      shield.y,
      shield.radius,
      lastHitEnemy.x + world.formation.offsetX,
      lastHitEnemy.y + world.formation.offsetY,
      lastHitEnemy.width,
      lastHitEnemy.height,
    );

  if (!stillOverlapping) shield.lastHitEnemyId = null;
}

/** Shield-vs-enemy collisions (F15): every contact deals exactly one hit of damage, then
 * either stops the shield (center-face hit) or redirects it per the zone outcome table. A
 * shield may damage multiple different enemies over its lifetime, but at most one per
 * contact event (F15 AC1-AC2). */
function resolveShieldHits(world: World): void {
  for (const shield of world.shields) {
    if (!shield.active) continue;
    clearDebounceIfSeparated(world, shield);

    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      if (enemy.id === shield.lastHitEnemyId) continue; // still-overlapping debounce.

      const ex = enemy.x + world.formation.offsetX;
      const ey = enemy.y + world.formation.offsetY;
      if (!circleRectOverlap(shield.x, shield.y, shield.radius, ex, ey, enemy.width, enemy.height))
        continue;

      enemy.hitsTaken += Math.max(1, Math.round(currentHitPower(world)));
      shield.lastHitEnemyId = enemy.id;

      if (enemy.hitsTaken >= enemy.hitsToKill) {
        enemy.alive = false;
        world.score += scoreForKill(world.level);
        const guaranteedRemaining = getGuaranteedDropsRemaining();
        const consumedGuarantee = maybeDropPowerUp(world, enemy, guaranteedRemaining);
        if (consumedGuarantee) consumeGuaranteedDrop();
      }

      const zone = classifyZone(
        shield.x,
        shield.y,
        shield.radius,
        ex,
        ey,
        enemy.width,
        enemy.height,
      );
      const outcome = outcomeForZone(zone);
      if (outcome.stop) {
        shield.active = false; // F15 AC3/F16 AC4b: direct center-face hit removes it from play.
      } else {
        shield.vx = outcome.vx;
        shield.vy = outcome.vy;
      }
      break; // F15 AC2: at most one enemy contact resolved per shield per tick.
    }
  }
  world.shields = world.shields.filter((s) => s.active);
}

/** Player-vs-shield collision (F16 AC2): a shield that is currently returning toward the
 * player (vy > 0 - only true after a bottom-corner bounce, F15) and overlaps the player is
 * "caught": removed from play, +1 life. Gating on vy > 0 also prevents the shield's own
 * spawn position (adjacent to the player, initially moving upward) from self-triggering a
 * catch the instant it is thrown. */
function resolveShieldCatches(world: World): void {
  const playerCenterX = world.player.x + world.player.width / 2;
  const playerCenterY = world.player.y + world.player.height / 2;
  const playerRadius = Math.max(world.player.width, world.player.height) / 2;

  for (const shield of world.shields) {
    if (!shield.active) continue;
    if (shield.vy <= 0) continue;
    if (
      !circleCircleOverlap(
        playerCenterX,
        playerCenterY,
        playerRadius,
        shield.x,
        shield.y,
        shield.radius,
      )
    ) {
      continue;
    }

    shield.active = false;
    world.lives += 1;
    world.lifeCatchFlashRemaining = LIFE_CATCH_FLASH_SECONDS; // F16 AC9: catch-confirmation cue.
    emit('shieldCaught', { level: world.level });
  }
  world.shields = world.shields.filter((s) => s.active);
}

/** Enemy laser vs player collision: costs a life unless invulnerable (F8 AC2/AC3). F16 AC1:
 * the shield never harms the player, so this only ever checks lasers, never shields. */
function resolveLaserHits(world: World): void {
  const invulnerable = world.player.postHitInvulnRemaining > 0 || world.effects.type === 'SHIELD';

  for (const laser of world.enemyLasers) {
    if (!laser.active) continue;
    if (
      !circleRectOverlap(
        laser.x,
        laser.y,
        laser.radius,
        world.player.x,
        world.player.y,
        world.player.width,
        world.player.height,
      )
    ) {
      continue;
    }

    laser.active = false;
    if (invulnerable) continue;

    world.lives -= 1;
    world.player.postHitInvulnRemaining = POST_HIT_INVULN_SECONDS;
  }
}

/** Player-vs-powerup collision: catch-only activation (F7 AC3). */
function resolvePowerUpCatches(world: World): void {
  const playerCenterX = world.player.x + world.player.width / 2;
  const playerCenterY = world.player.y + world.player.height / 2;
  const playerRadius = Math.max(world.player.width, world.player.height) / 2;

  for (const p of world.powerUps) {
    if (!p.active) continue;
    if (!circleCircleOverlap(playerCenterX, playerCenterY, playerRadius, p.x, p.y, p.radius))
      continue;

    p.active = false;
    applyPowerUp(world, p.type);
    world.score += SCORE_POWERUP_BONUS;
    emit('powerUpCaught', { type: p.type, level: world.level });
  }
}

/** F11: the entire single-active-slot rule in one branch - any temporary-power-up catch
 * (same type or different) unconditionally overwrites the slot with a full fresh duration.
 * The permanent multiplier is untouched by and never touches this slot (F11 AC5). */
function applyPowerUp(world: World, type: PowerUpType): void {
  switch (type) {
    case 'HIT_POWER':
    case 'SPEED':
    case 'SHIELD':
      world.effects = { type, remaining: POWERUP_DURATION_SECONDS };
      break;
    case 'PERMANENT_MULTIPLIER':
      // F7 AC7: stacks multiplicatively, permanent for the run.
      world.permanentMultiplier *= PERMANENT_MULTIPLIER_PER_CATCH;
      break;
  }
}

export function updateCollisions(world: World): void {
  resolveShieldHits(world);
  resolveShieldCatches(world);
  resolveLaserHits(world);
  resolvePowerUpCatches(world);
}

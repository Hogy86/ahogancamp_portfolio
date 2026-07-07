// Implements PRD §F2 AC3/AC5 (shield hits first enemy touched, one hit of damage),
// §F4 AC6 (damage-state tracking via hitsTaken), §F7 AC9 (hit-power composition),
// §F8 AC2/AC3 (laser hits cost a life unless invulnerable), §F10 AC2/AC3 (score per
// kill + power-up catch bonus).

import {
  EXTRA_DROP_CHANCE,
  HIT_POWER_MULTIPLIER,
  PERMANENT_MULTIPLIER_PER_CATCH,
  POST_HIT_INVULN_SECONDS,
  POWERUP_DURATION_SECONDS,
  POWERUP_RADIUS,
  SCORE_PER_KILL_BASE,
  SCORE_PER_KILL_PER_LEVEL,
  SCORE_POWERUP_BONUS,
} from '../config/constants';
import type { Enemy, PowerUpType, World } from '../core/types';
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

/** F7 AC9: current hit power composes permanent (stacked) x temporary (5x) multipliers. */
function currentHitPower(world: World): number {
  const base = world.permanentMultiplier;
  return world.effects.hitPowerRemaining > 0 ? base * HIT_POWER_MULTIPLIER : base;
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

/** Shield-vs-enemy collisions: each shield damages at most one enemy (F2 AC5). */
function resolveShieldHits(world: World): void {
  for (const shield of world.shields) {
    if (!shield.active) continue;

    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      const ex = enemy.x + world.formation.offsetX;
      const ey = enemy.y + world.formation.offsetY;
      if (!circleRectOverlap(shield.x, shield.y, shield.radius, ex, ey, enemy.width, enemy.height))
        continue;

      // Exactly one hit of damage to the first enemy touched, then the shield is consumed
      // (F2 AC3/AC5). Damage amount scales with current hit power (F7 AC9).
      shield.active = false;
      enemy.hitsTaken += Math.max(1, Math.round(currentHitPower(world)));

      if (enemy.hitsTaken >= enemy.hitsToKill) {
        enemy.alive = false;
        world.score += scoreForKill(world.level);
        const guaranteedRemaining = getGuaranteedDropsRemaining();
        const consumedGuarantee = maybeDropPowerUp(world, enemy, guaranteedRemaining);
        if (consumedGuarantee) consumeGuaranteedDrop();
      }
      break; // F2 AC5: at most one enemy consumed per throw.
    }
  }
}

/** Enemy laser vs player collision: costs a life unless invulnerable (F8 AC2/AC3). */
function resolveLaserHits(world: World): void {
  const invulnerable = world.player.postHitInvulnRemaining > 0 || world.effects.shieldRemaining > 0;

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

function applyPowerUp(world: World, type: PowerUpType): void {
  // F7 AC8: same-type temporary effects refresh (not stack) their timer.
  switch (type) {
    case 'HIT_POWER':
      world.effects.hitPowerRemaining = POWERUP_DURATION_SECONDS;
      break;
    case 'SPEED':
      world.effects.speedRemaining = POWERUP_DURATION_SECONDS;
      break;
    case 'SHIELD':
      world.effects.shieldRemaining = POWERUP_DURATION_SECONDS;
      break;
    case 'PERMANENT_MULTIPLIER':
      // F7 AC7: stacks multiplicatively, permanent for the run.
      world.permanentMultiplier *= PERMANENT_MULTIPLIER_PER_CATCH;
      break;
  }
}

export function updateCollisions(world: World): void {
  resolveShieldHits(world);
  resolveLaserHits(world);
  resolvePowerUpCatches(world);
}

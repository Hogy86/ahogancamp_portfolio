// Implements PRD §F3 (formation), §F4 AC6 (damage state), §F7 AC6 (shield
// invulnerability visual), §F8 AC9 (i-frame visual), §F3 AC6 (formation warning).
// ADR-0001: this is the canvas half of the hybrid canvas+DOM split - game-field
// entities only. HUD/overlays are DOM (see ui/HUDView.ts, ui/ScreenController.ts).

import { PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH } from '../config/constants';
import type { World } from '../core/types';
import { drawEnemyLaser, drawPowerUp, drawSentinel, drawShield, drawVanguard } from './shapes';

/** Blink period for invulnerability visuals, expressed as a tick count (not
 * wall-clock) so it stays perfectly in sync with the fixed-timestep sim - the
 * renderer derives blink phase from the invuln remaining-duration counter itself,
 * never from `performance.now()`. */
function blinkOn(remainingSeconds: number): boolean {
  // 10 Hz blink derived from the remaining-duration counter's own value, not
  // wall-clock time - purely a function of simulation state.
  return Math.floor(remainingSeconds * 10) % 2 === 0;
}

export class CanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('CanvasRenderer: 2D context unavailable');
    this.ctx = ctx;
  }

  render(world: World): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT);

    if (world.state === 'PLAYING' || world.state === 'PAUSED') {
      this.drawFormationWarning(world);
      this.drawEnemies(world);
      this.drawShields(world);
      this.drawEnemyLasers(world);
      this.drawPowerUps(world);
      this.drawPlayer(world);
    }
  }

  private drawFormationWarning(world: World): void {
    if (!world.formationWarningActive) return;
    const { ctx } = this;
    // Non-color-only warning (F3 AC6/NFR-9a): pulsing border PLUS a text cue, not
    // just a red tint.
    const pulse = Math.floor(world.formation.lowestY) % 20 < 10;
    ctx.save();
    ctx.strokeStyle = pulse ? '#ff5a5a' : '#ffb3b3';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, PLAYFIELD_WIDTH - 6, PLAYFIELD_HEIGHT - 6);
    ctx.fillStyle = '#ff5a5a';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WARNING: SENTINELS APPROACHING', PLAYFIELD_WIDTH / 2, 24);
    ctx.restore();
  }

  private drawEnemies(world: World): void {
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      drawSentinel(
        this.ctx,
        enemy.x + world.formation.offsetX,
        enemy.y + world.formation.offsetY,
        enemy.width,
        enemy.height,
        enemy.hitsToKill,
        enemy.hitsTaken,
        enemy.isBoss,
      );
    }
  }

  private drawShields(world: World): void {
    for (const shield of world.shields) {
      drawShield(this.ctx, shield.x, shield.y, shield.radius);
    }
  }

  private drawEnemyLasers(world: World): void {
    for (const laser of world.enemyLasers) {
      drawEnemyLaser(this.ctx, laser.x, laser.y, laser.radius);
    }
  }

  private drawPowerUps(world: World): void {
    for (const p of world.powerUps) {
      drawPowerUp(this.ctx, p.x, p.y, p.radius, p.type);
    }
  }

  private drawPlayer(world: World): void {
    const invulnerable =
      world.player.postHitInvulnRemaining > 0 || world.effects.shieldRemaining > 0;
    const remaining = Math.max(world.player.postHitInvulnRemaining, world.effects.shieldRemaining);
    drawVanguard(
      this.ctx,
      world.player.x,
      world.player.y,
      world.player.width,
      world.player.height,
      invulnerable,
      invulnerable ? blinkOn(remaining) : true,
    );
  }
}

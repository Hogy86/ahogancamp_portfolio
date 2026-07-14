// Implements PRD §F3 (formation), §F4 AC6 (damage state), §F7 AC6 (shield
// invulnerability visual), §F8 AC9 (i-frame visual), §F3 AC6 (formation warning), §F12
// AC10-11 (v2: boss-incoming warning cue), §F15 AC9 (v2: shield trail), §F18 (v2:
// level-intro fading text), §F19 (v2: Game Complete fireworks in place of entities).
// ADR-0001: this is the canvas half of the hybrid canvas+DOM split - game-field
// entities only. HUD/overlays are DOM (see ui/HUDView.ts, ui/ScreenController.ts).

import {
  LEVEL_INTRO_SECONDS,
  LEVEL_INTRO_TEXT_COLOR,
  LEVEL_INTRO_TEXT_STROKE_COLOR,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
  VICTORY_CELEBRATION_SECONDS,
} from '../config/constants';
import type { ShieldProjectile, World } from '../core/types';
import {
  drawEnemyLaser,
  drawFireworks,
  drawPowerUp,
  drawSentinel,
  drawShield,
  drawShieldTrailPoint,
  drawVanguard,
} from './shapes';

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
      this.drawBossWarning(world);
      this.drawEnemies(world);
      this.drawShields(world);
      this.drawEnemyLasers(world);
      this.drawPowerUps(world);
      this.drawPlayer(world);
      // Drawn last so the fading "LEVEL N" text stays on top of, and legible against,
      // the visible-but-frozen player/enemies underneath it (F18 AC3).
      this.drawLevelIntro(world);
    } else if (world.state === 'VICTORY') {
      // F19 AC3/AC4: same black background (cleared above), no entities - fireworks only.
      this.drawVictoryFireworks(world);
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

  /** F12 AC10-11 (round-2 C2): the boss-incoming telegraph is deliberately a SOLID amber
   * flash (not a pulse) with different text, so a player who has learned the red pulsing
   * danger-warning above does not misread this positive escalation cue as another loss
   * warning. The two cues are temporally mutually exclusive (this one only fires once the
   * formation is fully cleared), so they never overlap on screen. */
  private drawBossWarning(world: World): void {
    if (world.bossWarningRemaining <= 0) return;
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = LEVEL_INTRO_TEXT_COLOR;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, PLAYFIELD_WIDTH - 6, PLAYFIELD_HEIGHT - 6);
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    // design-review-v2-round4.md FAIL-2: dark outline behind the amber fill so the text
    // reads against light enemy/Vanguard bodies too, not just the black background.
    ctx.lineWidth = 4;
    ctx.strokeStyle = LEVEL_INTRO_TEXT_STROKE_COLOR;
    ctx.strokeText('BOSS INCOMING', PLAYFIELD_WIDTH / 2, 24);
    ctx.fillStyle = LEVEL_INTRO_TEXT_COLOR;
    ctx.fillText('BOSS INCOMING', PLAYFIELD_WIDTH / 2, 24);
    ctx.restore();
  }

  /** F18 AC3-AC4: "LEVEL [N]" text that fades exactly in step with the countdown - alpha is
   * driven directly by levelIntroRemaining, so the fade finishes on the same tick gameplay
   * unlocks (GameLoop's stepSimulation gate). */
  private drawLevelIntro(world: World): void {
    if (world.levelIntroRemaining <= 0) return;
    const { ctx } = this;
    const alpha = world.levelIntroRemaining / LEVEL_INTRO_SECONDS;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // design-review-v2-round4.md FAIL-2: dark outline behind the amber fill so the text
    // reads against light enemy/Vanguard bodies too, not just the black background - the
    // amber fill alone computes to only ~1.27:1 contrast against the white 1-hit enemies.
    ctx.lineWidth = 4;
    ctx.strokeStyle = LEVEL_INTRO_TEXT_STROKE_COLOR;
    ctx.strokeText(`LEVEL ${world.level}`, PLAYFIELD_WIDTH / 2, PLAYFIELD_HEIGHT / 2);
    ctx.fillStyle = LEVEL_INTRO_TEXT_COLOR;
    ctx.fillText(`LEVEL ${world.level}`, PLAYFIELD_WIDTH / 2, PLAYFIELD_HEIGHT / 2);
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
      this.drawShieldTrail(shield);
      drawShield(this.ctx, shield.x, shield.y, shield.radius);
    }
  }

  /** F15 AC9: short fading afterimage tracing the shield's recent path, oldest = most
   * transparent, drawn underneath the main shield so bounce paths stay legible without
   * altering collision (trail is rendering-only, never read by CollisionSystem). */
  private drawShieldTrail(shield: ShieldProjectile): void {
    const { trail, radius } = shield;
    trail.forEach((point, index) => {
      const recency = (index + 1) / trail.length; // oldest (index 0) -> smallest alpha.
      drawShieldTrailPoint(this.ctx, point.x, point.y, radius * 0.6, 0.3 * recency);
    });
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
    const shieldEffectActive = world.effects.type === 'SHIELD';
    const invulnerable = world.player.postHitInvulnRemaining > 0 || shieldEffectActive;
    const remaining = Math.max(
      world.player.postHitInvulnRemaining,
      shieldEffectActive ? world.effects.remaining : 0,
    );
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

  /** F19 AC4: deterministic fireworks driven purely by elapsed celebration time. */
  private drawVictoryFireworks(world: World): void {
    const elapsed = VICTORY_CELEBRATION_SECONDS - world.victoryCelebrationRemaining;
    drawFireworks(this.ctx, elapsed);
  }
}

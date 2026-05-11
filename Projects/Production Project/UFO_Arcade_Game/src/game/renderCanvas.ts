import { LOGICAL_H, LOGICAL_W, type PowerUpKind } from './constants';
import type { ArcadeSimulation, Enemy } from './simulation';

const PLAYER_VIS_R = 22;

const POWER_LABEL: Record<PowerUpKind, string> = {
  wide: 'Wide',
  power: '5×DMG',
  speed: 'Speed',
  shields: 'Shield',
};

export function computeLetterbox(
  cw: number,
  ch: number,
): { scale: number; ox: number; oy: number } {
  const s = Math.min(cw / LOGICAL_W, ch / LOGICAL_H);
  const ox = (cw - LOGICAL_W * s) * 0.5;
  const oy = (ch - LOGICAL_H * s) * 0.5;
  return { scale: s, ox, oy };
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  sim: ArcadeSimulation,
  tSec: number,
  opts: {
    reducedMotion: boolean;
    showDebug: boolean;
    devSeed: number;
    paused: boolean;
  },
): void {
  const { scale, ox, oy } = computeLetterbox(ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, ox, oy);

  // starfield
  const starSpeed = opts.reducedMotion ? 8 : 40;
  ctx.fillStyle = '#050810';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  ctx.fillStyle = '#a8c4ff22';
  for (let i = 0; i < (opts.reducedMotion ? 40 : 90); i++) {
    const sx = ((i * 997) % LOGICAL_W) + ((tSec * starSpeed * (0.3 + (i % 5) * 0.15)) % LOGICAL_W);
    const sy = ((i * 541) % LOGICAL_H) + ((i * 13) % 40);
    ctx.fillRect(sx % LOGICAL_W, sy % LOGICAL_H, 2, 2);
  }

  // particles
  for (const p of sim.particles) {
    ctx.globalAlpha = Math.max(0, p.life * 3);
    ctx.fillStyle = p.col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // pickups
  for (const pk of sim.pickups) {
    ctx.strokeStyle = '#ffea00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffea0088';
    ctx.fill();
    ctx.fillStyle = '#e8f0ff';
    ctx.font = '11px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(POWER_LABEL[pk.kind].slice(0, 1), pk.x, pk.y + 4);
  }

  // enemy projectiles + telegraphs
  for (const e of sim.enemies) {
    if (!e.alive || !e.tele) continue;
    const prog = 1 - e.tele.t / 0.5;
    ctx.strokeStyle = `rgba(255,120,180,${0.25 + prog * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r + 8 + prog * 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const pr of sim.enemyProj) {
    ctx.fillStyle = '#ff6b9d';
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // enemies
  for (const e of sim.enemies) {
    if (!e.alive) continue;
    drawEnemy(ctx, e);
  }

  // player bolts
  ctx.fillStyle = '#7af8ff';
  for (const pr of sim.playerProj) {
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // player UFO
  ctx.save();
  ctx.translate(sim.playerX, sim.playerY);
  if (sim.flash > 0) {
    ctx.globalAlpha = 0.35 + Math.sin(tSec * 40) * 0.35;
  }
  if (sim.iframe > 0 && Math.floor(tSec * 12) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }
  ctx.strokeStyle = sim.hasShields() ? '#9fffef' : '#66f0ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, PLAYER_VIS_R, PLAYER_VIS_R * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -4, PLAYER_VIS_R * 0.55, PLAYER_VIS_R * 0.35, 0, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;

  // HUD
  ctx.fillStyle = '#e8f2ff';
  ctx.font = 'bold 18px system-ui,sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${sim.score.toLocaleString()}`, 16, 28);
  ctx.fillText(`Lives ${sim.lives}`, 16, 52);
  ctx.fillText(`Level ${sim.level}/10`, 16, 76);
  ctx.textAlign = 'right';
  ctx.fillText(`Combo ×${sim.combo.toFixed(2)}`, LOGICAL_W - 16, 28);
  ctx.textAlign = 'left';

  let py = 100;
  ctx.font = '14px system-ui,sans-serif';
  for (const p of sim.activePowers) {
    ctx.fillStyle = '#cde';
    ctx.fillText(`${POWER_LABEL[p.kind]} ${p.time.toFixed(1)}s`, 16, py);
    py += 22;
  }

  if (opts.paused) {
    ctx.fillStyle = '#ffcc00cc';
    ctx.font = 'bold 22px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', LOGICAL_W * 0.5, 48);
    ctx.textAlign = 'left';
  }

  if (opts.showDebug) {
    ctx.fillStyle = '#8f8';
    ctx.font = '12px monospace';
    ctx.fillText(`seed ${opts.devSeed}`, 16, LOGICAL_H - 48);
    ctx.fillText(
      `e${sim.enemies.filter((e) => e.alive).length} pp${sim.playerProj.length} ep${sim.enemyProj.length}`,
      16,
      LOGICAL_H - 28,
    );
  }

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const col = e.isBoss ? '#ff99ee' : e.arch === 'tank' ? '#8899ff' : e.arch === 'scout' ? '#66ffcc' : '#ffcc66';
  ctx.strokeStyle = col;
  ctx.lineWidth = e.isBoss ? 4 : 2;
  ctx.beginPath();
  if (e.arch === 'tank') {
    ctx.rect(e.x - e.r, e.y - e.r * 0.7, e.r * 2, e.r * 1.4);
  } else if (e.arch === 'scout') {
    ctx.moveTo(e.x, e.y - e.r);
    ctx.lineTo(e.x + e.r, e.y + e.r * 0.6);
    ctx.lineTo(e.x - e.r, e.y + e.r * 0.6);
    ctx.closePath();
  } else {
    ctx.moveTo(e.x, e.y - e.r);
    ctx.lineTo(e.x + e.r * 0.9, e.y);
    ctx.lineTo(e.x, e.y + e.r * 0.8);
    ctx.lineTo(e.x - e.r * 0.9, e.y);
    ctx.closePath();
  }
  ctx.stroke();
  if (e.shield > 0) {
    ctx.strokeStyle = '#88ccff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

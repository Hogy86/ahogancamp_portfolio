import {
  COMBO_MAX,
  COMBO_STEP,
  COMBO_WINDOW_SEC,
  enemyProjectileSpeed,
  FIRE_COOLDOWN_MS,
  FIXED_DT,
  fireRateForArchetype,
  KILL_SCORE,
  LOGICAL_H,
  LOGICAL_W,
  MAX_PICKUPS_FIELD,
  MAX_PLAYER_PROJECTILES,
  MAX_SUBSTEPS,
  PICKUP_DESPAWN_SEC,
  PICKUP_DRIFT_SPEED,
  PLAYER_BOLT_LIFETIME,
  PLAYER_BOLT_SPEED,
  PLAYER_IFRAME_SEC,
  PLAYER_LIVES_DEFAULT,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  type EnemyArchetype,
  type LevelRow,
  LEVEL_TABLE,
  type PowerUpKind,
  shieldChance,
} from './constants';
import { mulberry32 } from './rng';
import { logTelemetry } from './persistence';

export interface SimInput {
  moveX: number;
  moveY: number;
  fire: boolean;
}

export type TelegraphKind = 'aimed' | 'spread' | 'spiral';

export interface Enemy {
  id: number;
  arch: EnemyArchetype;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  shield: number;
  shieldMax: number;
  alive: boolean;
  fireCd: number;
  tele?: {
    kind: TelegraphKind;
    t: number;
    dir: number;
    burstLeft?: number;
    burstGap?: number;
  };
  aiT: number;
  isBoss?: boolean;
  isMinion?: boolean;
}

export interface Projectile {
  fromPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  dmg: number;
  prevX: number;
  prevY: number;
}

export interface Pickup {
  kind: PowerUpKind;
  x: number;
  y: number;
  life: number;
}

export interface ActivePower {
  kind: PowerUpKind;
  time: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  col: string;
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

function normMove(mx: number, my: number): { x: number; y: number } {
  let x = mx;
  let y = my;
  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.SQRT2;
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

function segHitsCircle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  r: number,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;
  const a = dx * dx + dy * dy;
  if (a < 1e-12) {
    return fx * fx + fy * fy <= r * r;
  }
  let t = -(fx * dx + fy * dy) / a;
  t = clamp(t, 0, 1);
  const qx = x1 + t * dx;
  const qy = y1 + t * dy;
  const ddx = qx - cx;
  const ddy = qy - cy;
  return ddx * ddx + ddy * ddy <= r * r;
}

const ALL_POWER_KINDS: PowerUpKind[] = ['wide', 'power', 'speed', 'shields'];

export class ArcadeSimulation {
  rng: () => number;
  private nextId = 1;
  level = 1;
  row: LevelRow = LEVEL_TABLE[0]!;
  playerX = LOGICAL_W * 0.5;
  playerY = LOGICAL_H * 0.82;
  lives = PLAYER_LIVES_DEFAULT;
  score = 0;
  combo = 1;
  comboTimer = 0;
  iframe = 0;
  flash = 0;
  enemies: Enemy[] = [];
  playerProj: Projectile[] = [];
  enemyProj: Projectile[] = [];
  pickups: Pickup[] = [];
  particles: Particle[] = [];
  activePowers: ActivePower[] = [];
  fireCd = 0;
  toSpawn = 0;
  spawnedTotal = 0;
  bossPhase = false;
  bossSpawned = false;
  minionsToRelease = 0;
  minionsSpawned = 0;
  bossMinionCd = 0;
  pickupHistory: PowerUpKind[] = [];
  /** After level complete, allow pickup collection for 3s (PRD). */
  levelCompletePickupGrace = 0;
  /** When true, freeze combat but still update pickups / grace timer. */
  levelCompleteHold = false;

  constructor(seed: number | null) {
    this.rng = mulberry32(seed ?? (Date.now() % 1_000_000_000));
  }

  resetRun(): void {
    this.level = 1;
    this.score = 0;
    this.lives = PLAYER_LIVES_DEFAULT;
    this.clearLevelEntities();
    this.activePowers = [];
    this.combo = 1;
    this.comboTimer = 0;
  }

  restartLevelPreserveLives(): void {
    this.clearLevelEntities();
    this.activePowers = [];
    this.comboTimer = 0;
    this.startLevel(this.level);
  }

  restartFromLevel1(): void {
    this.level = 1;
    this.score = 0;
    this.lives = PLAYER_LIVES_DEFAULT;
    this.clearLevelEntities();
    this.activePowers = [];
    this.combo = 1;
    this.comboTimer = 0;
    this.startLevel(1);
  }

  clearLevelEntities(): void {
    this.enemies = [];
    this.playerProj = [];
    this.enemyProj = [];
    this.pickups = [];
    this.particles = [];
    this.fireCd = 0;
    this.toSpawn = 0;
    this.spawnedTotal = 0;
    this.bossPhase = false;
    this.bossSpawned = false;
    this.minionsToRelease = 0;
    this.minionsSpawned = 0;
    this.bossMinionCd = 0;
    this.levelCompletePickupGrace = 0;
    this.levelCompleteHold = false;
    this.playerX = LOGICAL_W * 0.5;
    this.playerY = LOGICAL_H * 0.82;
    this.iframe = 0;
  }

  startLevel(lv: number): void {
    this.level = lv;
    this.row = LEVEL_TABLE[lv - 1] ?? LEVEL_TABLE[0]!;
    this.clearLevelEntities();
    this.elitesSpawned = 0;
    this.planWaves();
    logTelemetry('level_start', { level: lv });
  }

  private planWaves(): void {
    const n = this.row.enemyCount;
    this.spawnedTotal = 0;
    this.spawnPhase = 0;
    if (this.level === 10) {
      this.spawnMode = 'boss';
      this.toSpawn = 20;
      this.minionsToRelease = 8;
      return;
    }
    if (this.level <= 2) {
      this.spawnMode = 'early';
      this.toSpawn = n;
      return;
    }
    if (this.level <= 5) {
      this.spawnMode = 'two';
      this.toSpawn = Math.ceil(n * 0.6);
      return;
    }
    this.spawnMode = 'three';
    this.toSpawn = Math.ceil(n * 0.4);
  }

  private maxElitesThisLevel(): number {
    if (this.level <= 5) return 0;
    if (this.level <= 7) return 1;
    if (this.level <= 9) return 2;
    return 0;
  }

  private elitesSpawned = 0;
  private spawnMode: 'early' | 'two' | 'three' | 'boss' = 'early';
  private spawnPhase = 0;

  private pickArchetype(): EnemyArchetype {
    const u = this.rng();
    const allowElite =
      this.level >= 6 &&
      this.level !== 10 &&
      this.elitesSpawned < this.maxElitesThisLevel() &&
      u < 0.08;
    if (allowElite) {
      this.elitesSpawned++;
      return 'elite';
    }
    const v = this.rng();
    if (v < 0.35) return 'scout';
    if (v < 0.75) return 'gunner';
    return 'tank';
  }

  private hullFor(arch: EnemyArchetype): number {
    if (arch === 'scout') return 2;
    if (arch === 'gunner') return 3;
    if (arch === 'tank') return 6;
    return 4;
  }

  private radiusFor(arch: EnemyArchetype): number {
    if (arch === 'tank') return 22;
    if (arch === 'elite') return 20;
    if (arch === 'scout') return 14;
    return 16;
  }

  spawnEnemyAt(x: number, y: number, arch: EnemyArchetype, opts?: { boss?: boolean; minion?: boolean }): Enemy {
    const sc = shieldChance(this.level);
    const hasShield = opts?.boss ? false : this.rng() < sc;
    const shieldMax = hasShield ? this.row.shieldHits : 0;
    const e: Enemy = {
      id: this.nextId++,
      arch,
      x,
      y,
      vx: 0,
      vy: 0,
      r: this.radiusFor(arch),
      hp: this.hullFor(arch),
      shield: shieldMax,
      shieldMax,
      alive: true,
      fireCd: 0.2 + this.rng() * 0.5,
      aiT: this.rng() * 10,
      isBoss: !!opts?.boss,
      isMinion: !!opts?.minion,
    };
    this.enemies.push(e);
    return e;
  }

  private trySpawnWave(_dt: number): void {
    const n = this.row.enemyCount;
    const alive = () => this.enemies.filter((e) => e.alive).length;

    const spawnOne = (sideMargin: number) => {
      const side = this.rng() < 0.5 ? sideMargin : LOGICAL_W - sideMargin;
      const y = 100 + this.rng() * (LOGICAL_H - 220);
      this.spawnEnemyAt(side, y, this.pickArchetype());
      this.toSpawn--;
      this.spawnedTotal++;
    };

    if (this.spawnMode === 'boss') {
      if (!this.bossPhase) {
        const cap = 8;
        while (this.toSpawn > 0) {
          const aliveReg = this.enemies.filter((e) => e.alive && !e.isBoss && !e.isMinion).length;
          if (aliveReg >= cap) break;
          spawnOne(40);
        }
      }
      return;
    }

    if (this.spawnMode === 'early') {
      while (this.toSpawn > 0 && alive() < n) {
        spawnOne(50);
      }
      return;
    }

    if (this.spawnMode === 'two') {
      if (this.spawnPhase === 0) {
        while (this.toSpawn > 0 && alive() < 8) {
          spawnOne(50);
        }
        if (this.toSpawn <= 0 && alive() <= 3 && this.spawnedTotal < n) {
          this.spawnPhase = 1;
          this.toSpawn = n - this.spawnedTotal;
        }
      } else {
        while (this.toSpawn > 0 && alive() < 8) {
          spawnOne(50);
        }
      }
      return;
    }

    // three-wave (40% / 35% / remainder), PRD §8.2
    const p1 = Math.ceil(n * 0.35);
    if (this.spawnPhase === 0) {
      while (this.toSpawn > 0 && alive() < 8) {
        spawnOne(50);
      }
      if (this.toSpawn <= 0 && alive() <= 3 && this.spawnedTotal < n) {
        this.spawnPhase = 1;
        this.toSpawn = Math.min(p1, n - this.spawnedTotal);
      }
    } else if (this.spawnPhase === 1) {
      while (this.toSpawn > 0 && alive() < 8) {
        spawnOne(50);
      }
      if (this.toSpawn <= 0 && alive() <= 3 && this.spawnedTotal < n) {
        this.spawnPhase = 2;
        this.toSpawn = n - this.spawnedTotal;
      }
    } else {
      while (this.toSpawn > 0 && alive() < 8) {
        spawnOne(50);
      }
    }
    void _dt;
  }

  private maybeEnterBoss(): void {
    if (this.level !== 10 || this.bossSpawned) return;
    const regularAlive = this.enemies.some((e) => e.alive && !e.isBoss && !e.isMinion);
    if (!regularAlive && this.toSpawn <= 0) {
      this.bossPhase = true;
      this.bossSpawned = true;
      const boss = this.spawnEnemyAt(LOGICAL_W * 0.5, 120, 'elite', { boss: true });
      boss.hp = 48;
      boss.r = 48;
      boss.shield = 0;
      boss.shieldMax = 0;
      this.bossMinionCd = 0.8;
    }
  }

  private bossThink(dt: number): void {
    if (this.level !== 10 || !this.bossPhase) return;
    const boss = this.enemies.find((e) => e.isBoss && e.alive);
    if (!boss) {
      this.bossMinionCd = 0;
      return;
    }
    this.bossMinionCd -= dt;
    if (this.minionsSpawned < this.minionsToRelease && this.bossMinionCd <= 0) {
      const side = this.rng() < 0.5 ? 80 : LOGICAL_W - 80;
      this.spawnEnemyAt(side, 160 + this.rng() * 200, this.rng() < 0.5 ? 'scout' : 'gunner', {
        minion: true,
      });
      this.minionsSpawned++;
      this.bossMinionCd = 1.4;
    }
  }

  damageMultiplier(): number {
    return this.activePowers.some((p) => p.kind === 'power') ? 5 : 1;
  }

  moveMultiplier(): number {
    return this.activePowers.some((p) => p.kind === 'speed') ? 2 : 1;
  }

  hasShields(): boolean {
    return this.activePowers.some((p) => p.kind === 'shields');
  }

  hasWide(): boolean {
    return this.activePowers.some((p) => p.kind === 'wide');
  }

  private addPower(kind: PowerUpKind): void {
    const existing = this.activePowers.find((p) => p.kind === kind);
    if (existing) {
      existing.time = POWERUP_DURATION;
      logTelemetry('power_pickup', { kind, level: this.level });
      return;
    }
    const shieldsIdx = this.activePowers.findIndex((p) => p.kind === 'shields');
    const hasShields = shieldsIdx >= 0;
    if (this.activePowers.length < 2) {
      this.activePowers.push({ kind, time: POWERUP_DURATION });
    } else {
      if (hasShields) {
        const idx = this.activePowers.findIndex((p) => p.kind !== 'shields');
        if (idx >= 0) this.activePowers[idx] = { kind, time: POWERUP_DURATION };
      } else {
        this.activePowers.shift();
        this.activePowers.push({ kind, time: POWERUP_DURATION });
      }
    }
    logTelemetry('power_pickup', { kind, level: this.level });
  }

  collectPickup(kind: PowerUpKind): void {
    this.addPower(kind);
  }

  private rollPickupKind(): PowerUpKind {
    for (let t = 0; t < 8; t++) {
      const k = ALL_POWER_KINDS[(this.rng() * ALL_POWER_KINDS.length) | 0]!;
      const h = this.pickupHistory;
      if (h.length >= 2 && h[h.length - 1] === k && h[h.length - 2] === k) continue;
      return k;
    }
    return 'wide';
  }

  tryDropPickup(x: number, y: number): void {
    if (this.pickups.length >= MAX_PICKUPS_FIELD) return;
    if (this.rng() > POWERUP_DROP_CHANCE) return;
    const kind = this.rollPickupKind();
    this.pickups.push({ kind, x, y, life: PICKUP_DESPAWN_SEC });
    this.pickupHistory.push(kind);
    if (this.pickupHistory.length > 4) this.pickupHistory.shift();
  }

  isLevelClear(): boolean {
    if (this.level === 10) {
      return this.enemies.every((e) => !e.alive);
    }
    return this.enemies.every((e) => !e.alive) && this.toSpawn <= 0;
  }

  step(dt: number, input: SimInput, paused: boolean): void {
    if (paused) return;

    if (this.levelCompleteHold) {
      this.levelCompletePickupGrace = Math.max(0, this.levelCompletePickupGrace - dt);
      for (const pk of this.pickups) {
        const cx = LOGICAL_W * 0.5;
        const cy = LOGICAL_H * 0.5;
        const dx = cx - pk.x;
        const dy = cy - pk.y;
        const d = Math.hypot(dx, dy) || 1;
        pk.x += (dx / d) * PICKUP_DRIFT_SPEED * dt;
        pk.y += (dy / d) * PICKUP_DRIFT_SPEED * dt;
      }
      this.resolvePickupCollectionOnly();
      return;
    }

    this.comboTimer -= dt;
    if (this.comboTimer <= 0) {
      this.combo = 1;
    }

    this.iframe = Math.max(0, this.iframe - dt);
    this.flash = Math.max(0, this.flash - dt);

    for (const p of this.activePowers) {
      p.time -= dt;
    }
    this.activePowers = this.activePowers.filter((p) => p.time > 0);

    let acc = dt;
    let guard = 0;
    while (acc > 0 && guard++ < MAX_SUBSTEPS) {
      const step = Math.min(FIXED_DT, acc);
      this.substep(step, input);
      acc -= step;
    }

    this.maybeEnterBoss();
    this.bossThink(dt);

    for (const pk of this.pickups) {
      const cx = LOGICAL_W * 0.5;
      const cy = LOGICAL_H * 0.5;
      const dx = cx - pk.x;
      const dy = cy - pk.y;
      const d = Math.hypot(dx, dy) || 1;
      pk.x += (dx / d) * PICKUP_DRIFT_SPEED * dt;
      pk.y += (dy / d) * PICKUP_DRIFT_SPEED * dt;
      pk.life -= dt;
    }
    this.pickups = this.pickups.filter((p) => p.life > 0);

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private resolvePickupCollectionOnly(): void {
    for (const pk of this.pickups) {
      const d = Math.hypot(pk.x - this.playerX, pk.y - this.playerY);
      if (d < PLAYER_RADIUS + 14) {
        pk.life = 0;
        this.collectPickup(pk.kind);
      }
    }
    this.pickups = this.pickups.filter((p) => p.life > 0);
  }

  private substep(dt: number, input: SimInput): void {
    if (this.levelCompleteHold) return;
    this.trySpawnWave(dt);

    const mv = normMove(input.moveX, input.moveY);
    const sp = PLAYER_SPEED * this.moveMultiplier();
    this.playerX += mv.x * sp * dt;
    this.playerY += mv.y * sp * dt;
    this.playerX = clamp(this.playerX, PLAYER_RADIUS + 8, LOGICAL_W - PLAYER_RADIUS - 8);
    this.playerY = clamp(this.playerY, PLAYER_RADIUS + 8, LOGICAL_H - PLAYER_RADIUS - 8);

    if (input.fire) {
      this.fireCd -= dt * 1000;
      if (this.fireCd <= 0) {
        const dmg = this.damageMultiplier();
        const angles: number[] = this.hasWide() ? [-20, -10, 0, 10, 20] : [0];
        for (const deg of angles) {
          const rad = (deg * Math.PI) / 180;
          const vx = Math.sin(rad) * PLAYER_BOLT_SPEED;
          const vy = -Math.cos(rad) * PLAYER_BOLT_SPEED;
          this.spawnPlayerProj(this.playerX, this.playerY - 8, vx, vy, dmg);
        }
        this.fireCd += FIRE_COOLDOWN_MS;
      }
    } else {
      this.fireCd = Math.min(this.fireCd, 0);
    }

    while (this.playerProj.length > MAX_PLAYER_PROJECTILES) {
      this.playerProj.shift();
    }

    for (const pr of this.playerProj) {
      pr.prevX = pr.x;
      pr.prevY = pr.y;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
    }
    this.playerProj = this.playerProj.filter(
      (p) => p.life > 0 && p.x > -20 && p.x < LOGICAL_W + 20 && p.y > -20 && p.y < LOGICAL_H + 20,
    );

    for (const e of this.enemies) {
      if (!e.alive) continue;
      this.updateEnemy(e, dt);
    }

    for (const pr of this.enemyProj) {
      pr.prevX = pr.x;
      pr.prevY = pr.y;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
    }
    this.enemyProj = this.enemyProj.filter(
      (p) => p.life > 0 && p.x > -40 && p.x < LOGICAL_W + 40 && p.y > -40 && p.y < LOGICAL_H + 40,
    );

    this.resolveCollisions();
  }

  private spawnPlayerProj(x: number, y: number, vx: number, vy: number, dmg: number): void {
    this.playerProj.push({
      fromPlayer: true,
      x,
      y,
      vx,
      vy,
      r: 4,
      life: PLAYER_BOLT_LIFETIME,
      dmg,
      prevX: x,
      prevY: y,
    });
  }

  private enemyFireRate(e: Enemy): number {
    const base = this.row.fireRate;
    return fireRateForArchetype(base, e.arch);
  }

  private telegraphTime(kind: TelegraphKind): number {
    if (kind === 'aimed') return 0.25;
    if (kind === 'spread') return 0.35;
    return 0.5;
  }

  private pickTelegraph(e: Enemy): TelegraphKind {
    if (e.arch === 'gunner') return 'spread';
    if (e.arch === 'elite' || e.isBoss) return 'spiral';
    return 'aimed';
  }

  private updateEnemy(e: Enemy, dt: number): void {
    e.aiT += dt;
    const spd = this.row.enemySpeed * (e.isBoss ? 0.35 : e.arch === 'scout' ? 1.15 : e.arch === 'tank' ? 0.55 : 1);

    const dx = this.playerX - e.x;
    const dy = this.playerY - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirx = dx / dist;
    const diry = dy / dist;

    if (e.arch === 'scout') {
      const swoop = Math.sin(e.aiT * 1.8) * 0.6;
      e.vx = (dirx * 0.75 + Math.cos(e.aiT * 2.2) * 0.25) * spd;
      e.vy = (diry * 0.55 + swoop) * spd;
    } else if (e.arch === 'gunner') {
      e.vx = Math.sin(e.aiT * 1.2) * spd * 0.9;
      e.vy = Math.cos(e.aiT * 0.9) * spd * 0.35;
    } else if (e.arch === 'tank') {
      e.vx = dirx * spd * 0.45;
      e.vy = diry * spd * 0.25;
    } else {
      const ang = e.aiT * 0.9;
      const cx = LOGICAL_W * 0.5;
      const cy = LOGICAL_H * 0.42;
      const tx = cx + Math.cos(ang) * (LOGICAL_W * 0.28);
      const ty = cy + Math.sin(ang * 1.3) * (LOGICAL_H * 0.18);
      e.vx = (tx - e.x) * 1.2;
      e.vy = (ty - e.y) * 1.2;
      const m = Math.hypot(e.vx, e.vy) || 1;
      e.vx = (e.vx / m) * spd;
      e.vy = (e.vy / m) * spd;
    }

    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.x = clamp(e.x, e.r + 4, LOGICAL_W - e.r - 4);
    e.y = clamp(e.y, e.r + 40, LOGICAL_H - e.r - 20);

    e.fireCd -= dt;
    if (e.tele) {
      e.tele.t -= dt;
      if (e.tele.t <= 0) {
        this.emitEnemyShot(e, e.tele);
        if (e.tele.kind === 'spiral' && (e.tele.burstLeft ?? 0) > 1) {
          e.tele.burstLeft = (e.tele.burstLeft ?? 1) - 1;
          e.tele.t = e.tele.burstGap ?? 0.1;
        } else {
          e.tele = undefined;
          e.fireCd = 1 / Math.max(0.15, this.enemyFireRate(e));
        }
      }
      return;
    }

    if (e.fireCd <= 0) {
      const kind = this.pickTelegraph(e);
      const burst = kind === 'spiral' ? 6 : kind === 'spread' ? 1 : 1;
      e.tele = {
        kind,
        t: this.telegraphTime(kind),
        dir: Math.atan2(dy, dx),
        burstLeft: burst,
        burstGap: kind === 'spiral' ? 0.1 : 0,
      };
    }
  }

  private emitEnemyShot(e: Enemy, tele: NonNullable<Enemy['tele']>): void {
    const spd = enemyProjectileSpeed(this.level);
    const base = tele.dir;
    if (tele.kind === 'aimed') {
      this.pushEnemyProj(e.x, e.y, Math.cos(base) * spd, Math.sin(base) * spd, 1);
    } else if (tele.kind === 'spread') {
      for (let i = -1; i <= 1; i++) {
        const ang = base + (i * (20 * Math.PI)) / 180;
        this.pushEnemyProj(e.x, e.y, Math.cos(ang) * spd, Math.sin(ang) * spd, 1);
      }
    } else {
      const idx = 6 - (tele.burstLeft ?? 6);
      const ang = base + (idx / 6) * Math.PI * 2;
      this.pushEnemyProj(e.x, e.y, Math.cos(ang) * spd, Math.sin(ang) * spd, 1);
    }
  }

  private pushEnemyProj(x: number, y: number, vx: number, vy: number, dmg: number): void {
    this.enemyProj.push({
      fromPlayer: false,
      x,
      y,
      vx,
      vy,
      r: 5,
      life: 2,
      dmg,
      prevX: x,
      prevY: y,
    });
  }

  private resolveCollisions(): void {
    for (const pr of this.playerProj) {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (!segHitsCircle(pr.prevX, pr.prevY, pr.x, pr.y, e.x, e.y, e.r)) continue;
        let dmg = pr.dmg;
        if (e.shield > 0) {
          const sub = Math.min(e.shield, dmg);
          e.shield -= sub;
          dmg -= sub;
          this.score += Math.floor(5 * this.combo);
          if (e.shield <= 0) this.spawnBurst(e.x, e.y, '#6cf', 10);
        }
        if (dmg > 0 && e.shield <= 0) {
          e.hp -= dmg;
          this.score += Math.floor(10 * this.combo);
        }
        pr.life = 0;
        if (e.hp <= 0) {
          this.killEnemy(e);
        }
        break;
      }
    }

    if (this.iframe <= 0 && !this.hasShields()) {
      for (const pr of this.enemyProj) {
        if (
          segHitsCircle(pr.prevX, pr.prevY, pr.x, pr.y, this.playerX, this.playerY, PLAYER_RADIUS)
        ) {
          pr.life = 0;
          this.playerHit();
          break;
        }
      }
    }

    if (this.iframe <= 0 && !this.hasShields()) {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - this.playerX, e.y - this.playerY);
        if (d < e.r + PLAYER_RADIUS) {
          this.playerHit();
        }
      }
    }

    for (const pk of this.pickups) {
      const d = Math.hypot(pk.x - this.playerX, pk.y - this.playerY);
      if (d < PLAYER_RADIUS + 14) {
        pk.life = 0;
        this.collectPickup(pk.kind);
      }
    }
  }

  private playerHit(): void {
    if (this.iframe > 0 || this.hasShields()) return;
    this.lives -= 1;
    this.iframe = PLAYER_IFRAME_SEC;
    this.flash = 0.12;
    this.combo = 1;
    this.comboTimer = 0;
    logTelemetry('death', { level: this.level, lives: this.lives });
  }

  private killEnemy(e: Enemy): void {
    e.alive = false;
    this.score += Math.floor(KILL_SCORE[e.arch] * this.combo);
    this.combo = Math.min(COMBO_MAX, this.combo + COMBO_STEP);
    this.comboTimer = COMBO_WINDOW_SEC;
    this.spawnBurst(e.x, e.y, '#f8f', 14);
    this.tryDropPickup(e.x, e.y);
    logTelemetry('kill', { arch: e.arch, level: this.level });
  }

  private spawnBurst(x: number, y: number, col: string, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + this.rng();
      const s = 80 + this.rng() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.35 + this.rng() * 0.25,
        col,
      });
    }
  }

  onLevelCompleteEnter(): void {
    this.levelCompleteHold = true;
    this.levelCompletePickupGrace = 3;
    logTelemetry('level_complete', { level: this.level });
  }

  /** Call from UI when leaving level complete overlay — discards pickups if grace elapsed. */
  finalizeLevelTransition(): void {
    if (this.levelCompletePickupGrace <= 0) {
      this.pickups = [];
    }
    this.levelCompleteHold = false;
    this.levelCompletePickupGrace = 0;
  }
}

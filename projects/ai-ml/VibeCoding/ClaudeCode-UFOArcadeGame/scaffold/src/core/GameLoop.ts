// Implements ADR-0002 decision 1 (fixed-timestep accumulator loop) and decision 3
// (simulation ticks only while state == PLAYING). This is the only place
// `requestAnimationFrame` or `performance.now()` appears in the codebase - both are
// used strictly to drive the accumulator, never as a per-effect timer (that
// distinction is what the binding security/architecture constraint #3 requires:
// no wall-clock-driven gameplay timers, only wall-clock-driven frame pacing).
// v2 additions: §F18 (level-intro freeze gates the rest of stepSimulation), §F12
// AC10-11 (boss-incoming warning ticks alongside gameplay, never gates it), §F19
// AC6 (the VICTORY celebration ticks on its own dedicated path, not stepSimulation).
//
// docs/mobile/architecture/mobile-architecture.md M-ADR-0005 (§8.2): takes an injected
// `InputManager` (so a platform's composition root can register touch sources on it
// before the loop starts) and adds `suspend()`/`resume()` - cancelling rAF and holding no
// timer while backgrounded (M10.6), and resetting `lastTimestamp`/`accumulator` on resume
// so the first frame back never "catches up" the elapsed background time (M4.2).

import { FIXED_DT } from '../config/constants';
import { InputManager } from './InputManager';
import { dispatchStateInput } from './GameStateMachine';
import { updateMovement } from '../systems/MovementSystem';
import { updateFormation } from '../systems/FormationSystem';
import { updateEnemyFire } from '../systems/EnemyFireSystem';
import { updateProjectiles } from '../systems/ProjectileSystem';
import { updateCollisions } from '../systems/CollisionSystem';
import { updatePowerUps } from '../systems/PowerUpSystem';
import { updateWinLoss } from '../systems/WinLossSystem';
import { updateLevelIntro } from '../systems/LevelIntroSystem';
import { updateBossWarning } from '../systems/BossWarningSystem';
import { updateVictoryCelebration } from '../systems/VictoryCelebrationSystem';
import type { World } from './types';

/** Max accumulated time processed per animation frame, to avoid a "spiral of death"
 * after a long tab-suspend (e.g. backgrounded tab) - clamps catch-up steps. */
const MAX_FRAME_TIME_SECONDS = 0.25;

export type RenderCallback = (world: World, alpha: number) => void;

export class GameLoop {
  /** Exposed so a platform's composition root can register extra InputSources
   * (Android's touch move-zone/throw button) before calling start() (§5.1). */
  readonly input: InputManager;
  private accumulator = 0;
  private lastTimestamp: number | null = null;
  private rafHandle = 0;
  private running = false;
  private suspended = false;

  constructor(
    private world: World,
    private readonly render: RenderCallback,
    input: InputManager = new InputManager(),
  ) {
    this.input = input;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    this.suspended = false;
    cancelAnimationFrame(this.rafHandle);
    this.input.dispose();
  }

  /** M4.1/M10.6: cancels the scheduled frame and holds no timer while the app is in
   * the background. Only ever called by Android's lifecycle handler - the web build
   * never backgrounds the loop (M3.12/OQ-M10 (a)). */
  suspend(): void {
    if (!this.running || this.suspended) return;
    this.suspended = true;
    cancelAnimationFrame(this.rafHandle);
  }

  /** M4.2: no time is "caught up" for the duration spent suspended - resetting
   * `lastTimestamp` to null makes the next tick treat its first frame as a zero-elapsed
   * frame, exactly like the very first tick after `start()`. */
  resume(): void {
    if (!this.running || !this.suspended) return;
    this.suspended = false;
    this.lastTimestamp = null;
    this.accumulator = 0;
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  /** Fixed-timestep accumulator: the RAF-supplied timestamp drives frame pacing
   * only, never gameplay timers (ADR-0002 decision 1/5). */
  private tick = (timestamp: number): void => {
    if (!this.running || this.suspended) return;

    if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
    const frameSeconds = Math.min(MAX_FRAME_TIME_SECONDS, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;
    this.accumulator += frameSeconds;

    const snapshot = this.input.snapshot();

    // Per-screen input dispatch always runs, regardless of PLAYING/PAUSED/etc
    // (ADR-0002 decision 2) - this is what makes Esc/menu semantics per-screen.
    dispatchStateInput(this.world, snapshot);

    let stepsRun = 0;
    while (this.accumulator >= FIXED_DT) {
      if (this.world.state === 'PLAYING') {
        this.stepSimulation(snapshot, FIXED_DT);
      } else if (this.world.state === 'VICTORY') {
        // F19 AC6: the Game Complete celebration is a single additive tick path - it does
        // not weaken the "sim only ticks during PLAYING" rule for any other system.
        updateVictoryCelebration(this.world, FIXED_DT);
      }
      this.accumulator -= FIXED_DT;
      stepsRun += 1;
    }

    // §5.3: touch sources (e.g. Android's THROW latch) only clear once at least one
    // fixed step has actually run this frame - keyboard ignores the argument.
    this.input.consumeEdges(stepsRun);

    const alpha = this.accumulator / FIXED_DT;
    this.render(this.world, alpha);

    this.rafHandle = requestAnimationFrame(this.tick);
  };

  /** Deterministic fixed system order (ADR-0002 decision 4): LevelIntro (gate) ->
   * BossWarning -> Movement -> Formation -> EnemyFire -> Projectile -> Collision ->
   * PowerUp -> WinLoss. All state feeding terminal conditions is finalized before
   * WinLossSystem runs.
   *
   * F18 AC2/AC5/AC8: while the level-intro countdown is active, this returns immediately
   * after ticking it - nobody moves or fires until it completes. This single early return
   * is what makes "nobody moves or fires during the intro" a property of one gate rather
   * than scattered per-system guards.
   *
   * F12 AC11: BossWarningSystem deliberately runs AFTER that gate (not before), and nothing
   * below gates on `bossWarningRemaining` - the player retains full move/throw control
   * during the boss-incoming cue; there simply are no enemies to hit yet. */
  private stepSimulation(snapshot: ReturnType<InputManager['snapshot']>, dt: number): void {
    updateLevelIntro(this.world, dt);
    if (this.world.levelIntroRemaining > 0) return;

    updateBossWarning(this.world, dt);

    updateMovement(this.world, snapshot, dt);
    updateFormation(this.world, dt);
    updateEnemyFire(this.world, dt);
    updateProjectiles(this.world, snapshot, dt);
    updateCollisions(this.world);
    updatePowerUps(this.world, dt);
    updateWinLoss(this.world);
  }
}

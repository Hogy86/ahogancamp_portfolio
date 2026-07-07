// Implements ADR-0002 decision 1 (fixed-timestep accumulator loop) and decision 3
// (simulation ticks only while state == PLAYING). This is the only place
// `requestAnimationFrame` or `performance.now()` appears in the codebase - both are
// used strictly to drive the accumulator, never as a per-effect timer (that
// distinction is what the binding security/architecture constraint #3 requires:
// no wall-clock-driven gameplay timers, only wall-clock-driven frame pacing).

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
import type { World } from './types';

/** Max accumulated time processed per animation frame, to avoid a "spiral of death"
 * after a long tab-suspend (e.g. backgrounded tab) - clamps catch-up steps. */
const MAX_FRAME_TIME_SECONDS = 0.25;

export type RenderCallback = (world: World, alpha: number) => void;

export class GameLoop {
  private readonly input: InputManager;
  private accumulator = 0;
  private lastTimestamp: number | null = null;
  private rafHandle = 0;
  private running = false;

  constructor(
    private world: World,
    private readonly render: RenderCallback,
  ) {
    this.input = new InputManager();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafHandle);
    this.input.dispose();
  }

  /** Fixed-timestep accumulator: the RAF-supplied timestamp drives frame pacing
   * only, never gameplay timers (ADR-0002 decision 1/5). */
  private tick = (timestamp: number): void => {
    if (!this.running) return;

    if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
    const frameSeconds = Math.min(MAX_FRAME_TIME_SECONDS, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;
    this.accumulator += frameSeconds;

    const snapshot = this.input.snapshot();

    // Per-screen input dispatch always runs, regardless of PLAYING/PAUSED/etc
    // (ADR-0002 decision 2) - this is what makes Esc/menu semantics per-screen.
    dispatchStateInput(this.world, snapshot);

    while (this.accumulator >= FIXED_DT) {
      if (this.world.state === 'PLAYING') {
        this.stepSimulation(snapshot, FIXED_DT);
      }
      this.accumulator -= FIXED_DT;
    }

    this.input.consumeEdges();

    const alpha = this.accumulator / FIXED_DT;
    this.render(this.world, alpha);

    this.rafHandle = requestAnimationFrame(this.tick);
  };

  /** Deterministic fixed system order (ADR-0002 decision 4): Movement -> Formation
   * -> EnemyFire -> Projectile -> Collision -> PowerUp -> WinLoss. All state feeding
   * terminal conditions is finalized before WinLossSystem runs. */
  private stepSimulation(snapshot: ReturnType<InputManager['snapshot']>, dt: number): void {
    updateMovement(this.world, snapshot, dt);
    updateFormation(this.world, dt);
    updateEnemyFire(this.world, dt);
    updateProjectiles(this.world, snapshot, dt);
    updateCollisions(this.world);
    updatePowerUps(this.world, dt);
    updateWinLoss(this.world);
  }
}

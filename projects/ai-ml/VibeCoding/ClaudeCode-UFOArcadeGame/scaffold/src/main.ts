// Implements PRD §F1-F10 (application entry point wiring loop, renderer, HUD, and
// screen controller together), NFR-1 (load-to-first-input), ADR-0001 (hybrid
// canvas+DOM split), ADR-0002 (fixed-timestep loop + state machine).

import { createNewRunWorld } from './core/world';
import { GameLoop } from './core/GameLoop';
import { CanvasRenderer } from './render/CanvasRenderer';
import { HUDView } from './ui/HUDView';
import { ScreenController } from './ui/ScreenController';
import { resetGuaranteedDrops } from './systems/levelRuntimeState';
import { FIXED_DT } from './config/constants';

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`main: required element #${id} not found`);
  return el as T;
}

function bootstrap(): void {
  const canvas = getRequiredElement<HTMLCanvasElement>('game-canvas');
  const hudRoot = getRequiredElement<HTMLElement>('hud-root');
  const overlayRoot = getRequiredElement<HTMLElement>('overlay-root');

  // Control-text line (F9 AC2) lives outside hud-root so HUDView can manage its
  // own fade lifecycle independently of the score/lives/level panels.
  const controlTextEl = document.createElement('div');
  controlTextEl.id = 'control-text';
  document.getElementById('app-root')?.appendChild(controlTextEl);

  const world = createNewRunWorld();
  resetGuaranteedDrops(world.level);

  const renderer = new CanvasRenderer(canvas);
  const hud = new HUDView(hudRoot, controlTextEl);
  const screens = new ScreenController(overlayRoot);

  let hasThrownOnce = false;

  const loop = new GameLoop(world, (currentWorld) => {
    if (currentWorld.shields.length > 0) hasThrownOnce = true;

    renderer.render(currentWorld);
    hud.update(currentWorld, hasThrownOnce, FIXED_DT);
    screens.render(currentWorld);
  });

  loop.start();
}

bootstrap();

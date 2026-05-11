import { LOGICAL_H, LOGICAL_W } from './constants';
import {
  loadSettings,
  logTelemetry,
  pushScore,
  saveLastCompletedLevel,
  saveSettings,
  type Settings,
} from './persistence';
import { SoundEngine } from './sound';
import { ArcadeSimulation, type SimInput } from './simulation';
import { computeLetterbox, drawGame } from './renderCanvas';

type Screen =
  | 'menu'
  | 'settings'
  | 'playing'
  | 'paused'
  | 'levelComplete'
  | 'gameOver'
  | 'win';

const MENU_INITIAL = 0.15;
const MENU_REPEAT = 0.075;

export class ArcadeApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sim: ArcadeSimulation;
  private sound = new SoundEngine();
  private screen: Screen = 'menu';
  private settings: Settings = loadSettings();
  private keys = new Set<string>();
  private lastT = 0;
  private pauseIndex = 0;
  private confirm: null | { title: string; onYes: () => void } = null;
  private menuHeld = 0;
  private menuDir = 0;
  private showDebug = false;
  private devSeed: number;
  private winT = 0;
  private winPhase: 'fx' | 'menu' = 'fx';
  private settingsLine = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const c = canvas.getContext('2d');
    if (!c) throw new Error('2d context');
    this.ctx = c;
    const dev = import.meta.env.VITE_DEV_MODE === 'true';
    this.devSeed = dev ? 42_4242 : (Date.now() % 1_000_000_000);
    this.sim = new ArcadeSimulation(dev ? 42_4242 : null);
    this.applySettings();
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', () => this.keys.clear());
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private applySettings(): void {
    this.sound.setEnabled(this.settings.sfx);
    saveSettings(this.settings);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private onKeyDown = (ev: KeyboardEvent): void => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.code)) {
      ev.preventDefault();
    }
    this.keys.add(ev.code);
    if (ev.code === 'F1') {
      this.showDebug = !this.showDebug;
      ev.preventDefault();
    }
    if (!ev.repeat) {
      this.handleMenuEdge(ev);
    }
  };

  private onKeyUp = (ev: KeyboardEvent): void => {
    this.keys.delete(ev.code);
    this.menuDir = 0;
    this.menuHeld = 0;
  };

  focus(): void {
    this.canvas.focus();
  }

  startLoop(): void {
    this.lastT = performance.now();
    const frame = (t: number): void => {
      const dt = Math.min(0.05, (t - this.lastT) / 1000);
      this.lastT = t;
      this.tick(dt);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  private tick(dt: number): void {
    this.updatePauseNav(dt);
    this.updateSim(dt);
    this.render(performance.now() / 1000);
  }

  private updatePauseNav(dt: number): void {
    if (this.screen !== 'paused' || this.confirm) return;
    let dir = 0;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) dir = -1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) dir = 1;
    if (dir === 0) {
      this.menuHeld = 0;
      this.menuDir = 0;
      return;
    }
    if (dir !== this.menuDir) {
      this.menuDir = dir;
      this.menuHeld = 0;
      this.pauseIndex = (this.pauseIndex + dir + 4) % 4;
      this.sound.menu();
      return;
    }
    this.menuHeld += dt;
    const thresh = this.menuHeld < MENU_INITIAL ? MENU_INITIAL : MENU_REPEAT;
    if (this.menuHeld >= thresh) {
      this.menuHeld = 0;
      this.pauseIndex = (this.pauseIndex + dir + 4) % 4;
      this.sound.menu();
    }
  }

  private updateSim(dt: number): void {
    if (this.screen === 'win') {
      this.winT += dt;
      if (this.winPhase === 'fx' && this.winT >= 6) {
        this.winPhase = 'menu';
      }
      return;
    }

    const simPaused = this.screen === 'paused';
    const simActive = this.screen === 'playing' || simPaused || this.screen === 'levelComplete';
    const input = this.readPlayingInput();

    if (simActive) {
      this.sim.step(dt, input, simPaused);
    }

    if (this.screen !== 'playing') return;

    if (this.sim.lives <= 0) {
      this.screen = 'gameOver';
      logTelemetry('game_end', { score: this.sim.score });
      return;
    }

    if (this.sim.isLevelClear()) {
      if (this.sim.level === 10) {
        saveLastCompletedLevel(10);
        pushScore(this.sim.score, 10);
        this.screen = 'win';
        this.winT = 0;
        this.winPhase = 'fx';
        logTelemetry('win', { score: this.sim.score });
      } else {
        this.sim.onLevelCompleteEnter();
        this.screen = 'levelComplete';
      }
    }
  }

  private readPlayingInput(): SimInput {
    if (this.screen !== 'playing') {
      return { moveX: 0, moveY: 0, fire: false };
    }
    let mx = 0;
    let my = 0;
    if (this.keys.has('KeyW')) my -= 1;
    if (this.keys.has('KeyS')) my += 1;
    if (this.keys.has('KeyA')) mx -= 1;
    if (this.keys.has('KeyD')) mx += 1;
    const fire = this.keys.has('Space');
    return { moveX: mx, moveY: my, fire };
  }

  private render(tSec: number): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.ctx.fillStyle = '#02040a';
    this.ctx.fillRect(0, 0, w, h);

    if (this.screen === 'menu') {
      this.drawTextCenter('Arcade UFO', h * 0.28, 34);
      this.drawTextCenter('Enter — Start', h * 0.42, 20);
      this.drawTextCenter('H — Settings    WASD move · Space fire · Esc pause', h * 0.52, 16);
      return;
    }

    if (this.screen === 'settings') {
      this.drawTextCenter('Settings / Help', h * 0.14, 26);
      const lines = [
        '↑/↓ select · Enter toggles the highlighted line',
        `${this.settingsLine === 0 ? '>' : ' '} SFX: ${this.settings.sfx ? 'On' : 'Off'}`,
        `${this.settingsLine === 1 ? '>' : ' '} Reduced motion: ${this.settings.reducedMotion ? 'On' : 'Off'}`,
        'Controls: WASD, Space, Esc / P pause; Q/R/1 when paused (with confirm).',
        'B — Back to menu',
      ];
      lines.forEach((line, i) => this.drawTextCenter(line, h * 0.24 + i * 26, i === 0 ? 14 : 16));
      return;
    }

    if (this.screen === 'gameOver') {
      drawGame(this.ctx, this.sim, tSec, {
        reducedMotion: this.settings.reducedMotion,
        showDebug: this.showDebug,
        devSeed: this.devSeed,
        paused: true,
      });
      this.drawOverlay(['Game Over', `Score ${this.sim.score}`, 'Enter — Menu    R — Retry level']);
      return;
    }

    if (this.screen === 'win') {
      drawGame(this.ctx, this.sim, tSec, {
        reducedMotion: this.settings.reducedMotion,
        showDebug: this.showDebug,
        devSeed: this.devSeed,
        paused: true,
      });
      if (this.winPhase === 'fx' && this.winT < 6) {
        this.drawFireworks(tSec);
        if (this.winT >= 1) {
          this.drawTextCenter('Press Enter to skip', h * 0.88, 14);
        }
      } else {
        this.drawOverlay(['Congratulations', `Final score ${this.sim.score}`, 'Enter — Replay from L1    M — Menu']);
      }
      return;
    }

    drawGame(this.ctx, this.sim, tSec, {
      reducedMotion: this.settings.reducedMotion,
      showDebug: this.showDebug,
      devSeed: this.devSeed,
      paused: this.screen === 'paused',
    });

    if (this.screen === 'paused') {
      this.drawPauseMenu();
    }
    if (this.screen === 'levelComplete') {
      this.drawOverlay([`Level ${this.sim.level} complete`, 'Enter — Continue']);
    }
    if (this.confirm) {
      this.drawOverlay([this.confirm.title, 'Enter — Confirm    Esc — Cancel']);
    }
  }

  private drawFireworks(tSec: number): void {
    const rm = this.settings.reducedMotion;
    const n = rm ? 12 : 40;
    const { scale, ox, oy } = computeLetterbox(this.canvas.clientWidth, this.canvas.clientHeight);
    this.ctx.save();
    this.ctx.setTransform(scale, 0, 0, scale, ox, oy);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + tSec * (rm ? 0.3 : 1.2);
      const rad = 120 + Math.sin(tSec * 2 + i) * 60;
      const x = LOGICAL_W * 0.5 + Math.cos(a) * rad * (0.3 + (i % 5) * 0.1);
      const y = LOGICAL_H * 0.42 + Math.sin(a * 1.1) * rad * 0.4;
      this.ctx.fillStyle = rm ? '#ffddeeaa' : `hsla(${(i * 37) % 360},90%,70%,0.85)`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, rm ? 3 : 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 36px system-ui,sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Congratulations', LOGICAL_W * 0.5, LOGICAL_H * 0.28);
    this.ctx.restore();
  }

  private drawTextCenter(text: string, y: number, size: number): void {
    this.ctx.fillStyle = '#e8f0ff';
    this.ctx.font = `${size}px system-ui,sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, this.canvas.clientWidth * 0.5, y);
  }

  private drawOverlay(lines: string[]): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.ctx.fillStyle = '#000a';
    this.ctx.fillRect(0, 0, w, h);
    let y = h * 0.36;
    for (const line of lines) {
      this.drawTextCenter(line, y, line.length > 40 ? 15 : 22);
      y += 36;
    }
  }

  private drawPauseMenu(): void {
    const opts = ['Resume', 'Quit to Main Menu', 'Restart Current Level', 'Restart from Level 1'];
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.ctx.fillStyle = '#0009';
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.textAlign = 'left';
    this.ctx.font = '20px system-ui,sans-serif';
    let y = h * 0.3;
    opts.forEach((o, i) => {
      this.ctx.fillStyle = i === this.pauseIndex ? '#ffea66' : '#dde7ff';
      this.ctx.fillText((i === this.pauseIndex ? '> ' : '  ') + o, w * 0.26, y);
      y += 36;
    });
  }

  private handleMenuEdge(ev: KeyboardEvent): void {
    if (this.screen === 'win' && this.winPhase === 'fx' && (ev.code === 'Enter' || ev.code === 'Space')) {
      if (this.winT >= 1) {
        this.winPhase = 'menu';
        this.winT = 99;
      }
    }

    const dialog = this.confirm;
    if (dialog) {
      if (ev.code === 'Escape') {
        this.confirm = null;
        this.sound.menu();
      }
      if (ev.code === 'Enter') {
        this.confirm = null;
        dialog.onYes();
        this.sound.menu();
      }
      return;
    }

    if (this.screen === 'menu' && ev.code === 'Enter') {
      this.sim.resetRun();
      this.sim.startLevel(1);
      this.screen = 'playing';
      this.sound.resume();
      logTelemetry('game_start', { seed: this.devSeed });
    }
    if (this.screen === 'menu' && ev.code === 'KeyH') {
      this.screen = 'settings';
    }
    if (this.screen === 'settings' && ev.code === 'KeyB') {
      this.screen = 'menu';
    }
    if (this.screen === 'settings' && (ev.code === 'ArrowUp' || ev.code === 'KeyW')) {
      this.settingsLine = (this.settingsLine + 1) % 2;
      this.sound.menu();
    }
    if (this.screen === 'settings' && (ev.code === 'ArrowDown' || ev.code === 'KeyS')) {
      this.settingsLine = (this.settingsLine + 1) % 2;
      this.sound.menu();
    }
    if (this.screen === 'settings' && ev.code === 'Enter') {
      if (this.settingsLine === 0) this.settings.sfx = !this.settings.sfx;
      else this.settings.reducedMotion = !this.settings.reducedMotion;
      this.applySettings();
      this.sound.menu();
    }

    if (this.screen === 'paused') {
      if (ev.code === 'Escape' || ev.code === 'KeyP') {
        this.screen = 'playing';
        logTelemetry('resume', { level: this.sim.level });
      }
      if (ev.code === 'Enter' || ev.code === 'Space') {
        this.activatePauseOption();
      }
      if (ev.code === 'KeyQ') {
        this.openConfirm('Quit to main menu?', () => this.quitToMenu());
      }
      if (ev.code === 'KeyR') {
        this.openConfirm('Restart current level?', () => {
          this.sim.restartLevelPreserveLives();
          this.screen = 'playing';
        });
      }
      if (ev.code === 'Digit1') {
        this.openConfirm('Restart from level 1? Score resets.', () => {
          this.sim.restartFromLevel1();
          this.screen = 'playing';
        });
      }
    }

    if (this.screen === 'levelComplete' && ev.code === 'Enter') {
      const finished = this.sim.level;
      this.sim.finalizeLevelTransition();
      this.sim.startLevel(finished + 1);
      this.screen = 'playing';
    }

    if (this.screen === 'gameOver') {
      if (ev.code === 'Enter') this.quitToMenu();
      if (ev.code === 'KeyR') {
        this.sim.restartLevelPreserveLives();
        this.screen = 'playing';
      }
    }

    if (this.screen === 'win' && this.winPhase === 'menu') {
      if (ev.code === 'Enter') {
        this.sim.restartFromLevel1();
        this.screen = 'playing';
      }
      if (ev.code === 'KeyM') {
        this.quitToMenu();
      }
    }
  }

  private openConfirm(title: string, onYes: () => void): void {
    this.confirm = { title, onYes };
  }

  private activatePauseOption(): void {
    const i = this.pauseIndex;
    if (i === 0) {
      this.screen = 'playing';
      logTelemetry('resume', { level: this.sim.level });
    }
    if (i === 1) {
      this.openConfirm('Quit to main menu?', () => this.quitToMenu());
    }
    if (i === 2) {
      this.openConfirm('Restart current level?', () => {
        this.sim.restartLevelPreserveLives();
        this.screen = 'playing';
      });
    }
    if (i === 3) {
      this.openConfirm('Restart from level 1?', () => {
        this.sim.restartFromLevel1();
        this.screen = 'playing';
      });
    }
  }

  private quitToMenu(): void {
    this.sim.clearLevelEntities();
    this.screen = 'menu';
    this.confirm = null;
  }
}

import './style.css';
import { ArcadeApp } from './game/arcadeApp';

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) throw new Error('#app missing');

const secure = window.isSecureContext;
if (!secure) {
  const b = document.createElement('div');
  b.id = 'http-banner';
  b.textContent = 'HTTP MODE — local static hosting without TLS';
  appRoot.prepend(b);
}

appRoot.innerHTML = `
  <div class="shell">
    <canvas id="game" width="1280" height="720" tabindex="0"></canvas>
    <p class="hint">Click the playfield to focus · F1 debug overlay</p>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('canvas missing');

const game = new ArcadeApp(canvas);
canvas.addEventListener('pointerdown', () => game.focus());
game.focus();
game.startLoop();

// Renders the four power-up tokens with the real `drawPowerUp` (bundled from src/) in
// headless Chromium and writes the F23 AC6(b) evidence images to docs/mobile/tests/screenshots.
// Files 1-4 are 1:1 crops (one image pixel per rendered pixel, no scaling or smoothing);
// the 8x sheet is a vector re-render for humans and is not evidence for AC6(b).
// Usage: node scripts/render-powerup-tokens.mjs [suffix]   (default suffix "r5")
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs', 'mobile', 'tests', 'screenshots');
const suffix = process.argv[2] ?? 'r5';
const TYPES = ['HIT_POWER', 'SPEED', 'SHIELD', 'PERMANENT_MULTIPLIER'];
const POWERUP_RADIUS = 12;
const BACKGROUND = '#0b0b1a';
const PAD = 6;

const bundle = await build({
  entryPoints: [path.join(root, 'src/render/shapes.ts')],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'shapes',
});
const script = bundle.outputFiles[0].text;

/** A sheet: four tokens in a row, each `diameter` device px across, drawn at `scale`. */
const sheets = [
  { name: `f23_tokens_13dp_at_2x_${suffix}.png`, diameter: 26, scale: 1, gray: false },
  { name: `f23_tokens_13dp_at_2x_gray_${suffix}.png`, diameter: 26, scale: 1, gray: true },
  { name: `f23_tokens_24px_${suffix}.png`, diameter: 24, scale: 1, gray: false },
  { name: `f23_tokens_24px_gray_${suffix}.png`, diameter: 24, scale: 1, gray: true },
  { name: `f23_tokens_magnified_8x_${suffix}.png`, diameter: 24, scale: 8, gray: false },
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const sheet of sheets) {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    await page.setContent(
      `<body style="margin:0;background:${BACKGROUND}"><canvas id="c" style="display:block"></canvas></body>`,
    );
    await page.addScriptTag({ content: script });
    const size = await page.evaluate(
      ({ types, radius, sheet, pad, bg }) => {
        const cell = (sheet.diameter + pad * 2) * sheet.scale;
        const canvas = document.getElementById('c');
        canvas.width = cell * types.length;
        canvas.height = cell;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        types.forEach((type, i) => {
          ctx.save();
          ctx.translate(cell * i + cell / 2, cell / 2);
          ctx.scale(
            (sheet.diameter / (radius * 2)) * sheet.scale,
            (sheet.diameter / (radius * 2)) * sheet.scale,
          );
          // The token is drawn by the shared function at the real POWERUP_RADIUS.
          // eslint-disable-next-line no-undef
          shapes.drawPowerUp(ctx, 0, 0, radius, type);
          ctx.restore();
        });
        if (sheet.gray) canvas.style.filter = 'grayscale(1)';
        return { w: canvas.width, h: canvas.height };
      },
      { types: TYPES, radius: POWERUP_RADIUS, sheet, pad: PAD, bg: BACKGROUND },
    );
    await page.setViewportSize({ width: size.w, height: size.h });
    await page.screenshot({
      path: path.join(outDir, sheet.name),
      clip: { x: 0, y: 0, width: size.w, height: size.h },
    });
    await page.close();
    console.log(`${sheet.name} ${size.w}x${size.h}`);
  }
} finally {
  await browser.close();
}

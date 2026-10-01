// Implements design-review-round3.md F2 (mobile UX): the arrows and pause bars on the
// touch buttons are drawn shapes, not text. Bare ASCII punctuation (`<`, `>`, `II`) read
// as comparison operators and a Roman numeral, and the pictographic Unicode set rendered
// as nothing on some WebViews (code-review-round3). Inline SVG has no font dependency, so
// it is safe on every WebView. Built with createElementNS only (no innerHTML - binding
// constraint L4b); colour comes from `currentColor` so the button's CSS still drives it.

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  return el;
}

function svgRoot(className: string): SVGSVGElement {
  return svgElement('svg', {
    viewBox: '0 0 24 24',
    class: className,
    focusable: 'false',
    'aria-hidden': 'true',
  });
}

/** A solid triangle pointing left or right, vertically centred in the 24-unit box. */
export function createArrowGlyph(direction: 'left' | 'right'): SVGSVGElement {
  const svg = svgRoot('touch-glyph-svg');
  const points = direction === 'left' ? '18,3 5,12 18,21' : '6,3 19,12 6,21';
  svg.append(svgElement('polygon', { points, fill: 'currentColor' }));
  return svg;
}

/** Two rounded vertical bars: the universal pause icon. */
export function createPauseGlyph(): SVGSVGElement {
  const svg = svgRoot('touch-glyph-svg');
  const bar = (x: string): SVGRectElement =>
    svgElement('rect', { x, y: '3', width: '6', height: '18', rx: '1.5', fill: 'currentColor' });
  svg.append(bar('5'), bar('13'));
  return svg;
}

// code-review-round15 M2: the THROW/WAIT label is SVG text with a fixed `textLength`, so
// its width is the same at any system font scale. As CSS text, "THROW" at 13px bold was
// 51.6 px wide at the default font and 66.3 px at the 130% WebView text-zoom cap, wider
// than the 52 px padding box of the 56dp button (56 - 2 x 2 px border; the default
// `padding: 1px 6px` leaves a 40 px content box, which the 44 px SVG overflows by 2 px per
// side while staying inside the padding box). 13 user units bold is the 12 sp floor.
const WORD_VIEWBOX_WIDTH = 44;
const WORD_VIEWBOX_HEIGHT = 20;
const WORD_BASELINE_Y = 15;
// Fixed advance widths (user units) per label: about 15% tighter for THROW (51.6 -> 44 px)
// and about 7% for WAIT than the natural 13px bold width, and never wider than the viewBox.
const WORD_TEXT_LENGTHS: Record<string, number> = { THROW: 44, WAIT: 32 };

/** Sets the label of a glyph made by `createWordGlyph`, keeping its fixed width. */
export function setWordGlyph(svg: SVGSVGElement, word: string): void {
  const text = svg.querySelector('text');
  if (!text) return;
  text.textContent = word;
  text.setAttribute('textLength', String(WORD_TEXT_LENGTHS[word] ?? WORD_VIEWBOX_WIDTH));
}

/** A short bold word drawn as SVG text of a fixed width (see the note above). */
export function createWordGlyph(word: string): SVGSVGElement {
  const svg = svgElement('svg', {
    viewBox: `0 0 ${WORD_VIEWBOX_WIDTH} ${WORD_VIEWBOX_HEIGHT}`,
    class: 'touch-glyph-svg touch-glyph-word',
    focusable: 'false',
    'aria-hidden': 'true',
  });
  svg.append(
    svgElement('text', {
      x: String(WORD_VIEWBOX_WIDTH / 2),
      y: String(WORD_BASELINE_Y),
      'text-anchor': 'middle',
      'font-size': '13',
      'font-weight': '700',
      'font-family': 'inherit',
      lengthAdjust: 'spacingAndGlyphs',
      fill: 'currentColor',
    }),
  );
  setWordGlyph(svg, word);
  return svg;
}

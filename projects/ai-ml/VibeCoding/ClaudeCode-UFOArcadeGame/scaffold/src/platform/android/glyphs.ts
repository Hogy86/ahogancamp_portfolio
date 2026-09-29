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

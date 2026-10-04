// Tests PRD addendum v5 r5 F23 AC1-AC4, AC6(a) and AC7 (source search): the four power-up
// glyphs (fist, rabbit, circle, capital X) drawn by `drawPowerUp`. AC5/AC8-AC10 are not
// geometry and are covered elsewhere (existing gameplay suites) or listed in
// docs/mobile/tests/manual-only-criteria.md (AC6(b), AC4.2(d), Q-v5-1). jsdom has no real 2D
// canvas, so the tests run the real exported function against a recording 2D-context stub that
// logs every path call with the style in force, then check the recorded geometry (not pixels).
// Every case runs at r = 12 and r = 20 to prove the glyphs scale with the radius (F23 preamble).
// The r5 fist and rabbit rules are asserted as written, one test per numbered item.

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { drawPowerUp } from './shapes';
import { LEVEL_INTRO_TEXT_COLOR } from '../config/constants';
import type { PowerUpType } from '../core/types';

type Pt = { x: number; y: number };
type Op =
  | { op: 'beginPath' | 'closePath' }
  | { op: 'moveTo' | 'lineTo'; x: number; y: number }
  | { op: 'quadraticCurveTo'; cx: number; cy: number; x: number; y: number }
  | { op: 'bezierCurveTo'; c1: Pt; c2: Pt; x: number; y: number }
  | { op: 'arc' | 'ellipse'; x: number; y: number; rx: number; ry: number; full: boolean }
  | { op: 'fill' | 'stroke'; fillStyle: string; strokeStyle: string; lineWidth: number };

const TYPES: PowerUpType[] = ['HIT_POWER', 'SPEED', 'SHIELD', 'PERMANENT_MULTIPLIER'];
const RADII = [12, 20];

/** Runs drawPowerUp at the origin and returns every recorded path/paint call. */
function record(type: PowerUpType, r: number): Op[] {
  const ops: Op[] = [];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    save: () => undefined,
    restore: () => undefined,
    translate: () => undefined,
    beginPath: () => ops.push({ op: 'beginPath' }),
    closePath: () => ops.push({ op: 'closePath' }),
    moveTo: (x: number, y: number) => ops.push({ op: 'moveTo', x, y }),
    lineTo: (x: number, y: number) => ops.push({ op: 'lineTo', x, y }),
    quadraticCurveTo: (cx: number, cy: number, x: number, y: number) =>
      ops.push({ op: 'quadraticCurveTo', cx, cy, x, y }),
    bezierCurveTo: (x1: number, y1: number, x2: number, y2: number, x: number, y: number) =>
      ops.push({ op: 'bezierCurveTo', c1: { x: x1, y: y1 }, c2: { x: x2, y: y2 }, x, y }),
    arc: (x: number, y: number, rad: number, a0: number, a1: number) =>
      ops.push({
        op: 'arc',
        x,
        y,
        rx: rad,
        ry: rad,
        full: Math.abs(a1 - a0) >= 2 * Math.PI - 1e-9,
      }),
    ellipse: (x: number, y: number, rx: number, ry: number, _rot: number, a0: number, a1: number) =>
      ops.push({ op: 'ellipse', x, y, rx, ry, full: Math.abs(a1 - a0) >= 2 * Math.PI - 1e-9 }),
    fill() {
      ops.push({
        op: 'fill',
        fillStyle: this.fillStyle,
        strokeStyle: this.strokeStyle,
        lineWidth: this.lineWidth,
      });
    },
    stroke() {
      ops.push({
        op: 'stroke',
        fillStyle: this.fillStyle,
        strokeStyle: this.strokeStyle,
        lineWidth: this.lineWidth,
      });
    },
  };
  drawPowerUp(ctx as unknown as CanvasRenderingContext2D, 0, 0, r, type);
  return ops;
}

/** Splits the calls into the shared ring/disc (up to and including the first stroke) and
 * the glyph (everything after it). */
function split(ops: Op[]): { ring: Op[]; glyph: Op[] } {
  const firstStroke = ops.findIndex((o) => o.op === 'stroke');
  return { ring: ops.slice(0, firstStroke + 1), glyph: ops.slice(firstStroke + 1) };
}

/** Every point the glyph touches, in units of r, including curve control points and the
 * four extreme points of each circle/ellipse. */
function allPoints(glyph: Op[], r: number): Pt[] {
  const pts: Pt[] = [];
  for (const o of glyph) {
    if (o.op === 'moveTo' || o.op === 'lineTo') pts.push({ x: o.x, y: o.y });
    else if (o.op === 'quadraticCurveTo') pts.push({ x: o.cx, y: o.cy }, { x: o.x, y: o.y });
    else if (o.op === 'bezierCurveTo') pts.push(o.c1, o.c2, { x: o.x, y: o.y });
    else if (o.op === 'arc' || o.op === 'ellipse') {
      pts.push(
        { x: o.x - o.rx, y: o.y },
        { x: o.x + o.rx, y: o.y },
        { x: o.x, y: o.y - o.ry },
        { x: o.x, y: o.y + o.ry },
      );
    }
  }
  return pts.map((p) => ({ x: p.x / r, y: p.y / r }));
}

/** Splits glyph calls into subpaths (each moveTo starts one) and flattens curves; result is
 * in units of r. `closed` is true when the subpath ended with closePath. */
type SubPath = {
  pts: Pt[];
  closed: boolean;
  /** src[i] is what drew the segment that ENDS at pts[i] ('curve' or 'line'; src[0] is the
   * moveTo). closeSrc is what drew the closing segment from the last point back to pts[0]. */
  src: ('move' | 'line' | 'curve')[];
  closeSrc: 'line' | 'curve';
};
function subpaths(glyph: Op[], r: number): SubPath[] {
  const out: SubPath[] = [];
  let cur: SubPath | null = null;
  const last = (): Pt => cur!.pts[cur!.pts.length - 1]!;
  for (const o of glyph) {
    if (o.op === 'moveTo') {
      cur = { pts: [{ x: o.x / r, y: o.y / r }], closed: false, src: ['move'], closeSrc: 'line' };
      out.push(cur);
    } else if (o.op === 'lineTo' && cur) {
      cur.pts.push({ x: o.x / r, y: o.y / r });
      cur.src.push('line');
    } else if (o.op === 'quadraticCurveTo' && cur) {
      const p0 = last();
      const c = { x: o.cx / r, y: o.cy / r };
      const p2 = { x: o.x / r, y: o.y / r };
      for (let i = 1; i <= 16; i += 1) {
        const t = i / 16;
        const u = 1 - t;
        cur.pts.push({
          x: u * u * p0.x + 2 * u * t * c.x + t * t * p2.x,
          y: u * u * p0.y + 2 * u * t * c.y + t * t * p2.y,
        });
        cur.src.push('curve');
      }
    } else if (o.op === 'bezierCurveTo' && cur) {
      const p0 = last();
      const c1 = { x: o.c1.x / r, y: o.c1.y / r };
      const c2 = { x: o.c2.x / r, y: o.c2.y / r };
      const p3 = { x: o.x / r, y: o.y / r };
      for (let i = 1; i <= 16; i += 1) {
        const t = i / 16;
        const u = 1 - t;
        cur.pts.push({
          x: u ** 3 * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * p3.x,
          y: u ** 3 * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * p3.y,
        });
        cur.src.push('curve');
      }
    } else if (o.op === 'closePath' && cur) {
      cur.closed = true;
      // A final point equal to the start is the same vertex, not an extra one.
      const first = cur.pts[0]!;
      const end = last();
      if (cur.pts.length > 1 && Math.hypot(end.x - first.x, end.y - first.y) < 1e-12) {
        cur.pts.pop();
        const popped = cur.src.pop();
        if (popped === 'curve') cur.closeSrc = 'curve';
      }
    }
  }
  return out;
}

type Seg = [Pt, Pt];
function segments(pts: Pt[], closed: boolean): Seg[] {
  const segs: Seg[] = [];
  for (let i = 0; i + 1 < pts.length; i += 1) segs.push([pts[i]!, pts[i + 1]!]);
  if (closed) segs.push([pts[pts.length - 1]!, pts[0]!]);
  return segs;
}

function orient(a: Pt, b: Pt, c: Pt): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
function onSegment(a: Pt, b: Pt, p: Pt): boolean {
  return (
    Math.min(a.x, b.x) - 1e-9 <= p.x &&
    p.x <= Math.max(a.x, b.x) + 1e-9 &&
    Math.min(a.y, b.y) - 1e-9 <= p.y &&
    p.y <= Math.max(a.y, b.y) + 1e-9
  );
}
/** True if the two segments share any point (proper crossing, touch or overlap). */
function segmentsMeet([a, b]: Seg, [c, d]: Seg): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (o1 * o2 < 0 && o3 * o4 < 0) return true;
  const eps = 1e-12;
  return (
    (Math.abs(o1) < eps && onSegment(a, b, c)) ||
    (Math.abs(o2) < eps && onSegment(a, b, d)) ||
    (Math.abs(o3) < eps && onSegment(c, d, a)) ||
    (Math.abs(o4) < eps && onSegment(c, d, b))
  );
}

/** F23 AC1(a): no two outline segments meet other than neighbours at their shared endpoint. */
function isSimpleClosedCurve(pts: Pt[]): boolean {
  const segs = segments(pts, true);
  const n = segs.length;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const neighbours = j === i + 1 || (i === 0 && j === n - 1);
      if (!neighbours && segmentsMeet(segs[i]!, segs[j]!)) return false;
    }
  }
  return true;
}

function bbox(pts: Pt[]): { minX: number; maxX: number; minY: number; maxY: number } {
  return {
    minX: Math.min(...pts.map((p) => p.x)),
    maxX: Math.max(...pts.map((p) => p.x)),
    minY: Math.min(...pts.map((p) => p.y)),
    maxY: Math.max(...pts.map((p) => p.y)),
  };
}

/** Horizontal extent of the closed outline at height y (min/max x over the edges hitting y). */
function widthAt(pts: Pt[], y: number): number {
  const xs: number[] = [];
  for (const [a, b] of segments(pts, true)) {
    if ((a.y <= y && y <= b.y) || (b.y <= y && y <= a.y)) {
      if (a.y === b.y) xs.push(a.x, b.x);
      else xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
    }
  }
  return xs.length === 0 ? 0 : Math.max(...xs) - Math.min(...xs);
}

type Bump = { x: number; y: number; prominence: number };
/** Bumps on the top edge: local maxima of the upper envelope of the outline. A bump's
 * prominence is its height above the higher of the two valleys between it and the
 * neighbouring bumps (or the outline's ends). Units of r. */
function topBumps(pts: Pt[]): Bump[] {
  const { minX, maxX } = bbox(pts);
  const N = 800;
  const segs = segments(pts, true);
  const h: number[] = [];
  for (let i = 0; i <= N; i += 1) {
    const x = minX + ((maxX - minX) * i) / N;
    let top = -Infinity;
    for (const [a, b] of segs) {
      if ((a.x <= x && x <= b.x) || (b.x <= x && x <= a.x)) {
        const y = a.x === b.x ? Math.min(a.y, b.y) : a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
        top = Math.max(top, -y);
      }
    }
    h.push(top);
  }
  const peaks: number[] = [];
  for (let i = 1; i < N; i += 1) {
    if (h[i]! > h[i - 1]! && h[i]! >= h[i + 1]!) peaks.push(i);
  }
  // Prominence is measured against the valleys to the neighbouring peaks (or the outline's
  // ends), so equal-height knuckles all get their own local height, not the global low.
  const bumps: Bump[] = peaks.map((i, k) => {
    const lowestBetween = (from: number, to: number): number => Math.min(...h.slice(from, to + 1));
    const leftBase = lowestBetween(peaks[k - 1] ?? 0, i);
    const rightBase = lowestBetween(i, peaks[k + 1] ?? N);
    return {
      x: minX + ((maxX - minX) * i) / N,
      y: -h[i]!,
      prominence: h[i]! - Math.max(leftBase, rightBase),
    };
  });
  return bumps;
}

/** Highest outline point (smallest y) at x, or Infinity if the outline does not reach x. */
function upperY(pts: Pt[], x: number): number {
  let top = Infinity;
  for (const [a, b] of segments(pts, true)) {
    if ((a.x <= x && x <= b.x) || (b.x <= x && x <= a.x)) {
      const y = a.x === b.x ? Math.min(a.y, b.y) : a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
      top = Math.min(top, y);
    }
  }
  return top;
}

/** Lowest outline point (largest y) at x, or -Infinity if the outline does not reach x. */
function lowerY(pts: Pt[], x: number): number {
  let bottom = -Infinity;
  for (const [a, b] of segments(pts, true)) {
    if ((a.x <= x && x <= b.x) || (b.x <= x && x <= a.x)) {
      const y = a.x === b.x ? Math.max(a.y, b.y) : a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
      bottom = Math.max(bottom, y);
    }
  }
  return bottom;
}

/** Filled runs [x0, x1] of the closed outline on the horizontal line at height y
 * (even-odd pairing of the sorted crossings). */
function runsAt(pts: Pt[], y: number): [number, number][] {
  const xs: number[] = [];
  for (const [a, b] of segments(pts, true)) {
    if (a.y !== b.y && ((a.y <= y && y < b.y) || (b.y <= y && y < a.y))) {
      xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
    }
  }
  xs.sort((p, q) => p - q);
  const runs: [number, number][] = [];
  for (let i = 0; i + 1 < xs.length; i += 2) runs.push([xs[i]!, xs[i + 1]!]);
  return runs;
}

/** Leftmost and rightmost x of the outline on the horizontal line at height y. */
function sideEdgesAt(pts: Pt[], y: number): { left: number; right: number } | null {
  const runs = runsAt(pts, y);
  if (runs.length === 0) return null;
  return { left: runs[0]![0], right: runs[runs.length - 1]![1] };
}

function distToSegment(p: Pt, [a, b]: Seg): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Radius of the largest disc centred at c that stays inside the outline (0 if c is outside). */
function insideRadius(pts: Pt[], c: Pt): number {
  const inside = runsAt(pts, c.y).some(([x0, x1]) => x0 <= c.x && c.x <= x1);
  if (!inside) return 0;
  return Math.min(...segments(pts, true).map((s) => distToSegment(c, s)));
}

const sampleRange = (from: number, to: number, n: number): number[] =>
  Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);

/** The rabbit's landmarks per F23 r5 AC4.2, located on the flattened outline. Points are
 * mirrored if needed so the head end is at +x (the spec allows facing left or right). */
function rabbitLandmarks(raw: Pt[]) {
  const first = bbox(raw);
  const tips0 = topBumps(raw).filter((b) => b.prominence >= 0.3);
  const headRight =
    tips0.length === 0 ||
    tips0.reduce((s, b) => s + b.x, 0) / tips0.length >= (first.minX + first.maxX) / 2;
  const pts = headRight ? raw : raw.map((p) => ({ x: -p.x, y: p.y }));
  const box = bbox(pts);
  const W = box.maxX - box.minX;
  const H = box.maxY - box.minY;
  const centreX = (box.minX + box.maxX) / 2;
  const bumps = topBumps(pts);
  const ears = bumps.filter((b) => b.prominence >= 0.3).sort((p, q) => p.x - q.x);
  // L2 (code-review-round19): with any ear count other than 2 this must not throw, because
  // it runs while the describe body is collected (the whole file would report no tests).
  // The degenerate fallback lets AC4.2(b)1 fail with a normal assertion on the ear count.
  const fallback: Bump = bumps[0] ?? { x: 0, y: 0, prominence: 0 };
  const rear: Bump = ears[0] ?? fallback;
  const front: Bump = ears[1] ?? rear;
  const between = sampleRange(rear.x, front.x, 400);
  const V = { x: 0, y: -Infinity };
  for (const x of between) {
    const y = upperY(pts, x);
    if (y > V.y) {
      V.x = x;
      V.y = y;
    }
  }
  const rump = bumps.filter((b) => b.x < rear.x).sort((p, q) => p.y - q.y)[0] ?? fallback;
  const N = { x: 0, y: -Infinity };
  for (const x of sampleRange(rump.x, rear.x, 400)) {
    const y = upperY(pts, x);
    if (y > N.y) {
      N.x = x;
      N.y = y;
    }
  }
  const E = V.y - Math.max(rear.y, front.y);
  /** Width and midpoint of the run of the outline that holds the given ear at `frac` * E
   * above the valley V. */
  const earSlice = (ear: Bump, frac: number) => {
    const y = V.y - frac * E;
    const runs = runsAt(pts, y);
    const run = runs.sort(
      (p, q) => Math.abs((p[0] + p[1]) / 2 - ear.x) - Math.abs((q[0] + q[1]) / 2 - ear.x),
    )[0]!;
    return { y, x0: run[0], x1: run[1], width: run[1] - run[0], mid: (run[0] + run[1]) / 2 };
  };
  return {
    pts,
    mirrored: !headRight,
    box,
    W,
    H,
    centreX,
    bumps,
    ears,
    rear,
    front,
    V,
    N,
    R: rump,
    E,
    earSlice,
  };
}

/** F23 AC6(a): a glyph's recorded path reduced to the signature columns of the table. */
function signature(glyph: Op[], r: number): Record<PowerUpType, boolean> {
  const fills = glyph.filter((o) => o.op === 'fill').length;
  const strokes = glyph.filter((o) => o.op === 'stroke').length;
  const arcs = glyph.filter((o) => o.op === 'arc' || o.op === 'ellipse');
  const lines = glyph.filter((o) => o.op === 'lineTo').length;
  const paths = subpaths(glyph, r);
  const bumps = paths.length === 1 ? topBumps(paths[0]!.pts) : [];
  const knuckles = bumps.filter((b) => b.prominence >= 0.06 && b.prominence <= 0.22);
  const ears = bumps.filter((b) => b.prominence >= 0.3);
  const closedOutline = paths.length === 1 && paths[0]!.closed;
  // Both ears are rooted in the head half: the midpoint of each at 0.25E is past the box centre.
  const earsInHead =
    ears.length === 2 &&
    (() => {
      const m = rabbitLandmarks(paths[0]!.pts);
      return m.ears.every((e) => m.earSlice(e, 0.25).mid > m.centreX);
    })();
  return {
    HIT_POWER:
      fills === 1 &&
      strokes === 0 &&
      closedOutline &&
      ears.length === 0 &&
      bumps.length === knuckles.length &&
      knuckles.length >= 3 &&
      knuckles.length <= 4,
    SPEED: fills === 1 && strokes === 0 && closedOutline && ears.length === 2 && earsInHead,
    SHIELD: fills === 0 && strokes === 1 && arcs.length === 1 && lines === 0,
    PERMANENT_MULTIPLIER:
      fills === 0 && strokes === 1 && arcs.length === 0 && lines === 2 && paths.length === 2,
  };
}

describe.each(RADII)('F23 power-up glyphs at r = %d', (r) => {
  const glyphOf = (t: PowerUpType): Op[] => split(record(t, r)).glyph;

  describe('AC2: ring and disc are identical for all four types', () => {
    it('draws the same arc, fill and ring stroke before any glyph call', () => {
      const rings = TYPES.map((t) => split(record(t, r)).ring);
      for (const ring of rings) expect(ring).toEqual(rings[0]);
      expect(rings[0]).toEqual([
        { op: 'beginPath' },
        { op: 'arc', x: 0, y: 0, rx: r, ry: r, full: true },
        { op: 'fill', fillStyle: 'rgba(20, 20, 30, 0.85)', strokeStyle: '', lineWidth: 1 },
        {
          op: 'stroke',
          fillStyle: 'rgba(20, 20, 30, 0.85)',
          strokeStyle: LEVEL_INTRO_TEXT_COLOR,
          lineWidth: 2,
        },
      ]);
    });
  });

  describe('AC1: no unintended crossing strokes, no "+"', () => {
    it.each(['HIT_POWER', 'SPEED'] as const)('%s is one closed simple curve', (t) => {
      const paths = subpaths(glyphOf(t), r);
      expect(paths).toHaveLength(1);
      expect(paths[0]!.closed).toBe(true);
      expect(isSimpleClosedCurve(paths[0]!.pts)).toBe(true);
    });

    it('SHIELD is exactly one full circle and nothing else', () => {
      const g = glyphOf('SHIELD').filter((o) => o.op !== 'beginPath');
      expect(g.map((o) => o.op)).toEqual(['arc', 'stroke']);
      const arc = g[0] as Extract<Op, { op: 'arc' | 'ellipse' }>;
      expect(arc.full).toBe(true);
      expect(arc.rx).toBe(arc.ry);
    });

    it('PERMANENT_MULTIPLIER is two segments crossing once, at the center', () => {
      const paths = subpaths(glyphOf('PERMANENT_MULTIPLIER'), r);
      expect(paths.map((p) => p.pts.length)).toEqual([2, 2]);
      const [s1, s2] = paths.map((p) => segments(p.pts, false)[0]!) as [Seg, Seg];
      expect(segmentsMeet(s1, s2)).toBe(true);
      // Proper crossing point of the two lines:
      const [a, b] = s1;
      const [c, d] = s2;
      const t = orient(c, d, a) / (orient(c, d, a) - orient(c, d, b));
      const x = a.x + t * (b.x - a.x);
      const y = a.y + t * (b.y - a.y);
      expect(Math.abs(x)).toBeLessThanOrEqual(0.05);
      expect(Math.abs(y)).toBeLessThanOrEqual(0.05);
    });

    it.each(TYPES)('%s has no horizontal and vertical segment crossing in their interiors', (t) => {
      const segs = subpaths(glyphOf(t), r).flatMap((p) => segments(p.pts, p.closed));
      // Spec Terminology: horizontal is |dy| <= 0.02r, vertical is |dx| <= 0.02r (points are
      // already in units of r).
      const horizontal = segs.filter(([a, b]) => Math.abs(a.y - b.y) <= 0.02);
      const vertical = segs.filter(([a, b]) => Math.abs(a.x - b.x) <= 0.02);
      const interior = (s: Seg, p: Pt): boolean =>
        Math.hypot(p.x - s[0].x, p.y - s[0].y) > 1e-6 &&
        Math.hypot(p.x - s[1].x, p.y - s[1].y) > 1e-6;
      for (const h of horizontal) {
        for (const v of vertical) {
          // Real intersection point (the segments are only near-axis-aligned, so it is not
          // simply (v.x, h.y)). Parallel/degenerate pairs cannot "+" cross.
          const den = orient(h[0], h[1], v[0]) - orient(h[0], h[1], v[1]);
          if (Math.abs(den) < 1e-12) continue;
          const tt = orient(h[0], h[1], v[0]) / den;
          const meet = {
            x: v[0].x + tt * (v[1].x - v[0].x),
            y: v[0].y + tt * (v[1].y - v[0].y),
          };
          expect(segmentsMeet(h, v) && interior(h, meet) && interior(v, meet)).toBe(false);
        }
      }
    });
  });

  describe('AC3: style and bound', () => {
    it.each(['HIT_POWER', 'SPEED'] as const)('%s has exactly one fill in the glyph color', (t) => {
      const paints = glyphOf(t).filter((o) => o.op === 'fill' || o.op === 'stroke');
      const fills = paints.filter((o) => o.op === 'fill');
      expect(fills).toHaveLength(1);
      for (const p of paints) {
        const style = p as Extract<Op, { op: 'fill' | 'stroke' }>;
        expect(style.op === 'fill' ? style.fillStyle : style.strokeStyle).toBe(
          LEVEL_INTRO_TEXT_COLOR,
        );
        if (style.op === 'stroke') expect(style.lineWidth).toBe(2);
      }
    });

    it.each(['SHIELD', 'PERMANENT_MULTIPLIER'] as const)('%s is stroke-only, width 2', (t) => {
      const paints = glyphOf(t).filter((o) => o.op === 'fill' || o.op === 'stroke');
      expect(paints).toHaveLength(1);
      expect(paints[0]).toEqual({
        op: 'stroke',
        fillStyle: LEVEL_INTRO_TEXT_COLOR,
        strokeStyle: LEVEL_INTRO_TEXT_COLOR,
        lineWidth: 2,
      });
    });

    it.each(['HIT_POWER', 'SPEED'] as const)('%s has no holes (one subpath)', (t) => {
      expect(subpaths(glyphOf(t), r)).toHaveLength(1);
    });

    it.each(['SHIELD', 'PERMANENT_MULTIPLIER'] as const)(
      '%s keeps every point within +-0.45r',
      (t) => {
        const pts = allPoints(glyphOf(t), r);
        expect(pts.length).toBeGreaterThan(0);
        for (const p of pts) {
          expect(Math.abs(p.x)).toBeLessThanOrEqual(0.45 + 1e-9);
          expect(Math.abs(p.y)).toBeLessThanOrEqual(0.45 + 1e-9);
        }
      },
    );

    // AC3(d) (r5): filled glyphs get a larger box, but stay out of the ring's corners.
    describe.each(['HIT_POWER', 'SPEED'] as const)('%s filled-glyph bound', (t) => {
      it('keeps every recorded point (incl. control points) within +-0.65r', () => {
        const pts = allPoints(glyphOf(t), r);
        for (const p of pts) {
          expect(Math.abs(p.x)).toBeLessThanOrEqual(0.65 + 1e-9);
          expect(Math.abs(p.y)).toBeLessThanOrEqual(0.65 + 1e-9);
        }
      });
      it('keeps every flattened-outline point within 0.75r of the center', () => {
        for (const p of subpaths(glyphOf(t), r)[0]!.pts) {
          expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(0.75 + 1e-9);
        }
      });
      it('leaves a visible dark gap of at least 2.0 px to the ring at r = 12', () => {
        // The check is defined at r = 12; the glyph scales with r, so d in units of r is
        // the same at both radii and is evaluated at 12. No optional stroke is used (s = 0).
        const d = Math.max(...subpaths(glyphOf(t), r)[0]!.pts.map((p) => Math.hypot(p.x, p.y)));
        const gapAt12 = 12 - 1 - d * 12 - 0;
        expect(gapAt12).toBeGreaterThanOrEqual(2.0 - 1e-9);
      });
    });
  });

  describe('AC4.1: HIT_POWER is a fist (r5)', () => {
    const pts = subpaths(glyphOf('HIT_POWER'), r)[0]!.pts;
    it('(a) has a 1.0r-1.3r by 0.8r-1.2r box centered on the token', () => {
      const b = bbox(pts);
      expect(b.maxX - b.minX).toBeGreaterThanOrEqual(1.0);
      expect(b.maxX - b.minX).toBeLessThanOrEqual(1.3);
      expect(b.maxY - b.minY).toBeGreaterThanOrEqual(0.8);
      expect(b.maxY - b.minY).toBeLessThanOrEqual(1.2);
      expect(Math.abs((b.minX + b.maxX) / 2)).toBeLessThanOrEqual(0.1);
      expect(Math.abs((b.minY + b.maxY) / 2)).toBeLessThanOrEqual(0.1);
    });
    it('(b) has 3-4 knuckle bumps on the top, 0.06r-0.22r high, none 0.3r, 0.17r apart', () => {
      // No floor: every local maximum counts, so a sub-0.06r bump fails instead of
      // being dropped before the count.
      const bumps = topBumps(pts);
      expect(bumps.length).toBeGreaterThanOrEqual(3);
      expect(bumps.length).toBeLessThanOrEqual(4);
      for (const b of bumps) {
        expect(b.y).toBeLessThan(0);
        expect(b.prominence).toBeGreaterThanOrEqual(0.06);
        expect(b.prominence).toBeLessThanOrEqual(0.22);
        expect(b.prominence).toBeLessThan(0.3);
      }
      const xs = bumps.map((b) => b.x).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i += 1)
        expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(0.17);
    });
    it('(c) has no forearm: width 0.12r above the lowest point is >= 0.6x the width at y=0', () => {
      const lowest = bbox(pts).maxY;
      expect(widthAt(pts, lowest - 0.12)).toBeGreaterThanOrEqual(0.6 * widthAt(pts, 0));
    });
    it('(d) stays inside 0.75r of the center (the AC3(d) bound, checked above)', () => {
      for (const p of pts) expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(0.75 + 1e-9);
    });
  });

  describe('AC4.2: SPEED is a side-view rabbit (r5)', () => {
    const rabbitPath = subpaths(glyphOf('SPEED'), r)[0]!;
    const raw = rabbitPath.pts;
    const m = rabbitLandmarks(raw);
    /** True when every outline segment that holds point p (within 1e-6r) was drawn by a curve
     * call (v3-round2 L4: a pointed tip made by a lineTo next to a curve must not pass). */
    const heldByCurve = (p: Pt): boolean => {
      const n = m.pts.length;
      const holding: ('move' | 'line' | 'curve')[] = [];
      for (let i = 0; i < n; i += 1) {
        const a = m.pts[i]!;
        const j = (i + 1) % n;
        const seg: Seg = [a, m.pts[j]!];
        if (distToSegment(p, seg) <= 1e-6) {
          holding.push(j === 0 ? rabbitPath.closeSrc : rabbitPath.src[j]!);
        }
      }
      return holding.length > 0 && holding.every((k) => k === 'curve');
    };
    const { pts, rear, front, V, N, R, E } = m;
    const eps = 1e-9;
    it('(a) has a 1.1r-1.3r by 0.9r-1.2r box, wider than tall, centered on the token', () => {
      expect(m.W).toBeGreaterThanOrEqual(1.1);
      expect(m.W).toBeLessThanOrEqual(1.3);
      expect(m.H).toBeGreaterThanOrEqual(0.9);
      expect(m.H).toBeLessThanOrEqual(1.2);
      expect(m.W).toBeGreaterThanOrEqual(m.H);
      expect(Math.abs(m.centreX)).toBeLessThanOrEqual(0.1);
      expect(Math.abs((m.box.minY + m.box.maxY) / 2)).toBeLessThanOrEqual(0.1);
    });

    describe('(b) ears: on the head, leaning back', () => {
      it('1. has exactly 2 top bumps of prominence >= 0.3r, the two highest points', () => {
        expect(m.ears).toHaveLength(2);
        const byHeight = [...m.bumps].sort((p, q) => p.y - q.y).slice(0, 2);
        expect(byHeight.map((b) => b.x).sort((p, q) => p - q)).toEqual(m.ears.map((b) => b.x));
      });
      it('2. has ear height 0.3r-0.55r and the lower tip 0.3r above the rump top', () => {
        expect(E).toBeGreaterThanOrEqual(0.3);
        expect(E).toBeLessThanOrEqual(0.55);
        expect(R.y - Math.max(rear.y, front.y)).toBeGreaterThanOrEqual(0.3);
      });
      it('3. has each ear 0.2r-0.3r wide at 0.25E and 0.12r-0.25r wide at 0.75E', () => {
        for (const ear of m.ears) {
          const base = m.earSlice(ear, 0.25).width;
          const near = m.earSlice(ear, 0.75).width;
          expect(base).toBeGreaterThanOrEqual(0.2 - eps);
          expect(base).toBeLessThanOrEqual(0.3 + eps);
          expect(near).toBeGreaterThanOrEqual(0.12 - eps);
          expect(near).toBeLessThanOrEqual(0.25 + eps);
        }
      });
      it('4. has a dark gap of >= 0.1r at 0.5E and >= 0.17r at 0.75E between the ears', () => {
        const gap = (frac: number): number =>
          m.earSlice(front, frac).x0 - m.earSlice(rear, frac).x1;
        expect(gap(0.5)).toBeGreaterThanOrEqual(0.1 - eps);
        expect(gap(0.75)).toBeGreaterThanOrEqual(0.17 - eps);
      });
      it('5. leans each ear back by 15-25 degrees from vertical', () => {
        for (const ear of m.ears) {
          const lowMid = m.earSlice(ear, 0.25).mid;
          const highMid = m.earSlice(ear, 0.75).mid;
          // The head is at +x, so "back" is toward -x: the higher midpoint is further back.
          const lean = (Math.atan2(lowMid - highMid, 0.5 * E) * 180) / Math.PI;
          expect(lean).toBeGreaterThanOrEqual(15);
          expect(lean).toBeLessThanOrEqual(25);
        }
      });
      it('6. rounds each tip with a curve call and has no flat-topped ear', () => {
        const curves = glyphOf('SPEED').filter(
          (o): o is Extract<Op, { op: 'bezierCurveTo' | 'quadraticCurveTo' }> =>
            o.op === 'bezierCurveTo' || o.op === 'quadraticCurveTo',
        );
        for (const ear of m.ears) {
          // L3: the curve end points are in the raw (unmirrored) frame, the ear in the mirrored one.
          const sign = m.mirrored ? -1 : 1;
          const nearTip = curves.some(
            (o) => Math.hypot((sign * o.x) / r - ear.x, o.y / r - ear.y) <= 0.15,
          );
          expect(nearTip).toBe(true);
          expect(
            heldByCurve({ x: ear.x, y: ear.y }),
            'the outline segment at the ear tip is a curve',
          ).toBe(true);
          for (const [a, b] of segments(pts, true)) {
            const horizontal = Math.abs(a.y - b.y) <= 0.02;
            const belowTip =
              Math.min(a.y, b.y) >= ear.y - 1e-9 && Math.max(a.y, b.y) <= ear.y + 0.05;
            const nearEar = Math.abs((a.x + b.x) / 2 - ear.x) <= 0.2;
            expect(horizontal && belowTip && nearEar && Math.abs(a.x - b.x) > 0.05).toBe(false);
          }
        }
      });
      it('7. roots both ears on the head, forward of the neck dip, tips in the head-end 0.6W', () => {
        for (const ear of m.ears) {
          const root = m.earSlice(ear, 0.25).mid;
          expect(root).toBeGreaterThan(m.centreX);
          expect(root).toBeGreaterThan(N.x);
          expect(ear.x).toBeGreaterThanOrEqual(m.box.maxX - 0.6 * m.W);
          expect(ear.x).toBeGreaterThan(R.x);
        }
      });
    });

    describe('(c) head, body, tail, legs', () => {
      it('1. has a head lump: a 0.3r disc forward of N and below V; nose-to-N 0.35r-0.65r', () => {
        let found = false;
        for (const x of sampleRange(N.x + 0.15, m.box.maxX - 0.15, 60)) {
          for (const y of sampleRange(V.y + 0.15, m.box.maxY - 0.15, 60)) {
            if (insideRadius(pts, { x, y }) >= 0.15 - eps) found = true;
          }
        }
        expect(found).toBe(true);
        expect(m.box.maxX - N.x).toBeGreaterThanOrEqual(0.35);
        expect(m.box.maxX - N.x).toBeLessThanOrEqual(0.65);
      });
      it('2. has a neck dip and a high rounded rump in the tail half', () => {
        expect(R.x).toBeLessThan(m.centreX);
        expect(N.y - R.y).toBeGreaterThanOrEqual(0.1);
        expect(N.y - R.y).toBeLessThanOrEqual(0.25);
        const curves = glyphOf('SPEED').filter(
          (o): o is Extract<Op, { op: 'bezierCurveTo' | 'quadraticCurveTo' }> =>
            o.op === 'bezierCurveTo' || o.op === 'quadraticCurveTo',
        );
        const sign = m.mirrored ? -1 : 1;
        expect(curves.some((o) => Math.hypot((sign * o.x) / r - R.x, o.y / r - R.y) <= 0.2)).toBe(
          true,
        );
        expect(
          heldByCurve({ x: R.x, y: R.y }),
          'the outline segment at the rump top is a curve',
        ).toBe(true);
      });
      it('3. keeps a horizontal body: below V it is >= 1.3x as wide as tall', () => {
        const b = bbox(pts.filter((p) => p.y >= V.y));
        expect((b.maxX - b.minX) / (b.maxY - b.minY)).toBeGreaterThanOrEqual(1.3);
      });
      it('4. has one small rounded tail bump 0.06r-0.15r behind the notch under it', () => {
        const footY = m.box.maxY;
        // Rear edge profile (leftmost x per height) from the rump top down to the foot line.
        const ys = sampleRange(R.y, footY - 0.02, 400);
        const left = ys.map((y) => sideEdgesAt(pts, y)!.left);
        let tail = 0;
        for (let i = 1; i < left.length; i += 1) if (left[i]! < left[tail]!) tail = i;
        // The notch is the first local maximum of the rear edge below the rearmost point.
        let notch = tail;
        while (notch + 1 < left.length && left[notch + 1]! >= left[notch]! - 1e-9) notch += 1;
        expect(notch).toBeGreaterThan(tail);
        // Below the notch the rear edge turns back out: a dent, not a plain slope.
        expect(Math.min(...left.slice(notch))).toBeLessThan(left[notch]! - 1e-6);
        expect(left[notch]! - left[tail]!).toBeGreaterThanOrEqual(0.06);
        expect(left[notch]! - left[tail]!).toBeLessThanOrEqual(0.15);
        expect(footY - ys[tail]!).toBeGreaterThanOrEqual(0.25);
      });
      it('5. has exactly one underside notch, 0.15r-0.3r deep, below mid-height', () => {
        const footY = m.box.maxY;
        const xs = sampleRange(m.box.minX, m.box.maxX, 600);
        const bottom = xs.map((x) => lowerY(pts, x));
        const grounded = xs.filter((_, i) => bottom[i]! >= footY - 0.03);
        const hindEnd = Math.min(...grounded);
        const frontEnd = Math.max(...grounded);
        // Walk the bottom edge between the outer ends of the two feet; each stretch lifted
        // clear of the foot line is one notch.
        const stretches: Pt[][] = [];
        let previous = false;
        xs.forEach((x, i) => {
          const lifted = x >= hindEnd && x <= frontEnd && bottom[i]! < footY - 0.03;
          if (lifted && !previous) stretches.push([]);
          if (lifted) stretches[stretches.length - 1]!.push({ x, y: bottom[i]! });
          previous = lifted;
        });
        expect(stretches).toHaveLength(1);
        const top = Math.min(...stretches[0]!.map((p) => p.y));
        const depth = footY - top;
        expect(depth).toBeGreaterThanOrEqual(0.15);
        expect(depth).toBeLessThanOrEqual(0.3);
        expect(top).toBeGreaterThan((m.box.minY + m.box.maxY) / 2);
        const atHalf = stretches[0]!.filter((p) => p.y <= footY - depth / 2);
        const widthHalf = Math.max(...atHalf.map((p) => p.x)) - Math.min(...atHalf.map((p) => p.x));
        expect(widthHalf).toBeGreaterThanOrEqual(0.15);
      });
      it('6. stands on exactly two feet on one line, one in each half, 0.15r-0.4r long', () => {
        const footY = m.box.maxY;
        const down = sampleRange(m.box.minX, m.box.maxX, 1200).filter(
          (x) => lowerY(pts, x) >= footY - 0.03,
        );
        const feet: number[][] = [];
        down.forEach((x, i) => {
          if (i === 0 || x - down[i - 1]! > 0.01) feet.push([]);
          feet[feet.length - 1]!.push(x);
        });
        expect(feet).toHaveLength(2);
        const [hind, fore] = feet as [number[], number[]];
        expect(Math.max(...hind)).toBeLessThan(m.centreX);
        expect(Math.min(...fore)).toBeGreaterThan(m.centreX);
        for (const run of feet) {
          const len = Math.max(...run) - Math.min(...run);
          expect(len).toBeGreaterThanOrEqual(0.15);
          expect(len).toBeLessThanOrEqual(0.4);
        }
        const lowest = (run: number[]): number => Math.max(...run.map((x) => lowerY(pts, x)));
        expect(Math.abs(lowest(hind) - lowest(fore))).toBeLessThanOrEqual(0.05);
      });
    });
  });

  describe('AC4.3: SHIELD is a small circle', () => {
    it('is centered, radius 0.25r-0.35r', () => {
      const arc = glyphOf('SHIELD').find((o) => o.op === 'arc') as Extract<
        Op,
        { op: 'arc' | 'ellipse' }
      >;
      expect(Math.abs(arc.x / r)).toBeLessThanOrEqual(0.03);
      expect(Math.abs(arc.y / r)).toBeLessThanOrEqual(0.03);
      expect(arc.rx / r).toBeGreaterThanOrEqual(0.25);
      expect(arc.rx / r).toBeLessThanOrEqual(0.35);
    });
  });

  describe('AC4.4: PERMANENT_MULTIPLIER is a capital X', () => {
    it('is (-a,-a)-(a,a) and (a,-a)-(-a,a) with a in 0.3r-0.4r', () => {
      const [s1, s2] = subpaths(glyphOf('PERMANENT_MULTIPLIER'), r).map((p) => p.pts);
      const a = s1![1]!.x;
      expect(a).toBeGreaterThanOrEqual(0.3);
      expect(a).toBeLessThanOrEqual(0.4);
      const close = (p: Pt, x: number, y: number): boolean =>
        Math.abs(p.x - x) < 0.05 && Math.abs(p.y - y) < 0.05;
      expect(close(s1![0]!, -a, -a) && close(s1![1]!, a, a)).toBe(true);
      expect(close(s2![0]!, a, -a) && close(s2![1]!, -a, a)).toBe(true);
    });
  });

  describe('AC6(a): each glyph matches only its own signature', () => {
    it.each(TYPES)('%s', (t) => {
      const sig = signature(glyphOf(t), r);
      for (const other of TYPES) expect(sig[other]).toBe(other === t);
    });
  });
});

/** F23 AC7: a source search proving no other draw code under src builds an "X" (two
 * crossing diagonals). A diagonal vertex is a moveTo/lineTo whose x and y are the same
 * expression up to sign (for example `-radius * 0.35, radius * 0.35`). */
describe('AC7: only the PERMANENT_MULTIPLIER token builds an X', () => {
  function sourceFiles(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
      else if (/\.ts$/.test(name) && !/\.(test|spec)\.ts$/.test(name)) out.push(full);
    }
    return out;
  }
  const DIAGONAL = /(?:moveTo|lineTo)\(\s*-?\s*([^,()]+?)\s*,\s*-?\s*([^,()]+?)\s*\)/g;
  const files = sourceFiles(path.join(process.cwd(), 'src'));

  it('finds source files to search', () => {
    expect(files.length).toBeGreaterThan(10);
    expect(files.some((f) => f.endsWith('shapes.ts'))).toBe(true);
  });

  it('has diagonal vertices (an X) only in shapes.ts, in exactly one two-line X', () => {
    const hits: Record<string, number> = {};
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      let n = 0;
      for (const m of text.matchAll(DIAGONAL)) {
        if (m[1]!.replace(/\s+/g, '') === m[2]!.replace(/\s+/g, '') && /[a-zA-Z]/.test(m[1]!))
          n += 1;
      }
      if (n > 0) hits[path.basename(f)] = n;
    }
    expect(hits).toEqual({ 'shapes.ts': 4 });
  });

  it('has no multiplication-sign or cross-mark characters drawn anywhere', () => {
    for (const f of files) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/[✕✖❌❎]/);
    }
  });
});

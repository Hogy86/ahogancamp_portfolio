// Tests PRD addendum v5 F23 AC1-AC4, AC6(a) and AC7 (source search): the four power-up
// glyphs (fist, double arrow "<-->", circle, capital X) drawn by `drawPowerUp`. The double
// arrow is F23 r6 AC4.2 (owner decision 2026-10-05, Q-v5-2). PRD addendum v7 F27 AC1/AC3
// (code-review-round21 L1/L3): the arrow checks fail for an X-like arrow. AC5/AC8-AC10 are not
// geometry and are covered elsewhere (existing gameplay suites) or listed in
// docs/mobile/tests/manual-only-criteria.md (AC6(b), Q-v5-1). jsdom has no real 2D
// canvas, so the tests run the real exported function against a recording 2D-context stub that
// logs every path call with the style in force, then check the recorded geometry (not pixels).
// Every case runs at r = 12 and r = 20 to prove the glyphs scale with the radius (F23 preamble).
// The r5 fist rules are asserted as written, one test per numbered item.

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
};
function subpaths(glyph: Op[], r: number): SubPath[] {
  const out: SubPath[] = [];
  let cur: SubPath | null = null;
  const last = (): Pt => cur!.pts[cur!.pts.length - 1]!;
  for (const o of glyph) {
    if (o.op === 'moveTo') {
      cur = { pts: [{ x: o.x / r, y: o.y / r }], closed: false };
      out.push(cur);
    } else if (o.op === 'lineTo' && cur) {
      cur.pts.push({ x: o.x / r, y: o.y / r });
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
      }
    } else if (o.op === 'closePath' && cur) {
      cur.closed = true;
      // A final point equal to the start is the same vertex, not an extra one.
      const first = cur.pts[0]!;
      const end = last();
      if (cur.pts.length > 1 && Math.hypot(end.x - first.x, end.y - first.y) < 1e-12) {
        cur.pts.pop();
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

/** F23 AC6(a): a glyph's recorded path reduced to the signature columns of the table. */
function signature(glyph: Op[], r: number): Record<PowerUpType, boolean> {
  const fills = glyph.filter((o) => o.op === 'fill').length;
  const strokes = glyph.filter((o) => o.op === 'stroke').length;
  const arcs = glyph.filter((o) => o.op === 'arc' || o.op === 'ellipse');
  const lines = glyph.filter((o) => o.op === 'lineTo').length;
  const paths = subpaths(glyph, r);
  const bumps = paths.length === 1 ? topBumps(paths[0]!.pts) : [];
  const closedOutline = paths.length === 1 && paths[0]!.closed;
  const knuckles = bumps.filter((b) => b.prominence >= 0.06 && b.prominence <= 0.22);
  return {
    HIT_POWER:
      fills === 1 &&
      strokes === 0 &&
      closedOutline &&
      bumps.length === knuckles.length &&
      knuckles.length >= 3 &&
      knuckles.length <= 4,
    SPEED:
      fills === 0 &&
      strokes === 1 &&
      arcs.length === 0 &&
      lines === 5 &&
      paths.length === 3 &&
      paths.every((p) => !p.closed),
    SHIELD: fills === 0 && strokes === 1 && arcs.length === 1 && lines === 0,
    PERMANENT_MULTIPLIER:
      fills === 0 && strokes === 1 && arcs.length === 0 && lines === 2 && paths.length === 2,
  };
}

const EPS = 1e-9;
const samePoint = (p: Pt, q: Pt): boolean => Math.hypot(p.x - q.x, p.y - q.y) < EPS;

/** True when two segments share no point at all, or share exactly one point that is an
 * endpoint of both (two strokes joined at a corner). Any interior crossing, a T-junction,
 * or a collinear overlap is false - that is what would turn the arrow into an X. */
function meetOnlyAtSharedEndpoint(s: Seg, t: Seg): boolean {
  if (!segmentsMeet(s, t)) return true;
  for (const p of s) {
    for (const q of t) {
      if (!samePoint(p, q)) continue;
      const sOther = samePoint(s[0], p) ? s[1] : s[0];
      const tOther = samePoint(t[0], q) ? t[1] : t[0];
      const collinear = Math.abs(orient(p, sOther, tOther)) < EPS;
      // Collinear and pointing the same way from the shared point means they overlap.
      const sameWay = (sOther.x - p.x) * (tOther.x - p.x) + (sOther.y - p.y) * (tOther.y - p.y) > 0;
      return !(collinear && sameWay);
    }
  }
  return false;
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
    it.each(['HIT_POWER'] as const)('%s is one closed simple curve', (t) => {
      const paths = subpaths(glyphOf(t), r);
      expect(paths).toHaveLength(1);
      expect(paths[0]!.closed).toBe(true);
      expect(isSimpleClosedCurve(paths[0]!.pts)).toBe(true);
    });

    it('SPEED is one shaft and two open arrowheads that meet only at the shaft ends', () => {
      const paths = subpaths(glyphOf('SPEED'), r);
      expect(paths.map((p) => p.pts.length)).toEqual([2, 3, 3]);
      const segs = paths.flatMap((p) => segments(p.pts, false));
      expect(segs).toHaveLength(5);
      // F27 AC1 / round-21 L1 (a): every pair of the five strokes, wing against wing
      // included, may meet only at an endpoint they share - no crossing anywhere.
      for (let i = 0; i < segs.length; i += 1) {
        for (let j = i + 1; j < segs.length; j += 1) {
          expect(meetOnlyAtSharedEndpoint(segs[i]!, segs[j]!), `segments ${i} and ${j}`).toBe(true);
        }
      }
      // The two wings of one head join at the head's tip.
      expect(segs[1]![1]).toEqual(segs[2]![0]);
      expect(segs[3]![1]).toEqual(segs[4]![0]);
    });

    it('SPEED has exactly 1 horizontal, 0 vertical and 4 diagonal segments (no "+")', () => {
      const segs = subpaths(glyphOf('SPEED'), r).flatMap((p) => segments(p.pts, false));
      const kinds = segs.map(([a, b]) => {
        if (Math.abs(a.y - b.y) < EPS) return 'horizontal';
        if (Math.abs(a.x - b.x) < EPS) return 'vertical';
        return 'diagonal';
      });
      expect(kinds.filter((k) => k === 'horizontal')).toHaveLength(1);
      expect(kinds.filter((k) => k === 'vertical')).toHaveLength(0);
      expect(kinds.filter((k) => k === 'diagonal')).toHaveLength(4);
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
    it('HIT_POWER has exactly one fill in the glyph color', () => {
      const t = 'HIT_POWER';
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

    it.each(['SPEED', 'SHIELD', 'PERMANENT_MULTIPLIER'] as const)(
      '%s is stroke-only, width 2',
      (t) => {
        const paints = glyphOf(t).filter((o) => o.op === 'fill' || o.op === 'stroke');
        expect(paints).toHaveLength(1);
        expect(paints[0]).toEqual({
          op: 'stroke',
          fillStyle: LEVEL_INTRO_TEXT_COLOR,
          strokeStyle: LEVEL_INTRO_TEXT_COLOR,
          lineWidth: 2,
        });
      },
    );

    it('HIT_POWER has no holes (one subpath)', () => {
      expect(subpaths(glyphOf('HIT_POWER'), r)).toHaveLength(1);
    });

    it.each(['SPEED', 'SHIELD', 'PERMANENT_MULTIPLIER'] as const)(
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

    // AC3(d) (r5): the filled fist gets a larger box, but stays out of the ring's corners.
    describe.each(['HIT_POWER'] as const)('%s filled-glyph bound', (t) => {
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

  describe('AC4.2: SPEED is a double-headed arrow "<-->" (F23 r6, Q-v5-2)', () => {
    const paths = subpaths(glyphOf('SPEED'), r);
    const [shaft, left, right] = paths.map((p) => p.pts) as [Pt[], Pt[], Pt[]];
    it('has a horizontal shaft through the center spanning the full +-0.45r', () => {
      expect(shaft).toHaveLength(2);
      expect(shaft[0]!.y).toBe(0);
      expect(shaft[1]!.y).toBe(0);
      expect(Math.min(...shaft.map((p) => p.x))).toBeCloseTo(-0.45, 9);
      expect(Math.max(...shaft.map((p) => p.x))).toBeCloseTo(0.45, 9);
    });
    it('has an arrowhead tip at each shaft end, the two heads mirrored left/right', () => {
      expect(left[1]).toEqual({ x: -0.45, y: 0 });
      expect(right[1]).toEqual({ x: 0.45, y: 0 });
      left.forEach((p, i) => {
        expect(p.x).toBeCloseTo(-right[i]!.x, 9);
        expect(p.y).toBeCloseTo(right[i]!.y, 9);
      });
    });
    it('has heads at least 0.5r tall and 0.2r long, wings mirrored above/below the shaft', () => {
      for (const head of [left, right]) {
        expect(head[0]!.y).toBeCloseTo(-head[2]!.y, 9);
        expect(head[2]!.y - head[0]!.y).toBeGreaterThanOrEqual(0.5);
        expect(Math.abs(head[1]!.x - head[0]!.x)).toBeGreaterThanOrEqual(0.2);
        expect(head[0]!.x).toBeCloseTo(head[2]!.x, 9);
      }
    });
    it('keeps the wing vertices clear of the shaft so the heads read open, not as an X', () => {
      // An X needs two strokes crossing at an interior point; the pairwise check in AC1
      // rules that out for every pair, wing against wing included. These bounds keep
      // each head on its own side of the centre so the heads cannot reach across it.
      for (const head of [left, right]) {
        expect(Math.abs(head[0]!.x)).toBeLessThan(0.45);
        expect(Math.abs(head[0]!.x)).toBeGreaterThan(0.1);
      }
    });
    it('puts the left wing ends at x < 0 and the right wing ends at x > 0', () => {
      for (const end of [left[0]!, left[2]!]) expect(end.x).toBeLessThan(0);
      for (const end of [right[0]!, right[2]!]) expect(end.x).toBeGreaterThan(0);
    });
    it('keeps every wing end at least 0.25r from the centre', () => {
      for (const end of [left[0]!, left[2]!, right[0]!, right[2]!]) {
        expect(Math.hypot(end.x, end.y)).toBeGreaterThanOrEqual(0.25);
      }
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

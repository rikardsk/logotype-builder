import { describe, it, expect } from 'vitest';
import { createLineGuide, createCircleGuide, createParallelGuide } from '../scaffolds';
import { decomposeGuidesWithPlanarGraph } from '../planarGraphDecomposer';

describe('planarGraphDecomposer', () => {
  it('extracts enclosed square face from 4 crossing lines', () => {
    // 4 crossing lines forming a central square between 200 and 400
    const l1 = createLineGuide('l1', 100, 200, 500, 200);
    const l2 = createLineGuide('l2', 100, 400, 500, 400);
    const l3 = createLineGuide('l3', 200, 100, 200, 500);
    const l4 = createLineGuide('l4', 400, 100, 400, 500);

    const faces = decomposeGuidesWithPlanarGraph([l1, l2, l3, l4]);
    expect(faces.length).toBe(1);
    expect(faces[0].bounds.width).toBeCloseTo(200, 0);
    expect(faces[0].bounds.height).toBeCloseTo(200, 0);
    expect(faces[0].center.x).toBeCloseTo(300, 0);
    expect(faces[0].center.y).toBeCloseTo(300, 0);
  });

  it('extracts two faces from a circle split by a diameter line', () => {
    const circle = createCircleGuide('c', 400, 400, 100);
    const line = createLineGuide('d', 200, 400, 600, 400);

    const faces = decomposeGuidesWithPlanarGraph([circle, line]);
    expect(faces.length).toBe(2);
    for (const f of faces) {
      expect(f.bounds.width).toBeGreaterThan(150);
      expect(f.bounds.height).toBeGreaterThan(80);
    }
  });

  it('returns empty array when lines do not enclose any region', () => {
    const l1 = createLineGuide('l1', 100, 100, 200, 200);
    const l2 = createLineGuide('l2', 300, 300, 400, 400);
    const faces = decomposeGuidesWithPlanarGraph([l1, l2]);
    expect(faces.length).toBe(0);
  });

  it('extracts cells formed by parallel lines intersecting another line or shape', () => {
    // 2 horizontal parallel lines at y=200 and y=300 (spacing=100)
    const par = createParallelGuide('p', 100, 250, 500, 250, 100);
    // 2 vertical lines crossing at x=200 and x=400
    const v1 = createLineGuide('v1', 200, 100, 200, 400);
    const v2 = createLineGuide('v2', 400, 100, 400, 400);

    const faces = decomposeGuidesWithPlanarGraph([par, v1, v2]);
    expect(faces.length).toBe(1);
    expect(faces[0].bounds.width).toBeCloseTo(200, 0);
    expect(faces[0].bounds.height).toBeCloseTo(100, 0);
    expect(faces[0].center.x).toBeCloseTo(300, 0);
    expect(faces[0].center.y).toBeCloseTo(250, 0);
  });

  it('extracts face between two circles connected by two lines', () => {
    const c1 = createCircleGuide('c1', 200, 400, 80);
    const c2 = createCircleGuide('c2', 600, 400, 80);
    // Lines starting inside c1 (x=200) and ending inside c2 (x=600)
    const l1 = createLineGuide('l1', 200, 360, 600, 360);
    const l2 = createLineGuide('l2', 200, 440, 600, 440);

    const faces = decomposeGuidesWithPlanarGraph([c1, c2, l1, l2]);
    expect(faces.length).toBeGreaterThan(0);
    // Let's verify what each face is:
    const centers = faces.map((f) => ({ x: Math.round(f.center.x), y: Math.round(f.center.y) }));
    // Must find bridge face around x=400, y=400
    const hasBridge = centers.some((c) => Math.abs(c.x - 400) < 50 && Math.abs(c.y - 400) < 30);
    expect(hasBridge).toBe(true);
  });
});

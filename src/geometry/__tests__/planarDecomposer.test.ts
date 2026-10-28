import { describe, it, expect } from 'vitest';
import { createCircleGuide, createParallelCircleGuide, createLineGuide } from '../scaffolds';
import { decomposeGuidesToAtomicFaces } from '../planarDecomposer';
import { isPointInPath } from '../shapeMerger';

describe('planarDecomposer', () => {
  it('decomposes two intersecting circles into 3 atomic faces', () => {
    // Two circles of radius 100 with centers 100 apart
    const c1 = createCircleGuide('c1', 200, 200, 100);
    const c2 = createCircleGuide('c2', 300, 200, 100);

    const faces = decomposeGuidesToAtomicFaces([c1, c2]);

    // Should create 3 faces: c1 \ c2, c1 ∩ c2, c2 \ c1
    expect(faces.length).toBe(3);
    for (const face of faces) {
      expect(face.pathData).toBeTruthy();
      expect(face.bounds.width).toBeGreaterThan(0);
      expect(face.bounds.height).toBeGreaterThan(0);
    }
  });

  it('handles empty guides gracefully', () => {
    const faces = decomposeGuidesToAtomicFaces([]);
    expect(faces).toEqual([]);
  });

  it('preserves single circle as 1 atomic face', () => {
    const c1 = createCircleGuide('single', 300, 300, 80);
    const faces = decomposeGuidesToAtomicFaces([c1]);
    expect(faces.length).toBe(1);
  });

  it('decomposes parallel circle into concentric atomic faces', () => {
    const pc = createParallelCircleGuide('pc', 300, 300, 100, 40);
    const faces = decomposeGuidesToAtomicFaces([pc]);
    // Inner circle (radius 80) and ring (between 80 and 120)
    expect(faces.length).toBe(2);

    // One face must be the inner disc, the other must be the annular ring
    const innerFace = faces.find((f) => isPointInPath(f.pathData, { x: 300, y: 300 }));
    const ringFace = faces.find((f) => isPointInPath(f.pathData, { x: 400, y: 300 }));

    expect(innerFace).toBeDefined();
    expect(ringFace).toBeDefined();
    expect(innerFace?.id).not.toBe(ringFace?.id);

    // The ring face MUST NOT contain the center of the circle!
    expect(isPointInPath(ringFace!.pathData, { x: 300, y: 300 })).toBe(false);
    // The inner face MUST NOT contain the ring area!
    expect(isPointInPath(innerFace!.pathData, { x: 400, y: 300 })).toBe(false);
  });

  it('slices a circle with a line while preserving true smooth Bézier curves', () => {
    const circle = createCircleGuide('c', 400, 400, 100);
    const line = createLineGuide('l', 200, 400, 600, 400);

    const faces = decomposeGuidesToAtomicFaces([circle, line]);
    expect(faces.length).toBe(2);

    for (const f of faces) {
      expect(f.bounds.width).toBeCloseTo(200, -1);
      expect(f.bounds.height).toBeCloseTo(100, -1);
      // Must contain Bézier cubic curve command ('c' or 'C')
      expect(/[cC]/.test(f.pathData)).toBe(true);
    }
  });

  it('does NOT slice a distant circle with an unextended line guide whose visible endpoints do not reach the circle', () => {
    // Circle at top-right
    const circle = createCircleGuide('c-top-right', 600, 150, 60);
    // Line at bottom-left pointing towards top-right, but stopping far before the circle
    const line = createLineGuide('l-bottom-left', 100, 650, 250, 500);

    const faces = decomposeGuidesToAtomicFaces([circle, line]);
    // The circle must remain completely intact as 1 face, NOT sliced by invisible continuation lines
    expect(faces.length).toBe(1);
    expect(faces[0].bounds.width).toBeCloseTo(120, 0);
    expect(faces[0].bounds.height).toBeCloseTo(120, 0);
  });

  it('does NOT slice a circle when line segment stops inside without crossing the boundary at 2 points', () => {
    const circle = createCircleGuide('c', 400, 400, 100);
    // Line that starts at the center and stops halfway to the boundary (length 50, radius 100)
    const line = createLineGuide('l-short', 400, 400, 450, 400);

    const faces = decomposeGuidesToAtomicFaces([circle, line]);
    expect(faces.length).toBe(1);
  });

  it('keeps line cells whole and does not fracture them with their own boundary lines', () => {
    // 4 crossing lines forming a 100x100 square in the center (from 300 to 400 in x and y)
    const h1 = createLineGuide('h1', 200, 300, 500, 300);
    const h2 = createLineGuide('h2', 200, 400, 500, 400);
    const v1 = createLineGuide('v1', 300, 200, 300, 500);
    const v2 = createLineGuide('v2', 400, 200, 400, 500);
    const circle = createCircleGuide('c', 700, 100, 50);

    const faces = decomposeGuidesToAtomicFaces([circle, h1, h2, v1, v2]);
    expect(faces.length).toBe(2);

    const squareCell = faces.find((f) => Math.abs(f.bounds.width - 100) < 5);
    expect(squareCell).toBeDefined();
    expect(squareCell?.bounds.width).toBeCloseTo(100, 0);
    expect(squareCell?.bounds.height).toBeCloseTo(100, 0);

    const circleCell = faces.find((f) => f.id !== squareCell?.id);
    expect(circleCell).toBeDefined();
    expect(circleCell?.bounds.width).toBeCloseTo(100, 0);
    expect(circleCell?.bounds.height).toBeCloseTo(100, 0);
  });

  it('creates an atomic shape between two circles connected by two lines', () => {
    // Two circles horizontally separated
    const c1 = createCircleGuide('c1', 200, 400, 80);
    const c2 = createCircleGuide('c2', 600, 400, 80);
    // Two lines bridging the two circles, starting inside c1 and ending inside c2
    const l1 = createLineGuide('l1', 200, 360, 600, 360);
    const l2 = createLineGuide('l2', 200, 440, 600, 440);

    const faces = decomposeGuidesToAtomicFaces([c1, c2, l1, l2]);
    // Must find the bridge face between the two circles (around center x=400, y=400)
    const bridgeFace = faces.find(
      (f) => f.center.x > 300 && f.center.x < 500 && Math.abs(f.center.y - 400) < 30
    );
    expect(bridgeFace).toBeDefined();
    expect(bridgeFace?.bounds.width).toBeGreaterThan(200);
    expect(bridgeFace?.bounds.height).toBeCloseTo(80, 0);
  });
});

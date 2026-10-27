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
});

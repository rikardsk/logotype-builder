import { describe, it, expect } from 'vitest';
import { createCircleGuide, createPolygonGuide } from '../scaffolds';
import {
  mergeFacePaths,
  subtractFaceFromShape,
  isPointInPath,
} from '../shapeMerger';

describe('shapeMerger', () => {
  it('unions two adjacent squares into a merged shape', () => {
    const sq1 = createPolygonGuide('sq1', [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ]);
    const sq2 = createPolygonGuide('sq2', [
      [100, 0],
      [200, 0],
      [200, 100],
      [100, 100],
    ]);

    const merged = mergeFacePaths([sq1.pathData, sq2.pathData]);
    expect(merged).toBeTruthy();
    expect(isPointInPath(merged, { x: 50, y: 50 })).toBe(true);
    expect(isPointInPath(merged, { x: 150, y: 50 })).toBe(true);
    expect(isPointInPath(merged, { x: 250, y: 50 })).toBe(false);
  });

  it('subtracts an inner circle from an outer shape', () => {
    const outer = createPolygonGuide('outer', [
      [0, 0],
      [200, 0],
      [200, 200],
      [0, 200],
    ]);
    const inner = createCircleGuide('inner', 100, 100, 40);

    const result = subtractFaceFromShape(outer.pathData, inner.pathData);
    expect(result).toBeTruthy();
    // Center was subtracted
    expect(isPointInPath(result, { x: 100, y: 100 })).toBe(false);
    // Corner is still inside
    expect(isPointInPath(result, { x: 20, y: 20 })).toBe(true);
  });
});

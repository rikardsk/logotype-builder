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

  it('unites multiple adjacent shapes into one continuous shape', () => {
    // 5 contiguous adjacent 50x50 squares in a row from x=0 to x=250
    const squares = Array.from({ length: 5 }, (_, i) =>
      createPolygonGuide(`sq-${i}`, [
        [i * 50, 0],
        [(i + 1) * 50, 0],
        [(i + 1) * 50, 50],
        [i * 50, 50],
      ])
    );

    const united = mergeFacePaths(squares.map((s) => s.pathData));
    expect(united).toBeTruthy();
    // Every sub-cell center must be inside the united shape
    for (let i = 0; i < 5; i++) {
      expect(isPointInPath(united, { x: i * 50 + 25, y: 25 })).toBe(true);
    }
    // Outside point must be false
    expect(isPointInPath(united, { x: 300, y: 25 })).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import {
  filletPathData,
  roundShapeCorners,
  roundShapesCorners,
} from '../cornerRounding';
import { getPaperScope } from '../paperScope';
import { ConstructedShape } from '../types';

describe('cornerRounding', () => {
  it('returns original path when radius <= 0', () => {
    const rectSvg = 'M0,0H100V100H0Z';
    expect(filletPathData(rectSvg, 0)).toBe(rectSvg);
    expect(filletPathData(rectSvg, -5)).toBe(rectSvg);
  });

  it('rounds corners of a rectangle into circular arcs', () => {
    const scope = getPaperScope();
    scope.activate();
    const rect = new scope.Path.Rectangle(new scope.Rectangle(10, 10, 80, 80));
    const originalPath = rect.pathData || '';
    rect.remove();

    const filleted = filletPathData(originalPath, 10);
    expect(filleted).toBeTruthy();
    expect(filleted).not.toBe(originalPath);

    // Verify filleted path is valid in paper.js and has more segments for arcs
    const resultItem = new scope.CompoundPath(filleted);
    expect(resultItem.isEmpty()).toBe(false);
    expect(resultItem.bounds.width).toBeCloseTo(80, 0);
    expect(resultItem.bounds.height).toBeCloseTo(80, 0);
    // 4 corners with arcs = 8 segments
    const childPath = resultItem.children[0] as paper.Path;
    expect(childPath.segments.length).toBe(8);
    resultItem.remove();
  });

  it('fillets acute corners of a triangle', () => {
    const scope = getPaperScope();
    scope.activate();
    const tri = new scope.Path();
    tri.add(new scope.Point(50, 10));
    tri.add(new scope.Point(90, 90));
    tri.add(new scope.Point(10, 90));
    tri.closed = true;
    const triPath = tri.pathData || '';
    tri.remove();

    const filleted = filletPathData(triPath, 8);
    expect(filleted).toBeTruthy();

    const result = new scope.CompoundPath(filleted);
    expect(result.isEmpty()).toBe(false);
    // 3 corners with arcs = 6 to 9 segments
    const child = result.children[0] as paper.Path;
    expect(child.segments.length).toBeGreaterThanOrEqual(6);
    result.remove();
  });

  it('fillets sharp cusps of curved intersecting shapes (e.g. lens)', () => {
    const scope = getPaperScope();
    scope.activate();
    const c1 = new scope.Path.Circle(new scope.Point(80, 100), 50);
    const c2 = new scope.Path.Circle(new scope.Point(120, 100), 50);
    const lens = c1.intersect(c2);
    const lensPath = lens.pathData || '';
    c1.remove();
    c2.remove();
    lens.remove();

    const filleted = filletPathData(lensPath, 6);
    expect(filleted).toBeTruthy();

    const result = new scope.CompoundPath(filleted);
    expect(result.isEmpty()).toBe(false);
    result.remove();
  });

  it('safely clamps fillet radius on small edges without distorting', () => {
    const scope = getPaperScope();
    scope.activate();
    const rect = new scope.Path.Rectangle(new scope.Rectangle(0, 0, 10, 10));
    const path = rect.pathData || '';
    rect.remove();

    // Radius 50 is much larger than edge 10
    const filleted = filletPathData(path, 50);
    expect(filleted).toBeTruthy();

    const result = new scope.CompoundPath(filleted);
    expect(result.isEmpty()).toBe(false);
    expect(result.bounds.width).toBeCloseTo(10, 0);
    expect(result.bounds.height).toBeCloseTo(10, 0);
    result.remove();
  });

  it('preserves non-destructive rawPathData and resets to 0 smoothly', () => {
    const shape: ConstructedShape = {
      id: 's1',
      pathData: 'M0,0H100V100H0Z',
      fillColor: '#6366f1',
      createdAt: 1,
    };

    const rounded = roundShapeCorners(shape, 8);
    expect(rounded.cornerRadius).toBe(8);
    expect(rounded.rawPathData).toBe('M0,0H100V100H0Z');
    expect(rounded.pathData).not.toBe(shape.pathData);

    // Apply different radius (non-destructive from rawPathData)
    const roundedAgain = roundShapeCorners(rounded, 16);
    expect(roundedAgain.cornerRadius).toBe(16);
    expect(roundedAgain.rawPathData).toBe('M0,0H100V100H0Z');

    // Reset to 0 (sharp)
    const reset = roundShapeCorners(roundedAgain, 0);
    expect(reset.cornerRadius).toBe(0);
    expect(reset.pathData).toBe('M0,0H100V100H0Z');
    expect(reset.rawPathData).toBeUndefined();
  });

  it('leaves text shapes untouched', () => {
    const textShape: ConstructedShape = {
      id: 't1',
      pathData: '',
      type: 'text',
      text: 'LOGO',
      fillColor: '#fff',
      createdAt: 1,
    };
    const result = roundShapeCorners(textShape, 10);
    expect(result).toBe(textShape);
  });

  it('rounds multiple shapes with roundShapesCorners', () => {
    const shapes: ConstructedShape[] = [
      {
        id: 's1',
        pathData: 'M0,0H80V80H0Z',
        fillColor: '#fff',
        createdAt: 1,
      },
      {
        id: 's2',
        pathData: 'M100,100H180V180H100Z',
        fillColor: '#fff',
        createdAt: 2,
      },
    ];

    const rounded = roundShapesCorners(shapes, 6);
    expect(rounded).toHaveLength(2);
    expect(rounded[0].cornerRadius).toBe(6);
    expect(rounded[1].cornerRadius).toBe(6);
  });
});

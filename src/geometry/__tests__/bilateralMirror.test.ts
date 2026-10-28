import { describe, it, expect } from 'vitest';
import {
  mirrorPoint,
  mirrorPathData,
  mirrorConstructedShape,
  mirrorGuide,
  mirrorShapesBatch,
  mirrorGuidesBatch,
} from '../bilateralMirror';
import { createLineGuide, createCircleGuide, createParallelGuide, createQuadGuide, createEllipseGuide } from '../scaffolds';
import { ConstructedShape } from '../types';
import { getPaperScope } from '../paperScope';

describe('bilateralMirror', () => {
  const center = { x: 400, y: 400 };

  it('mirrors a point across horizontal and vertical axes', () => {
    const pt = { x: 250, y: 300 };
    const hMirrored = mirrorPoint(pt, center, 'horizontal');
    expect(hMirrored).toEqual({ x: 550, y: 300 });

    const vMirrored = mirrorPoint(pt, center, 'vertical');
    expect(vMirrored).toEqual({ x: 250, y: 500 });
  });

  it('mirrors SVG path data across artboard center line', () => {
    const scope = getPaperScope();
    scope.activate();

    // Rectangle from x:100..250 (left of 400 by 150..300)
    const rect = new scope.Path.Rectangle(new scope.Rectangle(100, 200, 150, 100));
    const pathData = rect.pathData || '';
    rect.remove();

    const mirroredData = mirrorPathData(pathData, center, 'horizontal');
    expect(mirroredData).toBeTruthy();

    const mirroredItem = new scope.CompoundPath(mirroredData);
    // Mirrored rectangle must be from x:550..700 (right of 400 by 150..300)
    expect(mirroredItem.bounds.x).toBeCloseTo(550, 0);
    expect(mirroredItem.bounds.right).toBeCloseTo(700, 0);
    expect(mirroredItem.bounds.y).toBeCloseTo(200, 0);
    expect(mirroredItem.bounds.height).toBeCloseTo(100, 0);
    mirroredItem.remove();
  });

  it('mirrors constructed shapes including rawPathData and text', () => {
    const pathShape: ConstructedShape = {
      id: 's1',
      pathData: 'M100,200 L250,200 L250,300 L100,300 Z',
      rawPathData: 'M100,200 L250,200 L250,300 L100,300 Z',
      fillColor: '#6366f1',
      createdAt: 10,
    };

    const mirrored = mirrorConstructedShape(pathShape, center, 'horizontal', 's1-dup');
    expect(mirrored.id).toBe('s1-dup');
    expect(mirrored.pathData).toBeTruthy();
    expect(mirrored.rawPathData).toBeTruthy();

    const textShape: ConstructedShape = {
      id: 't1',
      pathData: '',
      type: 'text',
      text: 'ABC',
      fontSize: 50,
      x: 100,
      y: 200,
      fillColor: '#fff',
      createdAt: 20,
    };

    const mirroredText = mirrorConstructedShape(textShape, center, 'horizontal', 't1-dup');
    expect(mirroredText.id).toBe('t1-dup');
    expect(mirroredText.x).toBeGreaterThan(400);
    expect(mirroredText.y).toBe(200);
  });

  it('mirrors various guide shapes accurately across the symmetry axis', () => {
    // 1. Line Guide
    const line = createLineGuide('l1', 100, 150, 200, 250);
    const mLine = mirrorGuide(line, center, 'horizontal', 'l1-mirrored');
    expect(mLine.p1).toEqual({ x: 700, y: 150 });
    expect(mLine.p2).toEqual({ x: 600, y: 250 });

    // 2. Circle Guide
    const circle = createCircleGuide('c1', 250, 300, 50);
    const mCircle = mirrorGuide(circle, center, 'horizontal', 'c1-mirrored');
    expect(mCircle.cx).toBe(550);
    expect(mCircle.cy).toBe(300);
    expect(mCircle.rx).toBe(50);

    // 3. Parallel Guide
    const parallel = createParallelGuide('p1', 150, 100, 150, 300, 40);
    const mParallel = mirrorGuide(parallel, center, 'horizontal', 'p1-mirrored');
    expect(mParallel.p1?.x).toBe(650);
    expect(mParallel.p2?.x).toBe(650);

    // 4. Quad Guide
    const quad = createQuadGuide('q1', [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 200 },
      { x: 100, y: 200 },
    ]);
    const mQuad = mirrorGuide(quad, center, 'horizontal', 'q1-mirrored');
    expect(mQuad.points?.[0]).toEqual({ x: 700, y: 100 });
    expect(mQuad.points?.[1]).toEqual({ x: 600, y: 100 });

    // 5. Ellipse Guide
    const ellipse = createEllipseGuide('e1', 250, 300, 80, 40);
    ellipse.rotation = 30;
    const mEllipse = mirrorGuide(ellipse, center, 'horizontal', 'e1-mirrored');
    expect(mEllipse.cx).toBe(550);
    expect(mEllipse.rotation).toBe(330);
  });

  it('handles batch mirroring with duplication and in-place flips', () => {
    const shapes: ConstructedShape[] = [
      { id: 's1', pathData: 'M100,100 L200,100 L200,200 Z', fillColor: '#fff', createdAt: 1 },
    ];

    // Duplicate
    const dupRes = mirrorShapesBatch(shapes, ['s1'], center, 'horizontal', true, 'test');
    expect(dupRes.updatedShapes).toHaveLength(2);
    expect(dupRes.newSelectedIds).toHaveLength(1);
    expect(dupRes.newSelectedIds[0]).toContain('shape-mirror-test');

    // In-place flip
    const flipRes = mirrorShapesBatch(shapes, ['s1'], center, 'horizontal', false, 'test');
    expect(flipRes.updatedShapes).toHaveLength(1);
    expect(flipRes.newSelectedIds).toEqual(['s1']);

    // Batch Guides Duplicate
    const guides = [createLineGuide('l1', 100, 100, 200, 200)];
    const gDupRes = mirrorGuidesBatch(guides, ['l1'], center, 'horizontal', true, 'test');
    expect(gDupRes.updatedGuides).toHaveLength(2);
  });
});

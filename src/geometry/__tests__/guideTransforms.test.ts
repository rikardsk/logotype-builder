import { describe, it, expect } from 'vitest';
import { ConstructedShape } from '../types';
import {
  createLineGuide,
  createCircleGuide,
  createEllipseGuide,
  createQuadGuide,
  createParallelGuide,
  createParallelCircleGuide,
} from '../scaffolds';
import {
  moveGuide,
  updateLinePoint,
  resizeEllipseAxis,
  rotateEllipseGuide,
  moveConstructedShape,
  snapPointTo45Degrees,
  updateQuadCorner,
  getQuadCenter,
  resizeQuadEdge,
  rotateQuadGuide,
  updateParallelPoint,
  rotateParallelGuide,
  updateParallelSpacing,
  updateParallelCircleRadius,
  updateParallelCircleSpacing,
  getShapeBounds,
  getShapesBoundingBox,
  scaleConstructedShape,
  scaleConstructedShapes,
  resetShapesScale,
  calculateCornerScale,
  reorderShapes,
  getCanvasViewBox,
  resizeGuide,
} from '../guideTransforms';

describe('guideTransforms', () => {
  it('moves a line by dx and dy', () => {
    const line = createLineGuide('l', 10, 20, 30, 40);
    const moved = moveGuide(line, 5, -5);
    expect(moved.p1).toEqual({ x: 15, y: 15 });
    expect(moved.p2).toEqual({ x: 35, y: 35 });
  });

  it('updates a line endpoint', () => {
    const line = createLineGuide('l', 10, 20, 30, 40);
    const updated = updateLinePoint(line, 'p2', { x: 100, y: 100 });
    expect(updated.p1).toEqual({ x: 10, y: 20 });
    expect(updated.p2).toEqual({ x: 100, y: 100 });
  });

  it('resizes an ellipse rx and ry independently', () => {
    const ellipse = createEllipseGuide('e', 200, 200, 50, 30);
    // Resize horizontal rx
    const resizedX = resizeEllipseAxis(ellipse, 'rx', { x: 280, y: 200 });
    expect(resizedX.rx).toBe(80);
    expect(resizedX.ry).toBe(30);

    // Resize vertical ry (perpendicular handle)
    const resizedY = resizeEllipseAxis(ellipse, 'ry', { x: 200, y: 260 });
    expect(resizedY.rx).toBe(50);
    expect(resizedY.ry).toBe(60);
  });

  it('snaps angle to 0, 45, and 90 degrees when holding shift', () => {
    const origin = { x: 100, y: 100 };
    // Nearly horizontal (10 deg) -> snaps to horizontal (0 deg)
    const nearHorizontal = snapPointTo45Degrees(origin, { x: 200, y: 115 });
    expect(nearHorizontal.y).toBe(100);
    expect(nearHorizontal.x).toBeGreaterThan(190);

    // Nearly 45 degrees (40 deg) -> snaps to exactly 45 deg (dx == dy)
    const near45 = snapPointTo45Degrees(origin, { x: 200, y: 190 });
    const dx = near45.x - origin.x;
    const dy = near45.y - origin.y;
    expect(dx).toBeCloseTo(dy, 0);

    // Nearly vertical (80 deg) -> snaps to vertical (90 deg)
    const nearVertical = snapPointTo45Degrees(origin, { x: 110, y: 200 });
    expect(nearVertical.x).toBe(100);
    expect(nearVertical.y).toBeGreaterThan(190);
  });

  it('rotates an ellipse with handle', () => {
    const ellipse = createEllipseGuide('e', 200, 200, 50, 30);
    const rotated = rotateEllipseGuide(ellipse, { x: 250, y: 200 });
    expect(rotated.rotation).toBe(90);
    expect(rotated.pathData).toBeTruthy();
  });

  it('translates a constructed shape', () => {
    const shape = {
      id: 's1',
      pathData: 'M 10 10 L 30 10 L 30 30 Z',
      fillColor: '#6366f1',
      createdAt: 123,
    };
    const moved = moveConstructedShape(shape, 20, 30);
    expect(moved.pathData).toBeTruthy();
  });

  it('updates an individual corner of a quad independently', () => {
    const quad = createQuadGuide('q1', [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]);
    expect(quad.points).toHaveLength(4);

    // Update corner 1 (top right)
    const updated = updateQuadCorner(quad, 1, { x: 150, y: -20 });
    expect(updated.points?.[0]).toEqual({ x: 0, y: 0 });
    expect(updated.points?.[1]).toEqual({ x: 150, y: -20 });
    expect(updated.points?.[2]).toEqual({ x: 100, y: 100 });
    expect(updated.points?.[3]).toEqual({ x: 0, y: 100 });
    expect(updated.pathData).toBe('M 0 0 L 150 -20 L 100 100 L 0 100 Z');
  });

  it('translates all corners of a quad when moved', () => {
    const quad = createQuadGuide('q2', [
      { x: 10, y: 10 },
      { x: 50, y: 10 },
      { x: 50, y: 50 },
      { x: 10, y: 50 },
    ]);
    const moved = moveGuide(quad, 10, 20);
    expect(moved.points?.[0]).toEqual({ x: 20, y: 30 });
    expect(moved.points?.[1]).toEqual({ x: 60, y: 30 });
    expect(moved.points?.[2]).toEqual({ x: 60, y: 70 });
    expect(moved.points?.[3]).toEqual({ x: 20, y: 70 });
  });

  it('calculates the centroid center of a quad', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const center = getQuadCenter(pts);
    expect(center).toEqual({ x: 50, y: 50 });
  });

  it('resizes a quad along an edge side handle', () => {
    const quad = createQuadGuide('q3', [
      { x: 100, y: 100 }, // p0 top-left
      { x: 200, y: 100 }, // p1 top-right
      { x: 200, y: 200 }, // p2 bottom-right
      { x: 100, y: 200 }, // p3 bottom-left
    ]);

    // Drag top edge (edge 0 between p0 and p1) upward by 20px
    const topResized = resizeQuadEdge(
      quad,
      0,
      { x: 150, y: 80 },
      { x: 150, y: 100 }
    );
    expect(topResized.points?.[0].y).toBe(80);
    expect(topResized.points?.[1].y).toBe(80);
    // Bottom points unchanged
    expect(topResized.points?.[2].y).toBe(200);
    expect(topResized.points?.[3].y).toBe(200);

    // Drag right edge (edge 1 between p1 and p2) outward by 30px
    const rightResized = resizeQuadEdge(
      quad,
      1,
      { x: 230, y: 150 },
      { x: 200, y: 150 }
    );
    expect(rightResized.points?.[1].x).toBe(230);
    expect(rightResized.points?.[2].x).toBe(230);
    // Left points unchanged
    expect(rightResized.points?.[0].x).toBe(100);
    expect(rightResized.points?.[3].x).toBe(100);
  });

  it('rotates a quad around its center', () => {
    const quad = createQuadGuide('q4', [
      { x: -50, y: -50 },
      { x: 50, y: -50 },
      { x: 50, y: 50 },
      { x: -50, y: 50 },
    ]);
    // Quad center is (0, 0)
    // Drag rotation handle 90 degrees clockwise (from (0, -74) to (74, 0))
    const rotated = rotateQuadGuide(
      quad,
      { x: 74, y: 0 },
      { x: 0, y: -74 }
    );
    // After 90 deg rotation clockwise:
    // (-50, -50) -> (50, -50)
    expect(rotated.points?.[0].x).toBeCloseTo(50, 0);
    expect(rotated.points?.[0].y).toBeCloseTo(-50, 0);
    // (50, -50) -> (50, 50)
    expect(rotated.points?.[1].x).toBeCloseTo(50, 0);
    expect(rotated.points?.[1].y).toBeCloseTo(50, 0);
  });

  it('creates and moves parallel lines synchronously', () => {
    // Horizontal centerline from (100, 100) to (300, 100) with 40px spacing
    const par = createParallelGuide('p1', 100, 100, 300, 100, 40);
    expect(par.type).toBe('parallel');
    expect(par.spacing).toBe(40);
    expect(par.points).toHaveLength(4);
    // Line 1 is at y=80, Line 2 is at y=120
    expect(par.points?.[0]).toEqual({ x: 100, y: 80 });
    expect(par.points?.[1]).toEqual({ x: 300, y: 80 });
    expect(par.points?.[2]).toEqual({ x: 300, y: 120 });
    expect(par.points?.[3]).toEqual({ x: 100, y: 120 });

    // Moving shifts both lines synchronously
    const moved = moveGuide(par, 10, -20);
    expect(moved.p1).toEqual({ x: 110, y: 80 });
    expect(moved.p2).toEqual({ x: 310, y: 80 });
    expect(moved.points?.[0]).toEqual({ x: 110, y: 60 });
    expect(moved.points?.[1]).toEqual({ x: 310, y: 60 });
    expect(moved.points?.[2]).toEqual({ x: 310, y: 100 });
    expect(moved.points?.[3]).toEqual({ x: 110, y: 100 });
  });

  it('updates parallel lines endpoint (synchronous length and direction)', () => {
    const par = createParallelGuide('p1', 100, 100, 300, 100, 40);
    // Extend end from 300 to 400
    const extended = updateParallelPoint(par, 'p2', { x: 400, y: 100 });
    expect(extended.p2).toEqual({ x: 400, y: 100 });
    expect(extended.points?.[1]).toEqual({ x: 400, y: 80 });
    expect(extended.points?.[2]).toEqual({ x: 400, y: 120 });
  });

  it('rotates both parallel lines synchronously around their midpoint', () => {
    // Horizontal line from (-100, 0) to (100, 0) with center (0, 0)
    const par = createParallelGuide('p1', -100, 0, 100, 0, 40);
    // Drag rotation handle 90 degrees clockwise (from (0, -20) to (20, 0))
    const rotated = rotateParallelGuide(
      par,
      { x: 20, y: 0 },
      { x: 0, y: -20 }
    );
    // Centerline becomes vertical along x=0 from (0, -100) to (0, 100)
    expect(rotated.p1?.x).toBeCloseTo(0, 0);
    expect(rotated.p1?.y).toBeCloseTo(-100, 0);
    expect(rotated.p2?.x).toBeCloseTo(0, 0);
    expect(rotated.p2?.y).toBeCloseTo(100, 0);
  });

  it('adjusts spacing between parallel lines with spacing handle', () => {
    const par = createParallelGuide('p1', 100, 100, 300, 100, 40);
    // Center is (200, 100). Normal is along Y.
    // Drag spacing handle from y=80 (dist 20) outward to y=50 (dist 50)
    const widened = updateParallelSpacing(par, { x: 200, y: 50 });
    expect(widened.spacing).toBe(100);
    expect(widened.points?.[0].y).toBe(50);
    expect(widened.points?.[3].y).toBe(150);
  });

  it('moves parallel circle guide synchronously', () => {
    const pc = createParallelCircleGuide('pc1', 200, 200, 100, 40);
    expect(pc.type).toBe('parallel-circle');
    expect(pc.rx).toBe(100);
    expect(pc.spacing).toBe(40);

    const moved = moveGuide(pc, 50, -30);
    expect(moved.cx).toBe(250);
    expect(moved.cy).toBe(170);
    expect(moved.rx).toBe(100);
    expect(moved.spacing).toBe(40);
  });

  it('updates parallel circle radius while maintaining spacing', () => {
    const pc = createParallelCircleGuide('pc1', 200, 200, 100, 40);
    const resized = updateParallelCircleRadius(pc, { x: 350, y: 200 });
    expect(resized.cx).toBe(200);
    expect(resized.cy).toBe(200);
    expect(resized.rx).toBe(150);
    expect(resized.spacing).toBe(40);
  });

  it('updates parallel circle spacing while maintaining center radius', () => {
    const pc = createParallelCircleGuide('pc1', 200, 200, 100, 40);
    // Drag spacing outward to radius 140 (diff 40 from 100) -> spacing 80
    const widened = updateParallelCircleSpacing(pc, { x: 340, y: 200 });
    expect(widened.rx).toBe(100);
    expect(widened.spacing).toBe(80);
  });

  it('moves text constructed shape by dx and dy', () => {
    const textShape = {
      id: 't1',
      pathData: '',
      fillColor: '#6366f1',
      createdAt: 12345,
      type: 'text' as const,
      text: 'LOGOTYPE',
      fontFamily: 'Inter, sans-serif',
      fontSize: 64,
      x: 100,
      y: 150,
    };
    const moved = moveConstructedShape(textShape, 25, -50);
    expect(moved.x).toBe(125);
    expect(moved.y).toBe(100);
    expect(moved.text).toBe('LOGOTYPE');
    expect(moved.fontSize).toBe(64);
  });

  it('calculates bounding box and scales path and text shapes', () => {
    const pathShape = {
      id: 's1',
      pathData: 'M 100 100 L 200 100 L 200 200 L 100 200 Z',
      fillColor: '#6366f1',
      createdAt: 1,
    };
    const textShape = {
      id: 't1',
      pathData: '',
      fillColor: '#ffffff',
      createdAt: 2,
      type: 'text' as const,
      text: 'ACME',
      fontSize: 50,
      x: 100,
      y: 250,
    };

    const bbox = getShapesBoundingBox([pathShape, textShape]);
    expect(bbox).not.toBeNull();
    expect(bbox?.width).toBeGreaterThan(50);
    expect(bbox?.height).toBeGreaterThan(50);

    const center = { x: 150, y: 150 };
    const scaledPath = scaleConstructedShape(pathShape, 2, center);
    expect(scaledPath.pathData).toBeTruthy();
    const scaledBbox = getShapeBounds(scaledPath);
    expect(scaledBbox?.width).toBeCloseTo(200, 0);

    const scaledText = scaleConstructedShape(textShape, 1.5, center);
    expect(scaledText.fontSize).toBe(75);
    expect(scaledText.x).toBe(75);
    expect(scaledText.y).toBe(300);

    const scaledAll = scaleConstructedShapes([pathShape, textShape], 1.2);
    expect(scaledAll).toHaveLength(2);
    expect(scaledAll[0].scale).toBeCloseTo(1.2, 2);
    expect(scaledAll[1].scale).toBeCloseTo(1.2, 2);
  });

  it('resets scaled shapes back to original scale and dimensions', () => {
    const pathShape: ConstructedShape = {
      id: 's1',
      pathData: 'M 100 100 L 200 100 L 200 200 L 100 200 Z',
      fillColor: '#fff',
      createdAt: 1,
    };
    const textShape: ConstructedShape = {
      id: 't1',
      pathData: '',
      type: 'text',
      text: 'AB',
      fontSize: 50,
      originalFontSize: 50,
      x: 100,
      y: 250,
      fillColor: '#fff',
      createdAt: 2,
    };

    const initialBbox = getShapeBounds(pathShape);
    expect(initialBbox?.width).toBeCloseTo(100, 0);

    // Scale up by 1.5
    const scaled = scaleConstructedShapes([pathShape, textShape], 1.5);
    expect(scaled[0].scale).toBeCloseTo(1.5, 2);
    expect(scaled[1].fontSize).toBe(75);

    // Scale again by 1.2 (cumulative 1.8)
    const scaledAgain = scaleConstructedShapes(scaled, 1.2);
    expect(scaledAgain[0].scale).toBeCloseTo(1.8, 2);

    // Reset back to original scale
    const reset = resetShapesScale(scaledAgain);
    expect(reset[0].scale).toBe(1);
    expect(reset[1].scale).toBe(1);
    expect(reset[1].fontSize).toBe(50);

    const resetBbox = getShapeBounds(reset[0]);
    expect(resetBbox?.width).toBeCloseTo(100, 0);
    expect(resetBbox?.height).toBeCloseTo(100, 0);
  });

  it('leaves shapes already at original scale untouched', () => {
    const shape: ConstructedShape = {
      id: 's1',
      pathData: 'M 100 100 L 200 100 L 200 200 L 100 200 Z',
      fillColor: '#fff',
      createdAt: 1,
      scale: 1,
    };
    const reset = resetShapesScale([shape]);
    expect(reset[0]).toBe(shape);
  });

  it('calculates anchor and factor for corner scaling', () => {
    const bbox = { x: 100, y: 100, width: 200, height: 100 };
    // SE corner anchor is top-left (100, 100)
    const seResult = calculateCornerScale('scale-se', bbox, { x: 300, y: 200 });
    expect(seResult.anchor).toEqual({ x: 100, y: 100 });
    expect(seResult.factor).toBeCloseTo(1.0, 2);

    // NW corner anchor is bottom-right (300, 200)
    const nwResult = calculateCornerScale('scale-nw', bbox, { x: 100, y: 100 });
    expect(nwResult.anchor).toEqual({ x: 300, y: 200 });
    expect(nwResult.factor).toBeCloseTo(1.0, 2);

    // Scaling SE outward by 10%
    const seScaled = calculateCornerScale('scale-se', bbox, { x: 320, y: 210 });
    expect(seScaled.factor).toBeCloseTo(1.1, 2);

    // Alt scales around center (200, 150)
    const altResult = calculateCornerScale('scale-se', bbox, { x: 300, y: 200 }, true);
    expect(altResult.anchor).toEqual({ x: 200, y: 150 });
  });

  it('computes correct centering delta and moves shape to artboard center', () => {
    const artboard = { x: 0, y: 0, width: 800, height: 800 };
    const shape = {
      id: 's1',
      pathData: 'M 100 100 L 300 100 L 300 300 L 100 300 Z',
      fillColor: '#ffffff',
      createdAt: 1,
    };
    const bbox = getShapesBoundingBox([shape])!;
    expect(bbox).not.toBeNull();
    const artboardCenter = {
      x: artboard.x + artboard.width / 2,
      y: artboard.y + artboard.height / 2,
    };
    const shapeCenter = {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2,
    };
    const dx = artboardCenter.x - shapeCenter.x;
    const dy = artboardCenter.y - shapeCenter.y;
    expect(dx).toBe(200);
    expect(dy).toBe(200);

    const centeredShape = moveConstructedShape(shape, dx, dy);
    const newBbox = getShapesBoundingBox([centeredShape])!;
    expect(newBbox.x + newBbox.width / 2).toBeCloseTo(400, 0);
    expect(newBbox.y + newBbox.height / 2).toBeCloseTo(400, 0);
  });

  it('computes artboard crop bounds with padding', () => {
    const shape = {
      id: 's1',
      pathData: 'M 200 250 L 500 250 L 500 400 L 200 400 Z',
      fillColor: '#ffffff',
      createdAt: 1,
    };
    const bbox = getShapesBoundingBox([shape])!;
    const padding = 50;
    const cropped = {
      x: Math.round(bbox.x - padding),
      y: Math.round(bbox.y - padding),
      width: Math.max(100, Math.round(bbox.width + padding * 2)),
      height: Math.max(100, Math.round(bbox.height + padding * 2)),
    };
    expect(cropped.x).toBe(150);
    expect(cropped.y).toBe(200);
    expect(cropped.width).toBe(400);
    expect(cropped.height).toBe(250);
  });

  describe('reorderShapes', () => {
    const s1 = { id: 's1', pathData: 'M0 0', fillColor: '#fff', createdAt: 1 };
    const s2 = { id: 's2', pathData: 'M1 1', fillColor: '#fff', createdAt: 2 };
    const s3 = { id: 's3', pathData: 'M2 2', fillColor: '#fff', createdAt: 3 };

    it('moves a shape up towards foreground', () => {
      const initial = [s1, s2, s3];
      const result = reorderShapes(initial, 's2', 'up');
      expect(result.map((s) => s.id)).toEqual(['s1', 's3', 's2']);
    });

    it('moves a shape down towards background', () => {
      const initial = [s1, s2, s3];
      const result = reorderShapes(initial, 's2', 'down');
      expect(result.map((s) => s.id)).toEqual(['s2', 's1', 's3']);
    });

    it('does not move shape up if already at top', () => {
      const initial = [s1, s2, s3];
      const result = reorderShapes(initial, 's3', 'up');
      expect(result).toBe(initial);
    });

    it('does not move shape down if already at bottom', () => {
      const initial = [s1, s2, s3];
      const result = reorderShapes(initial, 's1', 'down');
      expect(result).toBe(initial);
    });

    it('returns unchanged if shape id not found', () => {
      const initial = [s1, s2, s3];
      const result = reorderShapes(initial, 'unknown', 'up');
      expect(result).toBe(initial);
    });
  });

  describe('getCanvasViewBox', () => {
    it('centers standard 800x800 artboard horizontally and vertically with equal padding', () => {
      const artboard = { x: 0, y: 0, width: 800, height: 800 };
      const viewBox = getCanvasViewBox(artboard);
      expect(viewBox).toBe('-100 -100 1000 1000');
    });

    it('centers cropped artboard accurately', () => {
      const artboard = { x: 150, y: 200, width: 400, height: 250 };
      const viewBox = getCanvasViewBox(artboard);
      // cx = 350, cy = 325, viewSize = 1000
      // vx = 350 - 500 = -150, vy = 325 - 500 = -175
      expect(viewBox).toBe('-150 -175 1000 1000');
    });
  });

  describe('nudge / arrow key movement', () => {
    it('nudges circle and line guides by 1px and 10px', () => {
      const circle = createCircleGuide('c1', 100, 100, 50);
      const movedBy1 = moveGuide(circle, 1, 0);
      expect(movedBy1.cx).toBe(101);
      expect(movedBy1.cy).toBe(100);

      const movedBy10 = moveGuide(circle, 0, -10);
      expect(movedBy10.cx).toBe(100);
      expect(movedBy10.cy).toBe(90);

      const line = createLineGuide('l1', 10, 20, 30, 40);
      const movedLine = moveGuide(line, -1, 10);
      expect(movedLine.p1).toEqual({ x: 9, y: 30 });
      expect(movedLine.p2).toEqual({ x: 29, y: 50 });
    });

    it('nudges text and path constructed shapes by delta', () => {
      const textShape = {
        id: 't1',
        pathData: '',
        fillColor: '#fff',
        createdAt: 1,
        type: 'text' as const,
        x: 50,
        y: 80,
      };
      const movedText = moveConstructedShape(textShape, 10, -10);
      expect(movedText.x).toBe(60);
      expect(movedText.y).toBe(70);
    });
  });

  describe('resizeGuide (lengthen, shorten, scale)', () => {
    it('lengthens and shortens a line guide symmetrically around its midpoint', () => {
      // Horizontal line from (0, 50) to (100, 50), midpoint (50, 50), length 100
      const line = createLineGuide('l1', 0, 50, 100, 50);

      // Lengthen by factor 1.2 -> new length 120 (from -10 to 110)
      const lengthened = resizeGuide(line, 1.2);
      expect(lengthened.p1?.x).toBeCloseTo(-10, 4);
      expect(lengthened.p1?.y).toBeCloseTo(50, 4);
      expect(lengthened.p2?.x).toBeCloseTo(110, 4);
      expect(lengthened.p2?.y).toBeCloseTo(50, 4);

      // Shorten by factor 0.8 -> new length 80 (from 10 to 90)
      const shortened = resizeGuide(line, 0.8);
      expect(shortened.p1?.x).toBeCloseTo(10, 4);
      expect(shortened.p1?.y).toBeCloseTo(50, 4);
      expect(shortened.p2?.x).toBeCloseTo(90, 4);
      expect(shortened.p2?.y).toBeCloseTo(50, 4);
    });

    it('scales circle and parallel circle guides', () => {
      const circle = createCircleGuide('c1', 100, 100, 50);
      const scaledCircle = resizeGuide(circle, 1.1);
      expect(scaledCircle.rx).toBeCloseTo(55, 4);
      expect(scaledCircle.cx).toBe(100);
      expect(scaledCircle.cy).toBe(100);

      const parallelCircle = createParallelCircleGuide('pc1', 100, 100, 50, 20);
      const scaledParallelCircle = resizeGuide(parallelCircle, 0.9);
      expect(scaledParallelCircle.rx).toBeCloseTo(45, 4);
    });

    it('scales ellipse guides symmetrically', () => {
      const ellipse = createEllipseGuide('e1', 200, 200, 100, 50);
      const scaled = resizeGuide(ellipse, 1.2);
      expect(scaled.rx).toBeCloseTo(120, 4);
      expect(scaled.ry).toBeCloseTo(60, 4);
      expect(scaled.cx).toBe(200);
      expect(scaled.cy).toBe(200);
    });

    it('scales quad/rectangle guides symmetrically around centroid', () => {
      const quad = createQuadGuide('q1', [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]); // centroid (50, 50)
      const scaled = resizeGuide(quad, 1.5);
      expect(scaled.points?.[0]).toEqual({ x: -25, y: -25 });
      expect(scaled.points?.[1]).toEqual({ x: 125, y: -25 });
      expect(scaled.points?.[2]).toEqual({ x: 125, y: 125 });
      expect(scaled.points?.[3]).toEqual({ x: -25, y: 125 });
    });
  });
});

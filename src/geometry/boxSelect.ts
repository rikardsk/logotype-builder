import { Bounds2D, ConstructedShape, GuideShape, Point2D } from './types';
import { getPaperScope } from './paperScope';

export function isPointInBox(pt: Point2D, box: Bounds2D): boolean {
  return (
    pt.x >= box.x &&
    pt.x <= box.x + box.width &&
    pt.y >= box.y &&
    pt.y <= box.y + box.height
  );
}

export function doBoxesIntersect(b1: Bounds2D, b2: Bounds2D): boolean {
  return (
    b1.x < b2.x + b2.width &&
    b1.x + b1.width > b2.x &&
    b1.y < b2.y + b2.height &&
    b1.y + b1.height > b2.y
  );
}

export function isGuideInBox(guide: GuideShape, box: Bounds2D): boolean {
  if (guide.type === 'line' && guide.p1 && guide.p2) {
    if (isPointInBox(guide.p1, box) || isPointInBox(guide.p2, box)) return true;
    const minX = Math.min(guide.p1.x, guide.p2.x);
    const minY = Math.min(guide.p1.y, guide.p2.y);
    const lineBounds: Bounds2D = {
      x: minX,
      y: minY,
      width: Math.max(guide.p1.x, guide.p2.x) - minX,
      height: Math.max(guide.p1.y, guide.p2.y) - minY,
    };
    return doBoxesIntersect(lineBounds, box);
  }

  if (guide.points && guide.points.length > 0) {
    if (guide.points.some((p) => isPointInBox(p, box))) return true;
    const xs = guide.points.map((p) => p.x);
    const ys = guide.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const polyBounds: Bounds2D = {
      x: minX,
      y: minY,
      width: Math.max(...xs) - minX,
      height: Math.max(...ys) - minY,
    };
    return doBoxesIntersect(polyBounds, box);
  }

  if (guide.type === 'parallel-circle' && guide.cx !== undefined && guide.cy !== undefined) {
    const r = (guide.rx || 50) + (guide.spacing || 40) / 2;
    const guideBounds: Bounds2D = {
      x: guide.cx - r,
      y: guide.cy - r,
      width: r * 2,
      height: r * 2,
    };
    return doBoxesIntersect(guideBounds, box);
  }

  if (guide.cx !== undefined && guide.cy !== undefined) {
    const rx = guide.rx || 30;
    const ry = guide.ry || rx;
    const guideBounds: Bounds2D = {
      x: guide.cx - rx,
      y: guide.cy - ry,
      width: rx * 2,
      height: ry * 2,
    };
    return doBoxesIntersect(guideBounds, box);
  }

  return false;
}

export function isShapeInBox(shape: ConstructedShape, box: Bounds2D): boolean {
  if (shape.type === 'text') {
    const fs = shape.fontSize || 48;
    const textLen = (shape.text || '').length;
    const width = Math.max(fs, textLen * fs * 0.6);
    const height = fs;
    const textBounds: Bounds2D = {
      x: shape.x || 0,
      y: (shape.y || 0) - height * 0.8,
      width,
      height,
    };
    return doBoxesIntersect(textBounds, box);
  }
  if (!shape.pathData) return false;
  const scope = getPaperScope();
  scope.activate();
  const item = new scope.CompoundPath(shape.pathData);
  const b = item.bounds;
  const shapeBounds: Bounds2D = {
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
  };
  const intersects = doBoxesIntersect(shapeBounds, box);
  item.remove();
  return intersects;
}

export function findItemsInBox(
  guides: GuideShape[],
  shapes: ConstructedShape[],
  box: Bounds2D
): { guideIds: string[]; shapeIds: string[] } {
  const normalizedBox: Bounds2D = {
    x: box.width < 0 ? box.x + box.width : box.x,
    y: box.height < 0 ? box.y + box.height : box.y,
    width: Math.abs(box.width),
    height: Math.abs(box.height),
  };

  const guideIds = guides
    .filter((g) => isGuideInBox(g, normalizedBox))
    .map((g) => g.id);

  const shapeIds = shapes
    .filter((s) => isShapeInBox(s, normalizedBox))
    .map((s) => s.id);

  return { guideIds, shapeIds };
}

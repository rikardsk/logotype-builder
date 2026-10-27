import { ArtboardConfig, Bounds2D, ConstructedShape, GuideShape, Point2D } from './types';
import {
  createCircleGuide,
  createLineGuide,
  createQuadGuide,
  createParallelGuide,
  createParallelCircleGuide,
} from './scaffolds';
import { getPaperScope } from './paperScope';

export function snapPointTo45Degrees(
  origin: Point2D,
  target: Point2D
): Point2D {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return target;

  const angle = Math.atan2(dy, dx);
  const step = Math.PI / 4; // 45 degrees
  const snappedAngle = Math.round(angle / step) * step;

  return {
    x: Math.round(origin.x + dist * Math.cos(snappedAngle)),
    y: Math.round(origin.y + dist * Math.sin(snappedAngle)),
  };
}

export function createRotatedEllipseGuide(
  id: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation = 0
): GuideShape {
  const scope = getPaperScope();
  scope.activate();
  const rect = new scope.Rectangle(
    new scope.Point(cx - rx, cy - ry),
    new scope.Size(rx * 2, ry * 2)
  );
  const ellipse = new scope.Path.Ellipse(rect);
  if (rotation !== 0) ellipse.rotate(rotation);
  const pathData = ellipse.pathData || '';
  ellipse.remove();
  return { id, type: 'ellipse', pathData, cx, cy, rx, ry, rotation };
}

export function moveGuide(
  guide: GuideShape,
  dx: number,
  dy: number
): GuideShape {
  if (guide.type === 'line' && guide.p1 && guide.p2) {
    return createLineGuide(
      guide.id,
      guide.p1.x + dx,
      guide.p1.y + dy,
      guide.p2.x + dx,
      guide.p2.y + dy
    );
  }
  if (guide.type === 'parallel' && guide.p1 && guide.p2) {
    return createParallelGuide(
      guide.id,
      guide.p1.x + dx,
      guide.p1.y + dy,
      guide.p2.x + dx,
      guide.p2.y + dy,
      guide.spacing || 40
    );
  }
  if (guide.type === 'rect' && guide.points && guide.points.length === 4) {
    const moved = guide.points.map((p) => ({
      x: p.x + dx,
      y: p.y + dy,
    })) as [Point2D, Point2D, Point2D, Point2D];
    return createQuadGuide(guide.id, moved);
  }
  if (guide.cx !== undefined && guide.cy !== undefined) {
    const ncx = guide.cx + dx;
    const ncy = guide.cy + dy;
    if (guide.type === 'parallel-circle') {
      return createParallelCircleGuide(
        guide.id,
        ncx,
        ncy,
        guide.rx || 50,
        guide.spacing || 40
      );
    }
    if (guide.type === 'circle') {
      return createCircleGuide(guide.id, ncx, ncy, guide.rx || 50);
    }
    return createRotatedEllipseGuide(
      guide.id,
      ncx,
      ncy,
      guide.rx || 50,
      guide.ry || 30,
      guide.rotation || 0
    );
  }
  return guide;
}

export function getQuadCenter(points: Point2D[]): Point2D {
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function getQuadEdgeNormal(
  pA: Point2D,
  pB: Point2D,
  center: Point2D
): Point2D {
  const ev = { x: pB.x - pA.x, y: pB.y - pA.y };
  const len = Math.hypot(ev.x, ev.y);
  if (len < 0.001) return { x: 0, y: -1 };
  const u = { x: ev.x / len, y: ev.y / len };
  const n1 = { x: -u.y, y: u.x };
  const mid = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
  const toMid = { x: mid.x - center.x, y: mid.y - center.y };
  return n1.x * toMid.x + n1.y * toMid.y >= 0 ? n1 : { x: u.y, y: -u.x };
}

export function resizeQuadEdge(
  guide: GuideShape,
  edgeIndex: number,
  currentPt: Point2D,
  prevPt: Point2D
): GuideShape {
  if (guide.type !== 'rect' || !guide.points || guide.points.length !== 4) return guide;
  const center = getQuadCenter(guide.points);
  const idxA = edgeIndex;
  const idxB = (edgeIndex + 1) % 4;
  const normal = getQuadEdgeNormal(guide.points[idxA], guide.points[idxB], center);
  const dx = currentPt.x - prevPt.x;
  const dy = currentPt.y - prevPt.y;
  const shift = dx * normal.x + dy * normal.y;
  if (Math.abs(shift) < 1e-4) return guide;

  const updatedPoints = [...guide.points] as [Point2D, Point2D, Point2D, Point2D];
  updatedPoints[idxA] = {
    x: guide.points[idxA].x + normal.x * shift,
    y: guide.points[idxA].y + normal.y * shift,
  };
  updatedPoints[idxB] = {
    x: guide.points[idxB].x + normal.x * shift,
    y: guide.points[idxB].y + normal.y * shift,
  };
  return createQuadGuide(guide.id, updatedPoints);
}

export function rotateQuadGuide(
  guide: GuideShape,
  currentPt: Point2D,
  prevPt: Point2D
): GuideShape {
  if (guide.type !== 'rect' || !guide.points || guide.points.length !== 4) return guide;
  const center = getQuadCenter(guide.points);
  const a1 = Math.atan2(prevPt.y - center.y, prevPt.x - center.x);
  const a2 = Math.atan2(currentPt.y - center.y, currentPt.x - center.x);
  const delta = a2 - a1;
  if (Math.abs(delta) < 1e-6) return guide;

  const cos = Math.cos(delta);
  const sin = Math.sin(delta);
  const newPoints = guide.points.map((p) => {
    const rx = p.x - center.x;
    const ry = p.y - center.y;
    return {
      x: center.x + rx * cos - ry * sin,
      y: center.y + rx * sin + ry * cos,
    };
  }) as [Point2D, Point2D, Point2D, Point2D];

  return createQuadGuide(guide.id, newPoints);
}

export function updateQuadCorner(
  guide: GuideShape,
  cornerIndex: number,
  newPt: Point2D
): GuideShape {
  if (guide.type !== 'rect' || !guide.points || guide.points.length !== 4) {
    return guide;
  }
  const updatedPoints = [...guide.points] as [Point2D, Point2D, Point2D, Point2D];
  updatedPoints[cornerIndex] = newPt;
  return createQuadGuide(guide.id, updatedPoints);
}

export function updateLinePoint(
  guide: GuideShape,
  which: 'p1' | 'p2',
  pt: Point2D
): GuideShape {
  if (guide.type !== 'line' || !guide.p1 || !guide.p2) return guide;
  const p1 = which === 'p1' ? pt : guide.p1;
  const p2 = which === 'p2' ? pt : guide.p2;
  return createLineGuide(guide.id, p1.x, p1.y, p2.x, p2.y);
}

export function updateParallelPoint(
  guide: GuideShape,
  which: 'p1' | 'p2',
  pt: Point2D
): GuideShape {
  if (guide.type !== 'parallel' || !guide.p1 || !guide.p2) return guide;
  const p1 = which === 'p1' ? pt : guide.p1;
  const p2 = which === 'p2' ? pt : guide.p2;
  return createParallelGuide(guide.id, p1.x, p1.y, p2.x, p2.y, guide.spacing || 40);
}

export function rotateParallelGuide(
  guide: GuideShape,
  currentPt: Point2D,
  prevPt: Point2D
): GuideShape {
  if (guide.type !== 'parallel' || !guide.p1 || !guide.p2) return guide;
  const center = { x: (guide.p1.x + guide.p2.x) / 2, y: (guide.p1.y + guide.p2.y) / 2 };
  const a1 = Math.atan2(prevPt.y - center.y, prevPt.x - center.x);
  const a2 = Math.atan2(currentPt.y - center.y, currentPt.x - center.x);
  const delta = a2 - a1;
  if (Math.abs(delta) < 1e-6) return guide;

  const cos = Math.cos(delta);
  const sin = Math.sin(delta);
  const rotPoint = (p: Point2D) => {
    const rx = p.x - center.x;
    const ry = p.y - center.y;
    return { x: center.x + rx * cos - ry * sin, y: center.y + rx * sin + ry * cos };
  };

  const newP1 = rotPoint(guide.p1);
  const newP2 = rotPoint(guide.p2);
  return createParallelGuide(guide.id, newP1.x, newP1.y, newP2.x, newP2.y, guide.spacing || 40);
}

export function updateParallelSpacing(
  guide: GuideShape,
  currentPt: Point2D
): GuideShape {
  if (guide.type !== 'parallel' || !guide.p1 || !guide.p2) return guide;
  const dx = guide.p2.x - guide.p1.x;
  const dy = guide.p2.y - guide.p1.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) return guide;

  const nx = -dy / len;
  const ny = dx / len;
  const mid = { x: (guide.p1.x + guide.p2.x) / 2, y: (guide.p1.y + guide.p2.y) / 2 };
  const dist = Math.abs((currentPt.x - mid.x) * nx + (currentPt.y - mid.y) * ny);
  const spacing = Math.max(10, Math.round(dist * 2));

  return createParallelGuide(guide.id, guide.p1.x, guide.p1.y, guide.p2.x, guide.p2.y, spacing);
}

export function updateParallelCircleRadius(
  guide: GuideShape,
  currentPt: Point2D
): GuideShape {
  if (guide.type !== 'parallel-circle' || guide.cx === undefined || guide.cy === undefined) {
    return guide;
  }
  const dist = Math.hypot(currentPt.x - guide.cx, currentPt.y - guide.cy);
  const r = Math.max(15, Math.round(dist));
  return createParallelCircleGuide(guide.id, guide.cx, guide.cy, r, guide.spacing || 40);
}

export function updateParallelCircleSpacing(
  guide: GuideShape,
  currentPt: Point2D
): GuideShape {
  if (guide.type !== 'parallel-circle' || guide.cx === undefined || guide.cy === undefined) {
    return guide;
  }
  const dist = Math.hypot(currentPt.x - guide.cx, currentPt.y - guide.cy);
  const baseR = guide.rx || 50;
  const spacing = Math.max(10, Math.round(Math.abs(dist - baseR) * 2));
  return createParallelCircleGuide(guide.id, guide.cx, guide.cy, baseR, spacing);
}

export function resizeEllipseAxis(
  guide: GuideShape,
  axis: 'rx' | 'ry',
  currentPt: Point2D
): GuideShape {
  if (guide.cx === undefined || guide.cy === undefined) return guide;
  const rot = ((guide.rotation || 0) * Math.PI) / 180;
  const dx = currentPt.x - guide.cx;
  const dy = currentPt.y - guide.cy;
  const localX = dx * Math.cos(-rot) - dy * Math.sin(-rot);
  const localY = dx * Math.sin(-rot) + dy * Math.cos(-rot);

  if (guide.type === 'circle') {
    const dist = Math.hypot(dx, dy);
    return createCircleGuide(guide.id, guide.cx, guide.cy, Math.max(dist, 10));
  }

  const rx = axis === 'rx' ? Math.max(Math.abs(localX), 10) : (guide.rx || 50);
  const ry = axis === 'ry' ? Math.max(Math.abs(localY), 10) : (guide.ry || 30);

  return createRotatedEllipseGuide(
    guide.id,
    guide.cx,
    guide.cy,
    rx,
    ry,
    guide.rotation || 0
  );
}

export function rotateEllipseGuide(
  guide: GuideShape,
  currentPt: Point2D
): GuideShape {
  if (guide.cx === undefined || guide.cy === undefined) return guide;
  const angle =
    (Math.atan2(currentPt.y - guide.cy, currentPt.x - guide.cx) * 180) /
    Math.PI;
  const rotation = Math.round(angle + 90);

  return createRotatedEllipseGuide(
    guide.id,
    guide.cx,
    guide.cy,
    guide.rx || 50,
    guide.ry || 30,
    rotation
  );
}

export function moveConstructedShape(
  shape: ConstructedShape,
  dx: number,
  dy: number
): ConstructedShape {
  if (shape.type === 'text') {
    return {
      ...shape,
      x: (shape.x || 0) + dx,
      y: (shape.y || 0) + dy,
    };
  }
  if (!shape.pathData) return shape;
  const scope = getPaperScope();
  scope.activate();
  const item = new scope.CompoundPath(shape.pathData);
  item.translate(new scope.Point(dx, dy));
  const pathData = item.pathData || '';
  item.remove();
  return { ...shape, pathData };
}

export function getShapeBounds(shape: ConstructedShape): Bounds2D | null {
  if (shape.type === 'text') {
    const fs = shape.fontSize || 48;
    const textLen = (shape.text || '').length;
    const width = Math.max(fs, textLen * fs * 0.6);
    const height = fs;
    return {
      x: shape.x || 0,
      y: (shape.y || 0) - height * 0.8,
      width,
      height,
    };
  }
  if (!shape.pathData) return null;
  const scope = getPaperScope();
  scope.activate();
  const item = new scope.CompoundPath(shape.pathData);
  const b = item.bounds;
  const bounds: Bounds2D = {
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
  };
  item.remove();
  return bounds;
}

export function getShapesBoundingBox(shapes: ConstructedShape[]): Bounds2D | null {
  if (shapes.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let count = 0;

  for (const shape of shapes) {
    const b = getShapeBounds(shape);
    if (!b) continue;
    count++;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  if (count === 0) return null;
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

export function scaleConstructedShape(
  shape: ConstructedShape,
  factor: number,
  center: Point2D
): ConstructedShape {
  if (factor <= 0) return shape;
  if (shape.type === 'text') {
    const origX = shape.x || 0;
    const origY = shape.y || 0;
    const newX = center.x + (origX - center.x) * factor;
    const newY = center.y + (origY - center.y) * factor;
    const newFontSize = Math.max(8, Math.round((shape.fontSize || 48) * factor));
    return {
      ...shape,
      x: Math.round(newX),
      y: Math.round(newY),
      fontSize: newFontSize,
    };
  }
  if (!shape.pathData) return shape;
  const scope = getPaperScope();
  scope.activate();
  const item = new scope.CompoundPath(shape.pathData);
  item.scale(factor, new scope.Point(center.x, center.y));
  const pathData = item.pathData || '';
  item.remove();
  return { ...shape, pathData };
}

export function scaleConstructedShapes(
  shapes: ConstructedShape[],
  factor: number,
  center?: Point2D
): ConstructedShape[] {
  if (shapes.length === 0 || factor <= 0) return shapes;
  let c = center;
  if (!c) {
    const bbox = getShapesBoundingBox(shapes);
    c = bbox
      ? { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 }
      : { x: 400, y: 400 };
  }
  return shapes.map((s) => scaleConstructedShape(s, factor, c!));
}

function getCornerPoint(handle: string, bbox: Bounds2D): Point2D {
  if (handle === 'scale-se') return { x: bbox.x + bbox.width, y: bbox.y + bbox.height };
  if (handle === 'scale-nw') return { x: bbox.x, y: bbox.y };
  if (handle === 'scale-ne') return { x: bbox.x + bbox.width, y: bbox.y };
  return { x: bbox.x, y: bbox.y + bbox.height };
}

export function calculateCornerScale(
  handle: string,
  bbox: Bounds2D,
  pt: Point2D,
  isAlt = false
): { factor: number; anchor: Point2D } {
  if (isAlt) {
    const center = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
    const corner = getCornerPoint(handle, bbox);
    const initDist = Math.hypot(corner.x - center.x, corner.y - center.y);
    const curDist = Math.hypot(pt.x - center.x, pt.y - center.y);
    return { factor: initDist > 0 ? Math.max(0.05, curDist / initDist) : 1, anchor: center };
  }

  const initialCorner = getCornerPoint(handle, bbox);
  const oppositeHandle =
    handle === 'scale-se'
      ? 'scale-nw'
      : handle === 'scale-nw'
      ? 'scale-se'
      : handle === 'scale-ne'
      ? 'scale-sw'
      : 'scale-ne';
  const anchor = getCornerPoint(oppositeHandle, bbox);

  const origDx = initialCorner.x - anchor.x;
  const origDy = initialCorner.y - anchor.y;
  const origLen = Math.hypot(origDx, origDy);
  if (origLen < 0.001) return { factor: 1, anchor };

  const proj = (pt.x - anchor.x) * (origDx / origLen) + (pt.y - anchor.y) * (origDy / origLen);
  return { factor: Math.max(0.05, proj / origLen), anchor };
}

export function reorderShapes(
  shapes: ConstructedShape[],
  id: string,
  direction: 'up' | 'down'
): ConstructedShape[] {
  const index = shapes.findIndex((s) => s.id === id);
  if (index === -1) return shapes;
  const targetIndex = direction === 'up' ? index + 1 : index - 1;
  if (targetIndex < 0 || targetIndex >= shapes.length) return shapes;

  const next = [...shapes];
  const temp = next[index];
  next[index] = next[targetIndex];
  next[targetIndex] = temp;
  return next;
}

export function getCanvasViewBox(artboard: ArtboardConfig): string {
  const cx = artboard.x + artboard.width / 2;
  const cy = artboard.y + artboard.height / 2;
  const viewSize = Math.max(1000, Math.max(artboard.width, artboard.height) + 200);
  const vx = Math.round(cx - viewSize / 2);
  const vy = Math.round(cy - viewSize / 2);
  return `${vx} ${vy} ${viewSize} ${viewSize}`;
}



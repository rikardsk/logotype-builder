import { GuideShape, ConstructedShape, Point2D } from './types';
import { getPaperScope } from './paperScope';
import {
  createLineGuide,
  createParallelGuide,
  createQuadGuide,
  createCircleGuide,
  createParallelCircleGuide,
} from './scaffolds';
import { createRotatedEllipseGuide } from './guideTransforms';

export function mirrorPoint(
  pt: Point2D,
  center: Point2D,
  axis: 'horizontal' | 'vertical'
): Point2D {
  if (axis === 'horizontal') {
    return { x: Math.round(2 * center.x - pt.x), y: Math.round(pt.y) };
  }
  return { x: Math.round(pt.x), y: Math.round(2 * center.y - pt.y) };
}

export function mirrorPathData(
  pathData: string,
  center: Point2D,
  axis: 'horizontal' | 'vertical'
): string {
  if (!pathData) return '';
  const scope = getPaperScope();
  scope.activate();
  const item = new scope.CompoundPath(pathData);
  const sx = axis === 'horizontal' ? -1 : 1;
  const sy = axis === 'vertical' ? -1 : 1;
  item.scale(sx, sy, new scope.Point(center.x, center.y));
  const res = item.pathData || '';
  item.remove();
  return res;
}

export function mirrorConstructedShape(
  shape: ConstructedShape,
  center: Point2D,
  axis: 'horizontal' | 'vertical',
  newId?: string
): ConstructedShape {
  const id = newId || shape.id;
  if (shape.type === 'text') {
    const fs = shape.fontSize || 48;
    const len = (shape.text || '').length;
    const width = Math.max(fs, len * fs * 0.6);
    const origX = shape.x || 0;
    const origY = shape.y || 0;
    const newX = axis === 'horizontal' ? Math.round(2 * center.x - (origX + width)) : origX;
    const newY = axis === 'vertical' ? Math.round(2 * center.y - origY) : origY;
    return { ...shape, id, x: newX, y: newY, createdAt: Date.now() };
  }

  const pathData = mirrorPathData(shape.pathData, center, axis);
  let rawPathData = shape.rawPathData;
  if (rawPathData) {
    rawPathData = mirrorPathData(rawPathData, center, axis);
  }
  return { ...shape, id, pathData, rawPathData, createdAt: Date.now() };
}

export function mirrorGuide(
  guide: GuideShape,
  center: Point2D,
  axis: 'horizontal' | 'vertical',
  newId?: string
): GuideShape {
  const id = newId || guide.id;
  if (guide.type === 'line' && guide.p1 && guide.p2) {
    const p1 = mirrorPoint(guide.p1, center, axis);
    const p2 = mirrorPoint(guide.p2, center, axis);
    return createLineGuide(id, p1.x, p1.y, p2.x, p2.y);
  }
  if (guide.type === 'parallel' && guide.p1 && guide.p2) {
    const p1 = mirrorPoint(guide.p1, center, axis);
    const p2 = mirrorPoint(guide.p2, center, axis);
    return createParallelGuide(id, p1.x, p1.y, p2.x, p2.y, guide.spacing || 40);
  }
  if (guide.type === 'rect' && guide.points && guide.points.length === 4) {
    const pts = guide.points.map((p) => mirrorPoint(p, center, axis)) as [Point2D, Point2D, Point2D, Point2D];
    return createQuadGuide(id, pts);
  }
  if (guide.cx !== undefined && guide.cy !== undefined) {
    const n = mirrorPoint({ x: guide.cx, y: guide.cy }, center, axis);
    if (guide.type === 'parallel-circle') {
      return createParallelCircleGuide(id, n.x, n.y, guide.rx || 50, guide.spacing || 40);
    }
    if (guide.type === 'circle') {
      return createCircleGuide(id, n.x, n.y, guide.rx || 50);
    }
    const rot = (360 - (guide.rotation || 0)) % 360;
    return createRotatedEllipseGuide(id, n.x, n.y, guide.rx || 50, guide.ry || 30, rot);
  }
  return guide;
}

export function mirrorShapesBatch(
  allShapes: ConstructedShape[],
  targetIds: string[],
  center: Point2D,
  axis: 'horizontal' | 'vertical',
  duplicate: boolean,
  idPrefix: string
): { updatedShapes: ConstructedShape[]; newSelectedIds: string[] } {
  if (targetIds.length === 0) return { updatedShapes: allShapes, newSelectedIds: [] };
  const targetShapes = allShapes.filter((s) => targetIds.includes(s.id));
  if (duplicate) {
    const mirrored = targetShapes.map((s, i) =>
      mirrorConstructedShape(s, center, axis, `shape-mirror-${idPrefix}-${i}`)
    );
    return {
      updatedShapes: [...allShapes, ...mirrored],
      newSelectedIds: mirrored.map((s) => s.id),
    };
  }
  const map = new Map(targetShapes.map((s) => [s.id, mirrorConstructedShape(s, center, axis)]));
  return {
    updatedShapes: allShapes.map((s) => map.get(s.id) || s),
    newSelectedIds: targetIds,
  };
}

export function mirrorGuidesBatch(
  allGuides: GuideShape[],
  selectedIds: string[],
  center: Point2D,
  axis: 'horizontal' | 'vertical',
  duplicate: boolean,
  idPrefix: string
): { updatedGuides: GuideShape[]; newSelectedIds: string[] } {
  if (selectedIds.length === 0) return { updatedGuides: allGuides, newSelectedIds: [] };
  const targetGuides = allGuides.filter((g) => selectedIds.includes(g.id));
  if (duplicate) {
    const mirrored = targetGuides.map((g, i) =>
      mirrorGuide(g, center, axis, `guide-mirror-${idPrefix}-${i}`)
    );
    return {
      updatedGuides: [...allGuides, ...mirrored],
      newSelectedIds: mirrored.map((g) => g.id),
    };
  }
  const map = new Map(targetGuides.map((g) => [g.id, mirrorGuide(g, center, axis)]));
  return {
    updatedGuides: allGuides.map((g) => map.get(g.id) || g),
    newSelectedIds: selectedIds,
  };
}

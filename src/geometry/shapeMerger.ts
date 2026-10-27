import { getPaperScope, PathItem } from './paperScope';
import { Point2D } from './types';

export function mergeFacePaths(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) return paths[0];

  const scope = getPaperScope();
  scope.activate();

  let combined: PathItem = new scope.CompoundPath(paths[0]);
  for (let i = 1; i < paths.length; i++) {
    const nextItem = new scope.CompoundPath(paths[i]);
    const united = combined.unite(nextItem, { insert: false });
    combined.remove();
    nextItem.remove();
    combined = united;
  }

  const result = combined.pathData || '';
  combined.remove();
  return result;
}

export function subtractFaceFromShape(
  baseShapePath: string,
  facePathToSubtract: string
): string {
  if (!baseShapePath) return '';
  if (!facePathToSubtract) return baseShapePath;

  const scope = getPaperScope();
  scope.activate();

  const base = new scope.CompoundPath(baseShapePath);
  const cutter = new scope.CompoundPath(facePathToSubtract);
  const resultItem = base.subtract(cutter, { insert: false });

  base.remove();
  cutter.remove();
  const result = resultItem.pathData || '';
  resultItem.remove();
  return result;
}

export function isPointInPath(pathData: string, pt: Point2D): boolean {
  if (!pathData) return false;
  const scope = getPaperScope();
  scope.activate();

  const item = new scope.CompoundPath(pathData);
  const contains = item.contains(new scope.Point(pt.x, pt.y));
  item.remove();
  return contains;
}

export function doesSegmentCrossFace(
  facePathData: string,
  p1: Point2D,
  p2: Point2D
): boolean {
  if (!facePathData) return false;
  const scope = getPaperScope();
  scope.activate();

  const face = new scope.CompoundPath(facePathData);
  if (face.contains(new scope.Point(p1.x, p1.y))) {
    face.remove();
    return true;
  }
  if (face.contains(new scope.Point(p2.x, p2.y))) {
    face.remove();
    return true;
  }

  const line = new scope.Path.Line(
    new scope.Point(p1.x, p1.y),
    new scope.Point(p2.x, p2.y)
  );
  const intersections = face.getIntersections(line);
  line.remove();
  face.remove();
  return intersections.length > 0;
}

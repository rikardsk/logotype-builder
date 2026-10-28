import { getPaperScope, PaperScope, PathItem, Path } from './paperScope';
import { Point2D } from './types';

function cleanMicroscopicHoles(item: PathItem, scope: PaperScope): PathItem {
  if (item instanceof scope.Path) return item;
  if (!(item instanceof scope.CompoundPath)) return item;

  const valid = (item.children as Path[]).filter((c) => Math.abs(c.area) > 5);
  if (valid.length === 0) return item;
  if (valid.length === 1) {
    const single = valid[0].clone({ insert: false });
    item.remove();
    return single;
  }
  const cp = new scope.CompoundPath({ insert: false });
  for (const c of valid) {
    cp.addChild(c.clone({ insert: false }));
  }
  item.remove();
  return cp;
}

function greedyFuseItems(items: PathItem[]): PathItem {
  let combined = items[0];
  const pool = items.slice(1);

  while (pool.length > 0) {
    const expBounds = combined.bounds.expand(2);
    const idx = pool.findIndex((it) => it.bounds.intersects(expBounds));
    const nextIdx = idx >= 0 ? idx : 0;
    const next = pool.splice(nextIdx, 1)[0];

    const maxDim = Math.max(next.bounds.width, next.bounds.height, 10);
    next.scale(1 + 0.6 / maxDim, next.bounds.center);

    const united = combined.unite(next, { insert: false });
    combined.remove();
    next.remove();
    combined = united;
  }

  return combined;
}

export function mergeFacePaths(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) return paths[0];

  const scope = getPaperScope();
  scope.activate();

  const items: PathItem[] = paths
    .map((p) => new scope.CompoundPath(p))
    .filter((it) => !it.isEmpty() && Math.abs(it.area) > 0.1);

  if (items.length === 0) return '';
  if (items.length === 1) {
    const res = items[0].pathData || '';
    items[0].remove();
    return res;
  }

  const fused = greedyFuseItems(items);
  const cleaned = cleanMicroscopicHoles(fused, scope);
  const result = cleaned.pathData || '';
  cleaned.remove();
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

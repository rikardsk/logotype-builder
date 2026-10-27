import { AtomicFace, GuideShape, Point2D } from './types';
import {
  getPaperScope,
  PaperScope,
  PathItem,
  Path,
} from './paperScope';
import { decomposeGuidesWithPlanarGraph } from './planarGraphDecomposer';
import { getParallelEndpoints } from './scaffolds';

export function extractConnectedFaces(
  item: PathItem,
  scope: PaperScope
): PathItem[] {
  if (!item || item.isEmpty()) return [];
  if (item instanceof scope.Path) {
    return Math.abs(item.area) > 1 ? [item] : [];
  }
  if (!(item instanceof scope.CompoundPath)) return [];

  item.reorient();
  const children = (item.children as Path[]).filter(
    (c) => c instanceof scope.Path && Math.abs(c.area) > 1
  );
  if (children.length <= 1) return children;

  const outers = children.filter((c) => c.area > 0);
  const holes = children.filter((c) => c.area < 0);
  if (holes.length === 0) return outers;

  return outers.map((outer) => {
    const myHoles = holes.filter(
      (h) => outer.bounds.contains(h.bounds) && outer.contains(h.bounds.center)
    );
    if (myHoles.length === 0) return outer;

    const cp = new scope.CompoundPath({ insert: false });
    cp.addChild(outer.clone({ insert: false }));
    for (const h of myHoles) {
      cp.addChild(h.clone({ insert: false }));
    }
    return cp;
  });
}

function sliceFaceWithShape(
  face: PathItem,
  cutter: PathItem,
  scope: PaperScope
): PathItem[] {
  scope.activate();
  if (!face.bounds.intersects(cutter.bounds)) {
    return extractConnectedFaces(face, scope);
  }

  const inside = face.intersect(cutter, { insert: false });
  const outside = face.subtract(cutter, { insert: false });
  const result: PathItem[] = [
    ...extractConnectedFaces(inside, scope),
    ...extractConnectedFaces(outside, scope),
  ];

  face.remove();
  inside.remove();
  outside.remove();
  return result;
}

function processSingleShape(
  shape: PathItem,
  currentFaces: PathItem[],
  scope: PaperScope
): PathItem[] {
  scope.activate();
  let remainder: PathItem = shape.clone({ insert: false });
  const nextFaces: PathItem[] = [];

  for (const face of currentFaces) {
    if (!face.bounds.intersects(remainder.bounds)) {
      nextFaces.push(face);
      continue;
    }
    nextFaces.push(...sliceFaceWithShape(face, remainder, scope));
    const sub = remainder.subtract(face, { insert: false });
    remainder.remove();
    remainder = sub;
  }

  nextFaces.push(...extractConnectedFaces(remainder, scope));
  remainder.remove();
  return nextFaces;
}

function getLineSegments(guide: GuideShape): { p1: Point2D; p2: Point2D }[] {
  if (guide.type === 'line' && guide.p1 && guide.p2) {
    return [{ p1: guide.p1, p2: guide.p2 }];
  }
  if (guide.type === 'parallel' && guide.p1 && guide.p2) {
    const { line1, line2 } = getParallelEndpoints(guide.p1, guide.p2, guide.spacing || 40);
    return [line1, line2];
  }
  return [];
}

function sliceFaceWithLine(
  face: PathItem,
  p1: Point2D,
  p2: Point2D,
  scope: PaperScope
): PathItem[] {
  scope.activate();
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) return [face];

  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  const startX = p1.x - ux * 5000;
  const startY = p1.y - uy * 5000;
  const endX = p2.x + ux * 5000;
  const endY = p2.y + uy * 5000;

  const cutter = new scope.Path([
    new scope.Point(startX, startY),
    new scope.Point(endX, endY),
    new scope.Point(endX + nx * 5000, endY + ny * 5000),
    new scope.Point(startX + nx * 5000, startY + ny * 5000),
  ]);
  cutter.closePath();

  if (!face.bounds.intersects(cutter.bounds)) {
    cutter.remove();
    return [face];
  }

  const inside = face.intersect(cutter, { insert: false });
  const outside = face.subtract(cutter, { insert: false });
  cutter.remove();
  face.remove();

  const result: PathItem[] = [
    ...extractConnectedFaces(inside, scope),
    ...extractConnectedFaces(outside, scope),
  ];
  inside.remove();
  outside.remove();
  return result;
}

function decomposeClosedShapes(
  pathDataList: string[],
  scope: PaperScope
): PathItem[] {
  let atomicPaths: PathItem[] = [];

  for (const pathData of pathDataList) {
    const item = new scope.CompoundPath(pathData);
    if (!item || item.isEmpty() || Math.abs(item.area) < 1) continue;

    const subContours: PathItem[] =
      item.children && item.children.length > 1
        ? (item.children as Path[]).map((c) => c.clone({ insert: false }))
        : [item.clone({ insert: false })];
    item.remove();

    for (const contour of subContours) {
      const area = (contour as Path).area ?? contour.bounds.width * contour.bounds.height;
      if (contour.isEmpty() || Math.abs(area) < 1) {
        contour.remove();
        continue;
      }
      atomicPaths = processSingleShape(contour, atomicPaths, scope);
      contour.remove();
    }
  }

  return atomicPaths;
}

export function decomposeGuidesToAtomicFaces(guides: GuideShape[]): AtomicFace[] {
  if (guides.length === 0) return [];

  const lineGuides = guides.filter((g) => g.type === 'line' || g.type === 'parallel');
  const closedGuides = guides.filter((g) => g.type !== 'line' && g.type !== 'parallel');

  if (closedGuides.length === 0) {
    return decomposeGuidesWithPlanarGraph(guides);
  }

  const scope = getPaperScope();
  scope.activate();
  scope.project.clear();

  const lineCells = lineGuides.length >= 3 ? decomposeGuidesWithPlanarGraph(lineGuides) : [];
  const allShapesData = [
    ...closedGuides.map((g) => g.pathData).filter(Boolean),
    ...lineCells.map((c) => c.pathData),
  ];

  let atomicPaths = decomposeClosedShapes(allShapesData, scope);

  for (const guide of lineGuides) {
    for (const seg of getLineSegments(guide)) {
      const nextAtomic: PathItem[] = [];
      for (const face of atomicPaths) {
        nextAtomic.push(...sliceFaceWithLine(face, seg.p1, seg.p2, scope));
      }
      atomicPaths = nextAtomic;
    }
  }

  return atomicPaths.map((p, index) => ({
    id: `face-${index}`,
    pathData: p.pathData,
    bounds: {
      x: p.bounds.x,
      y: p.bounds.y,
      width: p.bounds.width,
      height: p.bounds.height,
    },
    center: {
      x: p.bounds.center.x,
      y: p.bounds.center.y,
    },
  }));
}

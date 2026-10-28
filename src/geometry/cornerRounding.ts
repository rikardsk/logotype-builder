import { getPaperScope } from './paperScope';
import { ConstructedShape } from './types';
import paper from 'paper';

interface CornerFillet {
  pStart: paper.Point;
  pEnd: paper.Point;
  pMid: paper.Point;
  effectiveD: number;
}

function calculateCornerFillet(
  seg: paper.Segment,
  prevSeg: paper.Segment,
  nextSeg: paper.Segment,
  prevCurve: paper.Curve,
  nextCurve: paper.Curve,
  radius: number
): CornerFillet | null {
  const tIn = seg.handleIn.isZero() ? seg.point.subtract(prevSeg.point) : seg.handleIn.multiply(-1);
  const tOut = seg.handleOut.isZero() ? nextSeg.point.subtract(seg.point) : seg.handleOut;
  if (tIn.length < 1e-4 || tOut.length < 1e-4) return null;

  const dIn = tIn.normalize();
  const dOut = tOut.normalize();
  if (dIn.dot(dOut) > 0.99) return null;

  const u1 = dIn.multiply(-1);
  const u2 = dOut;
  const cosAlpha = Math.max(-1, Math.min(1, u1.dot(u2)));
  const alpha = Math.acos(cosAlpha);
  if (alpha < 0.05 || alpha > Math.PI - 0.05) return null;

  const tanHalf = Math.tan(alpha / 2);
  if (tanHalf < 1e-4) return null;

  const maxD = Math.min(prevCurve.length * 0.45, nextCurve.length * 0.45);
  const effectiveD = Math.min(radius / tanHalf, maxD);
  const effectiveR = effectiveD * tanHalf;
  if (effectiveD < 0.5) return null;

  const pStart = seg.point.add(u1.multiply(effectiveD));
  const pEnd = seg.point.add(u2.multiply(effectiveD));
  const bisector = u1.add(u2).normalize();
  const pCenter = seg.point.add(bisector.multiply(effectiveR / Math.sin(alpha / 2)));
  const pMid = pCenter.subtract(bisector.multiply(effectiveR));
  return { pStart, pEnd, pMid, effectiveD };
}

function appendCurveBetweenCorners(
  result: paper.Path,
  curve: paper.Curve,
  cCurr: CornerFillet | null,
  cNext: CornerFillet | null,
  nextPt: paper.Point
): void {
  if (curve.isStraight()) {
    result.lineTo(cNext ? cNext.pStart : nextPt);
    return;
  }
  const dStart = cCurr ? cCurr.effectiveD : 0;
  const dEnd = cNext ? curve.length - cNext.effectiveD : curve.length;
  if (dEnd <= dStart + 0.5) return;
  const midPt = curve.getPointAt((dStart + dEnd) / 2);
  const targetPt = cNext ? cNext.pStart : nextPt;
  result.curveTo(midPt, targetPt);
}

function filletSinglePath(path: paper.Path, radius: number): paper.Path {
  if (radius <= 0 || path.segments.length < 3) return path.clone({ insert: false });
  const n = path.segments.length;
  const corners: (CornerFillet | null)[] = [];
  for (let i = 0; i < n; i++) {
    const prevSeg = path.segments[(i - 1 + n) % n];
    const nextSeg = path.segments[(i + 1) % n];
    const prevCurve = path.curves[(i - 1 + n) % n];
    const nextCurve = path.curves[i];
    corners.push(calculateCornerFillet(path.segments[i], prevSeg, nextSeg, prevCurve, nextCurve, radius));
  }
  if (!corners.some(Boolean)) return path.clone({ insert: false });

  const result = new paper.Path({ closed: path.closed, insert: false });
  for (let i = 0; i < n; i++) {
    const cCurr = corners[i];
    const nextI = (i + 1) % n;
    const cNext = corners[nextI];
    if (cCurr) {
      if (result.segments.length === 0) result.moveTo(cCurr.pStart);
      result.arcTo(cCurr.pMid, cCurr.pEnd);
    } else if (result.segments.length === 0) {
      result.moveTo(path.segments[i].point);
    }
    appendCurveBetweenCorners(result, path.curves[i], cCurr, cNext, path.segments[nextI].point);
  }
  result.closePath();
  return result;
}

export function filletPathData(pathData: string, radius: number): string {
  if (!pathData || radius <= 0) return pathData;
  const scope = getPaperScope();
  scope.activate();

  const item = new scope.CompoundPath(pathData);
  const isCompound = item instanceof scope.CompoundPath && item.children.length > 1;
  const subPaths = (item.children && item.children.length > 0)
    ? (item.children as paper.Path[])
    : [item as unknown as paper.Path];

  const processed = subPaths.map((p) => filletSinglePath(p, radius));
  let resultSvg = '';
  if (isCompound) {
    const cp = new scope.CompoundPath({ insert: false });
    for (const p of processed) cp.addChild(p);
    resultSvg = cp.pathData || '';
    cp.remove();
  } else if (processed.length > 0) {
    resultSvg = processed[0].pathData || '';
    processed[0].remove();
  }
  item.remove();
  return resultSvg || pathData;
}

export function roundShapeCorners(
  shape: ConstructedShape,
  radius: number
): ConstructedShape {
  if (shape.type === 'text' || !shape.pathData) return shape;
  const rawPath = shape.rawPathData || shape.pathData;
  if (radius <= 0) {
    return {
      ...shape,
      pathData: rawPath,
      rawPathData: undefined,
      cornerRadius: 0,
    };
  }
  const filleted = filletPathData(rawPath, radius);
  return {
    ...shape,
    pathData: filleted,
    rawPathData: rawPath,
    cornerRadius: radius,
  };
}

export function roundShapesCorners(
  shapes: ConstructedShape[],
  radius: number
): ConstructedShape[] {
  if (shapes.length === 0) return shapes;
  return shapes.map((s) => roundShapeCorners(s, radius));
}

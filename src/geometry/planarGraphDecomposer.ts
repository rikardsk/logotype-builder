import { AtomicFace, GuideShape } from './types';
import { getPaperScope, PaperScope } from './paperScope';
import { getParallelEndpoints } from './scaffolds';

interface DirectedEdge {
  from: number;
  to: number;
  angle: number;
  twin: DirectedEdge | null;
  next: DirectedEdge | null;
  visited: boolean;
}

function guideToRawSegments(
  guide: GuideShape,
  scope: PaperScope
): [paper.Point, paper.Point][] {
  if (guide.type === 'line' && guide.p1 && guide.p2) {
    return [
      [
        new scope.Point(guide.p1.x, guide.p1.y),
        new scope.Point(guide.p2.x, guide.p2.y),
      ],
    ];
  }
  if (guide.type === 'parallel' && guide.p1 && guide.p2) {
    const { line1, line2 } = getParallelEndpoints(guide.p1, guide.p2, guide.spacing || 40);
    return [
      [new scope.Point(line1.p1.x, line1.p1.y), new scope.Point(line1.p2.x, line1.p2.y)],
      [new scope.Point(line2.p1.x, line2.p1.y), new scope.Point(line2.p2.x, line2.p2.y)],
    ];
  }
  if (guide.type === 'rect' && guide.points && guide.points.length === 4) {
    const pts = guide.points.map((p) => new scope.Point(p.x, p.y));
    return [
      [pts[0], pts[1]],
      [pts[1], pts[2]],
      [pts[2], pts[3]],
      [pts[3], pts[0]],
    ];
  }
  return pathDataToSegments(guide.pathData, scope);
}

function pathDataToSegments(
  pathData: string,
  scope: PaperScope
): [paper.Point, paper.Point][] {
  if (!pathData) return [];
  const item = new scope.CompoundPath(pathData);
  item.flatten(3);
  const segments: [paper.Point, paper.Point][] = [];

  for (const child of item.children) {
    if (!(child instanceof scope.Path)) continue;
    const count = child.segments.length;
    for (let i = 0; i < count - 1; i++) {
      segments.push([child.segments[i].point, child.segments[i + 1].point]);
    }
    if (child.closed && count > 1) {
      segments.push([child.lastSegment.point, child.firstSegment.point]);
    }
  }
  item.remove();
  return segments;
}

function getSegmentIntersection(
  p1: paper.Point,
  p2: paper.Point,
  p3: paper.Point,
  p4: paper.Point,
  scope: PaperScope
): paper.Point | null {
  const dx12 = p2.x - p1.x;
  const dy12 = p2.y - p1.y;
  const dx34 = p4.x - p3.x;
  const dy34 = p4.y - p3.y;
  const denom = dy34 * dx12 - dx34 * dy12;
  if (Math.abs(denom) < 1e-9) return null;

  const dx13 = p1.x - p3.x;
  const dy13 = p1.y - p3.y;
  const ua = (dx34 * dy13 - dy34 * dx13) / denom;
  const ub = (dx12 * dy13 - dy12 * dx13) / denom;
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return new scope.Point(p1.x + ua * dx12, p1.y + ua * dy12);
  }
  return null;
}

function splitSegmentWithIntersections(
  base: [paper.Point, paper.Point],
  all: [paper.Point, paper.Point][],
  scope: PaperScope
): [paper.Point, paper.Point][] {
  const pts: paper.Point[] = [base[0], base[1]];

  for (const other of all) {
    const hit = getSegmentIntersection(base[0], base[1], other[0], other[1], scope);
    if (hit) pts.push(hit);
  }

  const dir = base[1].subtract(base[0]);
  pts.sort((a, b) => a.subtract(base[0]).dot(dir) - b.subtract(base[0]).dot(dir));

  const unique = pts.filter(
    (p, idx) => !pts.slice(0, idx).some((u) => u.getDistance(p) < 0.25)
  );
  const result: [paper.Point, paper.Point][] = [];
  for (let k = 0; k < unique.length - 1; k++) {
    if (unique[k].getDistance(unique[k + 1]) >= 0.25) {
      result.push([unique[k], unique[k + 1]]);
    }
  }
  return result;
}

function deduplicateSegments(
  segments: [paper.Point, paper.Point][]
): [paper.Point, paper.Point][] {
  const deduped: [paper.Point, paper.Point][] = [];
  for (const [p1, p2] of segments) {
    const exists = deduped.some(
      ([a, b]) =>
        (a.getDistance(p1) < 0.25 && b.getDistance(p2) < 0.25) ||
        (a.getDistance(p2) < 0.25 && b.getDistance(p1) < 0.25)
    );
    if (!exists) deduped.push([p1, p2]);
  }
  return deduped;
}

function buildGraphVertices(
  segments: [paper.Point, paper.Point][]
): { vertices: paper.Point[]; edges: DirectedEdge[] } {
  const vertices: paper.Point[] = [];
  const getVertex = (p: paper.Point): number => {
    const idx = vertices.findIndex((v) => v.getDistance(p) < 0.25);
    if (idx >= 0) return idx;
    vertices.push(p);
    return vertices.length - 1;
  };

  const edges: DirectedEdge[] = [];
  for (const [p1, p2] of segments) {
    const u = getVertex(p1);
    const v = getVertex(p2);
    if (u === v) continue;
    const e1: DirectedEdge = {
      from: u,
      to: v,
      angle: Math.atan2(p2.y - p1.y, p2.x - p1.x),
      twin: null,
      next: null,
      visited: false,
    };
    const e2: DirectedEdge = {
      from: v,
      to: u,
      angle: Math.atan2(p1.y - p2.y, p1.x - p2.x),
      twin: e1,
      next: null,
      visited: false,
    };
    e1.twin = e2;
    edges.push(e1, e2);
  }
  return { vertices, edges };
}

function linkDirectedEdges(
  verticesCount: number,
  edges: DirectedEdge[]
): void {
  const outgoing: DirectedEdge[][] = Array.from(
    { length: verticesCount },
    () => []
  );
  for (const e of edges) outgoing[e.from].push(e);
  for (const list of outgoing) list.sort((a, b) => a.angle - b.angle);

  for (const e of edges) {
    if (!e.twin) continue;
    const outList = outgoing[e.to];
    const twinIdx = outList.indexOf(e.twin);
    const nextIdx = (twinIdx - 1 + outList.length) % outList.length;
    e.next = outList[nextIdx];
  }
}

function calculateSignedArea(pts: paper.Point[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return area / 2;
}

function cycleToAtomicFace(
  cycle: paper.Point[],
  index: number
): AtomicFace {
  const d = `M ${cycle[0].x} ${cycle[0].y} ` +
    cycle.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') + ' Z';

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;

  for (const p of cycle) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
    sumX += p.x;
    sumY += p.y;
  }

  return {
    id: `graph-face-${index}`,
    pathData: d,
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    center: {
      x: sumX / cycle.length,
      y: sumY / cycle.length,
    },
  };
}

export function decomposeGuidesWithPlanarGraph(
  guides: GuideShape[]
): AtomicFace[] {
  if (guides.length === 0) return [];
  const scope = getPaperScope();
  scope.activate();

  const rawSegments: [paper.Point, paper.Point][] = [];
  for (const guide of guides) {
    rawSegments.push(...guideToRawSegments(guide, scope));
  }
  if (rawSegments.length === 0) return [];

  const splitSegments: [paper.Point, paper.Point][] = [];
  for (const seg of rawSegments) {
    splitSegments.push(...splitSegmentWithIntersections(seg, rawSegments, scope));
  }

  const deduped = deduplicateSegments(splitSegments);
  const { vertices, edges } = buildGraphVertices(deduped);
  linkDirectedEdges(vertices.length, edges);

  const faces: AtomicFace[] = [];
  for (const e of edges) {
    if (e.visited) continue;
    const cycle: paper.Point[] = [];
    let curr: DirectedEdge | null = e;

    while (curr && !curr.visited) {
      curr.visited = true;
      cycle.push(vertices[curr.from]);
      curr = curr.next;
      if (cycle.length > 250) break;
    }

    if (cycle.length >= 3 && curr === e) {
      const area = calculateSignedArea(cycle);
      if (area > 15) {
        faces.push(cycleToAtomicFace(cycle, faces.length));
      }
    }
  }
  return faces;
}

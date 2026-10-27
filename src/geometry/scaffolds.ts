import { GuideShape, Point2D, ScaffoldConfig } from './types';

export function getParallelEndpoints(
  p1: Point2D,
  p2: Point2D,
  spacing: number
): { line1: { p1: Point2D; p2: Point2D }; line2: { p1: Point2D; p2: Point2D } } {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  const half = spacing / 2;
  const nx = len > 0.001 ? (dy / len) * half : 0;
  const ny = len > 0.001 ? (-dx / len) * half : -half;

  return {
    line1: {
      p1: { x: p1.x + nx, y: p1.y + ny },
      p2: { x: p2.x + nx, y: p2.y + ny },
    },
    line2: {
      p1: { x: p1.x - nx, y: p1.y - ny },
      p2: { x: p2.x - nx, y: p2.y - ny },
    },
  };
}

export function createParallelGuide(
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  spacing = 40
): GuideShape {
  const p1 = { x: x1, y: y1 };
  const p2 = { x: x2, y: y2 };
  const { line1, line2 } = getParallelEndpoints(p1, p2, spacing);
  const d = `M ${line1.p1.x} ${line1.p1.y} L ${line1.p2.x} ${line1.p2.y} M ${line2.p1.x} ${line2.p1.y} L ${line2.p2.x} ${line2.p2.y}`;
  return {
    id,
    type: 'parallel',
    pathData: d,
    p1,
    p2,
    spacing,
    points: [line1.p1, line1.p2, line2.p2, line2.p1],
  };
}

export function createQuadGuide(
  id: string,
  points: [Point2D, Point2D, Point2D, Point2D]
): GuideShape {
  const d = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;
  return { id, type: 'rect', pathData: d, points };
}

export function createLineGuide(
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): GuideShape {
  const d = `M ${x1} ${y1} L ${x2} ${y2}`;
  return {
    id,
    type: 'line',
    pathData: d,
    p1: { x: x1, y: y1 },
    p2: { x: x2, y: y2 },
  };
}

export function createCircleGuide(
  id: string,
  cx: number,
  cy: number,
  r: number
): GuideShape {
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
  return {
    id,
    type: 'circle',
    pathData: d,
    cx,
    cy,
    rx: r,
    ry: r,
  };
}

export function createParallelCircleGuide(
  id: string,
  cx: number,
  cy: number,
  r: number,
  spacing = 40
): GuideShape {
  const half = spacing / 2;
  const r1 = Math.max(5, Math.round(r - half));
  const r2 = Math.max(r1 + 5, Math.round(r + half));
  const d1 = `M ${cx - r1} ${cy} A ${r1} ${r1} 0 1 0 ${cx + r1} ${cy} A ${r1} ${r1} 0 1 0 ${cx - r1} ${cy} Z`;
  const d2 = `M ${cx - r2} ${cy} A ${r2} ${r2} 0 1 0 ${cx + r2} ${cy} A ${r2} ${r2} 0 1 0 ${cx - r2} ${cy} Z`;
  return {
    id,
    type: 'parallel-circle',
    pathData: `${d1} ${d2}`,
    cx,
    cy,
    rx: r,
    ry: r,
    spacing,
  };
}

export function createEllipseGuide(
  id: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): GuideShape {
  const d = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
  return {
    id,
    type: 'ellipse',
    pathData: d,
    cx,
    cy,
    rx,
    ry,
  };
}

export function createPolygonGuide(
  id: string,
  points: [number, number][]
): GuideShape {
  if (points.length === 0) return { id, type: 'polygon', pathData: '' };
  const d = `M ${points[0][0]} ${points[0][1]} ${points
    .slice(1)
    .map((p) => `L ${p[0]} ${p[1]}`)
    .join(' ')} Z`;
  return { id, type: 'polygon', pathData: d };
}

export function generateConcentricCirclesScaffold(): ScaffoldConfig {
  const cx = 400;
  const cy = 400;
  const radii = [70, 120, 180, 240, 300];
  const guides: GuideShape[] = radii.map((r, i) =>
    createCircleGuide(`concentric-${i}`, cx, cy, r)
  );
  guides.push(createCircleGuide('tangent-left', cx - 120, cy, 120));
  guides.push(createCircleGuide('tangent-right', cx + 120, cy, 120));
  return {
    id: 'concentric-rings',
    name: 'Concentric & Tangents',
    description: 'Golden ratio rings and tangent circles for modern tech emblems',
    iconName: 'Target',
    guides,
  };
}

export function generateFlowerOfLifeScaffold(): ScaffoldConfig {
  const cx = 400;
  const cy = 400;
  const r = 130;
  const guides: GuideShape[] = [createCircleGuide('center-circle', cx, cy, r)];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 * Math.PI) / 180;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    guides.push(createCircleGuide(`petal-${i}`, px, py, r));
  }
  return {
    id: 'flower-of-life',
    name: 'Flower of Life',
    description: 'Classic 7-circle sacred geometry grid for harmonious symbols',
    iconName: 'CircleDot',
    guides,
  };
}

export function generateVennScaffold(): ScaffoldConfig {
  const cx = 400;
  const cy = 400;
  const r = 150;
  const offset = 95;
  const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
  const guides: GuideShape[] = angles.map((ang, i) => {
    const px = cx + offset * Math.cos(ang - Math.PI / 2);
    const py = cy + offset * Math.sin(ang - Math.PI / 2);
    return createCircleGuide(`venn-${i}`, px, py, r);
  });
  return {
    id: 'venn-triad',
    name: 'Tri-Circle Venn',
    description: 'Triple overlapping circles for balanced interlocking marks',
    iconName: 'Layers',
    guides,
  };
}

export function generateIsometricGridScaffold(): ScaffoldConfig {
  const cx = 400;
  const cy = 400;
  const size = 65;
  const guides: GuideShape[] = [];
  const coords = [
    [-1, -1], [0, -1], [1, -1],
    [-1.5, 0], [-0.5, 0], [0.5, 0], [1.5, 0],
    [-1, 1], [0, 1], [1, 1],
  ];

  coords.forEach(([col, row], i) => {
    const px = cx + col * size * Math.sqrt(3);
    const py = cy + row * size * 1.5;
    const points: [number, number][] = [];
    for (let j = 0; j < 6; j++) {
      const angle = (j * 60 * Math.PI) / 180;
      points.push([px + size * Math.cos(angle), py + size * Math.sin(angle)]);
    }
    guides.push(createPolygonGuide(`hex-${i}`, points));
  });

  return {
    id: 'isometric-hex',
    name: 'Isometric Hex Grid',
    description: '3D isometric hexagonal cells for monograms and geometric icons',
    iconName: 'Hexagon',
    guides,
  };
}

export function generateModularGridScaffold(): ScaffoldConfig {
  const cx = 400;
  const cy = 400;
  const cellSize = 60;
  const count = 5;
  const startX = cx - (count * cellSize) / 2;
  const startY = cy - (count * cellSize) / 2;
  const guides: GuideShape[] = [];

  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const points: [number, number][] = [
        [x, y],
        [x + cellSize, y],
        [x + cellSize, y + cellSize],
        [x, y + cellSize],
      ];
      guides.push(createPolygonGuide(`cell-${r}-${c}`, points));
    }
  }

  return {
    id: 'modular-5x5',
    name: '5x5 Typographic Grid',
    description: 'Modular display grid for custom letters, numbers and monograms',
    iconName: 'Grid',
    guides,
  };
}

export function generateCustomScaffold(): ScaffoldConfig {
  return {
    id: 'custom-scaffold',
    name: 'Freeform Tracing',
    description: 'Draw crossing lines, circles and ellipses over your reference image',
    iconName: 'PenTool',
    guides: [],
  };
}

export const SCAFFOLD_PRESETS: ScaffoldConfig[] = [
  generateCustomScaffold(),
  generateFlowerOfLifeScaffold(),
  generateConcentricCirclesScaffold(),
  generateVennScaffold(),
  generateIsometricGridScaffold(),
  generateModularGridScaffold(),
];

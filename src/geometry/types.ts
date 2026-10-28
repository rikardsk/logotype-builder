export interface Point2D {
  x: number;
  y: number;
}

export interface Bounds2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArtboardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AtomicFace {
  id: string;
  pathData: string;
  bounds: Bounds2D;
  center: Point2D;
}

export interface ConstructedShape {
  id: string;
  pathData: string;
  fillColor: string;
  createdAt: number;
  type?: 'path' | 'text';
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  originalFontSize?: number;
  fontWeight?: string | number;
  x?: number;
  y?: number;
  letterSpacing?: number;
  visible?: boolean;
  scale?: number;
  rawPathData?: string;
  cornerRadius?: number;
}

export interface GuideShape {
  id: string;
  type: 'circle' | 'rect' | 'line' | 'ellipse' | 'polygon' | 'parallel' | 'parallel-circle';
  pathData: string;
  p1?: Point2D;
  p2?: Point2D;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  rotation?: number;
  points?: Point2D[];
  spacing?: number;
  strokeColor?: string;
  strokeWidth?: number;
  isLocked?: boolean;
}

export interface BackgroundImageConfig {
  url: string;
  opacity: number;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export type BuilderMode =
  | 'merge'
  | 'subtract'
  | 'draw-line'
  | 'draw-parallel'
  | 'draw-circle'
  | 'draw-parallel-circle'
  | 'draw-ellipse'
  | 'draw-rect'
  | 'text'
  | 'select';

export interface ScaffoldConfig {
  id: string;
  name: string;
  description: string;
  iconName: string;
  guides: GuideShape[];
}

export interface LogoProjectData {
  version: number;
  app: 'LogoBuilder';
  createdAt?: number;
  artboard: ArtboardConfig;
  canvasBackground: string;
  guides: GuideShape[];
  constructedShapes: ConstructedShape[];
  currentScaffold?: ScaffoldConfig | null;
  backgroundImage?: BackgroundImageConfig | null;
}

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { UploadCloud } from 'lucide-react';
import {
  AtomicFace,
  ArtboardConfig,
  BackgroundImageConfig,
  Bounds2D,
  BuilderMode,
  ConstructedShape,
  GuideShape,
  Point2D,
  LogoProjectData,
} from '../../geometry/types';
import {
  parseProjectFile,
  parseGenericSvgToShapes,
} from '../../geometry/projectSerialization';
import {
  createCircleGuide,
  createEllipseGuide,
  createLineGuide,
  createQuadGuide,
  createParallelGuide,
  createParallelCircleGuide,
  getParallelEndpoints,
} from '../../geometry/scaffolds';
import {
  moveGuide,
  updateLinePoint,
  resizeEllipseAxis,
  rotateEllipseGuide,
  moveConstructedShape,
  snapPointTo45Degrees,
  updateQuadCorner,
  resizeQuadEdge,
  rotateQuadGuide,
  getQuadCenter,
  updateParallelPoint,
  rotateParallelGuide,
  updateParallelSpacing,
  updateParallelCircleRadius,
  updateParallelCircleSpacing,
  getShapesBoundingBox,
  scaleConstructedShape,
  calculateCornerScale,
  getCanvasViewBox,
} from '../../geometry/guideTransforms';
import { findItemsInBox } from '../../geometry/boxSelect';
import { HatchPatterns } from './HatchPatterns';

interface CanvasProps {
  guides: GuideShape[];
  atomicFaces: AtomicFace[];
  constructedShapes: ConstructedShape[];
  mode: BuilderMode;
  isAltHeld: boolean;
  showGuides: boolean;
  showShapeOutlines?: boolean;
  pan: Point2D;
  zoom: number;
  selectedGuideIds: string[];
  selectedShapeIds: string[];
  selectedColor?: string;
  canvasBackground?: string;
  artboard?: ArtboardConfig;
  backgroundImage: BackgroundImageConfig | null;
  onPanChange: (pan: Point2D) => void;
  onZoomChange: (zoom: number) => void;
  onMergeFaceIds: (faceIds: string[]) => void;
  onSubtractFaceIds: (faceIds: string[]) => void;
  onAddGuide: (guide: GuideShape) => void;
  onAddConstructedShape?: (shape: ConstructedShape) => void;
  onCommitBatchGuidesTransform: (guides: GuideShape[]) => void;
  onCommitBatchShapesTransform: (shapes: ConstructedShape[]) => void;
  onSelectGuideIds: (ids: string[]) => void;
  onSelectShapeIds: (ids: string[]) => void;
  onDeleteSelected: () => void;
  onSetBackgroundImage: (url: string, width?: number, height?: number) => void;
  onLoadProject?: (project: LogoProjectData) => void;
}

function loadAndFitImage(
  url: string,
  onSet: (url: string, w: number, h: number) => void
): void {
  const img = new Image();
  img.onload = () => {
    const maxDim = 800;
    const origW = img.naturalWidth || 800;
    const origH = img.naturalHeight || 800;
    const ratio = Math.min(maxDim / origW, maxDim / origH);
    onSet(url, Math.round(origW * ratio), Math.round(origH * ratio));
  };
  img.onerror = () => onSet(url, 800, 800);
  img.src = url;
}

export const ShapeBuilderCanvas: React.FC<CanvasProps> = ({
  guides,
  atomicFaces,
  constructedShapes,
  mode,
  isAltHeld,
  showGuides,
  showShapeOutlines = true,
  pan,
  zoom,
  selectedGuideIds,
  selectedShapeIds,
  selectedColor,
  canvasBackground = '#121316',
  artboard = { x: 0, y: 0, width: 800, height: 800 },
  backgroundImage,
  onPanChange,
  onZoomChange,
  onMergeFaceIds,
  onSubtractFaceIds,
  onAddGuide,
  onAddConstructedShape,
  onCommitBatchGuidesTransform,
  onCommitBatchShapesTransform,
  onSelectGuideIds,
  onSelectShapeIds,
  onDeleteSelected,
  onSetBackgroundImage,
  onLoadProject,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const contentGroupRef = useRef<SVGGElement | null>(null);

  const [hoveredFaceId, setHoveredFaceId] = useState<string | null>(null);
  const [draggedFaceIds, setDraggedFaceIds] = useState<string[]>([]);
  const [dragPoints, setDragPoints] = useState<Point2D[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point2D>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [drawStart, setDrawStart] = useState<Point2D | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<Point2D | null>(null);

  // Marquee box select state
  const [marqueeStart, setMarqueeStart] = useState<Point2D | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<Point2D | null>(null);

  // Drag & drop reference image state
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  // Live transform state
  const [liveGuides, setLiveGuides] = useState<GuideShape[] | null>(null);
  const [liveShapes, setLiveShapes] = useState<ConstructedShape[] | null>(null);
  const [transformDrag, setTransformDrag] = useState<{
    target: 'guides' | 'shapes';
    handle:
      | 'move'
      | 'p1'
      | 'p2'
      | 'resize-x'
      | 'resize-y'
      | 'rotate'
      | 'corner-0'
      | 'corner-1'
      | 'corner-2'
      | 'corner-3'
      | 'edge-0'
      | 'edge-1'
      | 'edge-2'
      | 'edge-3'
      | 'rotate-rect'
      | 'parallel-p1'
      | 'parallel-p2'
      | 'parallel-spacing'
      | 'parallel-rotate'
      | 'parallel-circle-radius'
      | 'parallel-circle-spacing'
      | 'scale-corner'
      | 'scale-nw'
      | 'scale-ne'
      | 'scale-se'
      | 'scale-sw';
    primaryGuideId?: string;
    startPt: Point2D;
    initialBbox?: Bounds2D;
    initialShapes?: ConstructedShape[];
  } | null>(null);

  const isShapeBuilder = mode === 'merge' || mode === 'subtract';
  const effectiveMode = isAltHeld ? 'subtract' : mode;

  const activeGuides = liveGuides
    ? guides.map((g) => liveGuides.find((lg) => lg.id === g.id) || g)
    : guides;

  const activeShapes = liveShapes
    ? constructedShapes.map((s) => liveShapes.find((ls) => ls.id === s.id) || s)
    : constructedShapes;

  const singleSelectedGuide =
    selectedGuideIds.length === 1
      ? activeGuides.find((g) => g.id === selectedGuideIds[0]) || null
      : null;

  const selectedShapes = useMemo(
    () =>
      activeShapes.filter(
        (s) => s.visible !== false && selectedShapeIds.includes(s.id)
      ),
    [activeShapes, selectedShapeIds]
  );

  const shapesBoundingBox = useMemo(
    () =>
      mode === 'select' && selectedShapes.length > 0
        ? getShapesBoundingBox(selectedShapes)
        : null,
    [mode, selectedShapes]
  );

  const canvasViewBox = useMemo(() => getCanvasViewBox(artboard), [artboard]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) setIsSpacePressed(true);
      if (e.key === 'Backspace' || e.key === 'Delete') onDeleteSelected();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onDeleteSelected]);

  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent): Point2D => {
    if (!svgRef.current || !contentGroupRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const ctm = contentGroupRef.current.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    onZoomChange(Math.min(Math.max(zoom * factor, 0.3), 4));
  };

  const finishDrawingGuide = (start: Point2D, end: Point2D) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) return;

    if (mode === 'draw-line') {
      onAddGuide(createLineGuide(`line-${Date.now()}`, start.x, start.y, end.x, end.y));
    } else if (mode === 'draw-circle') {
      onAddGuide(createCircleGuide(`circle-${Date.now()}`, start.x, start.y, dist));
    } else if (mode === 'draw-ellipse') {
      const rx = Math.max(Math.abs(dx), 8);
      const ry = Math.max(Math.abs(dy), 8);
      onAddGuide(createEllipseGuide(`ellipse-${Date.now()}`, start.x, start.y, rx, ry));
    } else if (mode === 'draw-rect') {
      const p0 = { x: start.x, y: start.y };
      const p1 = { x: end.x, y: start.y };
      const p2 = { x: end.x, y: end.y };
      const p3 = { x: start.x, y: end.y };
      onAddGuide(createQuadGuide(`rect-${Date.now()}`, [p0, p1, p2, p3]));
    } else if (mode === 'draw-parallel') {
      onAddGuide(createParallelGuide(`parallel-${Date.now()}`, start.x, start.y, end.x, end.y, 40));
    } else if (mode === 'draw-parallel-circle') {
      onAddGuide(createParallelCircleGuide(`parallel-circle-${Date.now()}`, start.x, start.y, Math.max(dist, 15), 40));
    }
  };

  const startGuideTransform = (
    guide: GuideShape,
    handle:
      | 'move'
      | 'p1'
      | 'p2'
      | 'resize-x'
      | 'resize-y'
      | 'rotate'
      | 'corner-0'
      | 'corner-1'
      | 'corner-2'
      | 'corner-3'
      | 'edge-0'
      | 'edge-1'
      | 'edge-2'
      | 'edge-3'
      | 'rotate-rect'
      | 'parallel-p1'
      | 'parallel-p2'
      | 'parallel-spacing'
      | 'parallel-rotate'
      | 'parallel-circle-radius'
      | 'parallel-circle-spacing',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    let currentSelected = selectedGuideIds;
    if (e.shiftKey) {
      currentSelected = selectedGuideIds.includes(guide.id)
        ? selectedGuideIds.filter((id) => id !== guide.id)
        : [...selectedGuideIds, guide.id];
    } else if (!selectedGuideIds.includes(guide.id)) {
      currentSelected = [guide.id];
    }

    onSelectGuideIds(currentSelected);
    onSelectShapeIds([]);
    setLiveGuides(guides.filter((g) => currentSelected.includes(g.id)));
    setTransformDrag({
      target: 'guides',
      handle,
      primaryGuideId: guide.id,
      startPt: getCanvasCoords(e),
    });
  };

  const startShapeTransform = (shape: ConstructedShape, e: React.MouseEvent) => {
    e.stopPropagation();
    let currentSelected = selectedShapeIds;
    if (e.shiftKey) {
      currentSelected = selectedShapeIds.includes(shape.id)
        ? selectedShapeIds.filter((id) => id !== shape.id)
        : [...selectedShapeIds, shape.id];
    } else if (!selectedShapeIds.includes(shape.id)) {
      currentSelected = [shape.id];
    }

    onSelectShapeIds(currentSelected);
    onSelectGuideIds([]);
    setLiveShapes(constructedShapes.filter((s) => currentSelected.includes(s.id)));
    setTransformDrag({
      target: 'shapes',
      handle: 'move',
      startPt: getCanvasCoords(e),
    });
  };

  const startShapeScale = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    const pt = getCanvasCoords(e);
    const selected = constructedShapes.filter((s) => selectedShapeIds.includes(s.id));
    const bbox = getShapesBoundingBox(selected);
    if (!bbox) return;

    setLiveShapes(selected);
    setTransformDrag({
      target: 'shapes',
      handle: handle as any,
      startPt: pt,
      initialBbox: bbox,
      initialShapes: selected,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    if (e.button !== 0) return;

    const pt = getCanvasCoords(e);
    if (mode === 'select') {
      setMarqueeStart(pt);
      setMarqueeCurrent(pt);
      return;
    }

    if (isShapeBuilder) {
      setIsDragging(true);
      setDragPoints([pt]);
      if (hoveredFaceId) setDraggedFaceIds([hoveredFaceId]);
    } else {
      setDrawStart(pt);
      setDrawCurrent(pt);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      onPanChange({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    const pt = getCanvasCoords(e);

    if (marqueeStart) {
      setMarqueeCurrent(pt);
      const box: Bounds2D = {
        x: Math.min(marqueeStart.x, pt.x),
        y: Math.min(marqueeStart.y, pt.y),
        width: Math.abs(pt.x - marqueeStart.x),
        height: Math.abs(pt.y - marqueeStart.y),
      };
      const found = findItemsInBox(guides, constructedShapes, box);
      onSelectGuideIds(found.guideIds);
      onSelectShapeIds(found.shapeIds);
      return;
    }

    if (transformDrag) {
      handleTransformDrag(pt, e.shiftKey);
      return;
    }

    if (drawStart) {
      let targetPt = pt;
      if ((mode === 'draw-line' || mode === 'draw-parallel') && e.shiftKey) {
        targetPt = snapPointTo45Degrees(drawStart, pt);
      } else if (mode === 'draw-rect' && e.shiftKey) {
        const side = Math.max(Math.abs(pt.x - drawStart.x), Math.abs(pt.y - drawStart.y));
        const signX = pt.x >= drawStart.x ? 1 : -1;
        const signY = pt.y >= drawStart.y ? 1 : -1;
        targetPt = { x: drawStart.x + side * signX, y: drawStart.y + side * signY };
      }
      setDrawCurrent(targetPt);
      return;
    }

    if (isDragging) {
      setDragPoints((prev) => [...prev, pt]);
      if (hoveredFaceId && !draggedFaceIds.includes(hoveredFaceId)) {
        setDraggedFaceIds((prev) => [...prev, hoveredFaceId]);
      }
    }
  };

  const handleTransformDrag = (pt: Point2D, isShift = false) => {
    if (!transformDrag) return;
    const { target, handle, startPt, primaryGuideId } = transformDrag;
    const dx = pt.x - startPt.x;
    const dy = pt.y - startPt.y;

    if (target === 'shapes' && liveShapes) {
      if (handle === 'move') {
        setLiveShapes(liveShapes.map((s) => moveConstructedShape(s, dx, dy)));
        setTransformDrag((prev) => (prev ? { ...prev, startPt: pt } : null));
        return;
      }
      if (
        handle.startsWith('scale') &&
        transformDrag.initialBbox &&
        transformDrag.initialShapes
      ) {
        const { factor, anchor } = calculateCornerScale(
          handle,
          transformDrag.initialBbox,
          pt,
          isAltHeld
        );
        setLiveShapes(
          transformDrag.initialShapes.map((s) => scaleConstructedShape(s, factor, anchor))
        );
        return;
      }
      return;
    }

    if (target === 'guides' && liveGuides) {
      if (handle === 'move') {
        setLiveGuides(liveGuides.map((g) => moveGuide(g, dx, dy)));
        setTransformDrag((prev) => (prev ? { ...prev, startPt: pt } : null));
        return;
      }
      const primary = liveGuides.find((g) => g.id === primaryGuideId);
      if (!primary) return;

      let updatedPrimary = primary;
      if (handle === 'p1') {
        const snapPt = isShift && primary.p2 ? snapPointTo45Degrees(primary.p2, pt) : pt;
        updatedPrimary = updateLinePoint(primary, 'p1', snapPt);
      } else if (handle === 'p2') {
        const snapPt = isShift && primary.p1 ? snapPointTo45Degrees(primary.p1, pt) : pt;
        updatedPrimary = updateLinePoint(primary, 'p2', snapPt);
      } else if (handle === 'resize-x') {
        updatedPrimary = resizeEllipseAxis(primary, 'rx', pt);
      } else if (handle === 'resize-y') {
        updatedPrimary = resizeEllipseAxis(primary, 'ry', pt);
      } else if (handle === 'rotate') {
        updatedPrimary = rotateEllipseGuide(primary, pt);
      } else if (handle.startsWith('corner-')) {
        const idx = parseInt(handle.split('-')[1], 10);
        updatedPrimary = updateQuadCorner(primary, idx, pt);
      } else if (handle.startsWith('edge-')) {
        const idx = parseInt(handle.split('-')[1], 10);
        updatedPrimary = resizeQuadEdge(primary, idx, pt, startPt);
        setTransformDrag((prev) => (prev ? { ...prev, startPt: pt } : null));
      } else if (handle === 'rotate-rect') {
        updatedPrimary = rotateQuadGuide(primary, pt, startPt);
        setTransformDrag((prev) => (prev ? { ...prev, startPt: pt } : null));
      } else if (handle === 'parallel-p1') {
        const snapPt = isShift && primary.p2 ? snapPointTo45Degrees(primary.p2, pt) : pt;
        updatedPrimary = updateParallelPoint(primary, 'p1', snapPt);
      } else if (handle === 'parallel-p2') {
        const snapPt = isShift && primary.p1 ? snapPointTo45Degrees(primary.p1, pt) : pt;
        updatedPrimary = updateParallelPoint(primary, 'p2', snapPt);
      } else if (handle === 'parallel-spacing') {
        updatedPrimary = updateParallelSpacing(primary, pt);
      } else if (handle === 'parallel-rotate') {
        updatedPrimary = rotateParallelGuide(primary, pt, startPt);
        setTransformDrag((prev) => (prev ? { ...prev, startPt: pt } : null));
      } else if (handle === 'parallel-circle-radius') {
        updatedPrimary = updateParallelCircleRadius(primary, pt);
      } else if (handle === 'parallel-circle-spacing') {
        updatedPrimary = updateParallelCircleSpacing(primary, pt);
      }

      setLiveGuides(liveGuides.map((g) => (g.id === primaryGuideId ? updatedPrimary : g)));
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (marqueeStart) {
      setMarqueeStart(null);
      setMarqueeCurrent(null);
      return;
    }
    if (transformDrag) {
      if (transformDrag.target === 'guides' && liveGuides) {
        onCommitBatchGuidesTransform(liveGuides);
        setLiveGuides(null);
      } else if (transformDrag.target === 'shapes' && liveShapes) {
        onCommitBatchShapesTransform(liveShapes);
        setLiveShapes(null);
      }
      setTransformDrag(null);
      return;
    }
    if (drawStart && drawCurrent) {
      if (mode === 'text') {
        const pt = drawStart;
        setDrawStart(null);
        setDrawCurrent(null);
        onAddConstructedShape?.({
          id: `text-${Date.now()}`,
          pathData: '',
          type: 'text',
          text: 'LOGO',
          fontFamily: 'Inter, sans-serif',
          fontSize: 72,
          fontWeight: '700',
          letterSpacing: 2,
          x: Math.round(pt.x),
          y: Math.round(pt.y),
          fillColor: selectedColor || '#f4f4f5',
          createdAt: Date.now(),
        });
        return;
      }
      finishDrawingGuide(drawStart, drawCurrent);
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }
    if (isDragging) {
      if (draggedFaceIds.length > 0) {
        if (effectiveMode === 'subtract') onSubtractFaceIds(draggedFaceIds);
        else onMergeFaceIds(draggedFaceIds);
      }
      setIsDragging(false);
      setDraggedFaceIds([]);
      setDragPoints([]);
    }
  };

  const trailPathData = dragPoints.length > 1
    ? `M ${dragPoints[0].x} ${dragPoints[0].y} ` +
      dragPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const marqueeBox: Bounds2D | null = marqueeStart && marqueeCurrent
    ? {
        x: Math.min(marqueeStart.x, marqueeCurrent.x),
        y: Math.min(marqueeStart.y, marqueeCurrent.y),
        width: Math.abs(marqueeCurrent.x - marqueeStart.x),
        height: Math.abs(marqueeCurrent.y - marqueeStart.y),
      }
    : null;

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('text/uri-list')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const isProjectOrSvg =
        /\.(logo|json|svg)$/i.test(file.name) ||
        file.type === 'image/svg+xml' ||
        file.type === 'application/json';

      if (isProjectOrSvg) {
        try {
          const text = await file.text();
          const project = parseProjectFile(text);
          if (project) {
            onLoadProject?.(project);
            return;
          }
          const generic = parseGenericSvgToShapes(text);
          if (generic.shapes.length > 0) {
            onLoadProject?.({
              version: 1,
              app: 'LogoBuilder',
              artboard: generic.artboard || { x: 0, y: 0, width: 800, height: 800 },
              canvasBackground: '#121316',
              guides: [],
              constructedShapes: generic.shapes,
            });
            return;
          }
        } catch (err) {
          console.error('Failed to parse dropped project/SVG:', err);
        }
      }

      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
      if (!isImg) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) loadAndFitImage(result, onSetBackgroundImage);
      };
      reader.readAsDataURL(file);
      return;
    }

    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/'))) {
      loadAndFitImage(url, onSetBackgroundImage);
    }
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#0a0a0c] canvas-grid-pattern ${
        isSpacePressed ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : mode === 'select' ? 'cursor-default' : 'cursor-crosshair'
      }`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Reference Image Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-[#0a0a0c]/85 backdrop-blur-sm p-8 transition-all animate-in fade-in duration-150">
          <div className="flex flex-col items-center gap-3 p-10 rounded-3xl border-2 border-dashed border-cyan-400 bg-cyan-950/40 text-center shadow-2xl max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20 animate-bounce">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Drop Reference Image Here
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Image will automatically scale and fit the artboard for tracing
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300/80 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/30">
              PNG • JPG • SVG • WebP • GIF
            </div>
          </div>
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full pointer-events-auto" viewBox={canvasViewBox}>
        <HatchPatterns />
        <g ref={contentGroupRef} transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Artboard Frame */}
          <rect
            x={artboard.x}
            y={artboard.y}
            width={artboard.width}
            height={artboard.height}
            fill={
              canvasBackground === 'transparent'
                ? 'url(#transparency-checkers)'
                : canvasBackground
            }
            stroke={
              canvasBackground === '#ffffff' || canvasBackground === '#d4d4d8'
                ? '#cbd5e1'
                : '#27272a'
            }
            strokeWidth="1.5"
            rx="8"
          />

          {/* Background Reference Image */}
          {backgroundImage && backgroundImage.visible && (
            <image
              href={backgroundImage.url}
              x={backgroundImage.x}
              y={backgroundImage.y}
              width={backgroundImage.width}
              height={backgroundImage.height}
              opacity={backgroundImage.opacity}
              preserveAspectRatio="xMidYMid meet"
              pointerEvents="none"
            />
          )}

          {/* Built Logotype Shapes */}
          <g id="layer-constructed-shapes">
            {activeShapes.map((shape) => {
              if (shape.visible === false) return null;
              const isSelected = selectedShapeIds.includes(shape.id);
              if (shape.type === 'text') {
                const fs = shape.fontSize || 48;
                const textLen = (shape.text || '').length;
                const width = Math.max(fs, textLen * fs * 0.6);
                const height = fs;
                const boxX = shape.x || 0;
                const boxY = (shape.y || 0) - height * 0.8;

                return (
                  <g
                    key={shape.id}
                    className={mode === 'select' ? 'cursor-move hover:opacity-90' : ''}
                    onMouseDown={(e) => {
                      if (mode === 'select') startShapeTransform(shape, e);
                    }}
                  >
                    <text
                      x={shape.x || 0}
                      y={shape.y || 0}
                      fontFamily={shape.fontFamily || 'Inter, sans-serif'}
                      fontSize={shape.fontSize || 48}
                      fontWeight={shape.fontWeight || '700'}
                      letterSpacing={shape.letterSpacing || 0}
                      fill={shape.fillColor}
                      style={{ userSelect: 'none' }}
                    >
                      {shape.text ?? 'Text'}
                    </text>

                    {isSelected && mode === 'select' && (
                      <rect
                        x={boxX - 4}
                        y={boxY - 4}
                        width={width + 8}
                        height={height + 8}
                        fill="rgba(245, 158, 11, 0.08)"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        rx={4}
                        pointerEvents="none"
                      />
                    )}
                  </g>
                );
              }

              return (
                <path
                  key={shape.id}
                  d={shape.pathData}
                  fill={shape.fillColor}
                  fillRule="evenodd"
                  stroke={isSelected ? '#f59e0b' : showShapeOutlines ? '#18181b' : 'none'}
                  strokeWidth={isSelected ? 3 : showShapeOutlines ? 1.5 : 0}
                  strokeDasharray={isSelected ? '4 3' : 'none'}
                  filter="url(#shape-glow)"
                  className={mode === 'select' ? 'cursor-move hover:opacity-90' : ''}
                  onMouseDown={(e) => {
                    if (mode === 'select') startShapeTransform(shape, e);
                  }}
                />
              );
            })}
          </g>

          {/* Atomic Faces (Shape Builder Hover & Drag Scrubbing) */}
          {showGuides && isShapeBuilder && (
            <g id="layer-atomic-faces">
              {atomicFaces.map((face) => {
                const isHovered = hoveredFaceId === face.id;
                const isSelected = draggedFaceIds.includes(face.id);
                let fill = 'transparent';
                if (isSelected || isHovered) {
                  fill = effectiveMode === 'subtract'
                    ? 'url(#dot-mesh-subtract)'
                    : 'url(#dot-mesh-merge)';
                }
                return (
                  <path
                    key={face.id}
                    d={face.pathData}
                    fill={fill}
                    fillRule="evenodd"
                    stroke={isSelected ? (effectiveMode === 'subtract' ? '#f43f5e' : '#818cf8') : isHovered ? '#a5b4fc' : 'transparent'}
                    strokeWidth={isSelected || isHovered ? 2 : 0}
                    className="transition-colors duration-75 cursor-pointer"
                    onMouseEnter={() => setHoveredFaceId(face.id)}
                    onMouseLeave={() => {
                      if (hoveredFaceId === face.id) setHoveredFaceId(null);
                    }}
                  />
                );
              })}
            </g>
          )}

          {/* Construction Scaffold Guides */}
          {showGuides && (
            <g id="layer-scaffold-guides">
              {activeGuides.map((guide) => {
                const isSelected = selectedGuideIds.includes(guide.id);
                const isClosed =
                  guide.type === 'circle' ||
                  guide.type === 'ellipse' ||
                  guide.type === 'polygon' ||
                  guide.type === 'rect' ||
                  guide.type === 'parallel' ||
                  guide.type === 'parallel-circle';

                const hitPathData =
                  guide.type === 'parallel' && guide.points && guide.points.length === 4
                    ? `M ${guide.points[0].x} ${guide.points[0].y} L ${guide.points[1].x} ${guide.points[1].y} L ${guide.points[2].x} ${guide.points[2].y} L ${guide.points[3].x} ${guide.points[3].y} Z`
                    : guide.pathData;

                return (
                  <g key={guide.id}>
                    {/* Generous Clickable Hit Target in Select Mode */}
                    {mode === 'select' && (
                      <path
                        d={hitPathData}
                        fill={isClosed ? 'rgba(0, 0, 0, 0.001)' : 'none'}
                        stroke="transparent"
                        strokeWidth={isClosed ? 0 : 16}
                        pointerEvents="all"
                        className="cursor-pointer"
                        onMouseDown={(e) => startGuideTransform(guide, 'move', e)}
                      />
                    )}

                    {/* Visible Guide Stroke */}
                    <path
                      d={guide.pathData}
                      fill={
                        mode === 'select' && isClosed && isSelected
                          ? 'rgba(245, 158, 11, 0.08)'
                          : 'none'
                      }
                      stroke={isSelected ? '#f59e0b' : '#38bdf8'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeDasharray={
                        guide.type === 'line' ||
                        guide.type === 'parallel' ||
                        guide.type === 'parallel-circle'
                          ? 'none'
                          : '4 3'
                      }
                      className={
                        mode === 'select'
                          ? 'cursor-pointer hover:stroke-amber-400'
                          : 'pointer-events-none'
                      }
                      onMouseDown={(e) => {
                        if (mode === 'select') startGuideTransform(guide, 'move', e);
                      }}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Single Selected Guide Transform Handles */}
          {showGuides && singleSelectedGuide && mode === 'select' && (
            <g id="layer-transform-handles">
              {singleSelectedGuide.type === 'line' && singleSelectedGuide.p1 && singleSelectedGuide.p2 && (
                <>
                  <circle
                    cx={singleSelectedGuide.p1.x}
                    cy={singleSelectedGuide.p1.y}
                    r={6}
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    className="cursor-crosshair"
                    onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'p1', e)}
                  />
                  <circle
                    cx={singleSelectedGuide.p2.x}
                    cy={singleSelectedGuide.p2.y}
                    r={6}
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    className="cursor-crosshair"
                    onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'p2', e)}
                  />
                </>
              )}
              {singleSelectedGuide.type !== 'parallel-circle' &&
                singleSelectedGuide.cx !== undefined &&
                singleSelectedGuide.cy !== undefined && (
                <g
                  transform={`rotate(${singleSelectedGuide.rotation || 0}, ${singleSelectedGuide.cx}, ${singleSelectedGuide.cy})`}
                >
                  {/* Center Move Handle */}
                  <circle
                    cx={singleSelectedGuide.cx}
                    cy={singleSelectedGuide.cy}
                    r={6}
                    fill="#f59e0b"
                    className="cursor-move"
                    onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'move', e)}
                  />

                  {/* Handle 1 (East, X-Axis Radius rx) */}
                  <circle
                    cx={singleSelectedGuide.cx + (singleSelectedGuide.rx || 40)}
                    cy={singleSelectedGuide.cy}
                    r={14}
                    fill="transparent"
                    className="cursor-ew-resize"
                    onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'resize-x', e)}
                  />
                  <circle
                    cx={singleSelectedGuide.cx + (singleSelectedGuide.rx || 40)}
                    cy={singleSelectedGuide.cy}
                    r={6}
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    className="cursor-ew-resize pointer-events-none"
                  />

                  {/* Handle 2 (South, Y-Axis Radius ry - Perpendicular Handle) */}
                  <circle
                    cx={singleSelectedGuide.cx}
                    cy={singleSelectedGuide.cy + (singleSelectedGuide.ry || 30)}
                    r={14}
                    fill="transparent"
                    className="cursor-ns-resize"
                    onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'resize-y', e)}
                  />
                  <circle
                    cx={singleSelectedGuide.cx}
                    cy={singleSelectedGuide.cy + (singleSelectedGuide.ry || 30)}
                    r={6}
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    className="cursor-ns-resize pointer-events-none"
                  />

                  {/* Handle 3: Rotate Stem & Handle */}
                  <line
                    x1={singleSelectedGuide.cx}
                    y1={singleSelectedGuide.cy - (singleSelectedGuide.ry || 30)}
                    x2={singleSelectedGuide.cx}
                    y2={singleSelectedGuide.cy - (singleSelectedGuide.ry || 30) - 24}
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={singleSelectedGuide.cx}
                    cy={singleSelectedGuide.cy - (singleSelectedGuide.ry || 30) - 24}
                    r={16}
                    fill="transparent"
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'rotate', e)}
                  />
                  <circle
                    cx={singleSelectedGuide.cx}
                    cy={singleSelectedGuide.cy - (singleSelectedGuide.ry || 30) - 24}
                    r={6}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="pointer-events-none"
                  />
                </g>
              )}

              {/* Rectangle / Quad Handles: Rotate, Side Resizing, and 4 Corner Points */}
              {singleSelectedGuide.type === 'rect' &&
                singleSelectedGuide.points &&
                singleSelectedGuide.points.length === 4 &&
                (() => {
                  const pts = singleSelectedGuide.points;
                  const center = getQuadCenter(pts);
                  const topMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
                  const tv = { x: topMid.x - center.x, y: topMid.y - center.y };
                  const td = Math.hypot(tv.x, tv.y);
                  const tUnit = td > 0.001 ? { x: tv.x / td, y: tv.y / td } : { x: 0, y: -1 };
                  const rotPt = { x: topMid.x + tUnit.x * 24, y: topMid.y + tUnit.y * 24 };

                  return (
                    <g id="rect-transform-controls">
                      {/* Rotation Stem & Handle */}
                      <line
                        x1={topMid.x}
                        y1={topMid.y}
                        x2={rotPt.x}
                        y2={rotPt.y}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx={rotPt.x}
                        cy={rotPt.y}
                        r={16}
                        fill="transparent"
                        className="cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'rotate-rect', e)}
                      />
                      <circle
                        cx={rotPt.x}
                        cy={rotPt.y}
                        r={6}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="pointer-events-none"
                      />

                      {/* 4 Side Midpoint Resizing Handles */}
                      {pts.map((pA, i) => {
                        const pB = pts[(i + 1) % 4];
                        const midX = (pA.x + pB.x) / 2;
                        const midY = (pA.y + pB.y) / 2;
                        const cursor = i % 2 === 0 ? 'cursor-ns-resize' : 'cursor-ew-resize';
                        return (
                          <g key={`side-${i}`}>
                            <circle
                              cx={midX}
                              cy={midY}
                              r={14}
                              fill="transparent"
                              className={cursor}
                              onMouseDown={(e) =>
                                startGuideTransform(singleSelectedGuide, `edge-${i}` as any, e)
                              }
                            />
                            <rect
                              x={midX - 4}
                              y={midY - 4}
                              width={8}
                              height={8}
                              rx={1.5}
                              fill="#ffffff"
                              stroke="#f59e0b"
                              strokeWidth={1.5}
                              className="pointer-events-none"
                            />
                          </g>
                        );
                      })}

                      {/* 4 Corner Independent Points */}
                      {pts.map((pt, i) => (
                        <g key={`corner-${i}`}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={14}
                            fill="transparent"
                            className="cursor-crosshair"
                            onMouseDown={(e) =>
                              startGuideTransform(singleSelectedGuide, `corner-${i}` as any, e)
                            }
                          />
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={6}
                            fill="#ffffff"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            className="pointer-events-none"
                          />
                        </g>
                      ))}
                    </g>
                  );
                })()}

              {/* Parallel Lines Transform Controls */}
              {singleSelectedGuide.type === 'parallel' &&
                singleSelectedGuide.p1 &&
                singleSelectedGuide.p2 &&
                (() => {
                  const p1 = singleSelectedGuide.p1;
                  const p2 = singleSelectedGuide.p2;
                  const spacing = singleSelectedGuide.spacing || 40;
                  const dx = p2.x - p1.x;
                  const dy = p2.y - p1.y;
                  const len = Math.hypot(dx, dy);
                  const half = spacing / 2;
                  const nx = len > 0.001 ? (dy / len) * half : 0;
                  const ny = len > 0.001 ? (-dx / len) * half : -half;
                  const uNx = len > 0.001 ? dy / len : 0;
                  const uNy = len > 0.001 ? -dx / len : -1;

                  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                  const mid1 = { x: mid.x + nx, y: mid.y + ny };
                  const mid2 = { x: mid.x - nx, y: mid.y - ny };
                  const rotPt = { x: mid1.x + uNx * 24, y: mid1.y + uNy * 24 };

                  return (
                    <g id="parallel-transform-controls">
                      {/* Faint dashed centerline */}
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="#f59e0b"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        opacity={0.6}
                      />

                      {/* Faint dashed perpendicular spacing connector */}
                      <line
                        x1={mid1.x}
                        y1={mid1.y}
                        x2={mid2.x}
                        y2={mid2.y}
                        stroke="#f59e0b"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        opacity={0.8}
                      />

                      {/* Rotation Stem & Handle */}
                      <line
                        x1={mid1.x}
                        y1={mid1.y}
                        x2={rotPt.x}
                        y2={rotPt.y}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx={rotPt.x}
                        cy={rotPt.y}
                        r={16}
                        fill="transparent"
                        className="cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'parallel-rotate', e)}
                      />
                      <circle
                        cx={rotPt.x}
                        cy={rotPt.y}
                        r={6}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="pointer-events-none"
                      />

                      {/* Centerline Endpoints p1 & p2 (Resize length/direction synchronously) */}
                      <circle
                        cx={p1.x}
                        cy={p1.y}
                        r={14}
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'parallel-p1', e)}
                      />
                      <circle
                        cx={p1.x}
                        cy={p1.y}
                        r={6}
                        fill="#ffffff"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        className="pointer-events-none"
                      />

                      <circle
                        cx={p2.x}
                        cy={p2.y}
                        r={14}
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'parallel-p2', e)}
                      />
                      <circle
                        cx={p2.x}
                        cy={p2.y}
                        r={6}
                        fill="#ffffff"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        className="pointer-events-none"
                      />

                      {/* Spacing Handles (adjust distance between lines) */}
                      <circle
                        cx={mid1.x}
                        cy={mid1.y}
                        r={14}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'parallel-spacing', e)}
                      />
                      <rect
                        x={mid1.x - 4}
                        y={mid1.y - 4}
                        width={8}
                        height={8}
                        rx={1.5}
                        fill="#ffffff"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        className="pointer-events-none"
                      />

                      <circle
                        cx={mid2.x}
                        cy={mid2.y}
                        r={14}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'parallel-spacing', e)}
                      />
                      <rect
                        x={mid2.x - 4}
                        y={mid2.y - 4}
                        width={8}
                        height={8}
                        rx={1.5}
                        fill="#ffffff"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        className="pointer-events-none"
                      />
                    </g>
                  );
                })()}

              {/* Parallel Circles Transform Controls */}
              {singleSelectedGuide.type === 'parallel-circle' &&
                singleSelectedGuide.cx !== undefined &&
                singleSelectedGuide.cy !== undefined &&
                (() => {
                  const cx = singleSelectedGuide.cx;
                  const cy = singleSelectedGuide.cy;
                  const r = singleSelectedGuide.rx || 50;
                  const spacing = singleSelectedGuide.spacing || 40;
                  const half = spacing / 2;
                  const r1 = Math.max(5, Math.round(r - half));
                  const r2 = Math.max(r1 + 5, Math.round(r + half));

                  return (
                    <g id="parallel-circle-transform-controls">
                      {/* Faint dashed centerline circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        stroke="#f59e0b"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        fill="none"
                        opacity={0.65}
                      />

                      {/* Faint dashed radial connector for spacing */}
                      <line
                        x1={cx}
                        y1={cy - r1}
                        x2={cx}
                        y2={cy - r2}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="2 2"
                        opacity={0.8}
                      />

                      {/* Center Move Handle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={14}
                        fill="transparent"
                        className="cursor-move"
                        onMouseDown={(e) => startGuideTransform(singleSelectedGuide, 'move', e)}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="pointer-events-none"
                      />

                      {/* Radius Handle on centerline (Amber dot with white border) */}
                      <circle
                        cx={cx + r}
                        cy={cy}
                        r={14}
                        fill="transparent"
                        className="cursor-ew-resize"
                        onMouseDown={(e) =>
                          startGuideTransform(singleSelectedGuide, 'parallel-circle-radius', e)
                        }
                      />
                      <circle
                        cx={cx + r}
                        cy={cy}
                        r={6}
                        fill="#ffffff"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        className="pointer-events-none"
                      />

                      {/* Spacing Handle Inner Circle */}
                      <circle
                        cx={cx}
                        cy={cy - r1}
                        r={14}
                        fill="transparent"
                        className="cursor-ns-resize"
                        onMouseDown={(e) =>
                          startGuideTransform(singleSelectedGuide, 'parallel-circle-spacing', e)
                        }
                      />
                      <rect
                        x={cx - 4}
                        y={cy - r1 - 4}
                        width={8}
                        height={8}
                        rx={1.5}
                        fill="#ffffff"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        className="pointer-events-none"
                      />

                      {/* Spacing Handle Outer Circle */}
                      <circle
                        cx={cx}
                        cy={cy - r2}
                        r={14}
                        fill="transparent"
                        className="cursor-ns-resize"
                        onMouseDown={(e) =>
                          startGuideTransform(singleSelectedGuide, 'parallel-circle-spacing', e)
                        }
                      />
                      <rect
                        x={cx - 4}
                        y={cy - r2 - 4}
                        width={8}
                        height={8}
                        rx={1.5}
                        fill="#ffffff"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        className="pointer-events-none"
                      />
                    </g>
                  );
                })()}
            </g>
          )}

          {/* Shape Selection Bounding Box & Scale Handles */}
          {mode === 'select' && shapesBoundingBox && (
            <g id="layer-shape-transform-box">
              <rect
                x={shapesBoundingBox.x - 4}
                y={shapesBoundingBox.y - 4}
                width={shapesBoundingBox.width + 8}
                height={shapesBoundingBox.height + 8}
                fill="rgba(245, 158, 11, 0.04)"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                rx={3}
                pointerEvents="none"
              />
              {[
                {
                  handle: 'scale-nw',
                  x: shapesBoundingBox.x - 4,
                  y: shapesBoundingBox.y - 4,
                  cursor: 'nwse-resize',
                },
                {
                  handle: 'scale-ne',
                  x: shapesBoundingBox.x + shapesBoundingBox.width + 4,
                  y: shapesBoundingBox.y - 4,
                  cursor: 'nesw-resize',
                },
                {
                  handle: 'scale-se',
                  x: shapesBoundingBox.x + shapesBoundingBox.width + 4,
                  y: shapesBoundingBox.y + shapesBoundingBox.height + 4,
                  cursor: 'nwse-resize',
                },
                {
                  handle: 'scale-sw',
                  x: shapesBoundingBox.x - 4,
                  y: shapesBoundingBox.y + shapesBoundingBox.height + 4,
                  cursor: 'nesw-resize',
                },
              ].map((h) => (
                <g key={h.handle} className={h.cursor}>
                  {/* Invisible generous hit target (24x24 px) */}
                  <rect
                    x={h.x - 12}
                    y={h.y - 12}
                    width={24}
                    height={24}
                    fill="transparent"
                    style={{ cursor: h.cursor }}
                    onMouseDown={(e) => startShapeScale(e, h.handle)}
                  />
                  {/* Visible handle square */}
                  <rect
                    x={h.x - 5}
                    y={h.y - 5}
                    width={10}
                    height={10}
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    rx={2}
                    className="pointer-events-none shadow-md"
                  />
                </g>
              ))}
            </g>
          )}

          {/* Interactive Live Drawing Guide Preview */}
          {drawStart && drawCurrent && (
            <g id="layer-drawing-preview" pointerEvents="none">
              {mode === 'draw-line' && (
                <line
                  x1={drawStart.x}
                  y1={drawStart.y}
                  x2={drawCurrent.x}
                  y2={drawCurrent.y}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
              {mode === 'draw-parallel' &&
                (() => {
                  const { line1, line2 } = getParallelEndpoints(drawStart, drawCurrent, 40);
                  return (
                    <g>
                      <line
                        x1={drawStart.x}
                        y1={drawStart.y}
                        x2={drawCurrent.x}
                        y2={drawCurrent.y}
                        stroke="#38bdf8"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        opacity={0.5}
                      />
                      <line
                        x1={line1.p1.x}
                        y1={line1.p1.y}
                        x2={line1.p2.x}
                        y2={line1.p2.y}
                        stroke="#38bdf8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                      <line
                        x1={line2.p1.x}
                        y1={line2.p1.y}
                        x2={line2.p2.x}
                        y2={line2.p2.y}
                        stroke="#38bdf8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                    </g>
                  );
                })()}
              {mode === 'draw-rect' && (
                <rect
                  x={Math.min(drawStart.x, drawCurrent.x)}
                  y={Math.min(drawStart.y, drawCurrent.y)}
                  width={Math.abs(drawCurrent.x - drawStart.x)}
                  height={Math.abs(drawCurrent.y - drawStart.y)}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
              {mode === 'draw-circle' && (
                <circle
                  cx={drawStart.x}
                  cy={drawStart.y}
                  r={Math.hypot(drawCurrent.x - drawStart.x, drawCurrent.y - drawStart.y)}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
              {mode === 'draw-parallel-circle' &&
                (() => {
                  const r = Math.hypot(drawCurrent.x - drawStart.x, drawCurrent.y - drawStart.y);
                  const spacing = 40;
                  const half = spacing / 2;
                  const r1 = Math.max(5, Math.round(r - half));
                  const r2 = Math.max(r1 + 5, Math.round(r + half));
                  return (
                    <g>
                      <circle
                        cx={drawStart.x}
                        cy={drawStart.y}
                        r={r}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        opacity={0.5}
                      />
                      <circle
                        cx={drawStart.x}
                        cy={drawStart.y}
                        r={r1}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                      <circle
                        cx={drawStart.x}
                        cy={drawStart.y}
                        r={r2}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                    </g>
                  );
                })()}
              {mode === 'draw-ellipse' && (
                <ellipse
                  cx={drawStart.x}
                  cy={drawStart.y}
                  rx={Math.abs(drawCurrent.x - drawStart.x)}
                  ry={Math.abs(drawCurrent.y - drawStart.y)}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
            </g>
          )}

          {/* Marquee Box Select Overlay */}
          {marqueeBox && (
            <rect
              x={marqueeBox.x}
              y={marqueeBox.y}
              width={marqueeBox.width}
              height={marqueeBox.height}
              fill="rgba(56, 189, 248, 0.12)"
              stroke="#38bdf8"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              pointerEvents="none"
            />
          )}

          {/* Live Drag Sweep Trail */}
          {isDragging && trailPathData && (
            <path
              d={trailPathData}
              fill="none"
              stroke={effectiveMode === 'subtract' ? '#f43f5e' : '#818cf8'}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}
        </g>
      </svg>

      {/* Floating Status / Mode Pill */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-3 bg-[#18181b]/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-2xl text-xs font-medium text-zinc-300">
        <div className={`w-2.5 h-2.5 rounded-full ${mode === 'select' ? 'bg-amber-400' : isShapeBuilder ? (effectiveMode === 'subtract' ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500') : 'bg-cyan-400'}`} />
        <span>
          {mode === 'select' && (selectedGuideIds.length > 0 || selectedShapeIds.length > 0 ? `${selectedGuideIds.length + selectedShapeIds.length} item(s) selected (Drag corner handles to scale, drag to move)` : 'Select Tool: Click or drag a box across guides & shapes')}
          {mode === 'draw-line' && 'Line Tool (Hold Shift to snap to 0°, 45°, 90°)'}
          {mode === 'draw-parallel' && 'Parallel Lines Tool (Hold Shift to snap to 0°, 45°, 90°)'}
          {mode === 'draw-rect' && 'Rectangle Tool (Drag across canvas, hold Shift for square)'}
          {mode === 'draw-circle' && 'Circle Tool (Drag from center)'}
          {mode === 'draw-parallel-circle' && 'Parallel Circles Tool (Drag from center to set radius, 40px default gap)'}
          {mode === 'draw-ellipse' && 'Ellipse Tool (Drag from center)'}
          {mode === 'text' && 'Text Tool (Click on canvas to place text, choose font & size above)'}
          {isShapeBuilder && (effectiveMode === 'subtract' ? 'Subtract Mode (Hold Alt to Erase)' : 'Shape Builder (Drag across cells to Unite)')}
        </span>
        <span className="text-zinc-500">|</span>
        <span className="text-zinc-400 font-mono">
          {atomicFaces.length} atomic cells
        </span>
      </div>
    </div>
  );
};

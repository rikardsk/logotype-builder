import { useState, useCallback, useEffect } from 'react';
import {
  AtomicFace,
  ArtboardConfig,
  BackgroundImageConfig,
  BuilderMode,
  ConstructedShape,
  GuideShape,
  Point2D,
  ScaffoldConfig,
} from '../geometry/types';
import { SCAFFOLD_PRESETS } from '../geometry/scaffolds';
import { decomposeGuidesToAtomicFaces } from '../geometry/planarDecomposer';
import { mergeFacePaths, subtractFaceFromShape } from '../geometry/shapeMerger';
import {
  moveGuide,
  moveConstructedShape,
  scaleConstructedShapes,
  getShapesBoundingBox,
  reorderShapes,
} from '../geometry/guideTransforms';

export const COLOR_PALETTES = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#a855f7', // Purple
  '#f4f4f5', // White / Platinum
  '#71717a', // Cool Gray
  '#18181b', // Obsidian Black
  '#000000', // Pitch Black
];

export const DEFAULT_ARTBOARD: ArtboardConfig = {
  x: 0,
  y: 0,
  width: 800,
  height: 800,
};

interface HistoryState {
  shapes: ConstructedShape[];
  guides: GuideShape[];
  artboard?: ArtboardConfig;
}

interface ClipboardData {
  guides: GuideShape[];
  shapes: ConstructedShape[];
}

export function useBuilderStore() {
  const [currentScaffold, setCurrentScaffold] = useState<ScaffoldConfig>(
    SCAFFOLD_PRESETS[0]
  );
  const [guides, setGuides] = useState<GuideShape[]>(
    SCAFFOLD_PRESETS[0].guides
  );
  const [atomicFaces, setAtomicFaces] = useState<AtomicFace[]>([]);
  const [constructedShapes, setConstructedShapes] = useState<
    ConstructedShape[]
  >([]);
  const [mode, setMode] = useState<BuilderMode>('select');
  const [isAltHeld, setIsAltHeld] = useState(false);
  const [selectedColor, setSelectedColorState] = useState(COLOR_PALETTES[0]);
  const [showGuides, setShowGuides] = useState(true);
  const [pan, setPan] = useState<Point2D>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [canvasBackground, setCanvasBackground] = useState<string>('#121316');
  const [artboard, setArtboard] = useState<ArtboardConfig>(DEFAULT_ARTBOARD);

  // Multi-selection state
  const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  const [backgroundImage, setBackgroundImageState] =
    useState<BackgroundImageConfig | null>(null);
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  useEffect(() => {
    const faces = decomposeGuidesToAtomicFaces(guides);
    setAtomicFaces(faces);
  }, [guides]);

  const pushHistory = useCallback(() => {
    setPast((prev) => [
      ...prev.slice(-20),
      { shapes: constructedShapes, guides, artboard },
    ]);
    setFuture([]);
  }, [constructedShapes, guides, artboard]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [{ shapes: constructedShapes, guides, artboard }, ...prev]);
    setConstructedShapes(previous.shapes);
    setGuides(previous.guides);
    if (previous.artboard) setArtboard(previous.artboard);
  }, [past, constructedShapes, guides, artboard]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, { shapes: constructedShapes, guides, artboard }]);
    setConstructedShapes(next.shapes);
    setGuides(next.guides);
    if (next.artboard) setArtboard(next.artboard);
  }, [future, constructedShapes, guides, artboard]);

  const setSelectedColor = useCallback(
    (color: string) => {
      setSelectedColorState(color);
      if (selectedShapeIds.length === 0) return;
      const updated = constructedShapes.map((s) =>
        selectedShapeIds.includes(s.id) ? { ...s, fillColor: color } : s
      );
      pushHistory();
      setConstructedShapes(updated);
    },
    [selectedShapeIds, constructedShapes, pushHistory]
  );

  const selectScaffold = useCallback(
    (presetId: string) => {
      const found = SCAFFOLD_PRESETS.find((p) => p.id === presetId);
      if (!found) return;
      pushHistory();
      setCurrentScaffold(found);
      setGuides(found.guides);
      setConstructedShapes([]);
      setSelectedGuideIds([]);
      setSelectedShapeIds([]);
    },
    [pushHistory]
  );

  const addGuide = useCallback(
    (newGuide: GuideShape) => {
      const updated = [...guides, newGuide];
      pushHistory();
      setGuides(updated);
      setSelectedGuideIds([newGuide.id]);
      setSelectedShapeIds([]);
    },
    [guides, pushHistory]
  );

  const commitGuideTransform = useCallback(
    (updatedGuide: GuideShape) => {
      const updated = guides.map((g) =>
        g.id === updatedGuide.id ? updatedGuide : g
      );
      pushHistory();
      setGuides(updated);
    },
    [guides, pushHistory]
  );

  const commitBatchGuidesTransform = useCallback(
    (batch: GuideShape[]) => {
      const map = new Map(batch.map((g) => [g.id, g]));
      const updated = guides.map((g) => map.get(g.id) || g);
      pushHistory();
      setGuides(updated);
    },
    [guides, pushHistory]
  );

  const commitShapeTransform = useCallback(
    (updatedShape: ConstructedShape) => {
      const updated = constructedShapes.map((s) =>
        s.id === updatedShape.id ? updatedShape : s
      );
      pushHistory();
      setConstructedShapes(updated);
    },
    [constructedShapes, pushHistory]
  );

  const commitBatchShapesTransform = useCallback(
    (batch: ConstructedShape[]) => {
      const map = new Map(batch.map((s) => [s.id, s]));
      const updated = constructedShapes.map((s) => map.get(s.id) || s);
      pushHistory();
      setConstructedShapes(updated);
    },
    [constructedShapes, pushHistory]
  );

  const scaleShapes = useCallback(
    (factor: number) => {
      if (factor <= 0) return;
      const targetIds =
        selectedShapeIds.length > 0
          ? selectedShapeIds
          : constructedShapes.map((s) => s.id);
      if (targetIds.length === 0) return;

      const targetShapes = constructedShapes.filter((s) => targetIds.includes(s.id));
      const scaled = scaleConstructedShapes(targetShapes, factor);
      const map = new Map(scaled.map((s) => [s.id, s]));
      const updated = constructedShapes.map((s) => map.get(s.id) || s);

      pushHistory();
      setConstructedShapes(updated);
    },
    [constructedShapes, selectedShapeIds, pushHistory]
  );

  const centerLogo = useCallback(() => {
    if (constructedShapes.length === 0) return;
    const targetIds =
      selectedShapeIds.length > 0
        ? selectedShapeIds
        : constructedShapes.map((s) => s.id);
    const targetShapes = constructedShapes.filter((s) => targetIds.includes(s.id));
    const bbox = getShapesBoundingBox(targetShapes);
    if (!bbox) return;

    const artboardCenter = {
      x: artboard.x + artboard.width / 2,
      y: artboard.y + artboard.height / 2,
    };
    const logoCenter = {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2,
    };
    const dx = Math.round(artboardCenter.x - logoCenter.x);
    const dy = Math.round(artboardCenter.y - logoCenter.y);
    if (dx === 0 && dy === 0) return;

    pushHistory();
    const moved = targetShapes.map((s) => moveConstructedShape(s, dx, dy));
    const map = new Map(moved.map((s) => [s.id, s]));
    setConstructedShapes(constructedShapes.map((s) => map.get(s.id) || s));
  }, [constructedShapes, selectedShapeIds, artboard, pushHistory]);

  const cropCanvasToLogo = useCallback(() => {
    if (constructedShapes.length === 0) return;
    const bbox = getShapesBoundingBox(constructedShapes);
    if (!bbox) return;

    const padding = 50;
    const newArtboard: ArtboardConfig = {
      x: Math.round(bbox.x - padding),
      y: Math.round(bbox.y - padding),
      width: Math.max(100, Math.round(bbox.width + padding * 2)),
      height: Math.max(100, Math.round(bbox.height + padding * 2)),
    };

    pushHistory();
    setArtboard(newArtboard);
  }, [constructedShapes, pushHistory]);

  const resetArtboard = useCallback(() => {
    pushHistory();
    setArtboard(DEFAULT_ARTBOARD);
  }, [pushHistory]);

  const deleteSelected = useCallback(() => {
    if (selectedGuideIds.length === 0 && selectedShapeIds.length === 0) return;
    pushHistory();
    if (selectedGuideIds.length > 0) {
      setGuides((prev) => prev.filter((g) => !selectedGuideIds.includes(g.id)));
      setSelectedGuideIds([]);
    }
    if (selectedShapeIds.length > 0) {
      setConstructedShapes((prev) =>
        prev.filter((s) => !selectedShapeIds.includes(s.id))
      );
      setSelectedShapeIds([]);
    }
  }, [selectedGuideIds, selectedShapeIds, pushHistory]);

  const removeGuideById = useCallback(
    (id: string) => {
      const updated = guides.filter((g) => g.id !== id);
      setSelectedGuideIds((prev) => prev.filter((gid) => gid !== id));
      pushHistory();
      setGuides(updated);
    },
    [guides, pushHistory]
  );

  const addConstructedShape = useCallback(
    (newShape: ConstructedShape) => {
      pushHistory();
      setConstructedShapes((prev) => [...prev, newShape]);
      setSelectedShapeIds([newShape.id]);
      setSelectedGuideIds([]);
    },
    [pushHistory]
  );

  const updateConstructedShape = useCallback(
    (updatedShape: ConstructedShape) => {
      pushHistory();
      setConstructedShapes((prev) =>
        prev.map((s) => (s.id === updatedShape.id ? updatedShape : s))
      );
    },
    [pushHistory]
  );

  const removeShapeById = useCallback(
    (id: string) => {
      const updated = constructedShapes.filter((s) => s.id !== id);
      setSelectedShapeIds((prev) => prev.filter((sid) => sid !== id));
      pushHistory();
      setConstructedShapes(updated);
    },
    [constructedShapes, pushHistory]
  );

  const reorderShape = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const next = reorderShapes(constructedShapes, id, direction);
      if (next === constructedShapes) return;
      pushHistory();
      setConstructedShapes(next);
    },
    [constructedShapes, pushHistory]
  );

  const clearAllGuides = useCallback(() => {
    if (guides.length === 0) return;
    pushHistory();
    setGuides([]);
    setSelectedGuideIds([]);
  }, [guides, pushHistory]);

  const copySelection = useCallback(() => {
    const selectedGuides = guides.filter((g) =>
      selectedGuideIds.includes(g.id)
    );
    const selectedShapes = constructedShapes.filter((s) =>
      selectedShapeIds.includes(s.id)
    );
    if (selectedGuides.length === 0 && selectedShapes.length === 0) return;
    setClipboard({ guides: selectedGuides, shapes: selectedShapes });
  }, [selectedGuideIds, selectedShapeIds, guides, constructedShapes]);

  const pasteClipboard = useCallback(() => {
    if (!clipboard) return;
    pushHistory();
    const newGuides = clipboard.guides.map((g, i) =>
      moveGuide({ ...g, id: `guide-copy-${Date.now()}-${i}` }, 20, 20)
    );
    const newShapes = clipboard.shapes.map((s, i) =>
      moveConstructedShape(
        { ...s, id: `shape-copy-${Date.now()}-${i}`, createdAt: Date.now() },
        20,
        20
      )
    );

    if (newGuides.length > 0) {
      setGuides((prev) => [...prev, ...newGuides]);
      setSelectedGuideIds(newGuides.map((g) => g.id));
    }
    if (newShapes.length > 0) {
      setConstructedShapes((prev) => [...prev, ...newShapes]);
      setSelectedShapeIds(newShapes.map((s) => s.id));
    }
  }, [clipboard, pushHistory]);

  const duplicateSelection = useCallback(() => {
    copySelection();
    pasteClipboard();
  }, [copySelection, pasteClipboard]);

  const mergeFaceIds = useCallback(
    (faceIds: string[]) => {
      if (faceIds.length === 0) return;
      const targetFaces = atomicFaces.filter((f) => faceIds.includes(f.id));
      if (targetFaces.length === 0) return;

      const mergedPath = mergeFacePaths(targetFaces.map((f) => f.pathData));
      if (!mergedPath) return;

      const newShape: ConstructedShape = {
        id: `shape-${Date.now()}`,
        pathData: mergedPath,
        fillColor: selectedColor,
        createdAt: Date.now(),
      };
      const updated = [...constructedShapes, newShape];
      pushHistory();
      setConstructedShapes(updated);
      setSelectedShapeIds([newShape.id]);
    },
    [atomicFaces, selectedColor, constructedShapes, pushHistory]
  );

  const subtractFaceIds = useCallback(
    (faceIds: string[]) => {
      if (faceIds.length === 0 || constructedShapes.length === 0) return;
      const targetFaces = atomicFaces.filter((f) => faceIds.includes(f.id));
      if (targetFaces.length === 0) return;

      const cutterPath = mergeFacePaths(targetFaces.map((f) => f.pathData));
      if (!cutterPath) return;

      const updated = constructedShapes
        .map((shape) => {
          if (shape.type === 'text') return shape;
          return {
            ...shape,
            pathData: subtractFaceFromShape(shape.pathData, cutterPath),
          };
        })
        .filter((s) => s.type === 'text' || Boolean(s.pathData && s.pathData.length > 5));

      pushHistory();
      setConstructedShapes(updated);
    },
    [atomicFaces, constructedShapes, pushHistory]
  );

  const clearShapes = useCallback(() => {
    if (constructedShapes.length === 0) return;
    pushHistory();
    setConstructedShapes([]);
    setSelectedShapeIds([]);
  }, [constructedShapes, pushHistory]);

  return {
    currentScaffold,
    guides,
    atomicFaces,
    constructedShapes,
    mode,
    isAltHeld,
    selectedColor,
    showGuides,
    pan,
    zoom,
    canvasBackground,
    setCanvasBackground,
    artboard,
    isArtboardCropped:
      artboard.x !== DEFAULT_ARTBOARD.x ||
      artboard.y !== DEFAULT_ARTBOARD.y ||
      artboard.width !== DEFAULT_ARTBOARD.width ||
      artboard.height !== DEFAULT_ARTBOARD.height,
    centerLogo,
    cropCanvasToLogo,
    resetArtboard,
    selectedGuideIds,
    selectedShapeIds,
    backgroundImage,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    setMode,
    setIsAltHeld,
    setSelectedColor,
    setShowGuides,
    setPan,
    setZoom,
    setSelectedGuideIds,
    setSelectedShapeIds,
    selectScaffold,
    addGuide,
    addConstructedShape,
    updateConstructedShape,
    commitGuideTransform,
    commitBatchGuidesTransform,
    commitShapeTransform,
    commitBatchShapesTransform,
    scaleShapes,
    deleteSelected,
    removeGuideById,
    removeShapeById,
    reorderShape,
    clearAllGuides,
    clearShapes,
    copySelection,
    pasteClipboard,
    duplicateSelection,
    setBackgroundImage: useCallback((url: string, width = 800, height = 800) => {
      const x = Math.round((800 - width) / 2);
      const y = Math.round((800 - height) / 2);
      setBackgroundImageState({
        url,
        opacity: 0.5,
        visible: true,
        x,
        y,
        width,
        height,
        scale: 1,
      });
    }, []),
    setBackgroundOpacity: useCallback((opacity: number) => {
      setBackgroundImageState((prev) => (prev ? { ...prev, opacity } : null));
    }, []),
    toggleBackgroundVisibility: useCallback(() => {
      setBackgroundImageState((prev) =>
        prev ? { ...prev, visible: !prev.visible } : null
      );
    }, []),
    clearBackgroundImage: useCallback(() => setBackgroundImageState(null), []),
    mergeFaceIds,
    subtractFaceIds,
    undo,
    redo,
  };
}

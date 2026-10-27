import React, { useState, useEffect } from 'react';
import { useBuilderStore } from './state/useBuilderStore';
import { Header } from './components/ui/Header';
import { Toolbar } from './components/ui/Toolbar';
import { ColorPaletteBar } from './components/ui/ColorPaletteBar';
import { ShapesPanel } from './components/ui/ShapesPanel';
import { ExportModal } from './components/ui/ExportModal';
import { TextToolbar } from './components/ui/TextToolbar';
import { ShapeBuilderCanvas } from './components/canvas/ShapeBuilderCanvas';
import { BuilderMode } from './geometry/types';

export const App: React.FC = () => {
  const store = useBuilderStore();
  const [isExportOpen, setIsExportOpen] = useState(false);

  const selectedTextShape =
    store.selectedShapeIds.length === 1
      ? store.constructedShapes.find(
          (s) => s.id === store.selectedShapeIds[0] && s.type === 'text'
        ) || null
      : null;

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

      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        store.copySelection();
        return;
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        store.pasteClipboard();
        return;
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        store.duplicateSelection();
        return;
      }

      if (e.altKey) store.setIsAltHeld(true);
      if (e.key.toLowerCase() === 'v') store.setMode('select');
      if (e.key.toLowerCase() === 'm') store.setMode('merge');
      if (e.key.toLowerCase() === 'l') store.setMode('draw-line');
      if (e.key.toLowerCase() === 'p') store.setMode('draw-parallel');
      if (e.key.toLowerCase() === 'c') store.setMode('draw-circle');
      if (e.key.toLowerCase() === 'o') store.setMode('draw-parallel-circle');
      if (e.key.toLowerCase() === 'e') store.setMode('draw-ellipse');
      if (e.key.toLowerCase() === 'r') store.setMode('draw-rect');
      if (e.key.toLowerCase() === 't') {
        store.setSelectedShapeIds([]);
        store.setMode('text');
      }
      if (e.key.toLowerCase() === 'h') store.setShowGuides(!store.showGuides);

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        store.redo();
      }

      if (isCmdOrCtrl && e.key === ']') {
        e.preventDefault();
        const selectedId = store.selectedShapeIds[0];
        if (selectedId) store.reorderShape(selectedId, 'up');
        return;
      }
      if (isCmdOrCtrl && e.key === '[') {
        e.preventDefault();
        const selectedId = store.selectedShapeIds[0];
        if (selectedId) store.reorderShape(selectedId, 'down');
        return;
      }

      if (e.key === '[') {
        store.scaleShapes(0.9);
      }
      if (e.key === ']') {
        store.scaleShapes(1.1);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') store.setIsAltHeld(false);
    };

    const preventWindowDrop = (e: DragEvent) => e.preventDefault();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('dragover', preventWindowDrop);
    window.addEventListener('drop', preventWindowDrop);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('dragover', preventWindowDrop);
      window.removeEventListener('drop', preventWindowDrop);
    };
  }, [store]);

  const handleSelectShape = (id: string, isShift?: boolean) => {
    if (isShift) {
      const updated = store.selectedShapeIds.includes(id)
        ? store.selectedShapeIds.filter((sid) => sid !== id)
        : [...store.selectedShapeIds, id];
      store.setSelectedShapeIds(updated);
    } else {
      store.setSelectedShapeIds([id]);
      store.setSelectedGuideIds([]);
    }
  };

  const handleSetMode = (m: BuilderMode) => {
    if (m === 'text') {
      store.setSelectedShapeIds([]);
    }
    store.setMode(m);
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#0a0a0c] text-zinc-100">
      <Header
        currentScaffold={store.currentScaffold}
        onSelectScaffold={store.selectScaffold}
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        onUndo={store.undo}
        onRedo={store.redo}
        zoom={store.zoom}
        backgroundImage={store.backgroundImage}
        onSetBackgroundImage={store.setBackgroundImage}
        onSetBackgroundOpacity={store.setBackgroundOpacity}
        onToggleBackgroundVisibility={store.toggleBackgroundVisibility}
        onClearBackgroundImage={store.clearBackgroundImage}
        onZoomChange={store.setZoom}
        onResetZoom={() => {
          store.setZoom(1);
          store.setPan({ x: 0, y: 0 });
        }}
        onOpenExport={() => setIsExportOpen(true)}
        canvasBackground={store.canvasBackground}
        onSelectBackground={store.setCanvasBackground}
        hasConstructedShapes={store.constructedShapes.length > 0}
        isArtboardCropped={store.isArtboardCropped}
        onCenterLogo={store.centerLogo}
        onCropCanvas={store.cropCanvasToLogo}
        onResetArtboard={store.resetArtboard}
      />

      <div className="relative flex-1 w-full h-full overflow-hidden">
        <Toolbar
          mode={store.mode}
          isAltHeld={store.isAltHeld}
          showGuides={store.showGuides}
          onSetMode={handleSetMode}
          onToggleGuides={() => store.setShowGuides(!store.showGuides)}
          onClear={store.clearShapes}
          onClearGuides={store.clearAllGuides}
        />

        <TextToolbar
          mode={store.mode}
          selectedTextShape={selectedTextShape}
          selectedColor={store.selectedColor}
          onAddTextShape={store.addConstructedShape}
          onUpdateTextShape={store.updateConstructedShape}
          onDeselect={() => store.setSelectedShapeIds([])}
          onClose={() => {
            store.setSelectedShapeIds([]);
            if (store.mode === 'text') store.setMode('select');
          }}
        />

        <ColorPaletteBar
          selectedColor={store.selectedColor}
          onSelectColor={store.setSelectedColor}
        />

        <ShapesPanel
          shapes={store.constructedShapes}
          selectedShapeIds={store.selectedShapeIds}
          onSelectShape={handleSelectShape}
          onRemoveShape={store.removeShapeById}
          onScaleShapes={store.scaleShapes}
          onCenterLogo={store.centerLogo}
          onCropCanvas={store.cropCanvasToLogo}
          onResetArtboard={store.resetArtboard}
          isArtboardCropped={store.isArtboardCropped}
          onReorderShape={store.reorderShape}
        />

        <ShapeBuilderCanvas
          guides={store.guides}
          atomicFaces={store.atomicFaces}
          constructedShapes={store.constructedShapes}
          mode={store.mode}
          isAltHeld={store.isAltHeld}
          showGuides={store.showGuides}
          pan={store.pan}
          zoom={store.zoom}
          selectedGuideIds={store.selectedGuideIds}
          selectedShapeIds={store.selectedShapeIds}
          selectedColor={store.selectedColor}
          canvasBackground={store.canvasBackground}
          artboard={store.artboard}
          backgroundImage={store.backgroundImage}
          onPanChange={store.setPan}
          onZoomChange={store.setZoom}
          onMergeFaceIds={store.mergeFaceIds}
          onSubtractFaceIds={store.subtractFaceIds}
          onAddGuide={store.addGuide}
          onAddConstructedShape={store.addConstructedShape}
          onCommitBatchGuidesTransform={store.commitBatchGuidesTransform}
          onCommitBatchShapesTransform={store.commitBatchShapesTransform}
          onSelectGuideIds={store.setSelectedGuideIds}
          onSelectShapeIds={store.setSelectedShapeIds}
          onDeleteSelected={store.deleteSelected}
          onSetBackgroundImage={store.setBackgroundImage}
        />
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        constructedShapes={store.constructedShapes}
        guides={store.guides}
        canvasBackground={store.canvasBackground}
        artboard={store.artboard}
      />
    </div>
  );
};

export default App;

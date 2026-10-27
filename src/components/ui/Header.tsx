import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Download,
  FolderOpen,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  AlignCenter,
  Crop,
} from 'lucide-react';
import { BackgroundImageConfig, ScaffoldConfig, LogoProjectData } from '../../geometry/types';
import {
  parseProjectFile,
  parseGenericSvgToShapes,
} from '../../geometry/projectSerialization';
import { ScaffoldSelector } from './ScaffoldSelector';
import { ImageControls } from './ImageControls';
import { BackgroundControl } from './BackgroundControl';

interface HeaderProps {
  currentScaffold: ScaffoldConfig;
  onSelectScaffold: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  backgroundImage: BackgroundImageConfig | null;
  onSetBackgroundImage: (url: string, width?: number, height?: number) => void;
  onSetBackgroundOpacity: (opacity: number) => void;
  onToggleBackgroundVisibility: () => void;
  onClearBackgroundImage: () => void;
  onZoomChange: (zoom: number) => void;
  onResetZoom: () => void;
  onOpenExport: () => void;
  onLoadProject?: (project: LogoProjectData) => void;
  canvasBackground: string;
  onSelectBackground: (color: string) => void;
  hasConstructedShapes?: boolean;
  isArtboardCropped?: boolean;
  onCenterLogo?: () => void;
  onCropCanvas?: () => void;
  onResetArtboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScaffold,
  onSelectScaffold,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  backgroundImage,
  onSetBackgroundImage,
  onSetBackgroundOpacity,
  onToggleBackgroundVisibility,
  onClearBackgroundImage,
  onZoomChange,
  onResetZoom,
  onOpenExport,
  onLoadProject,
  canvasBackground,
  onSelectBackground,
  hasConstructedShapes = false,
  isArtboardCropped = false,
  onCenterLogo,
  onCropCanvas,
  onResetArtboard,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const handleProjectFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const project = parseProjectFile(text);
      if (project) {
        onLoadProject?.(project);
        e.target.value = '';
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
      }
    } catch (err) {
      console.error('Failed to load project file:', err);
    }
    e.target.value = '';
  };

  return (
    <>
      <header className="h-16 border-b border-white/10 bg-[#0e0f12]/80 backdrop-blur-xl px-6 flex items-center justify-between z-30 select-none">
        {/* Brand & Reference Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">
                  Logotype Builder
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  MVP
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Shape Builder & Image Scaffolding
              </p>
            </div>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          {/* Reference Image Controls */}
          <ImageControls
            backgroundImage={backgroundImage}
            onSetBackgroundImage={onSetBackgroundImage}
            onSetOpacity={onSetBackgroundOpacity}
            onToggleVisibility={onToggleBackgroundVisibility}
            onClearImage={onClearBackgroundImage}
          />
        </div>

        {/* Center: Scaffold Selector */}
        <ScaffoldSelector
          currentScaffold={currentScaffold}
          onSelectScaffold={onSelectScaffold}
        />

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* History Controls (Undo / Redo) */}
          <div className="h-9 flex items-center gap-0.5 bg-[#141519] border border-white/10 rounded-xl px-1 text-xs text-zinc-400">
            <button
              type="button"
              title="Undo (Ctrl+Z)"
              disabled={!canUndo}
              onClick={onUndo}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                canUndo
                  ? 'text-zinc-300 hover:text-white hover:bg-white/5 active:scale-90'
                  : 'text-zinc-600 cursor-not-allowed opacity-40'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Redo (Ctrl+Y)"
              disabled={!canRedo}
              onClick={onRedo}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                canRedo
                  ? 'text-zinc-300 hover:text-white hover:bg-white/5 active:scale-90'
                  : 'text-zinc-600 cursor-not-allowed opacity-40'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <BackgroundControl
            canvasBackground={canvasBackground}
            onSelectBackground={onSelectBackground}
          />

          {/* Canvas & Artboard Controls */}
          <div className="h-9 flex items-center gap-0.5 bg-[#141519] border border-white/10 rounded-xl px-1 text-xs text-zinc-400">
            <button
              type="button"
              title="Center Logo on Canvas"
              disabled={!hasConstructedShapes}
              onClick={onCenterLogo}
              className={`h-7 px-2 rounded-lg flex items-center gap-1.5 transition-all text-xs ${
                hasConstructedShapes
                  ? 'text-zinc-300 hover:text-white hover:bg-white/5 active:scale-95'
                  : 'text-zinc-600 cursor-not-allowed opacity-40'
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xl:inline text-[11px] font-medium">Center</span>
            </button>
            <div className="w-[1px] h-4 bg-white/10" />
            <button
              type="button"
              title={isArtboardCropped ? 'Reset Canvas Size (800×800)' : 'Crop Canvas around Logo'}
              disabled={!hasConstructedShapes && !isArtboardCropped}
              onClick={isArtboardCropped ? onResetArtboard : onCropCanvas}
              className={`h-7 px-2 rounded-lg flex items-center gap-1.5 transition-all text-xs ${
                isArtboardCropped
                  ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 active:scale-95'
                  : hasConstructedShapes
                  ? 'text-zinc-300 hover:text-white hover:bg-white/5 active:scale-95'
                  : 'text-zinc-600 cursor-not-allowed opacity-40'
              }`}
            >
              <Crop className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xl:inline text-[11px] font-medium">
                {isArtboardCropped ? 'Reset Canvas' : 'Crop'}
              </span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="h-9 flex items-center gap-1 bg-[#141519] border border-white/10 rounded-xl px-1.5 text-xs text-zinc-400">
            <button
              type="button"
              title="Zoom Out"
              onClick={() => onZoomChange(Math.max(zoom * 0.9, 0.3))}
              className="h-7 w-7 flex items-center justify-center hover:text-white rounded-lg hover:bg-white/5 active:scale-90"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Reset Zoom"
              onClick={onResetZoom}
              className="h-7 px-1.5 flex items-center justify-center hover:text-white font-mono text-[11px] rounded-lg hover:bg-white/5"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              title="Zoom In"
              onClick={() => onZoomChange(Math.min(zoom * 1.1, 4))}
              className="h-7 w-7 flex items-center justify-center hover:text-white rounded-lg hover:bg-white/5 active:scale-90"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Shortcuts Info */}
          <button
            type="button"
            title="Keyboard Shortcuts"
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all active:scale-95 border border-white/10"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Open / Import Project */}
          <input
            ref={projectInputRef}
            type="file"
            accept=".logo,.json,.svg"
            className="hidden"
            onChange={handleProjectFileSelect}
          />
          <button
            type="button"
            title="Open Project or Import SVG (.logo, .svg, .json)"
            onClick={() => projectInputRef.current?.click()}
            className="h-9 flex items-center gap-2 px-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 border border-white/10 text-xs font-semibold"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={onOpenExport}
            className="h-9 flex items-center gap-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Mark</span>
          </button>
        </div>
      </header>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#141519] border border-white/10 p-5 shadow-2xl text-xs space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-bold text-white text-sm">Keyboard & Mouse Controls</h4>
            <div className="space-y-2 text-zinc-300">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Draw Line Tool</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">L</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Draw Parallel Lines</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">P</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Draw Circle Tool</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">C</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Draw Ellipse Tool</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">E</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Draw Rectangle / Quad</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">R</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Shape Builder Tool</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">M</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Erase / Subtract Mode</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">Alt</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Pan Canvas</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">Space + Drag</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Toggle Guides</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">H</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Copy & Paste Selected</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">Ctrl + C / V</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Duplicate Selected</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">Ctrl + D</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Scale Logo Down / Up</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">[ / ]</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Move Shape Layer Up / Down</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">Ctrl + [ / ]</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Cycle Through Guides</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">Tab / Shift+Tab</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Nudge Guide / Shape (Hold Shift for 10px)</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">Arrow Keys</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>Resize / Lengthen Shape or Guide</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">Ctrl + Arrow Keys</kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Delete Selected Guide or Shape</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">Backspace</kbd>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowShortcuts(false)}
              className="w-full py-2 mt-2 rounded-xl bg-zinc-800 text-zinc-200 font-semibold hover:bg-zinc-700 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

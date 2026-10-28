import React from 'react';
import {
  MousePointer,
  MinusCircle,
  PlusCircle,
  Eye,
  EyeOff,
  Trash2,
  Circle,
  Slash,
  Equal,
  CircleDot,
  Square,
  Wand2,
  Type,
  Focus,
  Combine,
} from 'lucide-react';
import { BuilderMode } from '../../geometry/types';

interface ToolbarProps {
  mode: BuilderMode;
  isAltHeld: boolean;
  showGuides: boolean;
  onSetMode: (mode: BuilderMode) => void;
  onToggleGuides: () => void;
  onCycleGuide?: () => void;
  onClear: () => void;
  onClearGuides: () => void;
  onUniteShapes?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  mode,
  isAltHeld,
  showGuides,
  onSetMode,
  onToggleGuides,
  onCycleGuide,
  onClear,
  onClearGuides,
  onUniteShapes,
}) => {
  const isShapeBuilder = mode === 'merge' || mode === 'subtract';
  const effectiveMode = isAltHeld ? 'subtract' : mode;

  return (
    <aside className="absolute left-6 top-20 z-20 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-[#141519]/90 backdrop-blur-xl border border-white/10 shadow-2xl">
      {/* Selection Tool (V) */}
      <button
        type="button"
        title="Select & Transform (V): Click guide to move, resize, or delete (Backspace)"
        onClick={() => onSetMode('select')}
        className={`p-2.5 rounded-xl transition-all ${
          mode === 'select'
            ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
        }`}
      >
        <MousePointer className="w-5 h-5" />
      </button>

      <div className="w-6 h-[1px] bg-white/10 my-0.5" />

      {/* Drawing Tools Section */}
      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 pt-0.5">
        Draw
      </span>

      {/* Line Tool (L) */}
      <button
        type="button"
        title="Draw Guide Line (L): Drag across canvas to cross and slice"
        onClick={() => onSetMode('draw-line')}
        className={`p-2.5 rounded-xl transition-all ${
          mode === 'draw-line'
            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
        }`}
      >
        <Slash className="w-5 h-5 -rotate-45" />
      </button>

      {/* Parallel Lines Tool (P) */}
      <button
        type="button"
        title="Draw Parallel Lines (P): Synchronized movement, rotation, length and gap"
        onClick={() => onSetMode('draw-parallel')}
        className={`p-2.5 rounded-xl transition-all ${
          mode === 'draw-parallel'
            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
        }`}
      >
        <Equal className="w-5 h-5" />
      </button>

      {/* Circle Tool (C) */}
      <button
        type="button"
        title="Draw Guide Circle (C): Drag from center"
        onClick={() => onSetMode('draw-circle')}
        className={`p-2.5 rounded-xl transition-all ${
          mode === 'draw-circle'
            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
        }`}
      >
        <Circle className="w-5 h-5" />
      </button>

      {/* Parallel Circles Tool (O) */}
      <button
        type="button"
        title="Draw Parallel Circles (O): Concentric circles with synchronized radius and adjustable gap"
        onClick={() => onSetMode('draw-parallel-circle')}
        className={`p-2.5 rounded-xl transition-all ${
          mode === 'draw-parallel-circle'
            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
        }`}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
        </svg>
      </button>

      {/* Ellipse Tool (E) */}
      <button
        type="button"
        title="Draw Guide Ellipse (E): Drag from center"
        onClick={() => onSetMode('draw-ellipse')}
        className={`p-2.5 rounded-xl transition-all ${
          mode === 'draw-ellipse'
            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
        }`}
      >
        <CircleDot className="w-5 h-5" />
      </button>

      {/* Rectangle / Quad Tool (R) */}
      <button
        type="button"
        title="Draw Rectangle / Quad (R): Drag across canvas, adjust 4 corners in Select mode"
        onClick={() => onSetMode('draw-rect')}
        className={`p-2.5 rounded-xl transition-all ${
          mode === 'draw-rect'
            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
        }`}
      >
        <Square className="w-5 h-5" />
      </button>

      {/* Text Tool (T) */}
      <button
        type="button"
        title="Text Tool (T): Add text with custom font and size"
        onClick={() => onSetMode('text')}
        className={`p-2.5 rounded-xl transition-all ${
          mode === 'text'
            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
        }`}
      >
        <Type className="w-5 h-5" />
      </button>

      <div className="w-6 h-[1px] bg-white/10 my-0.5" />

      {/* Shape Builder Section */}
      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
        Build
      </span>

      {/* Shape Builder Merge (M) */}
      <button
        type="button"
        title="Shape Builder: Merge (M) - Drag across cells to unite"
        onClick={() => onSetMode('merge')}
        className={`p-2.5 rounded-xl transition-all ${
          isShapeBuilder && effectiveMode === 'merge'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
        }`}
      >
        <PlusCircle className="w-5 h-5" />
      </button>

      {/* Shape Builder Subtract (Alt) */}
      <button
        type="button"
        title="Shape Builder: Subtract (Alt) - Drag across cells to erase"
        onClick={() => onSetMode('subtract')}
        className={`p-2.5 rounded-xl transition-all ${
          isShapeBuilder && effectiveMode === 'subtract'
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
        }`}
      >
        <MinusCircle className="w-5 h-5" />
      </button>

      {/* Unite Shapes into 1 Continuous Shape (Ctrl+U) */}
      {onUniteShapes && (
        <button
          type="button"
          title="Unite All Shapes into 1 Continuous Shape (Ctrl+U) - Dissolves internal seams"
          onClick={onUniteShapes}
          className="p-2.5 rounded-xl text-zinc-400 hover:text-indigo-400 hover:bg-indigo-950/30 transition-all active:scale-95"
        >
          <Combine className="w-5 h-5" />
        </button>
      )}

      <div className="w-6 h-[1px] bg-white/10 my-0.5" />

      {/* Toggle Construction Guides Visibility (H) */}
      <button
        type="button"
        title={showGuides ? 'Hide Guides (H)' : 'Show Guides (H)'}
        onClick={onToggleGuides}
        className={`p-2.5 rounded-xl transition-all active:scale-95 ${
          showGuides
            ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/40'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        {showGuides ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      </button>

      {/* Cycle Through Guides (Tab) */}
      {onCycleGuide && (
        <button
          type="button"
          title="Cycle Through Guides (Tab)"
          onClick={onCycleGuide}
          className="p-2.5 rounded-xl text-zinc-400 hover:text-cyan-400 hover:bg-cyan-950/30 transition-all active:scale-95"
        >
          <Focus className="w-5 h-5" />
        </button>
      )}

      <div className="w-6 h-[1px] bg-white/10 my-0.5" />

      {/* Clear All Guides */}
      <button
        type="button"
        title="Clear Construction Guides"
        onClick={onClearGuides}
        className="p-2.5 rounded-xl text-zinc-500 hover:text-amber-400 hover:bg-amber-950/30 transition-all active:scale-95"
      >
        <Wand2 className="w-5 h-5" />
      </button>

      {/* Clear All Built Shapes */}
      <button
        type="button"
        title="Clear Built Shapes"
        onClick={onClear}
        className="p-2.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all active:scale-95"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </aside>
  );
};

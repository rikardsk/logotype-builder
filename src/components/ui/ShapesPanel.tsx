import React, { useMemo } from 'react';
import {
  Trash2,
  Layers,
  Type,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  AlignCenter,
  Crop,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Combine,
  FlipHorizontal,
} from 'lucide-react';
import { ConstructedShape } from '../../geometry/types';

interface ShapesPanelProps {
  shapes: ConstructedShape[];
  selectedShapeIds: string[];
  onSelectShape: (id: string, isShift?: boolean) => void;
  onRemoveShape: (id: string) => void;
  onScaleShapes?: (factor: number) => void;
  onResetScale?: () => void;
  onApplyCornerRadius?: (radius: number) => void;
  onCenterLogo?: () => void;
  onCropCanvas?: () => void;
  onResetArtboard?: () => void;
  isArtboardCropped?: boolean;
  onReorderShape?: (id: string, direction: 'up' | 'down') => void;
  onToggleVisibility?: (id: string) => void;
  onUniteShapes?: () => void;
  onMirrorSelection?: (axis?: 'horizontal' | 'vertical', duplicate?: boolean) => void;
  showShapeOutlines?: boolean;
  onToggleOutlines?: () => void;
}

export const ShapesPanel: React.FC<ShapesPanelProps> = ({
  shapes,
  selectedShapeIds,
  onSelectShape,
  onRemoveShape,
  onScaleShapes,
  onResetScale,
  onApplyCornerRadius,
  onCenterLogo,
  onCropCanvas,
  onResetArtboard,
  isArtboardCropped = false,
  onReorderShape,
  onToggleVisibility,
  onUniteShapes,
  onMirrorSelection,
  showShapeOutlines = true,
  onToggleOutlines,
}) => {
  if (shapes.length === 0) return null;

  const targetShapes = useMemo(() => {
    if (selectedShapeIds.length > 0) {
      return shapes.filter((s) => selectedShapeIds.includes(s.id));
    }
    return shapes.filter((s) => s.visible !== false);
  }, [shapes, selectedShapeIds]);

  const currentCornerRadius = useMemo(() => {
    const targetWithRadius = targetShapes.filter(
      (s) => typeof s.cornerRadius === 'number' && s.cornerRadius > 0
    );
    if (targetWithRadius.length === 0) return 0;
    return targetWithRadius[0].cornerRadius || 0;
  }, [targetShapes]);

  const isScaleModified = useMemo(() => {
    return targetShapes.some((s) => Math.abs((s.scale ?? 1) - 1) > 0.001);
  }, [targetShapes]);

  const currentScalePercent = useMemo(() => {
    if (targetShapes.length === 0) return 100;
    const avgScale =
      targetShapes.reduce((sum, s) => sum + (s.scale ?? 1), 0) / targetShapes.length;
    return Math.round(avgScale * 100);
  }, [targetShapes]);

  const layerItems = useMemo(() => {
    return shapes
      .map((shape, originalIndex) => ({
        shape,
        originalIndex,
      }))
      .reverse();
  }, [shapes]);

  return (
    <div className="absolute right-6 bottom-5 z-20 w-72 max-h-[30rem] overflow-y-auto rounded-2xl bg-[#141519]/90 backdrop-blur-xl border border-white/10 shadow-2xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 px-1">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Built Shapes ({shapes.length})</span>
        </span>
        {onToggleOutlines && (
          <button
            type="button"
            onClick={onToggleOutlines}
            title={showShapeOutlines ? 'Hide black outlines from shapes' : 'Show black outlines on shapes'}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 border ${
              showShapeOutlines
                ? 'bg-zinc-800 text-zinc-300 hover:text-white border-white/10'
                : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30'
            }`}
          >
            {showShapeOutlines ? 'Outlines: ON' : 'Outlines: OFF'}
          </button>
        )}
      </div>

      {/* Unite / Merge Continuous Shape Action */}
      {shapes.length > 1 && onUniteShapes && (
        <button
          type="button"
          onClick={onUniteShapes}
          title="Unite shapes into 1 continuous shape (dissolves internal seams & black outlines) [Hotkey: Ctrl+U]"
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Combine className="w-4 h-4" />
          <span>
            {selectedShapeIds.length > 1
              ? `Unite Selected (${selectedShapeIds.length})`
              : 'Unite All Shapes'}
          </span>
        </button>
      )}

      {/* Bilateral Mirror (Flip & Duplicate) Quick Actions */}
      {onMirrorSelection && (
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            title="Bilateral Mirror (Flip & Duplicate): Reflects horizontally across canvas center to complete symmetrical logo [Hotkey: Shift+M]"
            onClick={() => onMirrorSelection('horizontal', true)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all active:scale-95 text-[11px] font-medium shadow-sm"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Mirror & Dup</span>
          </button>
          <button
            type="button"
            title="Flip Horizontal: Invert left-to-right across canvas center [Hotkey: Shift+H]"
            onClick={() => onMirrorSelection('horizontal', false)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all active:scale-95 text-[11px] font-medium"
          >
            <FlipHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span>Flip Horiz</span>
          </button>
        </div>
      )}

      {/* Quick Scale Control */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="text-[11px] font-medium text-zinc-400 truncate"
            title={selectedShapeIds.length > 0 ? 'Scale Selection' : 'Scale Logo'}
          >
            Scale
          </span>
          {isScaleModified && (
            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {currentScalePercent}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onResetScale && (
            <button
              type="button"
              disabled={!isScaleModified}
              title={
                isScaleModified
                  ? 'Reset to original scale (100%) [Hotkey: \\]'
                  : 'At original scale (100%)'
              }
              onClick={onResetScale}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[11px] font-medium transition-all border ${
                isScaleModified
                  ? 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border-indigo-500/30 active:scale-95 shadow-sm'
                  : 'bg-zinc-800/40 text-zinc-600 border-white/5 cursor-not-allowed opacity-40'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <button
            type="button"
            title="Scale down 10% (Hotkey: [)"
            onClick={() => onScaleShapes?.(0.9)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 text-[11px] font-mono border border-white/5"
          >
            <ZoomOut className="w-3 h-3" />
            <span>-10%</span>
          </button>
          <button
            type="button"
            title="Scale up 10% (Hotkey: ])"
            onClick={() => onScaleShapes?.(1.1)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 text-[11px] font-mono border border-white/5"
          >
            <ZoomIn className="w-3 h-3" />
            <span>+10%</span>
          </button>
        </div>
      </div>

      {/* Corner Rounding / Fillet Polish Control */}
      <div className="flex flex-col gap-1.5 px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span
              className="text-[11px] font-medium text-zinc-300 truncate"
              title={selectedShapeIds.length > 0 ? 'Corner Rounding (Selected)' : 'Corner Rounding (Logo Polish)'}
            >
              {selectedShapeIds.length > 0 ? 'Corner Rounding' : 'Corner Polish'}
            </span>
            {currentCornerRadius > 0 && (
              <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentCornerRadius}px
              </span>
            )}
          </div>
          {onApplyCornerRadius && (
            <div className="flex items-center gap-1 shrink-0">
              {currentCornerRadius > 0 ? (
                <button
                  type="button"
                  title="Reset to sharp corners (0px)"
                  onClick={() => onApplyCornerRadius(0)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white transition-all active:scale-95 text-[11px] font-medium border border-amber-500/30"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Sharp</span>
                </button>
              ) : (
                <span className="text-[10px] text-zinc-500 font-mono">0px</span>
              )}
            </div>
          )}
        </div>

        {/* Range Slider for Live Fillet Polish */}
        {onApplyCornerRadius && (
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={currentCornerRadius}
              onChange={(e) => onApplyCornerRadius(Number(e.target.value))}
              title={`Corner fillet radius: ${currentCornerRadius}px`}
              className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Quick Presets: Sharp, 4px, 8px, 16px */}
        {onApplyCornerRadius && (
          <div className="grid grid-cols-4 gap-1 pt-0.5">
            {[
              { label: 'Sharp', val: 0, title: 'Sharp corners (0px)' },
              { label: '4px', val: 4, title: 'Subtle corner rounding (4px)' },
              { label: '8px', val: 8, title: 'Medium corner fillet (8px)' },
              { label: '16px', val: 16, title: 'Smooth organic fillet (16px)' },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                title={preset.title}
                onClick={() => onApplyCornerRadius(preset.val)}
                className={`py-0.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 border ${
                  currentCornerRadius === preset.val
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700/80 border-white/5'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alignment & Artboard Quick Actions */}
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <button
          type="button"
          title="Center Logo on Canvas"
          onClick={onCenterLogo}
          className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all active:scale-95 text-[11px] font-medium"
        >
          <AlignCenter className="w-3 h-3 text-indigo-400" />
          <span>Center</span>
        </button>
        <button
          type="button"
          title={isArtboardCropped ? 'Reset Canvas Size (800×800)' : 'Crop Canvas around Logo'}
          onClick={isArtboardCropped ? onResetArtboard : onCropCanvas}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border transition-all active:scale-95 text-[11px] font-medium ${
            isArtboardCropped
              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
              : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Crop className="w-3 h-3 text-indigo-400" />
          <span>{isArtboardCropped ? 'Reset' : 'Crop'}</span>
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {layerItems.map(({ shape, originalIndex }) => {
          const isSelected = selectedShapeIds.includes(shape.id);
          const isTop = originalIndex === shapes.length - 1;
          const isBottom = originalIndex === 0;
          const isHidden = shape.visible === false;

          return (
            <div
              key={shape.id}
              onClick={(e) => onSelectShape(shape.id, e.shiftKey)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-all group ${
                isSelected
                  ? 'bg-indigo-950/60 border border-indigo-500/40 text-white shadow-sm'
                  : 'bg-zinc-900/80 border border-white/5 text-zinc-300 hover:border-white/15'
              } ${isHidden ? 'opacity-40 hover:opacity-75' : ''}`}
            >
              <div className="flex items-center gap-2 overflow-hidden min-w-0 mr-1">
                <div
                  className={`w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm shrink-0 ${
                    isHidden ? 'opacity-40' : ''
                  }`}
                  style={{ backgroundColor: shape.fillColor }}
                />
                {shape.type === 'text' ? (
                  <div className="flex items-center gap-1 min-w-0">
                    <Type className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span
                      className={`text-[11px] truncate max-w-[100px] ${
                        isHidden ? 'line-through text-zinc-500' : 'text-zinc-300'
                      }`}
                      title={shape.text}
                    >
                      {shape.text || 'Text'}
                    </span>
                  </div>
                ) : (
                  <span
                    className={`font-mono text-[11px] truncate ${
                      isHidden ? 'line-through text-zinc-500' : 'text-zinc-400'
                    }`}
                  >
                    Shape #{originalIndex + 1}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                {/* Visibility Toggle Button */}
                <button
                  type="button"
                  title={isHidden ? 'Show Shape' : 'Hide Shape'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility?.(shape.id);
                  }}
                  className={`p-1 rounded-lg transition-all active:scale-90 ${
                    isHidden
                      ? 'text-zinc-500 hover:text-white hover:bg-white/10'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isHidden ? (
                    <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                  )}
                </button>

                <button
                  type="button"
                  disabled={isTop}
                  title={isTop ? 'Already on top' : 'Move on top (Bring forward)'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderShape?.(shape.id, 'up');
                  }}
                  className={`p-1 rounded-lg transition-all active:scale-90 ${
                    isTop
                      ? 'text-zinc-600 opacity-20 cursor-not-allowed'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isBottom}
                  title={
                    isBottom ? 'Already in background' : 'Move to background (Send backward)'
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderShape?.(shape.id, 'down');
                  }}
                  className={`p-1 rounded-lg transition-all active:scale-90 ${
                    isBottom
                      ? 'text-zinc-600 opacity-20 cursor-not-allowed'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete Shape"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveShape(shape.id);
                  }}
                  className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

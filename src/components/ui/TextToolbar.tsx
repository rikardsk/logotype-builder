import React, { useState, useEffect, useRef } from 'react';
import { Type, X, Plus, GripVertical } from 'lucide-react';
import { ConstructedShape, BuilderMode } from '../../geometry/types';

export const FONT_OPTIONS = [
  { label: 'Inter (Modern Sans)', value: 'Inter, sans-serif' },
  { label: 'Montserrat (Geometric)', value: 'Montserrat, sans-serif' },
  { label: 'Playfair Display (Serif)', value: '"Playfair Display", serif' },
  { label: 'Oswald (Condensed)', value: 'Oswald, sans-serif' },
  { label: 'Bebas Neue (Display)', value: '"Bebas Neue", sans-serif' },
  { label: 'JetBrains Mono (Code)', value: '"JetBrains Mono", monospace' },
  { label: 'Roboto (Clean Sans)', value: 'Roboto, sans-serif' },
  { label: 'Georgia (Classic Serif)', value: 'Georgia, serif' },
  { label: 'Impact (Heavy)', value: 'Impact, sans-serif' },
];

export const FONT_WEIGHTS = [
  { label: 'Regular', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Bold', value: '700' },
  { label: 'Black', value: '900' },
];

interface TextToolbarProps {
  mode: BuilderMode;
  selectedTextShape: ConstructedShape | null;
  selectedColor: string;
  onAddTextShape: (shape: ConstructedShape) => void;
  onUpdateTextShape: (shape: ConstructedShape) => void;
  onDeselect: () => void;
  onClose: () => void;
}

export const TextToolbar: React.FC<TextToolbarProps> = ({
  mode,
  selectedTextShape,
  selectedColor,
  onAddTextShape,
  onUpdateTextShape,
  onDeselect,
  onClose,
}) => {
  const [text, setText] = useState('LOGO');
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(72);
  const [fontWeight, setFontWeight] = useState('700');
  const [letterSpacing, setLetterSpacing] = useState(2);
  const [isDismissed, setIsDismissed] = useState(false);

  // Dragging state for movable panel
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 96, y: 80 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setIsDismissed(false);
  }, [mode, selectedTextShape?.id]);

  useEffect(() => {
    if (!selectedTextShape || selectedTextShape.type !== 'text') return;
    if (selectedTextShape.text !== undefined) setText(selectedTextShape.text);
    if (selectedTextShape.fontFamily) setFontFamily(selectedTextShape.fontFamily);
    if (selectedTextShape.fontSize) setFontSize(selectedTextShape.fontSize);
    if (selectedTextShape.fontWeight) setFontWeight(String(selectedTextShape.fontWeight));
    if (selectedTextShape.letterSpacing !== undefined) {
      setLetterSpacing(selectedTextShape.letterSpacing);
    }
  }, [selectedTextShape]);

  useEffect(() => {
    if (!isDraggingPanel) return;
    const handleMouseMove = (e: MouseEvent) => {
      const maxX = Math.max(10, window.innerWidth - 320);
      const maxY = Math.max(10, window.innerHeight - 80);
      const newX = Math.min(Math.max(10, e.clientX - dragOffsetRef.current.x), maxX);
      const newY = Math.min(Math.max(10, e.clientY - dragOffsetRef.current.y), maxY);
      setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => setIsDraggingPanel(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPanel]);

  const handlePanelDragStart = (e: React.MouseEvent) => {
    setIsDraggingPanel(true);
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleTextChange = (val: string) => {
    setText(val);
    if (!selectedTextShape) return;
    onUpdateTextShape({ ...selectedTextShape, text: val });
  };

  const handleFontChange = (val: string) => {
    setFontFamily(val);
    if (!selectedTextShape) return;
    onUpdateTextShape({ ...selectedTextShape, fontFamily: val });
  };

  const handleSizeChange = (val: number) => {
    const size = Math.max(12, Math.min(300, val));
    setFontSize(size);
    if (!selectedTextShape) return;
    onUpdateTextShape({ ...selectedTextShape, fontSize: size });
  };

  const handleWeightChange = (val: string) => {
    setFontWeight(val);
    if (!selectedTextShape) return;
    onUpdateTextShape({ ...selectedTextShape, fontWeight: val });
  };

  const handleSpacingChange = (val: number) => {
    setLetterSpacing(val);
    if (!selectedTextShape) return;
    onUpdateTextShape({ ...selectedTextShape, letterSpacing: val });
  };

  const handleAddCenter = () => {
    const newShape: ConstructedShape = {
      id: `text-${Date.now()}`,
      pathData: '',
      type: 'text',
      text: text || 'LOGO',
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      x: 250,
      y: 420,
      fillColor: selectedColor,
      createdAt: Date.now(),
    };
    onAddTextShape(newShape);
  };

  const handleClose = () => {
    setIsDismissed(true);
    onClose();
  };

  const handleDeselectToInsert = () => {
    onDeselect();
    setText('LOGO');
  };

  const isVisible =
    !isDismissed &&
    (mode === 'text' || Boolean(selectedTextShape && selectedTextShape.type === 'text'));
  if (!isVisible) return null;

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-40 flex flex-wrap items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#141519]/95 backdrop-blur-xl border border-white/10 shadow-2xl max-w-[calc(100vw-3rem)] select-none"
    >
      {/* Draggable Grip Handle */}
      <div
        onMouseDown={handlePanelDragStart}
        title="Drag to reposition panel"
        className="flex items-center gap-1 text-xs font-semibold text-cyan-400 pr-1.5 border-r border-white/10 cursor-grab active:cursor-grabbing hover:text-cyan-300"
      >
        <GripVertical className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
        <Type className="w-4 h-4" />
        <span className="hidden sm:inline">Typography</span>
      </div>

      <input
        type="text"
        value={text}
        placeholder="Type text..."
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => handleTextChange(e.target.value)}
        className="w-28 sm:w-32 px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-cyan-500 font-medium"
      />

      <select
        value={fontFamily}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => handleFontChange(e.target.value)}
        className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[130px]"
        style={{ fontFamily }}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
            {f.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <span className="text-[10px] text-zinc-400">Size</span>
        <input
          type="number"
          min={12}
          max={280}
          value={fontSize}
          onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => handleSizeChange(Number(e.target.value))}
          className="w-13 px-1 py-1 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white text-center focus:outline-none focus:border-cyan-500"
        />
        <input
          type="range"
          min={16}
          max={180}
          value={fontSize}
          onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => handleSizeChange(Number(e.target.value))}
          className="w-14 accent-cyan-500 cursor-pointer"
        />
      </div>

      <select
        value={fontWeight}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => handleWeightChange(e.target.value)}
        className="px-2 py-1 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
      >
        {FONT_WEIGHTS.map((w) => (
          <option key={w.value} value={w.value}>
            {w.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1 border-l border-white/10 pl-2">
        <span className="text-[10px] text-zinc-400">Gap</span>
        <input
          type="number"
          min={-5}
          max={30}
          value={letterSpacing}
          onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => handleSpacingChange(Number(e.target.value))}
          className="w-11 px-1 py-1 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white text-center focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Mode Actions: Editing vs Insert */}
      {selectedTextShape ? (
        <div className="flex items-center gap-1.5 ml-1 border-l border-white/10 pl-2">
          <span className="text-[10px] text-amber-400 font-medium px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 whitespace-nowrap">
            Editing
          </span>
          <button
            type="button"
            title="Deselect to switch back to Insert Mode"
            onClick={handleDeselectToInsert}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-sm transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Text</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAddCenter}
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-sm transition-all active:scale-95 ml-1 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Insert</span>
        </button>
      )}

      {/* Close Button */}
      <button
        type="button"
        title="Close Typography Panel"
        onClick={handleClose}
        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all ml-1 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

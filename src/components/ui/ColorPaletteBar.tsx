import React from 'react';
import { COLOR_PALETTES } from '../../state/useBuilderStore';

interface ColorPaletteBarProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

const COLOR_NAMES: Record<string, string> = {
  '#6366f1': 'Indigo',
  '#06b6d4': 'Cyan',
  '#10b981': 'Emerald',
  '#f59e0b': 'Amber',
  '#f43f5e': 'Rose',
  '#ec4899': 'Pink',
  '#a855f7': 'Purple',
  '#f4f4f5': 'White / Platinum',
  '#71717a': 'Cool Gray',
  '#18181b': 'Obsidian Charcoal',
  '#000000': 'Pitch Black',
};

function isColorDark(hex: string): boolean {
  if (!hex || hex === 'transparent') return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 130;
}

export const ColorPaletteBar: React.FC<ColorPaletteBarProps> = ({
  selectedColor,
  onSelectColor,
}) => {
  return (
    <div className="absolute top-20 right-6 z-20 flex flex-col gap-2 p-2 rounded-2xl bg-[#18191f]/95 backdrop-blur-xl border border-white/15 shadow-2xl">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 text-center select-none">
        Color
      </span>

      <div className="flex flex-col gap-1.5">
        {COLOR_PALETTES.map((color) => {
          const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
          const isDark = isColorDark(color);
          const name = COLOR_NAMES[color.toLowerCase()] || color;

          return (
            <button
              key={color}
              type="button"
              title={`${name} (${color})`}
              onClick={() => onSelectColor(color)}
              className={`w-7 h-7 rounded-xl transition-all active:scale-90 relative flex items-center justify-center ${
                isDark
                  ? 'border border-white/30 hover:border-white/60 shadow-sm'
                  : 'border border-black/20 hover:border-black/40'
              } ${
                isSelected
                  ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#18191f] scale-110 shadow-lg'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            >
              {isSelected && (
                <div
                  className={`w-2 h-2 rounded-full shadow-sm ${
                    isDark ? 'bg-white' : 'bg-zinc-900'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="w-full h-[1px] bg-white/10 my-0.5" />

      {/* Custom Color Input */}
      <label
        title="Custom Hex Color"
        className="w-7 h-7 rounded-xl border border-dashed border-white/30 hover:border-white/60 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:scale-105"
      >
        <input
          type="color"
          value={selectedColor.startsWith('#') ? selectedColor : '#6366f1'}
          onChange={(e) => onSelectColor(e.target.value)}
          className="opacity-0 w-0 h-0 absolute pointer-events-none"
        />
        <div
          className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
          style={{ backgroundColor: selectedColor }}
        />
      </label>
    </div>
  );
};

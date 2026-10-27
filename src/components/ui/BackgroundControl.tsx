import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

export const BACKGROUND_PRESETS = [
  { label: 'Transparent', value: 'transparent', preview: 'transparent' },
  { label: 'Pure White (for black logos)', value: '#ffffff', preview: '#ffffff' },
  { label: 'Light Gray', value: '#d4d4d8', preview: '#d4d4d8' },
  { label: 'Dark Canvas (Default)', value: '#121316', preview: '#121316' },
  { label: 'Deep Slate', value: '#1e293b', preview: '#1e293b' },
  { label: 'Pure Black', value: '#000000', preview: '#000000' },
];

interface BackgroundControlProps {
  canvasBackground: string;
  onSelectBackground: (color: string) => void;
}

export const BackgroundControl: React.FC<BackgroundControlProps> = ({
  canvasBackground,
  onSelectBackground,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isTransparent = canvasBackground === 'transparent';

  return (
    <div ref={containerRef} className="relative select-none">
      <button
        type="button"
        title="Artboard Background: Change color or make transparent"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 flex items-center gap-2 px-3 rounded-xl bg-[#141519] border border-white/10 hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all active:scale-95"
      >
        <div className="w-4 h-4 rounded-md border border-white/20 overflow-hidden relative shadow-inner">
          {isTransparent ? (
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  'repeating-conic-gradient(#52525b 0% 25%, #27272a 0% 50%)',
                backgroundSize: '6px 6px',
              }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ backgroundColor: canvasBackground }}
            />
          )}
        </div>
        <span className="text-[11px] font-medium hidden sm:inline">
          {isTransparent ? 'Transparent' : 'Background'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 w-56 p-2.5 rounded-2xl bg-[#141519]/95 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
            <Palette className="w-3 h-3 text-indigo-400" />
            <span>Artboard Background</span>
          </div>

          <div className="flex flex-col gap-1">
            {BACKGROUND_PRESETS.map((preset) => {
              const isSelected = canvasBackground === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    onSelectBackground(preset.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all text-left ${
                    isSelected
                      ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-md border border-white/20 overflow-hidden shrink-0">
                      {preset.value === 'transparent' ? (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundImage:
                              'repeating-conic-gradient(#71717a 0% 25%, #3f3f46 0% 50%)',
                            backgroundSize: '6px 6px',
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: preset.preview }}
                        />
                      )}
                    </div>
                    <span className="text-[11px] truncate">{preset.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="w-full h-[1px] bg-white/10 my-0.5" />

          {/* Custom Color Input */}
          <label className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer transition-all">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-md border border-dashed border-white/40 shrink-0"
                style={{
                  backgroundColor:
                    canvasBackground === 'transparent' ? '#6366f1' : canvasBackground,
                }}
              />
              <span className="text-[11px]">Custom Color...</span>
            </div>
            <input
              type="color"
              value={canvasBackground === 'transparent' ? '#121316' : canvasBackground}
              onChange={(e) => onSelectBackground(e.target.value)}
              className="opacity-0 w-0 h-0 pointer-events-none"
            />
          </label>
        </div>
      )}
    </div>
  );
};

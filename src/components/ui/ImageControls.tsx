import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { BackgroundImageConfig } from '../../geometry/types';

interface ImageControlsProps {
  backgroundImage: BackgroundImageConfig | null;
  onSetBackgroundImage: (url: string, width?: number, height?: number) => void;
  onSetOpacity: (opacity: number) => void;
  onToggleVisibility: () => void;
  onClearImage: () => void;
}

const DEMO_SAMPLES = [
  {
    id: 'squirrel-sketch',
    name: 'Squirrel Sketch',
    badge: 'Geometric',
    description: 'Circular curve squirrel logo sketch',
    url: '/samples/squirrel-sketch.png',
  },
  {
    id: 'trex-sketch',
    name: 'T-Rex Sketch',
    badge: 'Outline',
    description: 'Clean dinosaur logo outline',
    url: '/samples/trex-sketch.png',
  },
  {
    id: 'airplane-sketch',
    name: 'Airplane Sketch',
    badge: 'Hand-drawn',
    description: 'Clean Cessna aircraft drafting sketch',
    url: '/samples/airplane-sketch.png',
  },
];

function loadDemoImage(
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

export const ImageControls: React.FC<ImageControlsProps> = ({
  backgroundImage,
  onSetBackgroundImage,
  onSetOpacity,
  onToggleVisibility,
  onClearImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const demoMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (demoMenuRef.current && !demoMenuRef.current.contains(e.target as Node)) {
        setIsDemoOpen(false);
      }
    };
    if (isDemoOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDemoOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (!url) return;
      loadDemoImage(url, onSetBackgroundImage);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectDemo = (url: string) => {
    loadDemoImage(url, onSetBackgroundImage);
    setIsDemoOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload Custom Reference Image Button */}
      <button
        type="button"
        title="Upload your own reference image (PNG, JPG, SVG, WebP)"
        onClick={() => fileInputRef.current?.click()}
        className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-white/10 shadow-sm transition-all active:scale-95"
      >
        <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
        <span>Add Reference</span>
      </button>

      {/* Demo Samples Dropdown */}
      <div className="relative" ref={demoMenuRef}>
        <button
          type="button"
          title="Choose a sample reference sketch"
          onClick={() => setIsDemoOpen(!isDemoOpen)}
          className={`h-9 flex items-center gap-1.5 px-3 rounded-xl text-xs font-medium border shadow-sm transition-all active:scale-95 ${
            isDemoOpen
              ? 'bg-indigo-600/20 text-white border-indigo-500/50'
              : 'bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 border-indigo-500/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Demo Samples</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-indigo-400 transition-transform ${
              isDemoOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isDemoOpen && (
          <div className="absolute left-0 top-11 z-50 w-64 rounded-2xl bg-[#141519]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              Choose a Reference
            </div>
            {DEMO_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectDemo(sample.url)}
                className="w-full flex flex-col gap-0.5 p-2 rounded-xl text-left transition-all hover:bg-white/5 group border border-transparent hover:border-white/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                    {sample.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {sample.badge}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400">
                  {sample.description}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Reference Controls (Opacity & Visibility) */}
      {backgroundImage && (
        <div className="h-9 flex items-center gap-2.5 px-3 rounded-xl bg-[#141519]/90 backdrop-blur-xl border border-white/10 shadow-xl text-xs">
          {/* Opacity Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400">Opacity</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={backgroundImage.opacity}
              onChange={(e) => onSetOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="font-mono text-[10px] text-zinc-400 w-7">
              {Math.round(backgroundImage.opacity * 100)}%
            </span>
          </div>

          {/* Visibility Toggle */}
          <button
            type="button"
            title={backgroundImage.visible ? 'Hide Reference' : 'Show Reference'}
            onClick={onToggleVisibility}
            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
              backgroundImage.visible
                ? 'text-cyan-400 hover:bg-white/5'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            {backgroundImage.visible ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Remove Image */}
          <button
            type="button"
            title="Remove Reference Image"
            onClick={onClearImage}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

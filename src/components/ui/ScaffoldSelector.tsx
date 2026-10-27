import React, { useState, useRef, useEffect } from 'react';
import {
  CircleDot,
  Target,
  Layers,
  Hexagon,
  Grid,
  PenTool,
  ChevronDown,
  Check,
} from 'lucide-react';
import { SCAFFOLD_PRESETS } from '../../geometry/scaffolds';
import { ScaffoldConfig } from '../../geometry/types';

interface ScaffoldSelectorProps {
  currentScaffold: ScaffoldConfig;
  onSelectScaffold: (id: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  CircleDot: <CircleDot className="w-4 h-4" />,
  Target: <Target className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  Hexagon: <Hexagon className="w-4 h-4" />,
  Grid: <Grid className="w-4 h-4" />,
  PenTool: <PenTool className="w-4 h-4" />,
};

interface ScaffoldItemProps {
  preset: ScaffoldConfig;
  isActive: boolean;
  onSelect: () => void;
}

const ScaffoldItem: React.FC<ScaffoldItemProps> = ({ preset, isActive, onSelect }) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
        isActive
          ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
          : 'text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
            isActive
              ? 'bg-indigo-600/30 border-indigo-400/40 text-indigo-300'
              : 'bg-white/5 border-white/10 text-zinc-400'
          }`}
        >
          {ICONS[preset.iconName] || <CircleDot className="w-4 h-4" />}
        </div>
        <div className="flex flex-col truncate">
          <span className="text-xs font-semibold">{preset.name}</span>
          <span className="text-[10px] text-zinc-400 truncate">{preset.description}</span>
        </div>
      </div>
      {isActive && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
    </button>
  );
};

interface ScaffoldMenuProps {
  currentScaffoldId: string;
  onSelectPreset: (id: string) => void;
}

const ScaffoldMenu: React.FC<ScaffoldMenuProps> = ({
  currentScaffoldId,
  onSelectPreset,
}) => {
  return (
    <div className="absolute top-full mt-2 left-0 z-50 w-72 p-2 rounded-2xl bg-[#141519]/95 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-1">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1">
        Construction Scaffolds
      </div>
      <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
        {SCAFFOLD_PRESETS.map((preset) => (
          <ScaffoldItem
            key={preset.id}
            preset={preset}
            isActive={currentScaffoldId === preset.id}
            onSelect={() => onSelectPreset(preset.id)}
          />
        ))}
      </div>
    </div>
  );
};

export const ScaffoldSelector: React.FC<ScaffoldSelectorProps> = ({
  currentScaffold,
  onSelectScaffold,
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

  const handleSelect = (id: string) => {
    onSelectScaffold(id);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative select-none">
      <button
        type="button"
        title="Select Construction Scaffold"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 flex items-center gap-2 px-3 rounded-xl bg-[#141519] border border-white/10 hover:border-white/20 text-xs transition-all active:scale-95"
      >
        <span className="text-indigo-400">
          {ICONS[currentScaffold.iconName] || <CircleDot className="w-4 h-4" />}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hidden sm:inline">
            Scaffold:
          </span>
          <span className="font-semibold text-zinc-200">{currentScaffold.name}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <ScaffoldMenu
          currentScaffoldId={currentScaffold.id}
          onSelectPreset={handleSelect}
        />
      )}
    </div>
  );
};

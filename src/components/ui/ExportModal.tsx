import React, { useState, useMemo } from 'react';
import { X, Copy, Check, Download, Image } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ArtboardConfig, ConstructedShape, GuideShape } from '../../geometry/types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  constructedShapes: ConstructedShape[];
  guides: GuideShape[];
  canvasBackground?: string;
  artboard?: ArtboardConfig;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderCleanShape(s: ConstructedShape): string {
  if (s.type === 'text') {
    return `  <text x="${s.x || 0}" y="${s.y || 0}" font-family="${s.fontFamily || 'Inter, sans-serif'}" font-size="${s.fontSize || 48}" font-weight="${s.fontWeight || '700'}" letter-spacing="${s.letterSpacing || 0}" fill="${s.fillColor}">${escapeXml(s.text || '')}</text>`;
  }
  return `  <path d="${s.pathData}" fill="${s.fillColor}" fill-rule="evenodd" stroke="#18181b" stroke-width="1.5" />`;
}

function renderBlueprintShape(s: ConstructedShape): string {
  if (s.type === 'text') {
    return `  <text x="${s.x || 0}" y="${s.y || 0}" font-family="${s.fontFamily || 'Inter, sans-serif'}" font-size="${s.fontSize || 48}" font-weight="${s.fontWeight || '700'}" letter-spacing="${s.letterSpacing || 0}" fill="${s.fillColor}">${escapeXml(s.text || '')}</text>`;
  }
  return `  <path d="${s.pathData}" fill="${s.fillColor}" fill-rule="evenodd" stroke="#0f172a" stroke-width="2" />`;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  constructedShapes,
  guides,
  canvasBackground = '#121316',
  artboard = { x: 0, y: 0, width: 800, height: 800 },
}) => {
  const [activeTab, setActiveTab] = useState<'clean' | 'blueprint'>('clean');
  const [exportBg, setExportBg] = useState<'transparent' | 'canvas' | 'white' | 'black'>(
    canvasBackground === 'transparent' ? 'transparent' : 'canvas'
  );
  const [copied, setCopied] = useState(false);

  const effectiveBgColor = useMemo(() => {
    if (exportBg === 'transparent') return 'transparent';
    if (exportBg === 'white') return '#ffffff';
    if (exportBg === 'black') return '#000000';
    return canvasBackground || '#121316';
  }, [exportBg, canvasBackground]);

  const cleanSvgString = useMemo(() => {
    const bgRect =
      effectiveBgColor !== 'transparent'
        ? `  <rect x="${artboard.x}" y="${artboard.y}" width="${artboard.width}" height="${artboard.height}" fill="${effectiveBgColor}" />\n`
        : '';
    const paths = constructedShapes.map(renderCleanShape).join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${artboard.x} ${artboard.y} ${artboard.width} ${artboard.height}" width="${artboard.width}" height="${artboard.height}">\n${bgRect}${paths}\n</svg>`;
  }, [constructedShapes, effectiveBgColor, artboard]);

  const blueprintSvgString = useMemo(() => {
    const bgFill = effectiveBgColor === 'transparent' ? 'none' : effectiveBgColor;
    const guideElements = guides
      .map(
        (g) =>
          `  <path d="${g.pathData}" fill="none" stroke="#38bdf8" stroke-width="1.25" stroke-dasharray="4 3" opacity="0.55" />`
      )
      .join('\n');

    const shapeElements = constructedShapes.map(renderBlueprintShape).join('\n');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${artboard.x} ${artboard.y} ${artboard.width} ${artboard.height}" width="${artboard.width}" height="${artboard.height}">\n  <rect x="${artboard.x}" y="${artboard.y}" width="${artboard.width}" height="${artboard.height}" fill="${bgFill}" />\n  <g id="guides">\n${guideElements}\n  </g>\n  <g id="shapes">\n${shapeElements}\n  </g>\n</svg>`;
  }, [constructedShapes, guides, effectiveBgColor, artboard]);

  if (!isOpen) return null;

  const currentSvg = activeTab === 'clean' ? cleanSvgString : blueprintSvgString;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentSvg);
    setCopied(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logotype-${activeTab}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
  };

  const createPngFromImage = (img: HTMLImageElement): string => {
    const scale = 2;
    const w = Math.round(artboard.width * scale);
    const h = Math.round(artboard.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    if (effectiveBgColor === 'transparent') {
      ctx.clearRect(0, 0, w, h);
    } else {
      ctx.fillStyle = effectiveBgColor;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  };

  const handleDownloadPng = () => {
    const img = new window.Image();
    const svgBlob = new Blob([currentSvg], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const pngUrl = createPngFromImage(img);
      URL.revokeObjectURL(url);
      if (!pngUrl) return;

      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `logotype-${activeTab}-${Date.now()}.png`;
      a.click();
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
    };
    img.src = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#141519] border border-white/10 shadow-2xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Export Logotype
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Production-ready vector SVG and showcase blueprint
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-900 rounded-xl border border-white/5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('clean')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'clean'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Clean Logotype (Pure SVG)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blueprint')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'blueprint'
                ? 'bg-cyan-950/60 text-cyan-300 shadow-sm border border-cyan-800/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Blueprint Showcase (With Guides)
          </button>
        </div>

        {/* Background Export Options */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="font-semibold text-zinc-400 text-[11px]">Export Background:</span>
          <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl border border-white/5 text-[11px]">
            <button
              type="button"
              onClick={() => setExportBg('transparent')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                exportBg === 'transparent'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div
                className="w-3 h-3 rounded-sm border border-white/20"
                style={{
                  backgroundImage:
                    'repeating-conic-gradient(#71717a 0% 25%, #3f3f46 0% 50%)',
                  backgroundSize: '4px 4px',
                }}
              />
              <span>Transparent</span>
            </button>
            <button
              type="button"
              onClick={() => setExportBg('canvas')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                exportBg === 'canvas'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Match Artboard
            </button>
            <button
              type="button"
              onClick={() => setExportBg('white')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                exportBg === 'white'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div className="w-3 h-3 rounded-sm bg-white border border-zinc-400" />
              <span>White</span>
            </button>
            <button
              type="button"
              onClick={() => setExportBg('black')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                exportBg === 'black'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div className="w-3 h-3 rounded-sm bg-black border border-white/20" />
              <span>Black</span>
            </button>
          </div>
        </div>

        {/* Live SVG Preview Box */}
        <div
          className="w-full h-64 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center relative p-4 transition-colors"
          style={{
            backgroundColor:
              effectiveBgColor === 'transparent' ? 'transparent' : effectiveBgColor,
            backgroundImage:
              effectiveBgColor === 'transparent'
                ? 'repeating-conic-gradient(#1f2229 0% 25%, #141519 0% 50%)'
                : undefined,
            backgroundSize: '16px 16px',
          }}
        >
          <div
            className="w-full h-full max-w-[240px] max-h-[240px] flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: currentSvg }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all active:scale-95 border border-white/10"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy SVG Code'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all active:scale-95 border border-white/10"
            >
              <Image className="w-4 h-4 text-cyan-400" />
              <span>Download PNG (2x)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download SVG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

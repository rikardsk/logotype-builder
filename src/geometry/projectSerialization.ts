import {
  ArtboardConfig,
  ConstructedShape,
  GuideShape,
  LogoProjectData,
  ScaffoldConfig,
  BackgroundImageConfig,
} from './types';

export interface ProjectStateInput {
  guides: GuideShape[];
  constructedShapes: ConstructedShape[];
  artboard: ArtboardConfig;
  canvasBackground: string;
  currentScaffold?: ScaffoldConfig | null;
  backgroundImage?: BackgroundImageConfig | null;
}

export function createProjectData(input: ProjectStateInput): LogoProjectData {
  return {
    version: 1,
    app: 'LogoBuilder',
    createdAt: Date.now(),
    artboard: { ...input.artboard },
    canvasBackground: input.canvasBackground,
    guides: input.guides.map((g) => ({ ...g })),
    constructedShapes: input.constructedShapes.map((s) => ({ ...s })),
    currentScaffold: input.currentScaffold || null,
    backgroundImage: input.backgroundImage || null,
  };
}

export function embedProjectInSvg(
  svgString: string,
  project: LogoProjectData
): string {
  const json = JSON.stringify(project).replace(/]]>/g, ']]]]><![CDATA[>');
  const metadataBlock = `  <metadata id="logobuilder-project" type="application/json">\n    <![CDATA[${json}]]>\n  </metadata>\n`;

  const svgTagMatch = svgString.match(/<svg[^>]*>/i);
  if (!svgTagMatch) return svgString;

  const insertPos = svgTagMatch.index! + svgTagMatch[0].length;
  return (
    svgString.slice(0, insertPos) +
    '\n' +
    metadataBlock +
    svgString.slice(insertPos)
  );
}

function cleanCdata(content: string): string {
  let cleaned = content.trim();
  if (cleaned.startsWith('<![CDATA[')) {
    cleaned = cleaned.slice(9);
  }
  if (cleaned.endsWith(']]>')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

export function extractProjectFromSvg(
  svgString: string
): LogoProjectData | null {
  const metaMatch = svgString.match(
    /<metadata[^>]*id=["']logobuilder-project["'][^>]*>([\s\S]*?)<\/metadata>/i
  );
  if (!metaMatch) return null;

  try {
    const rawContent = cleanCdata(metaMatch[1]);
    const parsed = JSON.parse(rawContent);
    if (!parsed || (!Array.isArray(parsed.guides) && !Array.isArray(parsed.constructedShapes))) {
      return null;
    }
    return normalizeProjectData(parsed);
  } catch {
    return null;
  }
}

function normalizeProjectData(data: Record<string, unknown>): LogoProjectData {
  return {
    version: 1,
    app: 'LogoBuilder',
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    artboard: (data.artboard as ArtboardConfig) || { x: 0, y: 0, width: 800, height: 800 },
    canvasBackground: typeof data.canvasBackground === 'string' ? data.canvasBackground : '#121316',
    guides: Array.isArray(data.guides) ? data.guides : [],
    constructedShapes: Array.isArray(data.constructedShapes) ? data.constructedShapes : [],
    currentScaffold: (data.currentScaffold as ScaffoldConfig) || null,
    backgroundImage: (data.backgroundImage as BackgroundImageConfig) || null,
  };
}

export function parseProjectFile(fileContent: string): LogoProjectData | null {
  const trimmed = fileContent.trim();
  if (trimmed.startsWith('<') || trimmed.includes('<svg')) {
    return extractProjectFromSvg(trimmed);
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && (Array.isArray(parsed.guides) || Array.isArray(parsed.constructedShapes))) {
      return normalizeProjectData(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

function rectToPath(x: number, y: number, w: number, h: number): string {
  return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
}

function circleToPath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
}

function parseSvgArtboard(svg: string): ArtboardConfig | undefined {
  const vbMatch = svg.match(/viewBox=["']([-\d.,\s]+)["']/i);
  if (vbMatch) {
    const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
  }
  return undefined;
}

export function parseGenericSvgToShapes(
  svgString: string
): { shapes: ConstructedShape[]; artboard?: ArtboardConfig } {
  const items: { index: number; shape: ConstructedShape }[] = [];
  const artboard = parseSvgArtboard(svgString);

  // Extract <path d="..." fill="...">
  const pathRegex = /<path\b[^>]*\bd=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = pathRegex.exec(svgString)) !== null) {
    const tag = match[0];
    const d = match[1].trim();
    if (!d) continue;

    const fillMatch = tag.match(/\bfill=["']([^"']+)["']/i);
    const fill = fillMatch && fillMatch[1] !== 'none' ? fillMatch[1] : '#ffffff';

    items.push({
      index: match.index,
      shape: {
        id: `imported-path-${Date.now()}-${idx++}`,
        pathData: d,
        fillColor: fill,
        createdAt: Date.now() + idx,
        type: 'path',
        visible: true,
      },
    });
  }

  // Extract <rect ...>
  const rectRegex = /<rect\b[^>]*>/gi;
  while ((match = rectRegex.exec(svgString)) !== null) {
    const tag = match[0];
    const x = parseFloat((tag.match(/\bx=["']([^"']+)["']/i) || [])[1] || '0');
    const y = parseFloat((tag.match(/\by=["']([^"']+)["']/i) || [])[1] || '0');
    const w = parseFloat((tag.match(/\bwidth=["']([^"']+)["']/i) || [])[1] || '0');
    const h = parseFloat((tag.match(/\bheight=["']([^"']+)["']/i) || [])[1] || '0');
    const fill = (tag.match(/\bfill=["']([^"']+)["']/i) || [])[1] || '#ffffff';

    if (w > 0 && h > 0 && fill !== 'none') {
      items.push({
        index: match.index,
        shape: {
          id: `imported-rect-${Date.now()}-${idx++}`,
          pathData: rectToPath(x, y, w, h),
          fillColor: fill,
          createdAt: Date.now() + idx,
          type: 'path',
          visible: true,
        },
      });
    }
  }

  // Extract <circle ...>
  const circleRegex = /<circle\b[^>]*>/gi;
  while ((match = circleRegex.exec(svgString)) !== null) {
    const tag = match[0];
    const cx = parseFloat((tag.match(/\bcx=["']([^"']+)["']/i) || [])[1] || '0');
    const cy = parseFloat((tag.match(/\bcy=["']([^"']+)["']/i) || [])[1] || '0');
    const r = parseFloat((tag.match(/\br=["']([^"']+)["']/i) || [])[1] || '0');
    const fill = (tag.match(/\bfill=["']([^"']+)["']/i) || [])[1] || '#ffffff';

    if (r > 0 && fill !== 'none') {
      items.push({
        index: match.index,
        shape: {
          id: `imported-circle-${Date.now()}-${idx++}`,
          pathData: circleToPath(cx, cy, r),
          fillColor: fill,
          createdAt: Date.now() + idx,
          type: 'path',
          visible: true,
        },
      });
    }
  }

  items.sort((a, b) => a.index - b.index);
  return { shapes: items.map((i) => i.shape), artboard };
}

export function downloadProjectFile(
  project: LogoProjectData,
  filename = `logotype-project-${Date.now()}.logo`
): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

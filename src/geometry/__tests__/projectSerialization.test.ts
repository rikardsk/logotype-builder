import { describe, it, expect } from 'vitest';
import {
  createProjectData,
  embedProjectInSvg,
  extractProjectFromSvg,
  parseProjectFile,
  parseGenericSvgToShapes,
} from '../projectSerialization';
import { GuideShape, ConstructedShape } from '../types';

describe('projectSerialization', () => {
  const sampleGuides: GuideShape[] = [
    {
      id: 'g-circle-1',
      type: 'circle',
      cx: 400,
      cy: 400,
      rx: 150,
      pathData: 'M 250 400 A 150 150 0 1 0 550 400 A 150 150 0 1 0 250 400 Z',
    },
    {
      id: 'g-line-1',
      type: 'line',
      p1: { x: 100, y: 100 },
      p2: { x: 700, y: 700 },
      pathData: 'M 100 100 L 700 700',
    },
  ];

  const sampleShapes: ConstructedShape[] = [
    {
      id: 'shape-1',
      pathData: 'M 300 300 L 400 300 L 400 400 Z',
      fillColor: '#38bdf8',
      createdAt: 1000,
      type: 'path',
      visible: true,
    },
    {
      id: 'text-1',
      pathData: '',
      fillColor: '#ffffff',
      createdAt: 1001,
      type: 'text',
      text: 'STUDIO',
      fontSize: 32,
      fontFamily: 'Inter',
      x: 350,
      y: 450,
      visible: true,
    },
  ];

  it('creates project data correctly', () => {
    const data = createProjectData({
      guides: sampleGuides,
      constructedShapes: sampleShapes,
      artboard: { x: 0, y: 0, width: 800, height: 800 },
      canvasBackground: '#121316',
    });

    expect(data.app).toBe('LogoBuilder');
    expect(data.version).toBe(1);
    expect(data.guides.length).toBe(2);
    expect(data.constructedShapes.length).toBe(2);
    expect(data.artboard).toEqual({ x: 0, y: 0, width: 800, height: 800 });
  });

  it('embeds project data into SVG and extracts it with full fidelity', () => {
    const data = createProjectData({
      guides: sampleGuides,
      constructedShapes: sampleShapes,
      artboard: { x: 50, y: 50, width: 700, height: 700 },
      canvasBackground: '#1e293b',
    });

    const originalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 50 700 700" width="700" height="700">
  <path d="M 300 300 L 400 300 L 400 400 Z" fill="#38bdf8" />
</svg>`;

    const embeddedSvg = embedProjectInSvg(originalSvg, data);
    expect(embeddedSvg).toContain('<metadata id="logobuilder-project"');

    const extracted = extractProjectFromSvg(embeddedSvg);
    expect(extracted).not.toBeNull();
    expect(extracted?.app).toBe('LogoBuilder');
    expect(extracted?.guides.length).toBe(2);
    expect(extracted?.guides[0].type).toBe('circle');
    expect(extracted?.guides[0].rx).toBe(150);
    expect(extracted?.constructedShapes.length).toBe(2);
    expect(extracted?.constructedShapes[1].text).toBe('STUDIO');
    expect(extracted?.artboard).toEqual({ x: 50, y: 50, width: 700, height: 700 });
    expect(extracted?.canvasBackground).toBe('#1e293b');
  });

  it('parses project from json text and svg text via parseProjectFile', () => {
    const data = createProjectData({
      guides: sampleGuides,
      constructedShapes: sampleShapes,
      artboard: { x: 0, y: 0, width: 800, height: 800 },
      canvasBackground: '#121316',
    });

    const jsonString = JSON.stringify(data);
    const parsedFromJson = parseProjectFile(jsonString);
    expect(parsedFromJson).not.toBeNull();
    expect(parsedFromJson?.constructedShapes.length).toBe(2);

    const svg = embedProjectInSvg('<svg></svg>', data);
    const parsedFromSvg = parseProjectFile(svg);
    expect(parsedFromSvg).not.toBeNull();
    expect(parsedFromSvg?.guides.length).toBe(2);
  });

  it('parses generic SVG elements when no LogoBuilder metadata exists', () => {
    const genericSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
  <rect x="20" y="30" width="100" height="80" fill="#f43f5e" />
  <circle cx="200" cy="200" r="50" fill="#10b981" />
  <path d="M 10 10 L 50 50" fill="#3b82f6" />
</svg>`;

    const result = parseGenericSvgToShapes(genericSvg);
    expect(result.artboard).toEqual({ x: 0, y: 0, width: 500, height: 500 });
    expect(result.shapes.length).toBe(3);
    expect(result.shapes[0].fillColor).toBe('#f43f5e');
    expect(result.shapes[1].fillColor).toBe('#10b981');
    expect(result.shapes[2].pathData).toBe('M 10 10 L 50 50');
  });
});

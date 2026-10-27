import { describe, it, expect } from 'vitest';
import {
  SCAFFOLD_PRESETS,
  generateFlowerOfLifeScaffold,
  generateConcentricCirclesScaffold,
  generateIsometricGridScaffold,
  generateModularGridScaffold,
  generateVennScaffold,
  createParallelCircleGuide,
} from '../scaffolds';

describe('scaffolds', () => {
  it('loads all predefined presets', () => {
    expect(SCAFFOLD_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it('generates valid guides for flower of life', () => {
    const flower = generateFlowerOfLifeScaffold();
    expect(flower.guides.length).toBe(7);
    for (const guide of flower.guides) {
      expect(guide.pathData).toBeTruthy();
    }
  });

  it('generates valid guides for concentric circles', () => {
    const concentric = generateConcentricCirclesScaffold();
    expect(concentric.guides.length).toBeGreaterThanOrEqual(5);
  });

  it('generates valid guides for isometric grid', () => {
    const iso = generateIsometricGridScaffold();
    expect(iso.guides.length).toBe(10);
  });

  it('generates valid guides for modular 5x5 grid', () => {
    const modular = generateModularGridScaffold();
    expect(modular.guides.length).toBe(25);
  });

  it('generates valid guides for venn triad', () => {
    const venn = generateVennScaffold();
    expect(venn.guides.length).toBe(3);
  });

  it('creates valid parallel circle guide with two concentric rings', () => {
    const pc = createParallelCircleGuide('test-pc', 300, 300, 100, 40);
    expect(pc.type).toBe('parallel-circle');
    expect(pc.cx).toBe(300);
    expect(pc.cy).toBe(300);
    expect(pc.rx).toBe(100);
    expect(pc.spacing).toBe(40);
    expect(pc.pathData).toContain('M 220 300 A 80 80');
    expect(pc.pathData).toContain('M 180 300 A 120 120');
  });
});

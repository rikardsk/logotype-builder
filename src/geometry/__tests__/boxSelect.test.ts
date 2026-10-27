import { describe, it, expect } from 'vitest';
import { createLineGuide, createCircleGuide, createParallelCircleGuide } from '../scaffolds';
import { isPointInBox, doBoxesIntersect, isGuideInBox, isShapeInBox, findItemsInBox } from '../boxSelect';
import { ConstructedShape } from '../types';

describe('boxSelect', () => {
  it('correctly identifies points inside box', () => {
    const box = { x: 100, y: 100, width: 200, height: 200 };
    expect(isPointInBox({ x: 150, y: 150 }, box)).toBe(true);
    expect(isPointInBox({ x: 50, y: 150 }, box)).toBe(false);
  });

  it('detects intersecting bounding boxes', () => {
    const b1 = { x: 0, y: 0, width: 100, height: 100 };
    const b2 = { x: 50, y: 50, width: 100, height: 100 };
    const b3 = { x: 200, y: 200, width: 50, height: 50 };
    expect(doBoxesIntersect(b1, b2)).toBe(true);
    expect(doBoxesIntersect(b1, b3)).toBe(false);
  });

  it('selects lines and circles within marquee box', () => {
    const l1 = createLineGuide('l1', 50, 50, 150, 150);
    const l2 = createLineGuide('l2', 500, 500, 600, 600);
    const c1 = createCircleGuide('c1', 120, 120, 30);
    const marquee = { x: 40, y: 40, width: 150, height: 150 };

    expect(isGuideInBox(l1, marquee)).toBe(true);
    expect(isGuideInBox(l2, marquee)).toBe(false);
    expect(isGuideInBox(c1, marquee)).toBe(true);

    const result = findItemsInBox([l1, l2, c1], [], marquee);
    expect(result.guideIds).toEqual(['l1', 'c1']);
  });

  it('selects parallel circles within marquee box', () => {
    const pc1 = createParallelCircleGuide('pc1', 150, 150, 50, 20);
    const pc2 = createParallelCircleGuide('pc2', 700, 700, 50, 20);
    const marquee = { x: 50, y: 50, width: 200, height: 200 };

    expect(isGuideInBox(pc1, marquee)).toBe(true);
    expect(isGuideInBox(pc2, marquee)).toBe(false);
  });

  it('selects text shapes within marquee box', () => {
    const t1: ConstructedShape = {
      id: 'text-1',
      pathData: '',
      fillColor: '#ffffff',
      createdAt: 100,
      type: 'text',
      text: 'BRAND',
      fontSize: 48,
      x: 100,
      y: 100,
    };
    const t2: ConstructedShape = {
      id: 'text-2',
      pathData: '',
      fillColor: '#ffffff',
      createdAt: 101,
      type: 'text',
      text: 'OUTSIDE',
      fontSize: 48,
      x: 600,
      y: 600,
    };
    const marquee = { x: 80, y: 40, width: 250, height: 100 };

    expect(isShapeInBox(t1, marquee)).toBe(true);
    expect(isShapeInBox(t2, marquee)).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { BACKGROUND_PRESETS } from '../../components/ui/BackgroundControl';

describe('backgroundPresets', () => {
  it('includes transparent and white background options', () => {
    const hasTransparent = BACKGROUND_PRESETS.some((p) => p.value === 'transparent');
    const hasWhite = BACKGROUND_PRESETS.some((p) => p.value === '#ffffff');
    const hasBlack = BACKGROUND_PRESETS.some((p) => p.value === '#000000');

    expect(hasTransparent).toBe(true);
    expect(hasWhite).toBe(true);
    expect(hasBlack).toBe(true);
  });
});

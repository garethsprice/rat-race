import { hslToRgb, rgbToHsl, rgbToCss, hslToCss } from '../src/utils/colors';

describe('Color Utilities', () => {
  describe('hslToRgb', () => {
    it('should convert black (0, 0, 0)', () => {
      const result = hslToRgb(0, 0, 0);
      expect(result).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should convert white (0, 0, 1)', () => {
      const result = hslToRgb(0, 0, 1);
      expect(result).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should convert red (0, 1, 0.5)', () => {
      const result = hslToRgb(0, 1, 0.5);
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert green (120, 1, 0.5)', () => {
      const result = hslToRgb(120, 1, 0.5);
      expect(result).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should convert blue (240, 1, 0.5)', () => {
      const result = hslToRgb(240, 1, 0.5);
      expect(result).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle grey (any hue, 0 saturation)', () => {
      const result = hslToRgb(180, 0, 0.5);
      expect(result).toEqual({ r: 128, g: 128, b: 128 });
    });
  });

  describe('rgbToHsl', () => {
    it('should convert black', () => {
      const result = rgbToHsl(0, 0, 0);
      expect(result.l).toBe(0);
    });

    it('should convert white', () => {
      const result = rgbToHsl(255, 255, 255);
      expect(result.l).toBe(1);
    });

    it('should convert red', () => {
      const result = rgbToHsl(255, 0, 0);
      expect(result.h).toBe(0);
      expect(result.s).toBe(1);
      expect(result.l).toBe(0.5);
    });

    it('should convert grey (no saturation)', () => {
      const result = rgbToHsl(128, 128, 128);
      expect(result.s).toBe(0);
    });
  });

  describe('rgbToCss', () => {
    it('should format RGB as CSS string', () => {
      expect(rgbToCss({ r: 255, g: 128, b: 0 })).toBe('rgb(255, 128, 0)');
    });
  });

  describe('hslToCss', () => {
    it('should convert HSL to CSS RGB string', () => {
      const result = hslToCss(0, 1, 0.5);
      expect(result).toBe('rgb(255, 0, 0)');
    });
  });
});

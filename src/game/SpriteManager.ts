import { FurColor, SpriteSheetMeta } from '../types';
import { hslToRgb } from '../utils/colors';
import { SPRITE_PIVOT } from '../constants';

export class SpriteManager {
  private meta: SpriteSheetMeta | null = null;
  private sheetImage: HTMLImageElement | null = null;
  private vestMaskImage: HTMLImageElement | null = null;
  private recoloredSprites: Map<string, HTMLCanvasElement> = new Map();

  get isLoaded(): boolean {
    return this.meta !== null && this.sheetImage !== null && this.vestMaskImage !== null;
  }

  get animations(): Record<string, string[]> {
    return this.meta?.animations ?? {};
  }

  get cellSize(): number {
    return this.meta?.cell_size ?? 0;
  }

  get pivot(): { x: number; y: number } {
    return SPRITE_PIVOT;
  }

  async load(): Promise<void> {
    const base = import.meta.env.BASE_URL;
    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const [metaResponse, sheetImage, vestMaskImage] = await Promise.all([
      fetch(`${base}sprites/spritesheet_meta.json`),
      loadImage(`${base}sprites/spritesheet_grey.png`),
      loadImage(`${base}sprites/spritesheet_vest_mask.png`),
    ]);

    this.meta = await metaResponse.json();
    this.sheetImage = sheetImage;
    this.vestMaskImage = vestMaskImage;

    console.log(`Loaded sprite sheet: ${Object.keys(this.meta!.sprites).length} sprites`);
  }

  getRecoloredSprite(
    spriteName: string,
    vestHue: number | null,
    furColor: FurColor | null,
    vestSat: number = 0.85
  ): HTMLCanvasElement | null {
    if (!this.meta || !this.sheetImage || !this.vestMaskImage) return null;

    const furKey = furColor ? `${furColor.hue}_${furColor.sat}_${furColor.light}` : 'null';
    const cacheKey = `${spriteName}_v${vestHue}_f${furKey}`;

    const cached = this.recoloredSprites.get(cacheKey);
    if (cached) return cached;

    const spriteInfo = this.meta.sprites[spriteName];
    if (!spriteInfo) return null;

    const cellSize = this.meta.cell_size;
    const { x: sx, y: sy } = spriteInfo;

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = cellSize;
    spriteCanvas.height = cellSize;
    const spriteCtx = spriteCanvas.getContext('2d')!;

    spriteCtx.drawImage(this.sheetImage, sx, sy, cellSize, cellSize, 0, 0, cellSize, cellSize);

    const imageData = spriteCtx.getImageData(0, 0, cellSize, cellSize);
    const pixels = imageData.data;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = cellSize;
    maskCanvas.height = cellSize;
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCtx.drawImage(this.vestMaskImage, sx, sy, cellSize, cellSize, 0, 0, cellSize, cellSize);
    const maskData = maskCtx.getImageData(0, 0, cellSize, cellSize);
    const mask = maskData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const a = pixels[i + 3];
      if (a < 128) continue;

      const grey = pixels[i] / 255;
      const isVest = mask[i] > 128;

      if (isVest && vestHue !== null) {
        const rgb = hslToRgb(vestHue, vestSat, grey);
        pixels[i] = rgb.r;
        pixels[i + 1] = rgb.g;
        pixels[i + 2] = rgb.b;
      } else if (!isVest && furColor !== null) {
        const lightness = Math.min(1, grey * furColor.light);
        const rgb = hslToRgb(furColor.hue, furColor.sat, lightness);
        pixels[i] = rgb.r;
        pixels[i + 1] = rgb.g;
        pixels[i + 2] = rgb.b;
      }
    }

    spriteCtx.putImageData(imageData, 0, 0);
    this.recoloredSprites.set(cacheKey, spriteCanvas);
    return spriteCanvas;
  }

  getSpriteForRat(
    spriteName: string,
    vestHue: number | undefined,
    furColor: FurColor | null | undefined
  ): HTMLCanvasElement | null {
    return this.getRecoloredSprite(
      spriteName,
      vestHue ?? null,
      furColor ?? null
    );
  }
}

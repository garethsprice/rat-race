import { TrackBounds, TrackPosition, TrackSegment } from '../types';
import { hslToRgb, rgbToCss } from '../utils/colors';
import { TRACK_CONFIG } from '../constants';

export class Track {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private grassPattern: CanvasPattern | null = null;
  private trackPattern: CanvasPattern | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  async loadTextures(): Promise<void> {
    const base = import.meta.env.BASE_URL;
    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const [grassTexture, trackTexture] = await Promise.all([
      loadImage(`${base}textures/SICT_1100_rgb.png`),
      loadImage(`${base}textures/SICT_1101_rgb.png`),
    ]);

    this.grassPattern = this.ctx.createPattern(grassTexture, 'repeat');
    this.trackPattern = this.ctx.createPattern(trackTexture, 'repeat');
  }

  getBounds(): TrackBounds {
    const trackW = (TRACK_CONFIG.H_PERCENT / 100) * this.canvas.width;
    const trackH = (TRACK_CONFIG.V_PERCENT / 100) * this.canvas.height;
    const marginH = (this.canvas.width - trackW) / 2;
    const marginV = (this.canvas.height - trackH) / 2;

    return {
      left: marginH,
      right: this.canvas.width - marginH,
      top: marginV,
      bottom: this.canvas.height - marginV,
      radius: TRACK_CONFIG.CORNER_RADIUS,
    };
  }

  getTrackWidth(): number {
    return (TRACK_CONFIG.WIDTH_PERCENT / 100) * this.canvas.height;
  }

  getPerimeter(): number {
    const b = this.getBounds();
    const straightH = b.right - b.left - 2 * b.radius;
    const straightV = b.bottom - b.top - 2 * b.radius;
    const cornerArc = (Math.PI * b.radius) / 2;
    return 2 * straightH + 2 * straightV + 4 * cornerArc;
  }

  getEntryX(): number {
    const b = this.getBounds();
    return b.left + b.radius;
  }

  getExitX(): number {
    const b = this.getBounds();
    return b.right - b.radius;
  }

  getGateX(): number {
    const b = this.getBounds();
    return b.left + b.radius + 120;
  }

  getEntryLaneY(lane: number): number {
    const b = this.getBounds();
    const trackWidth = this.getTrackWidth();
    const laneSpacing = trackWidth / TRACK_CONFIG.NUM_LANES;
    const entryLaneTop = b.bottom - trackWidth / 2;
    return entryLaneTop + laneSpacing * lane + laneSpacing / 2;
  }

  getPositionOnTrack(t: number, lane: number = 0): TrackPosition {
    const b = this.getBounds();
    const trackWidth = this.getTrackWidth();
    const numLanes = TRACK_CONFIG.NUM_LANES;
    const laneSpacing = trackWidth / numLanes;
    const laneOffset = (lane - (numLanes - 1) / 2) * laneSpacing;

    const straightH = b.right - b.left - 2 * b.radius;
    const straightV = b.bottom - b.top - 2 * b.radius;
    const cornerArc = (Math.PI * b.radius) / 2;
    const perimeter = 2 * straightH + 2 * straightV + 4 * cornerArc;

    let dist = (((t % 1) + 1) % 1) * perimeter;

    // Bottom straight (left to right)
    if (dist < straightH) {
      return {
        x: b.left + b.radius + dist,
        y: b.bottom + laneOffset,
        segment: 'right',
        cornerProgress: 0,
      };
    }
    dist -= straightH;

    // Bottom-right corner
    if (dist < cornerArc) {
      const progress = dist / cornerArc;
      const angle = Math.PI / 2 - progress * (Math.PI / 2);
      const r = b.radius + laneOffset;
      return {
        x: b.right - b.radius + Math.cos(angle) * r,
        y: b.bottom - b.radius + Math.sin(angle) * r,
        segment: 'corner_br',
        cornerProgress: progress,
      };
    }
    dist -= cornerArc;

    // Right straight (bottom to top)
    if (dist < straightV) {
      return {
        x: b.right + laneOffset,
        y: b.bottom - b.radius - dist,
        segment: 'up',
        cornerProgress: 0,
      };
    }
    dist -= straightV;

    // Top-right corner
    if (dist < cornerArc) {
      const progress = dist / cornerArc;
      const angle = 0 - progress * (Math.PI / 2);
      const r = b.radius + laneOffset;
      return {
        x: b.right - b.radius + Math.cos(angle) * r,
        y: b.top + b.radius + Math.sin(angle) * r,
        segment: 'corner_tr',
        cornerProgress: progress,
      };
    }
    dist -= cornerArc;

    // Top straight (right to left)
    if (dist < straightH) {
      return {
        x: b.right - b.radius - dist,
        y: b.top - laneOffset,
        segment: 'left',
        cornerProgress: 0,
      };
    }
    dist -= straightH;

    // Top-left corner
    if (dist < cornerArc) {
      const progress = dist / cornerArc;
      const angle = -Math.PI / 2 - progress * (Math.PI / 2);
      const r = b.radius + laneOffset;
      return {
        x: b.left + b.radius + Math.cos(angle) * r,
        y: b.top + b.radius + Math.sin(angle) * r,
        segment: 'corner_tl',
        cornerProgress: progress,
      };
    }
    dist -= cornerArc;

    // Left straight (top to bottom)
    if (dist < straightV) {
      return {
        x: b.left - laneOffset,
        y: b.top + b.radius + dist,
        segment: 'down',
        cornerProgress: 0,
      };
    }
    dist -= straightV;

    // Bottom-left corner
    const progress = dist / cornerArc;
    const angle = Math.PI - progress * (Math.PI / 2);
    const r = b.radius + laneOffset;
    return {
      x: b.left + b.radius + Math.cos(angle) * r,
      y: b.bottom - b.radius + Math.sin(angle) * r,
      segment: 'corner_bl',
      cornerProgress: progress,
    };
  }

  isCornerSegment(segment: TrackSegment): boolean {
    return segment.startsWith('corner_');
  }

  draw(rats: { vestHue: number }[]): void {
    const b = this.getBounds();
    const trackWidth = this.getTrackWidth();
    const numLanes = TRACK_CONFIG.NUM_LANES;

    const roundedRectPath = (inset: number): void => {
      const r = Math.max(b.radius - inset, 5);
      this.ctx.beginPath();
      this.ctx.moveTo(b.left + inset + r, b.top + inset);
      this.ctx.lineTo(b.right - inset - r, b.top + inset);
      this.ctx.arcTo(b.right - inset, b.top + inset, b.right - inset, b.top + inset + r, r);
      this.ctx.lineTo(b.right - inset, b.bottom - inset - r);
      this.ctx.arcTo(b.right - inset, b.bottom - inset, b.right - inset - r, b.bottom - inset, r);
      this.ctx.lineTo(b.left + inset + r, b.bottom - inset);
      this.ctx.arcTo(b.left + inset, b.bottom - inset, b.left + inset, b.bottom - inset - r, r);
      this.ctx.lineTo(b.left + inset, b.top + inset + r);
      this.ctx.arcTo(b.left + inset, b.top + inset, b.left + inset + r, b.top + inset, r);
      this.ctx.closePath();
    };

    // Draw grass background
    if (this.grassPattern) {
      this.ctx.fillStyle = this.grassPattern;
    } else {
      this.ctx.fillStyle = '#2d5a27';
    }
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Entry/exit lanes
    const laneSpacing = trackWidth / numLanes;
    const entryLaneTop = b.bottom - trackWidth / 2;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, entryLaneTop, this.canvas.width, trackWidth);
    this.ctx.clip();
    if (this.trackPattern) {
      this.ctx.fillStyle = this.trackPattern;
    } else {
      this.ctx.fillStyle = '#8B5A2B';
    }
    this.ctx.fillRect(0, entryLaneTop, this.canvas.width, trackWidth);
    this.ctx.restore();

    // Outer white border
    roundedRectPath(-trackWidth / 2);
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Track surface
    this.ctx.save();
    roundedRectPath(-trackWidth / 2);
    this.ctx.clip();
    if (this.trackPattern) {
      this.ctx.fillStyle = this.trackPattern;
    } else {
      this.ctx.fillStyle = '#8B5A2B';
    }
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    // Grass infield
    roundedRectPath(trackWidth / 2);
    if (this.grassPattern) {
      this.ctx.fillStyle = this.grassPattern;
    } else {
      this.ctx.fillStyle = '#2d5a27';
    }
    this.ctx.fill();

    // Center scoreboard
    this.drawScoreboard(rats);

    // Lane lines
    for (let i = 1; i < numLanes; i++) {
      const laneOffset = -trackWidth / 2 + (trackWidth * i) / numLanes;
      roundedRectPath(laneOffset);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    // Inner white border
    roundedRectPath(trackWidth / 2);
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Entry lane lines
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, entryLaneTop);
    this.ctx.lineTo(this.canvas.width, entryLaneTop);
    this.ctx.stroke();

    for (let i = 1; i < numLanes; i++) {
      const y = entryLaneTop + laneSpacing * i;
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, entryLaneTop + trackWidth);
    this.ctx.lineTo(this.canvas.width, entryLaneTop + trackWidth);
    this.ctx.stroke();

    // Checkered finish line
    this.drawFinishLine();
  }

  private drawScoreboard(rats: { vestHue: number }[]): void {
    const boxWidth = 180;
    const boxHeight = 140;
    const boxX = this.canvas.width / 2 - boxWidth / 2 + 30;
    const boxY = this.canvas.height / 2 - boxHeight / 2 - 30;

    this.ctx.fillStyle = '#4a4a4a';
    this.ctx.fillRect(boxX - 6, boxY - 6, boxWidth + 12, boxHeight + 12);

    this.ctx.fillStyle = '#2a8a8a';
    this.ctx.fillRect(boxX - 3, boxY - 3, boxWidth + 6, boxHeight + 6);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    const smallBoxSize = 36;
    const smallBoxMargin = 8;
    const smallBoxX = boxX + smallBoxMargin;

    for (let i = 0; i < 3; i++) {
      const smallBoxY = boxY + smallBoxMargin + i * (smallBoxSize + 6);

      if (rats[i] && rats[i].vestHue !== undefined) {
        const rgb = hslToRgb(rats[i].vestHue, 0.85, 0.5);
        this.ctx.fillStyle = rgbToCss(rgb);
        this.ctx.fillRect(smallBoxX, smallBoxY, smallBoxSize, smallBoxSize);
      }

      this.ctx.strokeStyle = '#888';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(smallBoxX, smallBoxY, smallBoxSize, smallBoxSize);
    }
  }

  private drawFinishLine(): void {
    const b = this.getBounds();
    const trackWidth = this.getTrackWidth();
    const squareSize = 8;
    const numCols = 2;
    const finishX = b.right - b.radius - numCols * squareSize - 10;
    const finishTop = b.bottom - trackWidth / 2;
    const finishHeight = trackWidth;
    const numRows = Math.ceil(finishHeight / squareSize);

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const isWhite = (row + col) % 2 === 0;
        this.ctx.fillStyle = isWhite ? '#fff' : '#000';
        this.ctx.fillRect(
          finishX + col * squareSize,
          finishTop + row * squareSize,
          squareSize,
          squareSize
        );
      }
    }
  }

  drawGates(opacity: number): void {
    if (opacity <= 0) return;

    const b = this.getBounds();
    const trackWidth = this.getTrackWidth();
    const numLanes = TRACK_CONFIG.NUM_LANES;
    const laneSpacing = trackWidth / numLanes;
    const entryLaneTop = b.bottom - trackWidth / 2;
    const gateX = this.getGateX();

    this.ctx.globalAlpha = opacity;

    for (let i = 0; i < numLanes; i++) {
      const laneY = entryLaneTop + laneSpacing * i + laneSpacing / 2;
      const postWidth = 6;
      const postHeight = laneSpacing - 8;

      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(gateX - postWidth / 2, laneY - postHeight / 2, postWidth, postHeight);

      this.ctx.fillStyle = '#A0522D';
      this.ctx.fillRect(gateX - postWidth / 2, laneY - postHeight / 2, 2, postHeight);

      this.ctx.fillStyle = '#5D3A1A';
      this.ctx.fillRect(gateX + postWidth / 2 - 2, laneY - postHeight / 2, 2, postHeight);

      const barWidth = 20;
      const barHeight = 4;
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(gateX - barWidth / 2, laneY - barHeight / 2, barWidth, barHeight);

      this.ctx.fillStyle = '#A0522D';
      this.ctx.fillRect(gateX - barWidth / 2, laneY - barHeight / 2, barWidth, 1);
    }

    this.ctx.globalAlpha = 1.0;
  }

  drawPipes(): void {
    const b = this.getBounds();
    const trackWidth = this.getTrackWidth();
    const numLanes = TRACK_CONFIG.NUM_LANES;
    const laneSpacing = trackWidth / numLanes;
    const entryLaneTop = b.bottom - trackWidth / 2;
    const pipeHeight = laneSpacing - 4;
    const pipeLength = 30;

    const drawPipe = (startX: number, endX: number, y: number): void => {
      const top = y - pipeHeight / 2;
      const gradient = this.ctx.createLinearGradient(0, top, 0, top + pipeHeight);
      gradient.addColorStop(0, '#d0d0d0');
      gradient.addColorStop(0.3, '#e8e8e8');
      gradient.addColorStop(0.5, '#c0c0c0');
      gradient.addColorStop(1, '#808080');

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(startX, top, endX - startX, pipeHeight);

      this.ctx.strokeStyle = '#f0f0f0';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(startX, top);
      this.ctx.lineTo(endX, top);
      this.ctx.stroke();

      this.ctx.strokeStyle = '#606060';
      this.ctx.beginPath();
      this.ctx.moveTo(startX, top + pipeHeight);
      this.ctx.lineTo(endX, top + pipeHeight);
      this.ctx.stroke();
    };

    for (let i = 0; i < numLanes; i++) {
      const laneY = entryLaneTop + laneSpacing * i + laneSpacing / 2;
      drawPipe(-10, pipeLength, laneY);
      drawPipe(this.canvas.width - pipeLength, this.canvas.width + 10, laneY);
    }
  }
}

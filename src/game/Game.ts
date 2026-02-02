import { GateState } from '../types';
import { Track } from './Track';
import { Rat } from './Rat';
import { SpriteManager } from './SpriteManager';
import { MusicManager } from './MusicManager';
import {
  RAT_NAMES,
  FUR_COLORS,
  VEST_HUES,
  TIMING_CONFIG,
} from '../constants';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private track: Track;
  private spriteManager: SpriteManager;
  private musicManager: MusicManager;
  private rats: Rat[] = [];

  private speedMultiplier: number = TIMING_CONFIG.DEFAULT_SPEED_MULTIPLIER;
  private animationFPS: number = TIMING_CONFIG.DEFAULT_FPS;
  private showDebug: boolean = false;

  private gateState: GateState = 'visible';
  private gateOpacity: number = 1.0;
  private raceStarted: boolean = false;

  private usedNames: string[] = [];
  private usedVestHues: number[] = [];
  private lastTime: number = 0;

  private spriteScale: number = 1.5;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.track = new Track(canvas);
    this.spriteManager = new SpriteManager();
    this.musicManager = new MusicManager();
  }

  async init(): Promise<void> {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    await Promise.all([
      this.track.loadTextures(),
      this.spriteManager.load(),
    ]);

    // Create initial rats
    for (let i = 0; i < 3; i++) {
      this.rats.push(this.createRat(i, i * 500));
    }

    this.updateRatNamesDisplay();
    this.setupEventListeners();
    this.setupDebugControls();

    requestAnimationFrame((time) => this.animate(time));
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private getRandomName(): string {
    if (this.usedNames.length >= RAT_NAMES.length) {
      this.usedNames = [];
    }
    const available = RAT_NAMES.filter((n) => !this.usedNames.includes(n));
    const name = available[Math.floor(Math.random() * available.length)];
    this.usedNames.push(name);
    return name;
  }

  private getUniqueVestHue(): number {
    const available = VEST_HUES.filter((h) => !this.usedVestHues.includes(h));
    if (available.length === 0) {
      this.usedVestHues = [];
      const hue = VEST_HUES[Math.floor(Math.random() * VEST_HUES.length)];
      this.usedVestHues.push(hue);
      return hue;
    }
    const hue = available[Math.floor(Math.random() * available.length)];
    this.usedVestHues.push(hue);
    return hue;
  }

  private createRat(lane: number, startDelay: number = 0): Rat {
    const vestHue = this.getUniqueVestHue();
    const furColor = FUR_COLORS[Math.floor(Math.random() * FUR_COLORS.length)];
    const name = this.getRandomName();
    return new Rat(name, lane, vestHue, furColor, startDelay);
  }

  addRat(): void {
    const lane = this.rats.length % 3;
    this.rats.push(this.createRat(lane, 0));
    this.updateRatNamesDisplay();
  }

  removeRat(): void {
    if (this.rats.length > 1) {
      const removed = this.rats.pop()!;
      this.usedNames = this.usedNames.filter((n) => n !== removed.name);
      this.updateRatNamesDisplay();
    }
  }

  toggleDebug(): void {
    this.showDebug = !this.showDebug;
    const debugBtn = document.getElementById('debugBtn');
    if (debugBtn) {
      debugBtn.textContent = `Debug: ${this.showDebug ? 'ON' : 'OFF'}`;
    }
    const debugControls = document.getElementById('debugControls');
    if (debugControls) {
      debugControls.classList.toggle('hidden', !this.showDebug);
    }
  }

  private updateRatNamesDisplay(): void {
    const container = document.getElementById('ratNames');
    if (container) {
      container.innerHTML = this.rats
        .map((rat) => `<span>${rat.name}</span>`)
        .join('');
    }
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'o' || e.key === 'O') {
        // Toggle overlay - implement if needed
      }
      if (e.key === 'm' || e.key === 'M') {
        this.toggleMusic();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const rat = this.getRatAtPosition(x, y);
      if (rat) {
        this.triggerTurn(rat);
      }
    });

    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) {
      musicToggle.addEventListener('click', () => this.toggleMusic());
    }
  }

  private setupDebugControls(): void {
    const fpsSlider = document.getElementById('fpsSlider') as HTMLInputElement;
    const fpsValue = document.getElementById('fpsValue');
    const speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
    const speedValue = document.getElementById('speedValue');
    const ratSpeedSlider = document.getElementById('ratSpeedSlider') as HTMLInputElement;
    const ratSpeedValue = document.getElementById('ratSpeedValue');

    if (fpsSlider && fpsValue) {
      fpsSlider.addEventListener('input', () => {
        this.animationFPS = parseInt(fpsSlider.value);
        fpsValue.textContent = String(this.animationFPS);
      });
    }

    if (speedSlider && speedValue) {
      speedSlider.addEventListener('input', () => {
        this.speedMultiplier = parseFloat(speedSlider.value) / 100;
        speedValue.textContent = this.speedMultiplier.toFixed(3);
      });
    }

    if (ratSpeedSlider && ratSpeedValue) {
      ratSpeedSlider.addEventListener('input', () => {
        const baseSpeed = parseFloat(ratSpeedSlider.value) / 100000;
        ratSpeedValue.textContent = baseSpeed.toFixed(5);
        for (const rat of this.rats) {
          rat.speed = baseSpeed + Math.random() * baseSpeed * 0.5;
        }
      });
    }
  }

  private toggleMusic(): void {
    const allFinished = this.rats.every((r) => r.state === 'finished');
    const enabled = this.musicManager.toggle(this.raceStarted, allFinished);

    const toggle = document.getElementById('musicToggle');
    if (toggle) {
      toggle.textContent = enabled ? '🔊 Music' : '🔇 Music';
      toggle.classList.toggle('enabled', enabled);
    }
  }

  private getRatAtPosition(x: number, y: number): Rat | null {
    const clickRadius = 50;
    let closest: Rat | null = null;
    let closestDist = Infinity;

    for (const rat of this.rats) {
      if (rat.state !== 'racing') continue;
      const pos = this.track.getPositionOnTrack(rat.trackPos, rat.lane);
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < clickRadius && dist < closestDist) {
        closest = rat;
        closestDist = dist;
      }
    }
    return closest;
  }

  private triggerTurn(rat: Rat): void {
    if (rat.triggeredAnim) return;

    const turnFrames = this.spriteManager.animations.turn;
    if (!turnFrames || turnFrames.length === 0) return;

    rat.triggeredAnim = 'turn';
    rat.triggeredFrameIndex = 0;
    rat.frameTimer = 0;
    rat.turnStartDirection = rat.direction;
  }

  private update(dt: number): void {
    const frameInterval = 1000 / this.animationFPS;

    // Update gate fade
    if (this.gateState === 'fading') {
      this.gateOpacity -= dt * this.speedMultiplier * TIMING_CONFIG.GATE_FADE_RATE;
      if (this.gateOpacity <= 0) {
        this.gateOpacity = 0;
        this.gateState = 'hidden';
        if (this.musicManager.isEnabled && this.musicManager.musicState === 'intro') {
          this.musicManager.startLoop();
        }
      }
    }

    // Check if all rats finished
    const allFinished = this.rats.every((r) => r.state === 'finished');
    if (allFinished && this.raceStarted && this.musicManager.musicState === 'loop') {
      this.musicManager.startEnd();
    }

    // Check if all rats are waiting at gate
    const allWaiting = this.rats.every(
      (r) =>
        r.state === 'waiting' ||
        r.state === 'racing' ||
        r.state === 'exiting' ||
        r.state === 'finished'
    );
    const waitingRats = this.rats.filter((r) => r.state === 'waiting');

    if (allWaiting && waitingRats.length > 0 && !this.raceStarted) {
      const minWait = Math.min(...waitingRats.map((r) => r.waitTimer));
      if (minWait >= TIMING_CONFIG.GATE_WAIT_TIME) {
        this.raceStarted = true;
        this.gateState = 'fading';
      }
    }

    // Update rats
    for (const rat of this.rats) {
      rat.update(
        dt,
        this.speedMultiplier,
        frameInterval,
        this.track,
        this.gateState,
        this.spriteManager.animations
      );
    }
  }

  private draw(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw track
    this.track.draw(this.rats);

    // Draw debug lanes
    if (this.showDebug) {
      this.drawDebugLanes();
    }

    if (!this.spriteManager.isLoaded) return;

    // Draw gates
    if (this.gateState !== 'hidden') {
      this.track.drawGates(this.gateOpacity);
    }

    // Sort and draw rats
    const sortedRats = [...this.rats].sort((a, b) => {
      const getY = (rat: Rat): number => {
        if (rat.state === 'entering' || rat.state === 'exiting' || rat.state === 'waiting') {
          return this.track.getEntryLaneY(rat.lane);
        }
        return this.track.getPositionOnTrack(rat.trackPos, rat.lane).y;
      };
      return getY(a) - getY(b);
    });

    for (const rat of sortedRats) {
      this.drawRat(rat);
    }

    // Draw pipes on top
    this.track.drawPipes();
  }

  private drawDebugLanes(): void {
    const laneColors = ['#ff0', '#0ff', '#f0f'];
    for (let lane = 0; lane < 3; lane++) {
      this.ctx.strokeStyle = laneColors[lane];
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.002) {
        const pos = this.track.getPositionOnTrack(t, lane);
        if (t === 0) {
          this.ctx.moveTo(pos.x, pos.y);
        } else {
          this.ctx.lineTo(pos.x, pos.y);
        }
      }
      this.ctx.closePath();
      this.ctx.stroke();
    }
    this.ctx.setLineDash([]);
  }

  private drawRat(rat: Rat): void {
    if (rat.state === 'finished' || rat.startDelay > 0) return;

    let x: number, y: number, rotation: number;
    let frames: string[], frameIndex: number;

    if (rat.state === 'entering' || rat.state === 'exiting') {
      x = rat.laneX;
      y = this.track.getEntryLaneY(rat.lane);
      rotation = 0;
      frames = this.spriteManager.animations.walk || [];
      frameIndex = rat.segmentFrameIndex % (frames.length || 1);
    } else if (rat.state === 'waiting') {
      x = rat.laneX;
      y = this.track.getEntryLaneY(rat.lane);
      rotation = 0;
      frames = this.spriteManager.animations.sniff || [];
      frameIndex = rat.triggeredFrameIndex % (frames.length || 1);
    } else {
      const pos = this.track.getPositionOnTrack(rat.trackPos, rat.lane);
      x = pos.x;
      y = pos.y;

      if (rat.triggeredAnim) {
        frames = this.spriteManager.animations[rat.triggeredAnim] || [];
        frameIndex = rat.triggeredFrameIndex;
        rotation = rat.getRotationForSegment(pos.segment, pos.cornerProgress);
      } else {
        frames = this.spriteManager.animations.walk || [];
        const rawIndex = rat.segmentFrameIndex % (frames.length || 1);
        frameIndex = rat.direction < 0 ? frames.length - 1 - rawIndex : rawIndex;
        rotation = rat.getRotationForSegment(pos.segment, pos.cornerProgress);
      }
    }

    if (!frames || frames.length === 0) return;

    const spriteName = frames[Math.min(frameIndex, frames.length - 1)];
    const spriteCanvas = this.spriteManager.getSpriteForRat(
      spriteName,
      rat.vestHue,
      rat.furColor
    );

    if (spriteCanvas) {
      const cellSize = this.spriteManager.cellSize;
      const scaledSize = cellSize * this.spriteScale;
      const pivot = this.spriteManager.pivot;
      const scaledPivotX = pivot.x * this.spriteScale;
      const scaledPivotY = pivot.y * this.spriteScale;

      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(rotation);
      this.ctx.drawImage(
        spriteCanvas,
        -scaledSize / 2 - scaledPivotX,
        -scaledSize / 2 - scaledPivotY,
        scaledSize,
        scaledSize
      );
      this.ctx.restore();

      if (this.showDebug) {
        this.ctx.fillStyle = '#f00';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private animate(time: number): void {
    const dt = this.lastTime ? time - this.lastTime : 16;
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.animate(t));
  }
}

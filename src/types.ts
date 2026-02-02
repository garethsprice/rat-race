export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface FurColor {
  hue: number;
  sat: number;
  light: number;
  name: string;
}

export interface TrackBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  radius: number;
}

export interface TrackPosition {
  x: number;
  y: number;
  segment: TrackSegment;
  cornerProgress: number;
}

export type TrackSegment =
  | 'right'
  | 'left'
  | 'up'
  | 'down'
  | 'corner_br'
  | 'corner_tr'
  | 'corner_tl'
  | 'corner_bl';

export type RatState =
  | 'entering'
  | 'waiting'
  | 'racing'
  | 'exiting'
  | 'finished';

export type GateState = 'visible' | 'fading' | 'hidden';

export type MusicState = 'none' | 'intro' | 'loop' | 'end' | 'finished';

export interface SpriteInfo {
  index: number;
  col: number;
  row: number;
  x: number;
  y: number;
  original_file: string;
  original_rotation: number;
  directions: string[];
}

export interface SpriteSheetMeta {
  cell_size: number;
  columns: number;
  rows: number;
  sprites: Record<string, SpriteInfo>;
  animations: Record<string, string[]>;
}

export interface RatConfig {
  lane: number;
  startDelay?: number;
  vestHue: number;
  furColor: FurColor | null;
  name: string;
}

export interface GameConfig {
  trackHPercent: number;
  trackVPercent: number;
  cornerRadius: number;
  trackWidthPercent: number;
  spriteScale: number;
  initialSpeedMultiplier: number;
  animationFPS: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  trackHPercent: 65.5,
  trackVPercent: 84,
  cornerRadius: 130,
  trackWidthPercent: 14,
  spriteScale: 1.5,
  initialSpeedMultiplier: 0.125,
  animationFPS: 60,
};

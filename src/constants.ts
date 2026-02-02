import { FurColor } from './types';

/** Predefined distinct vest colors (hues) that are easily distinguishable */
export const VEST_HUES = [0, 30, 60, 120, 180, 210, 270, 300, 330];

/** Fur color presets for rats */
export const FUR_COLORS: (FurColor | null)[] = [
  null, // Default grey
  { hue: 0, sat: 0.1, light: 0.3, name: 'black' },
  { hue: 0, sat: 0.0, light: 2.0, name: 'white' },
  { hue: 40, sat: 0.3, light: 1.5, name: 'cream' },
  { hue: 25, sat: 0.6, light: 0.8, name: 'brown' },
  { hue: 30, sat: 0.4, light: 1.0, name: 'tan' },
  { hue: 20, sat: 0.5, light: 0.6, name: 'chocolate' },
  { hue: 0, sat: 0.0, light: 1.3, name: 'light-gray' },
  { hue: 0, sat: 0.0, light: 0.7, name: 'dark-gray' },
  { hue: 35, sat: 0.3, light: 1.2, name: 'fawn' },
  { hue: 120, sat: 0.7, light: 0.9, name: 'green' },
  { hue: 340, sat: 0.6, light: 1.3, name: 'pink' },
  { hue: 280, sat: 0.7, light: 0.9, name: 'purple' },
];

/** Classic rat names from the original After Dark screensaver */
export const RAT_NAMES = [
  "Merkle's Mistake",
  "Rat O' War",
  'Crunchy In Milk',
  'Rocket Science',
  'Rats? In Berkeley?',
  'Pepe Le Fromage',
  'Ersatz Rats',
  'Nosfer-RAT-u',
  'Rodent Rambler',
  'Control Group',
  'Kentucky Blue Cheese',
  'Mister Wuggums',
  'Dime a Dozen',
  'Dog Eat Dog',
  'Mouse++',
  'Rat Came Back',
  'Better Than Cats',
  'Rat Tattooie',
  'Drag And Drop',
  'Flea Biscuit',
  "Mama's Good Gravy",
  'Feta Cheda',
  'Eeky Squeaky Heart',
  'Polysorbate-80',
  'FD&C Red #2',
  'Buttercup',
  'Son of Da Mouse',
  'Tall Tail',
  'Space Rat Spiff',
  'Big Wheel',
  'Whisper',
  'Pink Eye',
  'Habitrail Hipster',
  'Twelve Step',
  'Algernon',
  'Doug',
  'Nachismo',
  'Abort, Retry, Fail?',
  'Trurl',
  'The Nose',
  'Ten Fingered Freddy',
  'Little Elvis',
  'Works for Cheese',
  "Sampson's Pigtail",
  'E Ticket',
  "I'm With Stupid",
  'Boris Bait',
  'What, Me Scurry?',
  'Sec-Rat-ariat',
  'By A Whisker',
  "Hillary's Little Secret",
  "Flamin' Furball",
  'Dan Ratter',
  'Rat-a-tat',
];

/** Sprite pivot offset */
export const SPRITE_PIVOT = { x: 24, y: 0 };

/** Track configuration defaults */
export const TRACK_CONFIG = {
  H_PERCENT: 65.5,
  V_PERCENT: 84,
  CORNER_RADIUS: 130,
  WIDTH_PERCENT: 14,
  NUM_LANES: 3,
};

/** Animation and timing defaults */
export const TIMING_CONFIG = {
  DEFAULT_FPS: 60,
  DEFAULT_SPEED_MULTIPLIER: 0.125,
  GATE_WAIT_TIME: 3000, // ms before gates open
  GATE_FADE_RATE: 0.002, // opacity per ms
};

/** Rat behavior configuration */
export const BEHAVIOR_CONFIG = {
  BASE_SPEED: 0.00015,
  SPEED_VARIANCE: 0.0001,
  ACTION_CHANCE: 0.004, // per dt
  SNIFF_DURATION_MIN: 1000,
  SNIFF_DURATION_MAX: 3000,
  GROOM_DURATION_MIN: 1000,
  GROOM_DURATION_MAX: 3000,
  BACKWARDS_TURN_CHANCE: 0.02, // per dt
  BACKWARDS_TIME_MIN: 1000,
  BACKWARDS_TIME_MAX: 5000,
  COOLDOWN_AFTER_ACTION_MIN: 500,
  COOLDOWN_AFTER_ACTION_MAX: 2000,
  COOLDOWN_AFTER_TURN_FORWARD: 500,
  COOLDOWN_AFTER_TURN_BACKWARD: 2000,
};

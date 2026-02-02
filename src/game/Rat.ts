import { FurColor, RatState, TrackSegment } from '../types';
import { BEHAVIOR_CONFIG } from '../constants';

export class Rat {
  name: string;
  trackPos: number = 0;
  laneX: number = -100;
  speed: number;
  frameIndex: number = 0;
  frameTimer: number = 0;
  lane: number;
  vestHue: number;
  furColor: FurColor | null;
  currentSegment: TrackSegment | null = null;
  segmentFrameIndex: number = 0;
  triggeredAnim: string | null = null;
  triggeredFrameIndex: number = 0;
  triggeredDuration: number = 0;
  triggeredElapsed: number = 0;
  triggerCooldown: number = 0;
  direction: number = 1;
  turnStartDirection: number = 1;
  state: RatState = 'entering';
  startDelay: number;
  lapsCompleted: number = 0;
  waitTimer: number = 0;
  backwardsTimer: number = 0;

  constructor(
    name: string,
    lane: number,
    vestHue: number,
    furColor: FurColor | null,
    startDelay: number = 0
  ) {
    this.name = name;
    this.lane = lane;
    this.vestHue = vestHue;
    this.furColor = furColor;
    this.startDelay = startDelay;
    this.speed =
      BEHAVIOR_CONFIG.BASE_SPEED +
      Math.random() * BEHAVIOR_CONFIG.SPEED_VARIANCE;
  }

  update(
    dt: number,
    speedMultiplier: number,
    frameInterval: number,
    track: {
      getGateX: () => number;
      getEntryX: () => number;
      getPerimeter: () => number;
      getPositionOnTrack: (t: number, lane: number) => { segment: TrackSegment };
      isCornerSegment: (segment: TrackSegment) => boolean;
    },
    gateState: string,
    animations: Record<string, string[]>
  ): void {
    if (this.startDelay > 0) {
      this.startDelay -= dt * speedMultiplier;
      return;
    }

    // Animate walking
    this.frameTimer += dt * speedMultiplier;
    if (this.frameTimer >= frameInterval) {
      this.segmentFrameIndex++;
      this.frameTimer = 0;
    }

    if (this.state === 'entering') {
      this.updateEntering(dt, speedMultiplier, track);
    } else if (this.state === 'waiting') {
      this.updateWaiting(dt, speedMultiplier, frameInterval, gateState, track, animations);
    } else if (this.state === 'racing') {
      this.updateRacing(dt, speedMultiplier, frameInterval, track, animations);
    } else if (this.state === 'exiting') {
      this.updateExiting(dt, speedMultiplier, track);
    }
  }

  private updateEntering(
    dt: number,
    speedMultiplier: number,
    track: { getGateX: () => number; getPerimeter: () => number }
  ): void {
    const perimeter = track.getPerimeter();
    const pixelSpeed = this.speed * perimeter;
    this.laneX += pixelSpeed * dt * speedMultiplier;

    const gateX = track.getGateX();
    if (this.laneX >= gateX - 30) {
      this.state = 'waiting';
      this.laneX = gateX - 30;
      this.waitTimer = 0;
      this.triggeredAnim = 'sniff';
      this.triggeredFrameIndex = 0;
    }
  }

  private updateWaiting(
    dt: number,
    speedMultiplier: number,
    frameInterval: number,
    gateState: string,
    track: { getEntryX: () => number; getPerimeter: () => number },
    animations: Record<string, string[]>
  ): void {
    this.waitTimer += dt;

    this.frameTimer += dt * speedMultiplier;
    if (this.frameTimer >= frameInterval) {
      this.triggeredFrameIndex++;
      const frames = animations.sniff;
      if (frames && this.triggeredFrameIndex >= frames.length) {
        this.triggeredFrameIndex = 0;
      }
      this.frameTimer = 0;
    }

    if (gateState === 'hidden') {
      this.state = 'racing';
      const b_left_radius = track.getEntryX();
      const distFromStart = this.laneX - b_left_radius;
      const perimeter = track.getPerimeter();
      this.trackPos = Math.max(0, distFromStart / perimeter);
      this.lapsCompleted = 0;
      this.triggeredAnim = null;
    }
  }

  private updateRacing(
    dt: number,
    speedMultiplier: number,
    frameInterval: number,
    track: {
      getEntryX: () => number;
      getPerimeter: () => number;
      getPositionOnTrack: (t: number, lane: number) => { segment: TrackSegment };
      isCornerSegment: (segment: TrackSegment) => boolean;
    },
    animations: Record<string, string[]>
  ): void {
    if (this.triggerCooldown > 0) {
      this.triggerCooldown -= dt * speedMultiplier;
    }

    if (this.backwardsTimer > 0) {
      this.backwardsTimer -= dt;
    }

    const pos = track.getPositionOnTrack(this.trackPos, this.lane);
    const newSegment = pos.segment;

    if (newSegment !== this.currentSegment) {
      this.currentSegment = newSegment;
      this.segmentFrameIndex = 0;
      this.frameTimer = 0;
    }

    if (this.triggeredAnim) {
      this.updateTriggeredAnimation(dt, speedMultiplier, frameInterval, animations);
    } else {
      this.updateMovement(dt, speedMultiplier, track, newSegment);
      this.tryTriggerBehavior(dt, track, newSegment, animations);
    }
  }

  private updateTriggeredAnimation(
    dt: number,
    speedMultiplier: number,
    frameInterval: number,
    animations: Record<string, string[]>
  ): void {
    if (this.triggeredAnim === 'sniff' || this.triggeredAnim === 'groom') {
      this.triggeredElapsed += dt;
    }

    this.frameTimer += dt * speedMultiplier;
    if (this.frameTimer >= frameInterval) {
      this.triggeredFrameIndex++;
      this.frameTimer = 0;

      const frames = animations[this.triggeredAnim!];
      if (!frames || this.triggeredFrameIndex >= frames.length) {
        if (this.triggeredAnim === 'turn') {
          const wasGoingForward = this.direction > 0;
          this.direction *= -1;
          if (wasGoingForward) {
            this.backwardsTimer =
              BEHAVIOR_CONFIG.BACKWARDS_TIME_MIN +
              Math.random() *
                (BEHAVIOR_CONFIG.BACKWARDS_TIME_MAX -
                  BEHAVIOR_CONFIG.BACKWARDS_TIME_MIN);
          }
          this.triggerCooldown =
            this.direction > 0
              ? BEHAVIOR_CONFIG.COOLDOWN_AFTER_TURN_FORWARD
              : BEHAVIOR_CONFIG.COOLDOWN_AFTER_TURN_BACKWARD;
          this.triggeredAnim = null;
          this.triggeredFrameIndex = 0;
        } else if (
          this.triggeredAnim === 'sniff' ||
          this.triggeredAnim === 'groom'
        ) {
          if (this.triggeredElapsed >= this.triggeredDuration) {
            this.triggeredAnim = null;
            this.triggeredFrameIndex = 0;
            this.triggeredElapsed = 0;
            this.triggeredDuration = 0;
            this.triggerCooldown =
              BEHAVIOR_CONFIG.COOLDOWN_AFTER_ACTION_MIN +
              Math.random() *
                (BEHAVIOR_CONFIG.COOLDOWN_AFTER_ACTION_MAX -
                  BEHAVIOR_CONFIG.COOLDOWN_AFTER_ACTION_MIN);
          } else {
            this.triggeredFrameIndex = 0;
          }
        } else {
          this.triggeredAnim = null;
          this.triggeredFrameIndex = 0;
          this.triggerCooldown =
            BEHAVIOR_CONFIG.COOLDOWN_AFTER_ACTION_MIN +
            Math.random() *
              (BEHAVIOR_CONFIG.COOLDOWN_AFTER_ACTION_MAX -
                BEHAVIOR_CONFIG.COOLDOWN_AFTER_ACTION_MIN);
        }
      }
    }
  }

  private updateMovement(
    dt: number,
    speedMultiplier: number,
    track: {
      getEntryX: () => number;
      isCornerSegment: (segment: TrackSegment) => boolean;
    },
    segment: TrackSegment
  ): void {
    const laneBonus = (2 - this.lane) * 0.2;
    const cornerSpeedFactor = track.isCornerSegment(segment)
      ? 1.2 + laneBonus
      : 1.0;

    const oldPos = this.trackPos;
    this.trackPos +=
      this.speed * dt * speedMultiplier * this.direction * cornerSpeedFactor;

    if (oldPos > 0.9 && this.trackPos >= 1.0) {
      this.lapsCompleted++;
      if (this.lapsCompleted >= 1) {
        this.state = 'exiting';
        this.laneX = track.getEntryX();
      } else {
        this.trackPos = this.trackPos - 1.0;
      }
    }
  }

  private tryTriggerBehavior(
    dt: number,
    track: { isCornerSegment: (segment: TrackSegment) => boolean },
    segment: TrackSegment,
    animations: Record<string, string[]>
  ): void {
    if (track.isCornerSegment(segment) || this.triggerCooldown > 0) return;

    const rand = Math.random();

    if (this.direction < 0) {
      if (
        this.backwardsTimer <= 0 &&
        rand < BEHAVIOR_CONFIG.BACKWARDS_TURN_CHANCE * dt
      ) {
        const frames = animations.turn;
        if (frames && frames.length > 0) {
          this.triggeredAnim = 'turn';
          this.triggeredFrameIndex = 0;
          this.frameTimer = 0;
          this.triggeredElapsed = 0;
          this.triggeredDuration = 0;
          this.turnStartDirection = this.direction;
        }
      }
    } else {
      const actionChance = BEHAVIOR_CONFIG.ACTION_CHANCE * dt;

      if (rand < actionChance * 0.45) {
        const frames = animations.sniff;
        if (frames && frames.length > 0) {
          this.triggeredAnim = 'sniff';
          this.triggeredFrameIndex = 0;
          this.frameTimer = 0;
          this.triggeredElapsed = 0;
          this.triggeredDuration =
            BEHAVIOR_CONFIG.SNIFF_DURATION_MIN +
            Math.random() *
              (BEHAVIOR_CONFIG.SNIFF_DURATION_MAX -
                BEHAVIOR_CONFIG.SNIFF_DURATION_MIN);
        }
      } else if (rand < actionChance * 0.75) {
        const frames = animations.groom;
        if (frames && frames.length > 0) {
          this.triggeredAnim = 'groom';
          this.triggeredFrameIndex = 0;
          this.frameTimer = 0;
          this.triggeredElapsed = 0;
          this.triggeredDuration =
            BEHAVIOR_CONFIG.GROOM_DURATION_MIN +
            Math.random() *
              (BEHAVIOR_CONFIG.GROOM_DURATION_MAX -
                BEHAVIOR_CONFIG.GROOM_DURATION_MIN);
        }
      } else if (rand < actionChance * 0.9) {
        const frames = animations.turn;
        if (frames && frames.length > 0) {
          this.triggeredAnim = 'turn';
          this.triggeredFrameIndex = 0;
          this.frameTimer = 0;
          this.triggeredElapsed = 0;
          this.triggeredDuration = 0;
          this.turnStartDirection = this.direction;
        }
      }
    }
  }

  private updateExiting(
    dt: number,
    speedMultiplier: number,
    track: { getPerimeter: () => number }
  ): void {
    const perimeter = track.getPerimeter();
    const pixelSpeed = this.speed * perimeter;
    this.laneX += pixelSpeed * dt * speedMultiplier;

    if (this.laneX >= window.innerWidth + 100) {
      this.state = 'finished';
    }
  }

  getRotationForSegment(
    segment: TrackSegment,
    cornerProgress: number = 0
  ): number {
    const isCorner = segment.startsWith('corner_');

    if (isCorner) {
      const progress =
        this.direction < 0 ? 1 - cornerProgress : cornerProgress;

      if (this.direction > 0) {
        switch (segment) {
          case 'corner_br':
            return -progress * (Math.PI / 2);
          case 'corner_tr':
            return -Math.PI / 2 - progress * (Math.PI / 2);
          case 'corner_tl':
            return Math.PI - progress * (Math.PI / 2);
          case 'corner_bl':
            return Math.PI / 2 - progress * (Math.PI / 2);
        }
      } else {
        switch (segment) {
          case 'corner_br':
            return Math.PI / 2 + progress * (Math.PI / 2);
          case 'corner_tr':
            return progress * (Math.PI / 2);
          case 'corner_tl':
            return -Math.PI / 2 + progress * (Math.PI / 2);
          case 'corner_bl':
            return Math.PI + progress * (Math.PI / 2);
        }
      }
    }

    if (this.direction > 0) {
      switch (segment) {
        case 'right':
          return 0;
        case 'left':
          return Math.PI;
        case 'up':
          return -Math.PI / 2;
        case 'down':
          return Math.PI / 2;
        default:
          return 0;
      }
    } else {
      switch (segment) {
        case 'right':
          return Math.PI;
        case 'left':
          return 0;
        case 'up':
          return Math.PI / 2;
        case 'down':
          return -Math.PI / 2;
        default:
          return Math.PI;
      }
    }
  }
}

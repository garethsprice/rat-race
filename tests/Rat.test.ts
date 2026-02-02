import { Rat } from '../src/game/Rat';

describe('Rat', () => {
  describe('constructor', () => {
    it('should create a rat with correct properties', () => {
      const rat = new Rat('Test Rat', 1, 180, null, 500);

      expect(rat.name).toBe('Test Rat');
      expect(rat.lane).toBe(1);
      expect(rat.vestHue).toBe(180);
      expect(rat.furColor).toBeNull();
      expect(rat.startDelay).toBe(500);
      expect(rat.state).toBe('entering');
      expect(rat.direction).toBe(1);
      expect(rat.lapsCompleted).toBe(0);
    });

    it('should have a speed within expected range', () => {
      const rat = new Rat('Speed Test', 0, 0, null);

      expect(rat.speed).toBeGreaterThanOrEqual(0.00015);
      expect(rat.speed).toBeLessThanOrEqual(0.00025);
    });
  });

  describe('getRotationForSegment', () => {
    let rat: Rat;

    beforeEach(() => {
      rat = new Rat('Rotation Test', 0, 0, null);
    });

    describe('forward direction', () => {
      beforeEach(() => {
        rat.direction = 1;
      });

      it('should return 0 for right segment', () => {
        expect(rat.getRotationForSegment('right')).toBe(0);
      });

      it('should return PI for left segment', () => {
        expect(rat.getRotationForSegment('left')).toBe(Math.PI);
      });

      it('should return -PI/2 for up segment', () => {
        expect(rat.getRotationForSegment('up')).toBe(-Math.PI / 2);
      });

      it('should return PI/2 for down segment', () => {
        expect(rat.getRotationForSegment('down')).toBe(Math.PI / 2);
      });
    });

    describe('backward direction', () => {
      beforeEach(() => {
        rat.direction = -1;
      });

      it('should return PI for right segment (facing left)', () => {
        expect(rat.getRotationForSegment('right')).toBe(Math.PI);
      });

      it('should return 0 for left segment (facing right)', () => {
        expect(rat.getRotationForSegment('left')).toBe(0);
      });

      it('should return PI/2 for up segment (facing down)', () => {
        expect(rat.getRotationForSegment('up')).toBe(Math.PI / 2);
      });

      it('should return -PI/2 for down segment (facing up)', () => {
        expect(rat.getRotationForSegment('down')).toBe(-Math.PI / 2);
      });
    });

    describe('corners', () => {
      it('should interpolate rotation through corner_br forward', () => {
        rat.direction = 1;
        const startRotation = rat.getRotationForSegment('corner_br', 0);
        const endRotation = rat.getRotationForSegment('corner_br', 1);

        expect(startRotation).toBeCloseTo(0);
        expect(endRotation).toBeCloseTo(-Math.PI / 2);
      });

      it('should interpolate rotation through corner_br backward', () => {
        rat.direction = -1;
        const startRotation = rat.getRotationForSegment('corner_br', 0);
        const endRotation = rat.getRotationForSegment('corner_br', 1);

        expect(startRotation).toBeCloseTo(Math.PI);
        expect(endRotation).toBeCloseTo(Math.PI / 2);
      });
    });
  });

  describe('state transitions', () => {
    it('should start in entering state', () => {
      const rat = new Rat('State Test', 0, 0, null);
      expect(rat.state).toBe('entering');
    });

    it('should track laps completed', () => {
      const rat = new Rat('Lap Test', 0, 0, null);
      expect(rat.lapsCompleted).toBe(0);

      rat.lapsCompleted = 1;
      expect(rat.lapsCompleted).toBe(1);
    });
  });
});

// Jest setup file

// Mock canvas context
const createMockContext = (): Partial<CanvasRenderingContext2D> => ({
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  arcTo: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  drawImage: jest.fn(),
  createPattern: jest.fn(() => ({})),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
  })),
  putImageData: jest.fn(),
  clip: jest.fn(),
  setLineDash: jest.fn(),
});

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = jest.fn(() => createMockContext()) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock Image
global.Image = class MockImage {
  onload: (() => void) | null = null;
  onerror: ((err: Error) => void) | null = null;
  src: string = '';

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
} as unknown as typeof Image;

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  })
) as jest.Mock;

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  currentTime: 0,
})) as unknown as typeof AudioContext;

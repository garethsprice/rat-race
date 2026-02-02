# Rat Race

A faithful recreation of the classic "After Dark" screensaver Rat Race, built with TypeScript and Vite.

## Features

- Authentic rat sprites with vest color customization
- Realistic rat behaviors (sniffing, grooming, turning around)
- MIDI music playback (intro, loop, and ending tracks)
- Responsive canvas rendering
- Debug controls for tuning animation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start a development server at `http://localhost:3000`.

### Build

```bash
npm run build
```

The production build will be output to the `dist` directory.

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Type Checking

```bash
npm run typecheck
```

## Project Structure

```
rat-race/
├── public/
│   ├── sprites/          # Sprite sheets and metadata
│   ├── textures/         # Grass and track textures
│   └── music/            # MIDI music files
├── src/
│   ├── game/
│   │   ├── Game.ts       # Main game class
│   │   ├── Rat.ts        # Rat entity
│   │   ├── Track.ts      # Track rendering
│   │   ├── SpriteManager.ts
│   │   └── MusicManager.ts
│   ├── utils/
│   │   └── colors.ts     # Color conversion utilities
│   ├── styles/
│   │   └── main.css      # Application styles
│   ├── constants.ts      # Game constants
│   ├── types.ts          # TypeScript interfaces
│   └── main.ts           # Entry point
├── tests/
│   ├── setup.ts          # Jest setup
│   ├── colors.test.ts    # Color utility tests
│   └── Rat.test.ts       # Rat class tests
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── jest.config.js
```

## Controls

- **Click on a rat** - Make it turn around
- **M key** - Toggle music on/off
- **O key** - Toggle reference overlay (debug)

## Credits

Original "After Dark" screensaver by Berkeley Systems.

This is a fan recreation for educational purposes.

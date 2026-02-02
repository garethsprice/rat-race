import { Game } from './game/Game';
import './styles/main.css';

declare global {
  interface Window {
    game: Game | undefined;
  }
}

async function main(): Promise<void> {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const game = new Game(canvas);
  window.game = game;

  await game.init();

  console.log('Rat Race initialized!');
}

main().catch(console.error);

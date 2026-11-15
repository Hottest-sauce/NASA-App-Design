// main.js — Main Game Runner & Sequence Controller
import { GameState } from './shared/game-state.js';
import { mountSol0 } from './sols/sol-0.js';
import { mountSol1 } from './sols/sol-1.js';
import { mountSol2 } from './sols/sol-2.js';

async function runGame() {
  const app = document.getElementById('app');
  const state = GameState.create();

  // Sol 0 (Act 1: Morning Prep & Solar Alignment)
  await mountSol0(app, state);

  // Sol 1 (Act 2 & 3: Jezero Crater Detour & Night Dust Storm)
  await mountSol1(app, state);

  // Sol 2 (Act 4: Day 2 Recovery & Satellite Uplink Endings)
  await mountSol2(app, state);
}

runGame().catch((err) => {
  console.error('Game error:', err);
});

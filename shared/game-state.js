// shared/game-state.js — in-memory game state passed between sol modules

export const GameState = {
  create() {
    return {
      power: 50,             // base power %
      water: 11,             // kg total exploration stock
      oxygen: 3.5,           // kg total exploration stock
      daylight: 0,           // bonus minutes from skipping tasks
      choices: [],            // e.g. ['1A', '2A', 'AA']
      research: 0,           // research data / points
      iceSamples: false,     // collected from Neretva Vallis
      depotSamples: false,   // collected from depot
      communications: true,  // true = operational, false = offline/compromised
      baseClean: true,       // true = clean, false = dusty/dirty
      rocksMovedMinutes: 0,  // distance rocks were displaced by storm
      path: '',              // e.g. 'AA', 'AB', 'BA', 'BB'
      temperature: null,     // NASA InSight weekly & current temperature data
      sunAngle: null,        // NASA JPL / GISS Martian Sun elevation & azimuth
      baseLocation: {
        lat: 17.80514,
        lon: 75.99765,
        site: 'Jezero Crater Outpost',
      },
    };
  },
};

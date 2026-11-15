// minigames/cliff-climb.js — Cliff-Face Rover Climbing Autoscroller
// Features:
// - Top-down abstracted space rover constrained vertically at bottom 35% of container
// - Rock sprites loaded from "assets/images/Rock sprites.png" (9 distinct sprites)
// - Rock impact bounces rover back along Y with deceleration & smooth reacceleration phase
// - Randomized cracks that the rover can pass through without steering blocks
// - Passive battery drain at 1% per second
// - Rover battery HUD on top screen synchronized and aligned with lower battery HUD
// - Ending cutscene occurs on click (player clicks to step out & survey overlook)
// - Secret Konami code (UP UP DOWN LEFT RIGHT UP) instant skip support

import { DadPhone } from '../shared/dadphone.js';

const DEG2RAD = Math.PI / 180;

// 9 Rock Sprite Bounding Boxes from "Rock sprites.png" (360x360)
const ROCK_SPRITES = [
  { sx: 14,  sy: 33,  sw: 99,  sh: 68 },
  { sx: 137, sy: 22,  sw: 98,  sh: 78 },
  { sx: 255, sy: 34,  sw: 90,  sh: 67 },
  { sx: 14,  sy: 140, sw: 95,  sh: 76 },
  { sx: 124, sy: 135, sw: 97,  sh: 79 },
  { sx: 250, sy: 127, sw: 95,  sh: 89 },
  { sx: 12,  sy: 246, sw: 95,  sh: 85 },
  { sx: 126, sy: 272, sw: 105, sh: 60 },
  { sx: 246, sy: 249, sw: 96,  sh: 85 },
];

const rockImg = new Image();
rockImg.src = 'assets/images/Rock sprites.png';
let rockImgReady = false;
rockImg.onload = () => { rockImgReady = true; };

/**
 * Mount and run the Cliff-Face Rover Climbing Game
 * @param {HTMLElement} container - DOM parent to render into
 * @param {Object} opts - { durationSec: 60, initialBattery: 100 }
 * @returns {Promise<{ survived: boolean, finalBattery: number, hitsTaken: number }>}
 */
export async function mountCliffClimb(container, opts = {}) {
  const DURATION = opts.durationSec || 60;
  // Ensure rover battery starts at 100% (allowing 2 hits max before critical drain)
  let battery = 100;
  if (opts.initialBattery !== undefined) {
    battery = Math.min(100, Math.max(90, opts.initialBattery));
  }
  const initialPower = battery;

  container.innerHTML = `
    <div style="max-width:680px; margin:0 auto; font-family:system-ui,sans-serif;">
      <!-- Title & Live Telemetry -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-family:monospace; font-size:.85rem; color:#80cbc4;">
        <span>🧗 CLIFF-FACE ROVER TRANSIT // SOL 1</span>
        <span id="rover-coord-hud" style="color:#00e5ff; font-weight:700;">LAT: 17.80514° N | LON: 75.99765° E</span>
      </div>

      <!-- Distance Progress Bar -->
      <div style="background:#091424; border:2px solid #1a365d; border-radius:8px; padding:6px 14px; margin-bottom:10px; display:flex; align-items:center; gap:12px;">
        <span style="font-size:1.1rem;">🏎️</span>
        <div style="flex:1; height:8px; background:#060d17; border-radius:4px; overflow:hidden; position:relative;">
          <div id="drive-progress-bar" style="height:100%; width:0%; background:linear-gradient(90deg,#00bcd4,#4caf50); transition:width .1s;"></div>
        </div>
        <span style="font-size:1.1rem;">🏁</span>
        <span id="drive-timer" style="font-family:monospace; font-size:.9rem; color:#ffd54f; font-weight:700; min-width:40px;">60s</span>
      </div>

      <!-- Main Game Canvas Container -->
      <div style="position:relative; width:100%; height:620px; border:3px solid #1a365d; border-radius:12px; overflow:hidden; background:#0d0604; box-shadow:0 8px 30px rgba(0,0,0,0.8);">
        <canvas id="cliff-canvas" width="640" height="620" style="display:block; width:100%; height:100%;"></canvas>
        
        <!-- Big 'Go!' Overlay -->
        <div id="go-banner" style="
          position:absolute; top:42%; left:50%; transform:translate(-50%,-50%);
          font-family:system-ui, sans-serif; font-size:4rem; font-weight:900;
          color:#4caf50; text-shadow:0 0 20px #76ff03, 4px 4px 0 #1b5e20;
          pointer-events:none; transition:opacity .4s ease-out, transform .4s ease-out;
          letter-spacing:.05em;
        ">
          Go!
        </div>

        <!-- Damage Red Flash Overlay -->
        <div id="dmg-flash" style="position:absolute; inset:0; background:rgba(255,0,0,0.4); pointer-events:none; opacity:0; transition:opacity .15s;"></div>

        <!-- Battery Health Bar (Pixel Art Style matching reference) -->
        <div id="battery-hud" style="
          position:absolute; bottom:14px; left:16px;
          background:rgba(5, 11, 20, 0.92); border:2px solid #243b55;
          border-radius:10px; padding:8px 14px; display:flex; align-items:center; gap:12px;
          box-shadow:0 4px 16px rgba(0,0,0,0.6);
        ">
          <!-- Pixel Battery Drawing matching user asset -->
          <div style="display:flex; align-items:center;">
            <div style="
              width:70px; height:32px; border:4px solid #1b4320; border-radius:3px;
              background:#a4cca4; position:relative; padding:3px; display:flex; gap:4px;
              box-shadow:inset 0 0 0 1px #274e13, 0 2px 6px rgba(0,0,0,0.5);
              box-sizing:border-box;
            ">
              <div id="bat-seg-1" style="flex:1; background:#38761d; border:1px solid #274e13; border-radius:1px; transition:background .2s;"></div>
              <div id="bat-seg-2" style="flex:1; background:#38761d; border:1px solid #274e13; border-radius:1px; transition:background .2s;"></div>
              <div id="bat-seg-3" style="flex:1; background:#38761d; border:1px solid #274e13; border-radius:1px; transition:background .2s;"></div>
            </div>
            <!-- Battery terminal nipple on right -->
            <div style="width:5px; height:14px; background:#a4cca4; border:3px solid #1b4320; border-left:none; border-radius:0 3px 3px 0; margin-left:-1px;"></div>
          </div>
          <div style="font-family:monospace; font-size:.85rem;">
            <div style="color:#80cbc4; font-size:.7rem; letter-spacing:.05em;">ROVER BATTERY</div>
            <b id="battery-num" style="color:#00e5ff; font-size:1.1rem;">100%</b>
          </div>
        </div>

        <!-- Touch / Mouse Drag Instruction -->
        <div style="
          position:absolute; bottom:14px; right:16px; font-family:monospace;
          font-size:.75rem; color:#80cbc4; background:rgba(5, 11, 20, 0.75);
          padding:6px 10px; border-radius:6px; pointer-events:none;
        ">
          ← → / Drag to Steer
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#cliff-canvas');
  const ctx = canvas.getContext('2d');
  const progressBar = container.querySelector('#drive-progress-bar');
  const timerLabel = container.querySelector('#drive-timer');
  const goBanner = container.querySelector('#go-banner');
  const dmgFlash = container.querySelector('#dmg-flash');
  const batSeg1 = container.querySelector('#bat-seg-1');
  const batSeg2 = container.querySelector('#bat-seg-2');
  const batSeg3 = container.querySelector('#bat-seg-3');
  const batNum = container.querySelector('#battery-num');
  const coordHud = container.querySelector('#rover-coord-hud');

  // Mars route waypoints along scale map:
  // 1st marker: 17.80514, 75.99765 (Sol 0 Base)
  // 2nd marker: 17.93835, 76.19952
  // 3rd marker: 18.08660, 76.87518
  // 4th marker: 18.49316, 77.24322 (Cliff Overlook / Neretva Vallis)
  const ROUTE_MARKERS = [
    { lat: 17.80514, lon: 75.99765 },
    { lat: 17.93835, lon: 76.19952 },
    { lat: 18.08660, lon: 76.87518 },
    { lat: 18.49316, lon: 77.24322 }
  ];

  function getRouteCoordinates(t) {
    if (t <= 0) return ROUTE_MARKERS[0];
    if (t >= 1) return ROUTE_MARKERS[3];
    const c = [0, 0.164, 0.625, 1.0];
    for (let i = 0; i < 3; i++) {
      if (t <= c[i + 1]) {
        const segT = (t - c[i]) / (c[i + 1] - c[i]);
        const p1 = ROUTE_MARKERS[i];
        const p2 = ROUTE_MARKERS[i + 1];
        return {
          lat: p1.lat + (p2.lat - p1.lat) * segT,
          lon: p1.lon + (p2.lon - p1.lon) * segT,
        };
      }
    }
    return ROUTE_MARKERS[3];
  }

  const W = canvas.width;
  const H = canvas.height;

  // Track Road bounds (canyon track in center)
  const ROAD_LEFT = 85;
  const ROAD_RIGHT = W - 85;

  // Rover dimensions and position
  // Constraint: Place rover at bottom 35% of container -> Y = H * (1 - 0.35) = H * 0.65
  const ROVER_FIXED_Y = H * 0.65; // ~403px
  const rover = {
    x: W / 2,
    y: ROVER_FIXED_Y,
    bounceOffset: 0, // dynamic bounce offset in px (bounces down/back upon rock impact)
    shudder: 0,
    w: 36,
    h: 56,
    vx: 0,
    speed: 320, // lateral move speed in px/s
    steerLeft: false,
    steerRight: false,
    targetX: null,
  };

  // Autoscroll speed
  const NORMAL_SPEED = 240;
  let scrollSpeed = NORMAL_SPEED; // px/s
  let terrainOffset = 0;

  // Obstacle arrays
  const rocks = [];
  const potholes = [];
  const cracks = [];
  const dustParticles = [];

  // Spawners
  let spawnTimer = 0;
  let elapsed = 0;
  let running = false;
  let gameOver = false;
  let hitsTaken = 0;

  // --- AUDIO BLIP HELPER ---
  function playBeep(freq = 440, duration = 0.08, type = 'square') {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  // --- UPDATE BATTERY UI (SYNCHRONIZED WITH TOP HUD BATTERY) ---
  function updateBatteryUI() {
    batNum.textContent = Math.max(0, Math.round(battery)) + '%';
    
    // Top HUD battery elements
    const topBatSeg1 = document.getElementById('top-bat-seg-1');
    const topBatSeg2 = document.getElementById('top-bat-seg-2');
    const topBatSeg3 = document.getElementById('top-bat-seg-3');
    const topBatNum = document.getElementById('top-battery-num');
    if (topBatNum) {
      topBatNum.textContent = Math.max(0, Math.round(battery)) + '%';
    }

    const setSegments = (s1, s2, s3, label) => {
      if (!s1 || !s2 || !s3) return;
      if (battery > 60) {
        s1.style.background = '#38761d';
        s2.style.background = '#38761d';
        s3.style.background = '#38761d';
        s1.style.borderColor = '#274e13';
        s2.style.borderColor = '#274e13';
        s3.style.borderColor = '#274e13';
        if (label) label.style.color = '#00e5ff';
      } else if (battery > 25) {
        s1.style.background = '#38761d';
        s2.style.background = '#38761d';
        s3.style.background = 'transparent';
        s1.style.borderColor = '#274e13';
        s2.style.borderColor = '#274e13';
        s3.style.borderColor = 'transparent';
        if (label) label.style.color = '#ffd54f';
      } else if (battery > 0) {
        s1.style.background = '#e65100';
        s2.style.background = 'transparent';
        s3.style.background = 'transparent';
        s1.style.borderColor = '#bf360c';
        s2.style.borderColor = 'transparent';
        s3.style.borderColor = 'transparent';
        if (label) label.style.color = '#ff5722';
      } else {
        s1.style.background = 'transparent';
        s2.style.background = 'transparent';
        s3.style.background = 'transparent';
        s1.style.borderColor = 'transparent';
        s2.style.borderColor = 'transparent';
        s3.style.borderColor = 'transparent';
        if (label) {
          label.style.color = '#f44336';
          label.textContent = '0% DEPLETED';
        }
      }
    };

    setSegments(batSeg1, batSeg2, batSeg3, batNum);
    setSegments(topBatSeg1, topBatSeg2, topBatSeg3, topBatNum);
  }

  let failureTriggered = false;
  let arrivalTriggered = false;

  // --- DAMAGE LOGIC ---
  function takeDamage(reason = 'Rock Collision') {
    hitsTaken++;
    battery = Math.max(0, battery - 40); // 40% drain per hit
    updateBatteryUI();

    // Red screen flash
    dmgFlash.style.opacity = '1';
    setTimeout(() => { dmgFlash.style.opacity = '0'; }, 180);

    // Hit sounds
    playBeep(160, 0.2, 'sawtooth');
    setTimeout(() => playBeep(90, 0.25, 'triangle'), 60);

    // If rock collision, trigger severe slow down and bouncing back animation
    if (reason.includes('Rock')) {
      scrollSpeed = 45; // Slow down sharply upon rock impact
      rover.bounceOffset = 34; // Bounce backward
      rover.shudder = 10;
    }

    // Sparks / debris
    for (let i = 0; i < 18; i++) {
      dustParticles.push({
        x: rover.x,
        y: rover.y + rover.bounceOffset,
        vx: (Math.random() - 0.5) * 280,
        vy: (Math.random() - 0.5) * 280,
        r: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#ff9800' : '#ff5722',
        life: 0.35,
      });
    }

    if (battery <= 0 && running && !failureTriggered) {
      failureTriggered = true;
      running = false;
      setTimeout(() => {
        if (minigameResolve) triggerFailureCutscene(minigameResolve);
      }, 120);
    }
  }

  // --- KEYBOARD & TOUCH CONTROLS ---
  function onKeydown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      rover.steerLeft = true;
      rover.targetX = null;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      rover.steerRight = true;
      rover.targetX = null;
    }
  }
  function onKeyup(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') rover.steerLeft = false;
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rover.steerRight = false;
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const canvasX = (clientX - rect.left) * (W / rect.width);
    rover.targetX = Math.max(ROAD_LEFT + 20, Math.min(ROAD_RIGHT - 20, canvasX));
  }

  window.addEventListener('keydown', onKeydown);
  window.addEventListener('keyup', onKeyup);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('touchmove', onPointerMove, { passive: true });

  // --- SPAWN OBSTACLES & CRACKS ---
  function spawnCycle() {
    const roll = Math.random();

    if (roll < 0.45) {
      // Spawn Rock from Rock sprites.png
      const spIdx = Math.floor(Math.random() * ROCK_SPRITES.length);
      rocks.push({
        x: ROAD_LEFT + 25 + Math.random() * (ROAD_RIGHT - ROAD_LEFT - 50),
        y: -50,
        r: Math.random() * 6 + 17, // Collision radius
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.6,
        sprite: ROCK_SPRITES[spIdx],
      });
    } else if (roll < 0.72) {
      // Spawn Pothole / Crater
      potholes.push({
        x: ROAD_LEFT + 30 + Math.random() * (ROAD_RIGHT - ROAD_LEFT - 60),
        y: -40,
        rx: Math.random() * 8 + 16,
        ry: Math.random() * 6 + 12,
      });
    } else {
      // Spawn highly randomized Crack (rover can pass right through!)
      const crackX = ROAD_LEFT + 25 + Math.random() * (ROAD_RIGHT - ROAD_LEFT - 50);
      const segCount = Math.floor(Math.random() * 5) + 6; // 6 to 10 jagged segments
      const crackLen = Math.random() * 120 + 90; // 90 to 210px
      const segLen = crackLen / segCount;
      const pts = [];
      let curX = 0;
      for (let s = 0; s < segCount; s++) {
        curX += (Math.random() - 0.5) * 24;
        pts.push({ dx: curX, dy: segLen * (s + 1) });
      }

      cracks.push({
        x: crackX,
        y: -crackLen - 20,
        len: crackLen,
        width: Math.random() * 2.5 + 3,
        pts,
        color: Math.random() > 0.4 ? '#180702' : '#220b04',
      });
    }
  }

  // --- INITIAL COUNTDOWN ("Go!") ---
  playBeep(440, 0.12, 'sine');
  setTimeout(() => playBeep(880, 0.25, 'sine'), 300);

  await new Promise((r) => setTimeout(r, 900));
  goBanner.style.opacity = '0';
  goBanner.style.transform = 'translate(-50%, -50%) scale(1.6)';
  setTimeout(() => goBanner.remove(), 400);

  running = true;
  let lastTime = performance.now();
  let animId = null;
  let minigameResolve = null;

  // --- MAIN LOOP ---
  const resultPromise = new Promise((resolve) => {
    minigameResolve = resolve;

    // Secret Konami code hook to skip active cliff climb immediately with 100% battery
    window.__skipActiveMinigame = () => {
      running = false;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('keyup', onKeyup);
      canvas.removeEventListener('pointermove', onPointerMove);
      resolve({
        survived: true,
        finalBattery: 100,
        hitsTaken: 0,
      });
    };

    if (typeof window !== 'undefined' && window.__SECRET_SKIP_ACTIVE) {
      window.__skipActiveMinigame();
      return;
    }

    function gameLoop(now) {
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      if (running) {
        elapsed += dt;

        // Passive battery drain at a rate of 1% a second
        battery = Math.max(0, battery - (1.0 * dt));
        updateBatteryUI();

        // Bounce recovery: rover eases back to normal Y position
        if (rover.bounceOffset > 0) {
          rover.bounceOffset = Math.max(0, rover.bounceOffset - (75 * dt));
        }
        if (rover.shudder > 0) {
          rover.shudder = Math.max(0, rover.shudder - (22 * dt));
        }

        // Reacceleration phase back to regular cruising speed
        if (scrollSpeed < NORMAL_SPEED) {
          scrollSpeed = Math.min(NORMAL_SPEED, scrollSpeed + (115 * dt));
        }

        // Check battery depletion failure
        if (battery <= 0 && !failureTriggered) {
          failureTriggered = true;
          running = false;
          triggerFailureCutscene(resolve);
          return;
        }

        // Update progress bar & timer
        const progressPct = Math.min(100, (elapsed / DURATION) * 100);
        progressBar.style.width = progressPct.toFixed(1) + '%';
        timerLabel.textContent = Math.max(0, Math.ceil(DURATION - elapsed)) + 's';

        // Update live coordinates telemetry HUD interpolating along scale Mars route
        const progressFraction = Math.min(1, Math.max(0, elapsed / DURATION));
        const curCoord = getRouteCoordinates(progressFraction);
        if (coordHud) {
          coordHud.textContent = `LAT: ${curCoord.lat.toFixed(5)}° N | LON: ${curCoord.lon.toFixed(5)}° E`;
        }

        // Check completion (Ending cutscene plays out, then proceeds on click)
        if (elapsed >= DURATION && !arrivalTriggered) {
          arrivalTriggered = true;
          running = false;
          triggerArrivalCutscene(resolve);
          return;
        }

        // Spawn timer
        spawnTimer += dt;
        if (spawnTimer >= 0.85) {
          spawnTimer = 0;
          spawnCycle();
        }

        // --- ROVER STEERING (Free movement; rover can pass right through cracks!) ---
        const currentMinX = ROAD_LEFT + 22;
        const currentMaxX = ROAD_RIGHT - 22;

        if (rover.targetX !== null) {
          // Smooth move toward pointer target
          const dx = rover.targetX - rover.x;
          rover.x += Math.sign(dx) * Math.min(Math.abs(dx), rover.speed * dt);
        } else {
          // Keyboard steer
          if (rover.steerLeft) rover.x -= rover.speed * dt;
          if (rover.steerRight) rover.x += rover.speed * dt;
        }

        // Clamp inside road boundaries
        rover.x = Math.max(currentMinX, Math.min(currentMaxX, rover.x));

        // Constrain vertically strictly at bottom 35%
        rover.y = ROVER_FIXED_Y;

        // --- SCROLL TERRAIN & OBSTACLES ---
        terrainOffset = (terrainOffset + scrollSpeed * dt) % 80;

        // Move Rocks
        for (let i = rocks.length - 1; i >= 0; i--) {
          const rk = rocks[i];
          rk.y += scrollSpeed * dt;
          rk.rot += rk.rotSpeed * dt;

          // Collision detection with rover box
          const currentRoverY = ROVER_FIXED_Y + rover.bounceOffset;
          const dist = Math.hypot(rover.x - rk.x, currentRoverY - rk.y);
          if (dist < rk.r + 18) {
            takeDamage('Rock Impact');
            rocks.splice(i, 1);
            continue;
          }

          if (rk.y > H + 50) rocks.splice(i, 1);
        }

        // Move Potholes
        for (let i = potholes.length - 1; i >= 0; i--) {
          const ph = potholes[i];
          ph.y += scrollSpeed * dt;

          const dist = Math.hypot(rover.x - ph.x, rover.y - ph.y);
          if (dist < ph.rx + 14) {
            takeDamage('Pothole G-Shock');
            potholes.splice(i, 1);
            continue;
          }

          if (ph.y > H + 50) potholes.splice(i, 1);
        }

        // Move Cracks
        for (let i = cracks.length - 1; i >= 0; i--) {
          const cr = cracks[i];
          cr.y += scrollSpeed * dt;
          if (cr.y > H + 100) cracks.splice(i, 1);
        }

        // Update dust particles
        for (let i = dustParticles.length - 1; i >= 0; i--) {
          const p = dustParticles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) dustParticles.splice(i, 1);
        }
      }

      // RENDER
      renderCanvas();
      animId = requestAnimationFrame(gameLoop);
    }

    animId = requestAnimationFrame(gameLoop);
  });

  // --- RENDER FUNCTION ---
  function renderCanvas() {
    const c = ctx;

    // 1. Canyon canyon rock walls (Left & Right)
    c.fillStyle = '#4a2517';
    c.fillRect(0, 0, W, H);

    // Track surface (Martian regolith)
    c.fillStyle = '#9e472a';
    c.fillRect(ROAD_LEFT, 0, ROAD_RIGHT - ROAD_LEFT, H);

    // Track tire ruts / lines scrolling down
    c.strokeStyle = '#85371c';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(ROAD_LEFT + 70, 0);
    c.lineTo(ROAD_LEFT + 70, H);
    c.moveTo(ROAD_RIGHT - 70, 0);
    c.lineTo(ROAD_RIGHT - 70, H);
    c.stroke();

    // Canyon wall jagged shadows
    c.fillStyle = '#34190e';
    for (let y = -80; y < H + 80; y += 40) {
      const py = y + terrainOffset;
      c.beginPath();
      c.moveTo(ROAD_LEFT, py);
      c.lineTo(ROAD_LEFT - 30, py + 20);
      c.lineTo(ROAD_LEFT, py + 40);
      c.fill();

      c.beginPath();
      c.moveTo(ROAD_RIGHT, py);
      c.lineTo(ROAD_RIGHT + 30, py + 20);
      c.lineTo(ROAD_RIGHT, py + 40);
      c.fill();
    }

    // 2. Draw Potholes / Impact Craters
    potholes.forEach((ph) => {
      // Outer crater rim shadow
      c.fillStyle = '#7a3118';
      c.beginPath();
      c.ellipse(ph.x, ph.y, ph.rx + 3, ph.ry + 2, 0, 0, Math.PI * 2);
      c.fill();
      // Inner deep hole
      c.fillStyle = '#2d1108';
      c.beginPath();
      c.ellipse(ph.x, ph.y, ph.rx, ph.ry, 0, 0, Math.PI * 2);
      c.fill();
    });

    // 3. Draw Cracks (Randomized terrain fissures — rover passes right through)
    cracks.forEach((cr) => {
      c.save();
      c.strokeStyle = cr.color || '#1b0802';
      c.lineWidth = cr.width || 4;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(cr.x, cr.y);
      if (cr.pts && cr.pts.length) {
        cr.pts.forEach((pt) => {
          c.lineTo(cr.x + pt.dx, cr.y + pt.dy);
        });
      } else {
        c.lineTo(cr.x, cr.y + cr.len);
      }
      c.stroke();

      // Subtle edge highlight
      c.strokeStyle = 'rgba(140, 50, 25, 0.4)';
      c.lineWidth = 1;
      c.stroke();
      c.restore();
    });

    // 4. Draw Rocks using Rock sprites.png
    rocks.forEach((rk) => {
      c.save();
      c.translate(rk.x, rk.y);

      // Boulder ground shadow
      c.fillStyle = 'rgba(25, 8, 4, 0.55)';
      c.beginPath();
      c.ellipse(2, 5, rk.r * 1.05, rk.r * 0.75, 0, 0, Math.PI * 2);
      c.fill();

      if (rockImgReady && rk.sprite) {
        const sp = rk.sprite;
        const drawW = rk.r * 2.3;
        const drawH = drawW * (sp.sh / sp.sw);
        c.drawImage(rockImg, sp.sx, sp.sy, sp.sw, sp.sh, -drawW / 2, -drawH / 2, drawW, drawH);
      } else {
        c.fillStyle = '#4e342e';
        c.beginPath();
        c.arc(0, 0, rk.r, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#6d4c41';
        c.lineWidth = 2;
        c.stroke();
      }
      c.restore();
    });

    const currentRoverY = ROVER_FIXED_Y + rover.bounceOffset + (rover.shudder > 0 ? (Math.random() - 0.5) * rover.shudder : 0);

    // 5. Draw Headlight Beams casting forward from rover
    c.save();
    const beamGrad = c.createLinearGradient(rover.x, currentRoverY, rover.x, currentRoverY - 180);
    beamGrad.addColorStop(0, 'rgba(255, 238, 150, 0.45)');
    beamGrad.addColorStop(1, 'rgba(255, 238, 150, 0)');
    c.fillStyle = beamGrad;
    c.beginPath();
    c.moveTo(rover.x - 14, currentRoverY - 20);
    c.lineTo(rover.x - 55, currentRoverY - 180);
    c.lineTo(rover.x + 55, currentRoverY - 180);
    c.lineTo(rover.x + 14, currentRoverY - 20);
    c.fill();
    c.restore();

    // 6. Draw Rover (with bounce offset & shudder from rock impacts)
    drawRover(c, rover.x, currentRoverY);

    // 7. Draw Dust / Spark Particles
    dustParticles.forEach((p) => {
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      c.fill();
    });
  }

  // Draw Top-down Space Rover
  function drawRover(c, rx, ry) {
    c.save();
    c.translate(rx, ry);

    // Rover chassis shadow
    c.fillStyle = 'rgba(10, 4, 2, 0.6)';
    c.fillRect(-22, -26, 44, 56);

    // 4 Heavy-duty Martian Cleat Wheels
    c.fillStyle = '#212121';
    // Front wheels
    c.fillRect(-25, -24, 8, 16);
    c.fillRect(17, -24, 8, 16);
    // Rear wheels
    c.fillRect(-25, 12, 8, 16);
    c.fillRect(17, 12, 8, 16);

    // Wheel hubs (gold metallic)
    c.fillStyle = '#ffb300';
    c.fillRect(-23, -19, 4, 6);
    c.fillRect(19, -19, 4, 6);
    c.fillRect(-23, 17, 4, 6);
    c.fillRect(19, 17, 4, 6);

    // Main pressurized cabin body (White & Teal NASA livery)
    c.fillStyle = '#eceff1';
    c.fillRect(-17, -26, 34, 52);
    c.strokeStyle = '#90a4ae';
    c.lineWidth = 1.5;
    c.strokeRect(-17, -26, 34, 52);

    // Front windshield visor (dark tinted cyan)
    c.fillStyle = '#006064';
    c.beginPath();
    c.roundRect(-13, -23, 26, 12, 3);
    c.fill();

    // Roof solar panel array
    c.fillStyle = '#0d47a1';
    c.fillRect(-12, -7, 24, 22);
    c.strokeStyle = '#42a5f5';
    c.lineWidth = 1;
    c.strokeRect(-12, -7, 24, 22);

    // Antenna dish mount
    c.fillStyle = '#ff7043';
    c.beginPath();
    c.arc(6, 20, 3, 0, Math.PI * 2);
    c.fill();

    // Twin Headlight lenses
    c.fillStyle = '#fff59d';
    c.fillRect(-14, -27, 5, 2);
    c.fillRect(9, -27, 5, 2);

    c.restore();
  }

  // --- ARRIVAL CUTSCENE: PLAYS OUT CUTSCENE, PROCEEDS ON CLICK ---
  function triggerArrivalCutscene(resolve) {
    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('keyup', onKeyup);
    canvas.removeEventListener('pointermove', onPointerMove);

    // Rover comes to a parked stop at overlook
    scrollSpeed = 0;
    rover.bounceOffset = 0;
    rover.shudder = 0;

    let cutsceneTime = 0;
    const cutsceneDuration = 2.4; // 2.4 seconds walk
    let astroX = rover.x;
    let astroY = rover.y - 12;
    const footprints = [];
    let cutsceneFinished = false;

    playBeep(320, 0.3, 'sine');
    setTimeout(() => playBeep(640, 0.4, 'sine'), 250);

    function cutsceneLoop(now) {
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;
      cutsceneTime += dt;

      renderCanvas();
      const c = ctx;

      // Draw footprints left on Mars regolith
      footprints.forEach((fp) => {
        c.fillStyle = '#6d2e18';
        c.beginPath();
        c.ellipse(fp.x, fp.y, 3, 5, fp.rot || 0, 0, Math.PI * 2);
        c.fill();
      });

      // Astronaut steps out and walks forward toward overlook
      if (cutsceneTime < cutsceneDuration) {
        const walkDt = dt * 30;
        astroY -= walkDt;

        if (Math.floor(cutsceneTime * 6) % 2 === 0) {
          if (footprints.length === 0 || Math.hypot(footprints[footprints.length - 1].x - astroX, footprints[footprints.length - 1].y - astroY) > 8) {
            footprints.push({ x: astroX + (footprints.length % 2 === 0 ? -4 : 4), y: astroY + 8 });
          }
        }
      }

      // Draw Astronaut in EVA suit
      c.save();
      c.translate(astroX, astroY);
      c.fillStyle = '#cfd8dc';
      c.fillRect(-8, 3, 16, 7);
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.ellipse(0, 0, 9, 8, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#90a4ae';
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = '#ffd54f';
      c.beginPath();
      c.ellipse(0, -3, 6, 4, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#b78103';
      c.lineWidth = 1;
      c.stroke();
      c.restore();

      // Cutscene Overlook HUD Banner
      c.fillStyle = 'rgba(5, 11, 20, 0.9)';
      c.fillRect(W / 2 - 250, 30, 500, 56);
      c.strokeStyle = '#00bcd4';
      c.lineWidth = 2;
      c.strokeRect(W / 2 - 250, 30, 500, 56);

      c.textAlign = 'center';
      c.fillStyle = '#00e5ff';
      c.font = 'bold 16px ui-monospace, monospace';
      c.fillText('🏁 JEZERO CLIFF OVERLOOK REACHED', W / 2, 54);

      c.fillStyle = '#7dff9a';
      c.font = '13px ui-monospace, monospace';
      c.fillText('Pressurization Nominal • Player Stepped Out onto Rim', W / 2, 73);

      if (cutsceneTime < cutsceneDuration) {
        requestAnimationFrame(cutsceneLoop);
      } else {
        // Cutscene finished playing out!
        // DO NOT AUTOPROCEED — PROCEED TO NEXT STAGE ON CLICK
        cutsceneFinished = true;
        promptProceedOnClick();
      }
    }

    function promptProceedOnClick() {
      if (document.querySelector('#arrival-click-overlay')) return;

      const clickOverlay = document.createElement('div');
      clickOverlay.id = 'arrival-click-overlay';
      clickOverlay.style.cssText = `
        position: absolute; inset: 0; z-index: 40;
        background: rgba(5, 12, 22, 0.45);
        display: flex; flex-direction: column;
        align-items: center; justify-content: flex-end;
        cursor: pointer; animation: fade-in .3s ease-out;
        border-radius: 10px; padding: 30px;
      `;
      clickOverlay.innerHTML = `
        <button id="btn-egress-click" style="
          background: linear-gradient(135deg, #00897b, #004d40);
          border: 2px solid #00e5ff;
          color: #ffffff; border-radius: 28px;
          padding: 14px 34px; font-family: ui-monospace, monospace;
          font-size: 1.05rem; font-weight: 800; cursor: pointer;
          box-shadow: 0 0 24px rgba(0, 229, 255, 0.55);
          transition: transform .15s, background .2s;
        ">
          👉 CLICK TO PROCEED TO NERETVA VALLIS
        </button>
        <div style="margin-top:10px; font-family:monospace; font-size:.8rem; color:#4dd0e1; text-shadow:0 1px 3px #000;">
          (Rover parked at canyon overlook • Click anywhere to advance)
        </div>
      `;

      canvas.parentElement.appendChild(clickOverlay);

      const doAdvance = () => {
        clickOverlay.remove();
        cancelAnimationFrame(animId);
        resolve({
          survived: battery > 0,
          finalBattery: Math.round(battery),
          hitsTaken,
        });
      };

      clickOverlay.onclick = doAdvance;
      canvas.onclick = doAdvance;
      window.__skipActiveCutscene = doAdvance;

      if (typeof window !== 'undefined' && window.__SECRET_SKIP_ACTIVE) {
        doAdvance();
      }
    }

    // Support instant skip via Konami code
    window.__skipActiveCutscene = () => {
      cancelAnimationFrame(animId);
      resolve({
        survived: battery > 0,
        finalBattery: Math.round(battery),
        hitsTaken,
      });
    };

    // Begin cutscene loop immediately
    requestAnimationFrame(cutsceneLoop);
  }

  // --- FAILURE CUTSCENE: OCCURS ON CLICK ---
  function triggerFailureCutscene(resolve) {
    failureTriggered = true;
    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('keyup', onKeyup);
    canvas.removeEventListener('pointermove', onPointerMove);

    scrollSpeed = 0;
    rover.bounceOffset = 0;
    renderCanvas();

    const failOverlay = document.createElement('div');
    failOverlay.id = 'fail-click-overlay';
    failOverlay.style.cssText = `
      position: absolute; inset: 0; z-index: 40;
      background: rgba(25, 4, 4, 0.85);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      cursor: pointer; animation: fade-in .3s ease-out;
      border-radius: 10px; padding: 20px;
    `;
    failOverlay.innerHTML = `
      <div style="font-family:ui-monospace,monospace; font-size:1.2rem; color:#ff5252; font-weight:800; margin-bottom:10px; letter-spacing:.05em; text-align:center;">
        ⚠️ ROVER POWER DRAINED — CRITICAL STALL
      </div>
      <div style="color:#ffccbc; font-family:system-ui,sans-serif; font-size:.92rem; margin-bottom:18px; text-align:center; max-width:440px;">
        Battery depleted after terrain collisions. Manual emergency winch recovery required.
      </div>
      <button id="btn-recovery-click" style="
        background: linear-gradient(135deg, #b71c1c, #7f0000);
        border: 2px solid #ff5252;
        color: #ffffff; border-radius: 24px;
        padding: 12px 28px; font-family: ui-monospace, monospace;
        font-size: 1rem; font-weight: 700; cursor: pointer;
        box-shadow: 0 0 20px rgba(255, 82, 82, 0.45);
        transition: transform .15s, background .2s;
      ">
        👉 CLICK FOR EMERGENCY WINCH RECOVERY
      </button>
      <div style="margin-top:10px; font-family:monospace; font-size:.75rem; color:#ff8a80; opacity:.8;">
        (Click anywhere to advance to next section)
      </div>
    `;

    canvas.parentElement.appendChild(failOverlay);

    let failStarted = false;
    function startRecovery() {
      if (failStarted) return;
      failStarted = true;
      failOverlay.remove();

      cancelAnimationFrame(animId);
      resolve({
        survived: false,
        finalBattery: 0,
        hitsTaken,
        penaltyApplied: true,
      });
    }

    failOverlay.onclick = startRecovery;
    canvas.onclick = startRecovery;
    window.__skipActiveCutscene = startRecovery;

    if (typeof window !== 'undefined' && window.__SECRET_SKIP_ACTIVE) {
      startRecovery();
    }
  }

  const finalResult = await resultPromise;
  window.__skipActiveMinigame = null;
  window.__skipActiveCutscene = null;
  return finalResult;
}

// minigames/cliff-climb.js — Cliff-Face Rover Climbing Autoscroller
// Target duration: 60 seconds (1 minute).
// Features:
// - Top-down abstracted space rover constrained vertically at bottom 35% of container
// - Autoscrolling Martian canyon terrain
// - Obstacles: Rocks & potholes (deal 40% battery damage per hit, max 2 hits)
// - Cracks: Jagged terrain fissures that act as physical lateral barriers limiting rover steering range
// - Passive battery drain over time + segmented pixel battery visualization
// - "Go!" countdown start
// - Ending Cutscene: Rover parks, hatch opens, astronaut steps out onto Martian soil leaving footprints

import { DadPhone } from '../shared/dadphone.js';

const DEG2RAD = Math.PI / 180;

/**
 * Mount and run the Cliff-Face Rover Climbing Game
 * @param {HTMLElement} container - DOM parent to render into
 * @param {Object} opts - { durationSec: 60, initialBattery: 100 }
 * @returns {Promise<{ survived: boolean, finalBattery: number, hitsTaken: number }>}
 */
export async function mountCliffClimb(container, opts = {}) {
  const DURATION = opts.durationSec || 60;
  // Ensure rover battery starts at 100% (or base power scaled to full capacity, allowing 2 hits max before critical drain)
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
        <span>LAT: 18.97° N | LON: 77.60° E</span>
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
    w: 36,
    h: 56,
    vx: 0,
    speed: 320, // lateral move speed in px/s
    steerLeft: false,
    steerRight: false,
    targetX: null,
  };

  // Autoscroll speed
  let scrollSpeed = 240; // px/s
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

  // --- UPDATE BATTERY UI ---
  function updateBatteryUI() {
    batNum.textContent = Math.max(0, Math.round(battery)) + '%';
    
    // 3 Segment logic matching retro pixel green palette
    if (battery > 60) {
      batSeg1.style.background = '#38761d';
      batSeg2.style.background = '#38761d';
      batSeg3.style.background = '#38761d';
      batSeg1.style.borderColor = '#274e13';
      batSeg2.style.borderColor = '#274e13';
      batSeg3.style.borderColor = '#274e13';
      batNum.style.color = '#00e5ff';
    } else if (battery > 25) {
      // 1 hit taken (down by 40%): 2 segments remaining
      batSeg1.style.background = '#38761d';
      batSeg2.style.background = '#38761d';
      batSeg3.style.background = 'transparent';
      batSeg1.style.borderColor = '#274e13';
      batSeg2.style.borderColor = '#274e13';
      batSeg3.style.borderColor = 'transparent';
      batNum.style.color = '#ffd54f';
    } else if (battery > 0) {
      // 2 hits taken (critical battery): 1 segment remaining in warning orange
      batSeg1.style.background = '#e65100';
      batSeg2.style.background = 'transparent';
      batSeg3.style.background = 'transparent';
      batSeg1.style.borderColor = '#bf360c';
      batSeg2.style.borderColor = 'transparent';
      batSeg3.style.borderColor = 'transparent';
      batNum.style.color = '#ff5722';
    } else {
      // Battery depleted (critical failure)
      batSeg1.style.background = 'transparent';
      batSeg2.style.background = 'transparent';
      batSeg3.style.background = 'transparent';
      batSeg1.style.borderColor = 'transparent';
      batSeg2.style.borderColor = 'transparent';
      batSeg3.style.borderColor = 'transparent';
      batNum.style.color = '#f44336';
      batNum.textContent = '0% DEPLETED';
    }
  }

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

    // Sparks / debris
    for (let i = 0; i < 16; i++) {
      dustParticles.push({
        x: rover.x,
        y: rover.y,
        vx: (Math.random() - 0.5) * 280,
        vy: (Math.random() - 0.5) * 280,
        r: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#ff9800' : '#ff5722',
        life: 0.35,
      });
    }

    if (battery <= 0 && running) {
      running = false;
      setTimeout(() => {
        if (minigameResolve) triggerFailureCutscene(minigameResolve);
      }, 150);
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

    if (roll < 0.42) {
      // Spawn Rock
      rocks.push({
        x: ROAD_LEFT + 25 + Math.random() * (ROAD_RIGHT - ROAD_LEFT - 50),
        y: -40,
        r: Math.random() * 8 + 14,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 3,
        color: Math.random() > 0.5 ? '#5d4037' : '#3e2723',
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
      // Spawn Crack (Longitudinal Fissure that divides or pinches the road)
      const crackSide = Math.random() > 0.5 ? 'left' : 'right';
      const crackX = crackSide === 'left'
        ? ROAD_LEFT + 40 + Math.random() * 90
        : ROAD_RIGHT - 40 - Math.random() * 90;
      
      cracks.push({
        x: crackX,
        y: -140,
        len: Math.random() * 80 + 160,
        side: crackSide, // limits motion from this side
        jaggedPts: [-10, 8, -6, 12, -4, 6],
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
    function gameLoop(now) {
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      if (running) {
        elapsed += dt;

        // Passive battery drain over time (~0.28% per second)
        battery = Math.max(0, battery - (0.28 * dt));
        updateBatteryUI();

        // Check battery depletion failure
        if (battery <= 0) {
          running = false;
          triggerFailureCutscene(resolve);
          return;
        }

        // Update progress bar & timer
        const progressPct = Math.min(100, (elapsed / DURATION) * 100);
        progressBar.style.width = progressPct.toFixed(1) + '%';
        timerLabel.textContent = Math.max(0, Math.ceil(DURATION - elapsed)) + 's';

        // Check completion
        if (elapsed >= DURATION) {
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

        // --- ROVER STEERING ---
        let currentMinX = ROAD_LEFT + 22;
        let currentMaxX = ROAD_RIGHT - 22;

        // Check active cracks near rover Y that constrain lateral range
        for (let i = 0; i < cracks.length; i++) {
          const cr = cracks[i];
          if (rover.y >= cr.y && rover.y <= cr.y + cr.len) {
            if (cr.side === 'left') {
              // Crack is on the left: cannot steer to the left of this crack!
              currentMinX = Math.max(currentMinX, cr.x + 22);
            } else {
              // Crack is on the right: cannot steer to the right of this crack!
              currentMaxX = Math.min(currentMaxX, cr.x - 22);
            }
          }
        }

        if (rover.targetX !== null) {
          // Smooth move toward pointer target
          const dx = rover.targetX - rover.x;
          rover.x += Math.sign(dx) * Math.min(Math.abs(dx), rover.speed * dt);
        } else {
          // Keyboard steer
          if (rover.steerLeft) rover.x -= rover.speed * dt;
          if (rover.steerRight) rover.x += rover.speed * dt;
        }

        // Clamp inside dynamically constrained bounds
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
          const dist = Math.hypot(rover.x - rk.x, rover.y - rk.y);
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

    // 3. Draw Cracks (Fissures that constrain movement)
    cracks.forEach((cr) => {
      c.strokeStyle = '#1b0802';
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(cr.x, cr.y);
      for (let j = 0; j < cr.jaggedPts.length; j += 2) {
        c.lineTo(cr.x + cr.jaggedPts[j], cr.y + (cr.len / 3) * (j / 2 + 1));
      }
      c.lineTo(cr.x, cr.y + cr.len);
      c.stroke();

      // Warning hazard boundary indicator along crack
      c.strokeStyle = 'rgba(255, 152, 0, 0.45)';
      c.lineWidth = 1.5;
      c.setLineDash([6, 6]);
      c.beginPath();
      c.moveTo(cr.x + (cr.side === 'left' ? 14 : -14), cr.y);
      c.lineTo(cr.x + (cr.side === 'left' ? 14 : -14), cr.y + cr.len);
      c.stroke();
      c.setLineDash([]);
    });

    // 4. Draw Rocks / Boulders
    rocks.forEach((rk) => {
      c.save();
      c.translate(rk.x, rk.y);
      c.rotate(rk.rot);
      // Boulder shadow
      c.fillStyle = '#261007';
      c.beginPath();
      c.ellipse(3, 4, rk.r, rk.r * 0.8, 0, 0, Math.PI * 2);
      c.fill();
      // Boulder body
      c.fillStyle = rk.color;
      c.beginPath();
      c.arc(0, 0, rk.r, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#8d6e63';
      c.lineWidth = 2;
      c.stroke();
      c.restore();
    });

    // 5. Draw Headlight Beams casting forward from rover
    c.save();
    const beamGrad = c.createLinearGradient(rover.x, rover.y, rover.x, rover.y - 180);
    beamGrad.addColorStop(0, 'rgba(255, 238, 150, 0.45)');
    beamGrad.addColorStop(1, 'rgba(255, 238, 150, 0)');
    c.fillStyle = beamGrad;
    c.beginPath();
    c.moveTo(rover.x - 14, rover.y - 20);
    c.lineTo(rover.x - 55, rover.y - 180);
    c.lineTo(rover.x + 55, rover.y - 180);
    c.lineTo(rover.x + 14, rover.y - 20);
    c.fill();
    c.restore();

    // 6. Draw Rover (Top-Down Abstracted Space Rover)
    drawRover(c, rover.x, rover.y);

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

  // --- ARRIVAL CUTSCENE: ROVER PARKS & PLAYER STEPS OUT ---
  function triggerArrivalCutscene(resolve) {
    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('keyup', onKeyup);
    canvas.removeEventListener('pointermove', onPointerMove);

    // Cutscene state
    let cutsceneTime = 0;
    const cutsceneDuration = 4.2; // 4.2 seconds
    let astroX = rover.x;
    let astroY = rover.y - 12;
    const footprints = [];

    playBeep(320, 0.3, 'sine');
    setTimeout(() => playBeep(640, 0.4, 'sine'), 250);

    function cutsceneLoop(now) {
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;
      cutsceneTime += dt;

      // Decelerate scrolling to 0
      scrollSpeed = Math.max(0, scrollSpeed - (400 * dt));
      terrainOffset = (terrainOffset + scrollSpeed * dt) % 80;

      // Render base scene
      renderCanvas();

      const c = ctx;

      // Draw footprints left on Mars regolith
      footprints.forEach((fp) => {
        c.fillStyle = '#6d2e18';
        c.beginPath();
        c.ellipse(fp.x, fp.y, 3, 5, fp.rot || 0, 0, Math.PI * 2);
        c.fill();
      });

      // After rover stops completely, astronaut emerges and steps out
      if (cutsceneTime > 1.2) {
        const walkDt = dt * 26;
        astroY -= walkDt; // steps forward toward overlook

        if (Math.floor(cutsceneTime * 6) % 2 === 0) {
          if (footprints.length === 0 || Math.hypot(footprints[footprints.length - 1].x - astroX, footprints[footprints.length - 1].y - astroY) > 8) {
            footprints.push({ x: astroX + (footprints.length % 2 === 0 ? -4 : 4), y: astroY + 8 });
          }
        }

        // Draw Astronaut in EVA suit (Top-Down view)
        c.save();
        c.translate(astroX, astroY);

        // EVA backpack (life support PLSS)
        c.fillStyle = '#cfd8dc';
        c.fillRect(-8, 3, 16, 7);

        // EVA suit shoulders/body (White)
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.ellipse(0, 0, 9, 8, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#90a4ae';
        c.lineWidth = 1;
        c.stroke();

        // Helmet & Gold Visor
        c.fillStyle = '#ffd54f';
        c.beginPath();
        c.ellipse(0, -3, 6, 4, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#b78103';
        c.lineWidth = 1;
        c.stroke();

        c.restore();
      }

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
      c.fillText('Rover Parked • Pressurization Nominal • Player Ingressing Surface', W / 2, 73);

      if (cutsceneTime < cutsceneDuration) {
        requestAnimationFrame(cutsceneLoop);
      } else {
        cancelAnimationFrame(animId);
        resolve({
          survived: battery > 0,
          finalBattery: Math.round(battery),
          hitsTaken,
        });
      }
    }

    requestAnimationFrame(cutsceneLoop);
  }

  // --- FAILURE CUTSCENE: ROVER STALLS ON CLIFF & EMERGENCY EVA COMMENCES ---
  function triggerFailureCutscene(resolve) {
    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('keyup', onKeyup);
    canvas.removeEventListener('pointermove', onPointerMove);

    let cutsceneTime = 0;
    const cutsceneDuration = 4.2;
    let astroX = rover.x;
    let astroY = rover.y - 12;
    const footprints = [];
    const smokePuffs = [];

    playBeep(180, 0.4, 'sawtooth');
    setTimeout(() => playBeep(110, 0.5, 'triangle'), 300);

    function failLoop(now) {
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;
      cutsceneTime += dt;

      // Rapidly grind to a halt
      scrollSpeed = Math.max(0, scrollSpeed - (550 * dt));
      terrainOffset = (terrainOffset + scrollSpeed * dt) % 80;

      // Billow smoke from dead battery unit
      if (cutsceneTime < 3.2 && Math.random() < 0.5) {
        smokePuffs.push({
          x: rover.x + (Math.random() - 0.5) * 20,
          y: rover.y - 18,
          vx: (Math.random() - 0.5) * 35,
          vy: -Math.random() * 50 - 20,
          r: Math.random() * 6 + 4,
          alpha: 0.75,
        });
      }

      // Update smoke
      for (let i = smokePuffs.length - 1; i >= 0; i--) {
        const s = smokePuffs[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.alpha -= dt * 0.38;
        s.r += dt * 7;
        if (s.alpha <= 0) smokePuffs.splice(i, 1);
      }

      renderCanvas();
      const c = ctx;

      // Render smoke particles
      smokePuffs.forEach((s) => {
        c.fillStyle = `rgba(180, 150, 140, ${Math.max(0, s.alpha)})`;
        c.beginPath();
        c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        c.fill();
      });

      // Render footprints
      footprints.forEach((fp) => {
        c.fillStyle = '#6d2e18';
        c.beginPath();
        c.ellipse(fp.x, fp.y, 3, 5, 0, 0, Math.PI * 2);
        c.fill();
      });

      // Astronaut emerges to begin emergency manual winch & inspection
      if (cutsceneTime > 1.2) {
        const walkDt = dt * 22;
        astroY -= walkDt;

        if (Math.floor(cutsceneTime * 6) % 2 === 0) {
          if (footprints.length === 0 || Math.hypot(footprints[footprints.length - 1].x - astroX, footprints[footprints.length - 1].y - astroY) > 8) {
            footprints.push({ x: astroX + (footprints.length % 2 === 0 ? -4 : 4), y: astroY + 8 });
          }
        }

        // Astronaut in EVA suit
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
        c.fillStyle = '#ffab40';
        c.beginPath();
        c.ellipse(0, -3, 6, 4, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();
      }

      // Failure HUD Alert Banner
      c.fillStyle = 'rgba(25, 4, 4, 0.94)';
      c.fillRect(W / 2 - 250, 26, 500, 64);
      c.strokeStyle = '#f44336';
      c.lineWidth = 2;
      c.strokeRect(W / 2 - 250, 26, 500, 64);

      c.textAlign = 'center';
      c.fillStyle = '#ff5252';
      c.font = 'bold 15px ui-monospace, monospace';
      c.fillText('⚠️ ROVER POWER DRAINED — CRITICAL STALL', W / 2, 50);

      c.fillStyle = '#ffccbc';
      c.font = '12px ui-monospace, monospace';
      c.fillText('Emergency Manual Winch Required • Life Support Penalty Incurred', W / 2, 70);

      if (cutsceneTime < cutsceneDuration) {
        requestAnimationFrame(failLoop);
      } else {
        cancelAnimationFrame(animId);
        resolve({
          survived: false,
          finalBattery: 0,
          hitsTaken,
          penaltyApplied: true,
        });
      }
    }

    requestAnimationFrame(failLoop);
  }

  const finalResult = await resultPromise;
  return finalResult;
}

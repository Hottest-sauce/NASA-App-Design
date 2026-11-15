// minigames/solar-alignment.js
// Exports mountSolarAlignment(container, opts) → Promise<result>
// Features:
// 1. Ray strictly from solar panel pole center (P.x, P.y) to Sun circle center (S.x, S.y)
// 2. Sensor bulb gradients from cold silver to radiant incandescent gold as alignment approaches 1.0
// 3. Power level visually surges as aim nears Sun, then rapidly decays back to 0% when misaligned
// 4. Power & score rate strictly relative to cosine angular proximity (al^2 and al^3)
// 5. Two auxiliary panels (left & right). When game finishes, a cutscene animates them rotating to match the main panel's aim!

import { DadPhone } from '../shared/dadphone.js';

const R = Math.PI / 180;
const CFG = {
  seconds: 15,
  speed: 60,
  limit: 75,
  lockAt: 0.95,
  dropAt: 0.85,
  lockSecs: 5,
  pointsPerSec: 12,
  pointsPerPower: 25,
  maxPower: 500,
  failThreshold: 50,
};

const svgMarkup = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120'><rect width='200' height='120' fill='#0d1b2a'/><circle cx='30' cy='25' r='12' fill='#ffd24d'/><g stroke='#ffd24d' stroke-width='2' stroke-dasharray='4 3'><line x1='40' y1='31' x2='108' y2='70'/><line x1='34' y1='37' x2='102' y2='76'/></g><rect x='85' y='72' width='60' height='8' fill='#1d3f8a' stroke='#8fb4ff' transform='rotate(120 115 76)'/><text x='14' y='112' fill='#cfe' font-size='10' font-family='sans-serif'>rays hit head-on = max power</text></svg>";
const DIAGRAM = 'data:image/svg+xml,' + encodeURIComponent(svgMarkup);

const INTRO = [
  'Hey kiddo, it\u2019s Dad! Solar panels generate power from the sun, so we need to make sure they get lots of sunlight!',
  'The panel swings back and forth. Click, tap or press Space to flip direction. The \u2190 and \u2192 keys pick a direction too.',
  'Watch the sensor bulb glow gold and the power meter surge as you point toward the Sun! If you drift away, power drops back to 0%.',
  'Lock on for 4 seconds for a \u00d72 BONUS. You have 20 seconds. Align the array!',
];
const OUTRO = [
  'Great job, kiddo! And here\u2019s the cool part: scientists do this exact same thing in real life, just without clicking.',
  { text: 'A solar panel makes the most power when sunlight hits it straight on. Tilted away, the same sunlight spreads over more area, so every bit of panel gets less.', image: DIAGRAM, caption: 'Head-on rays = most power' },
  'The Sun moves across the sky, so engineers either turn panels with motors or pick a smart fixed angle. The International Space Station\u2019s big solar wings rotate to keep facing the Sun as it orbits.',
  'To know where to aim, spacecraft can use sun sensors. Scientists can also calculate the Sun\u2019s position from the date, the time and the spot on the planet. That\u2019s how NASA plans for Mars.',
  'Mars has another problem: dust. It settles on panels and blocks light. The Spirit and Opportunity rovers sometimes got a free cleaning when the wind blew it off.',
  'And sunlight on Mars is less than half as strong as on Earth, so every bit of aiming counts. Hold down the fort!',
];
const FAIL_LINES = [
  'Uh oh, kiddo... the panels barely caught any sunlight, and running the orientation motor drained our stored energy.',
  'We couldn\'t lock on in time, so the base is taking a -15% power penalty. We have to push ahead with what we have!',
];

const SG_CSS = `
.sg{display:flex;gap:12px;max-width:920px;margin:0 auto;font-family:system-ui,sans-serif}
.sg-meter{width:68px;display:flex;flex-direction:column;align-items:center;gap:6px;font-weight:700;color:#22b455}
.sg-meter small{font-size:.65rem;letter-spacing:.1em}
.sg-tube{flex:1;width:38px;min-height:260px;border:3px solid #22b455;border-radius:10px;background:#061209;position:relative;overflow:hidden;box-shadow:inset 0 0 12px rgba(0,0,0,0.8)}
.sg-fill{position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(0deg,#1f9d4d,#7dff9a);transition:height .08s ease-out;box-shadow:0 0 10px #7dff9a88}
.sg-fill.gold{background:linear-gradient(0deg,#d49a00,#ffe066);box-shadow:0 0 18px #ffd24d}
.sg-fill.fail{background:linear-gradient(0deg,#b71c1c,#ff5252);border-color:#b71c1c}
.sg-stage{position:relative;flex:1;min-width:0}
.sg canvas{width:100%;height:auto;display:block;border:3px solid #1a365d;border-radius:10px;touch-action:manipulation;cursor:pointer;background:#c98a5a;box-shadow:0 6px 24px rgba(0,0,0,0.6)}
.sg-start{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:700 1.15rem system-ui;padding:14px 26px;border-radius:12px;border:0;background:#ff9a4d;color:#1a0a00;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,0.6);transition:all .2s;}
.sg-start:hover{transform:translate(-50%,-50%) scale(1.05);background:#ffaa66;box-shadow:0 0 24px #ff9a4daa}
.sg-res{max-width:920px;margin:12px auto 0;padding:12px 16px;border-radius:12px;border:1px solid var(--line,#26574a);background:var(--card,#112233);color:var(--fg,#e0f7fa);font-family:system-ui,sans-serif}
.sg-res.fail{border-color:#b71c1c;background:#2a0a0a}
`;

/**
 * Mount the Solar Alignment minigame into container
 */
export async function mountSolarAlignment(container, opts = {}) {
  if (!document.getElementById('sg-css')) {
    const c = document.createElement('style');
    c.id = 'sg-css';
    c.textContent = SG_CSS;
    document.head.append(c);
  }

  const sunInfo = opts.sunAngle || { elevation: 36.4, azimuth: 108.2, gameSunDeg: -38.5 };

  container.innerHTML = `
    <h2 style="color:#ff9a4d;margin:12px 0 4px">☀️ Solar Alignment (NASA Ephemeris Calibration)</h2>
    <div style="font-family:monospace; font-size:.8rem; color:#80cbc4; margin-bottom:10px; background:#07131e; padding:6px 12px; border-radius:6px; border:1px solid #1a365d;">
      🛰️ NASA SUN VECTOR // ELEVATION: <b style="color:#00e5ff;">${sunInfo.elevation}°</b> | AZIMUTH: <b style="color:#00e5ff;">${sunInfo.azimuth}°</b> [18.97° N, 77.60° E]
    </div>
    <p style="font-size:.88rem;opacity:.85;margin:0 0 10px">Click or press Space to reverse swing. Align sensor to surge power before it decays!</p>
    <div class="sg">
      <div class="sg-meter">
        <span>▲</span>
        <div class="sg-tube"><div class="sg-fill"></div></div>
        <span>▼</span>
        <small id="power-pct-label">0%</small>
      </div>
      <div class="sg-stage">
        <canvas width="780" height="480" aria-label="Solar panel game: click to reverse the panel"></canvas>
        <button class="sg-start">▶ Start mission</button>
      </div>
    </div>
    <div class="sg-res" hidden></div>
  `;

  const $ = (q) => container.querySelector(q);
  const cv = $('canvas'), ctx = cv.getContext('2d');
  const fill = $('.sg-fill'), btn = $('.sg-start'), resEl = $('.sg-res');
  const powerPctLabel = $('#power-pct-label');

  const W = 780, H = 480;

  // Primary panel center at pole top
  const P = { x: 390, y: 268 };

  // Auxiliary panels (left & right)
  const P_LEFT = { x: 195, y: 268 };
  const P_RIGHT = { x: 585, y: 268 };

  // Sun position derived from NASA ephemeris
  const sunDeg = (sunInfo.gameSunDeg != null) ? sunInfo.gameSunDeg : -38.5;
  const sunRadius = 210;
  const S = {
    x: P.x + Math.sin(sunDeg * R) * sunRadius,
    y: P.y - Math.cos(sunDeg * R) * sunRadius,
  };

  const alignOf = (a) => Math.max(0, Math.cos((a - sunDeg) * R));

  // Game state
  const fresh = () => ({
    running: false, busy: false,
    a: -60, dir: 1, t: 0,
    level: 0, base: 0, bonus: 0, lock: 0, mult: 1, done: null,
    // Auxiliary panel angles
    aLeft: -25, aRight: +20,
    syncingCutscene: false,
    syncProgress: 0,
  });

  let s = fresh(), last = performance.now();
  let animId = null;

  const onPointer = () => { if (s.running) s.dir *= -1; };
  const onKeydown = (e) => {
    if (!s.running) return;
    if (e.key === 'ArrowLeft') s.dir = -1;
    else if (e.key === 'ArrowRight') s.dir = 1;
    else if (e.key === ' ' || e.key === 'Enter') s.dir *= -1;
    else return;
    e.preventDefault();
  };
  cv.addEventListener('pointerdown', onPointer);
  window.addEventListener('keydown', onKeydown);

  // Helper: interpolate RGB color for sensor bulb
  function getBulbColor(al) {
    // Cold silver/white at al=0 -> Brilliant glowing gold at al=1
    const r = Math.round(210 + (255 - 210) * al);
    const g = Math.round(225 + (220 - 225) * al);
    const b = Math.round(240 * (1 - al * 0.92));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Draw an individual solar panel assembly
  function drawPanel(c, posX, posY, angleDeg, al, isMain = true) {
    c.save();
    // 1. Steel Support Pole
    c.fillStyle = isMain ? '#3e4854' : '#2b333d';
    c.fillRect(posX - (isMain ? 7 : 5), posY, isMain ? 14 : 10, H - posY);

    // Pole base mount
    c.fillStyle = '#1f242b';
    c.beginPath();
    c.moveTo(posX - 18, H - 40);
    c.lineTo(posX + 18, H - 40);
    c.lineTo(posX + 24, H);
    c.lineTo(posX - 24, H);
    c.fill();

    // 2. Rotate Panel around pivot (posX, posY)
    c.translate(posX, posY);
    c.rotate(angleDeg * R);

    const halfW = isMain ? 74 : 58;
    const h = isMain ? 18 : 14;

    // Main solar photovoltaic wing
    if (isMain && al > 0.1) {
      c.shadowColor = '#ffd24d';
      c.shadowBlur = 35 * al;
    }
    c.fillStyle = isMain ? '#163366' : '#122547';
    c.fillRect(-halfW, -h / 2, halfW * 2, h);
    c.shadowBlur = 0;

    // Cell frame
    c.strokeStyle = isMain ? '#79a8ff' : '#496fa8';
    c.lineWidth = 1.5;
    c.strokeRect(-halfW, -h / 2, halfW * 2, h);

    // Photovoltaic cell divider lines
    const divisions = isMain ? 5 : 4;
    const step = (halfW * 2) / divisions;
    c.strokeStyle = isMain ? '#406cb5' : '#2d4b80';
    c.lineWidth = 1;
    for (let i = 1; i < divisions; i++) {
      const lineX = -halfW + i * step;
      c.beginPath();
      c.moveTo(lineX, -h / 2);
      c.lineTo(lineX, h / 2);
      c.stroke();
    }

    // 3. Sensor Stick & Bulb
    const sensorLen = isMain ? 34 : 26;
    c.strokeStyle = '#1a1f26';
    c.lineWidth = isMain ? 3 : 2.5;
    c.beginPath();
    c.moveTo(0, -h / 2);
    c.lineTo(0, -h / 2 - sensorLen);
    c.stroke();

    // Bulb glow & gradient
    const bulbY = -h / 2 - sensorLen - (isMain ? 10 : 7);
    const bulbRadius = isMain ? 9 : 7;
    const bulbColor = isMain ? getBulbColor(al) : (s.syncingCutscene ? getBulbColor(al) : '#b0bec5');

    if (isMain && al > 0.05) {
      c.shadowColor = `rgba(255, 215, 0, ${al * 0.95})`;
      c.shadowBlur = 12 + 28 * al;
    }
    c.fillStyle = bulbColor;
    c.beginPath();
    c.ellipse(0, bulbY, bulbRadius, bulbRadius * 1.3, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#222';
    c.lineWidth = 1.5;
    c.stroke();
    c.shadowBlur = 0;

    c.restore();
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    // 1. Cutscene logic: auxiliary panels rotate to align with main panel
    if (s.syncingCutscene) {
      s.syncProgress += dt * 0.9;
      const t = Math.min(1, s.syncProgress);
      // Smooth lerp to target angle s.a
      s.aLeft = s.aLeft + (s.a - s.aLeft) * (dt * 3.5);
      s.aRight = s.aRight + (s.a - s.aRight) * (dt * 3.5);
    } else {
      // Normal gameplay swinging
      s.a += s.dir * CFG.speed * dt;
      if (s.a > CFG.limit) { s.a = CFG.limit; s.dir = -1; }
      if (s.a < -CFG.limit) { s.a = -CFG.limit; s.dir = 1; }
    }

    const al = alignOf(s.a);

    if (s.running) {
      s.t += dt;

      // Rate is strictly non-linear to reward exact alignment
      const proximityRate = Math.pow(al, 4);

      if (al >= CFG.lockAt) s.lock += dt;
      else if (al < CFG.dropAt) s.lock = 0;

      s.mult = s.lock >= CFG.lockSecs ? 2 : 1;

      // Score rate relative to sun proximity
      const pts = proximityRate * CFG.pointsPerSec * dt * s.mult;
      s.base += pts;
      if (s.mult > 1) s.bonus += pts;

      // VISUAL POWER DYNAMICS:
      // Surges rapidly as you align with the Sun; drains back to 0% when tilted away!
      if (al > 0.45) {
        // High charging rate
        s.level = Math.min(100, s.level + (proximityRate * 60) * dt);
      } else {
        // Rapid discharge decay back to 0%
        s.level = Math.max(0, s.level - (45 * (1 - al)) * dt);
      }

      if (s.t >= CFG.seconds) {
        s.running = false;
        s.done && s.done();
      }
    } else if (!s.syncingCutscene) {
      // During DadPhone introduction: power visibly surges and drops as the panel swings
      s.level = Math.max(0, Math.min(100, Math.pow(al, 3) * 100));
    }

    fill.style.height = s.level.toFixed(1) + '%';
    fill.classList.toggle('gold', s.mult > 1);
    powerPctLabel.textContent = Math.round(s.level) + '%';

    draw(al);
    animId = requestAnimationFrame(frame);
  }

  function draw(al) {
    const c = ctx;

    // Martian Sky gradient
    const sky = c.createLinearGradient(0, 0, 0, H * 0.75);
    sky.addColorStop(0, '#c98a5a');
    sky.addColorStop(1, '#f0c595');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);

    // Martian Jezero crater terrain ground
    c.fillStyle = '#8a4a2a';
    c.fillRect(0, H * 0.82, W, H);
    c.fillStyle = '#6e381e';
    c.fillRect(0, H * 0.88, W, H);

    // Sun corona & glow
    const gl = c.createRadialGradient(S.x, S.y, 8, S.x, S.y, 110 + 60 * al);
    gl.addColorStop(0, 'rgba(255,235,140,0.95)');
    gl.addColorStop(1, 'rgba(255,235,140,0)');
    c.fillStyle = gl;
    c.fillRect(S.x - 200, S.y - 200, 400, 400);

    // Sun core circle
    c.fillStyle = '#ffd24d';
    c.beginPath();
    c.arc(S.x, S.y, 38, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#fff5a6';
    c.lineWidth = 2;
    c.stroke();

    // RAY TO THE SUN:
    // Strictly from the solar panel pole top P(390, 268) to the Sun center S(S.x, S.y)
    if (al > 0.04) {
      // Soft outer beam
      c.strokeStyle = `rgba(255, 235, 140, ${al * 0.35})`;
      c.lineWidth = 12 * al + 2;
      c.beginPath();
      c.moveTo(P.x, P.y);
      c.lineTo(S.x, S.y);
      c.stroke();

      // Sharp core dashed ray
      c.strokeStyle = `rgba(255, 215, 90, ${al * 0.95})`;
      c.lineWidth = 3.5;
      c.setLineDash([10, 8]);
      c.beginPath();
      c.moveTo(P.x, P.y);
      c.lineTo(S.x, S.y);
      c.stroke();
      c.setLineDash([]);
    }

    // DRAW THE THREE SOLAR PANELS:
    // 1. Auxiliary Left Panel
    drawPanel(c, P_LEFT.x, P_LEFT.y, s.aLeft, s.syncingCutscene ? al : 0.2, false);

    // 2. Auxiliary Right Panel
    drawPanel(c, P_RIGHT.x, P_RIGHT.y, s.aRight, s.syncingCutscene ? al : 0.2, false);

    // 3. Main Center Panel (active player control)
    drawPanel(c, P.x, P.y, s.a, al, true);

    // Turn direction indicator (during gameplay)
    if (s.running) {
      c.fillStyle = '#fff';
      c.font = 'bold 16px system-ui';
      c.textAlign = 'center';
      c.fillText(s.dir < 0 ? '◀ turning left' : 'turning right ▶', P.x, H - 16);

      // HUD overlay on canvas
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(0, 0, W, 12);
      c.fillStyle = '#7dff9a';
      c.fillRect(0, 0, W * (1 - s.t / CFG.seconds), 12);

      c.textAlign = 'right';
      c.fillStyle = '#fff';
      c.font = 'bold 22px system-ui';
      c.fillText('⏱ ' + Math.ceil(CFG.seconds - s.t) + 's', W - 16, 44);

      c.textAlign = 'left';
      c.font = 'bold 18px system-ui';
      c.fillText('Sun Lock ' + Math.round(al * 100) + '%', 16, 44);

      if (s.mult > 1) {
        c.textAlign = 'center';
        c.fillStyle = '#fff';
        c.strokeStyle = '#b8860b';
        c.lineWidth = 5;
        c.font = 'bold 32px system-ui';
        c.strokeText('☀️ ×2 BONUS!', W / 2, 80);
        c.fillText('☀️ ×2 BONUS!', W / 2, 80);
      }
    }

    // Cutscene Array Sync banner
    if (s.syncingCutscene) {
      c.fillStyle = 'rgba(10, 25, 47, 0.85)';
      c.fillRect(W / 2 - 240, 28, 480, 52);
      c.strokeStyle = '#00bcd4';
      c.lineWidth = 2;
      c.strokeRect(W / 2 - 240, 28, 480, 52);

      c.textAlign = 'center';
      c.fillStyle = '#00e5ff';
      c.font = 'bold 17px ui-monospace, monospace';
      c.fillText('🛰️ ARRAY SYNC // SLAVING AUXILIARY PANELS', W / 2, 50);

      c.fillStyle = '#7dff9a';
      c.font = '13px ui-monospace, monospace';
      c.fillText(`Aligning Wings to Master Vector (${s.a.toFixed(1)}°)`, W / 2, 70);
    }
  }

  function calcScore() {
    const total = s.base + s.bonus;
    const max = CFG.seconds * CFG.pointsPerSec;
    const pct = Math.round((total / max) * 100);
    const failed = pct < CFG.failThreshold;
    const powerBonus = failed ? -15 : (pct >= 100 ? 25 : 5);
    return {
      score: Math.round(total), base: Math.round(s.base), bonus: Math.round(s.bonus),
      power: Math.min(CFG.maxPower, Math.round(total / CFG.pointsPerPower)),
      stars: pct >= 80 ? 3 : pct >= 50 ? 2 : pct >= 30 ? 1 : 0,
      pct, failed, powerBonus,
    };
  }

  animId = requestAnimationFrame(frame);

  if (opts.autoStart !== false) {
    setTimeout(() => { if (!s.busy) btn.click(); }, 150);
  }

  const result = await new Promise((resolve) => {
    btn.onclick = async () => {
      s = fresh();
      s.busy = true;
      btn.hidden = true;
      resEl.hidden = true;
      fill.classList.remove('fail');

      if (opts.intro !== false) {
        await DadPhone.say({ from: 'dad', lines: INTRO });
      }

      // RESET THE BAR TO 0 ONCE PLAYER CAN CONTROL
      s.level = 0;
      fill.style.height = '0%';
      powerPctLabel.textContent = '0%';
      s.base = 0;
      s.bonus = 0;
      s.lock = 0;
      s.t = 0;

      last = performance.now();
      s.running = true;
      await new Promise((r) => { s.done = r; });

      const res = calcScore();

      // Trigger auxiliary panels rotating cutscene
      s.syncingCutscene = true;
      s.syncProgress = 0;

      // Allow 2.5 seconds for the auxiliary panels to visibly rotate and lock in
      await new Promise((doneSync) => setTimeout(doneSync, 2500));
      s.syncingCutscene = false;

      resEl.hidden = false;
      resEl.classList.toggle('fail', res.failed);
      fill.classList.toggle('fail', res.failed);

      if (res.failed) {
        resEl.innerHTML = `<b>❌ Mission Failed!</b> Score ${res.score} (${res.pct}%). Below ${CFG.failThreshold}% threshold.<br><span style="color:#ff5252;font-weight:700">PENALTY: -15% Base Power</span> (excess actuator strain).`;
        await DadPhone.ring({ from: 'dad', lines: FAIL_LINES });
      } else if (res.pct >= 100) {
        resEl.innerHTML = `<b>${'⭐'.repeat(res.stars)} Perfect alignment!</b> Score ${res.score} (${res.pct}%). Base Power: <b>+25%</b>`;
        if (opts.outro !== false) await DadPhone.ring({ from: 'dad', lines: OUTRO });
      } else {
        resEl.innerHTML = `<b>${'⭐'.repeat(res.stars) || '☁️'} Time's up!</b> Score ${res.score} (${res.pct}%). Base Power: <b>+5%</b>. (100% required for +25% bonus).`;
        if (opts.outro !== false) await DadPhone.ring({ from: 'dad', lines: OUTRO });
      }

      s.busy = false;
      setTimeout(() => resolve(res), 1500);
    };
  });

  cv.removeEventListener('pointerdown', onPointer);
  window.removeEventListener('keydown', onKeydown);
  if (animId) cancelAnimationFrame(animId);
  container.innerHTML = '';

  return result;
}

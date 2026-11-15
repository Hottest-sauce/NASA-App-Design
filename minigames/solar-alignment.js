// minigames/solar-alignment.js
// Exports mountSolarAlignment(container, opts) → Promise<result>
// The minigame renders into the given container and resolves when complete.
// FAIL STATE: Scores <30% incur a penalty (-15% power) with NO RETRY.
//
// Result: { score, base, bonus, pct, stars, failed, powerBonus }
//   powerBonus: +25 (perfect 100%), +5 (30-99%), -15 (fail <30%, penalty applied)

import { DadPhone } from '../shared/dadphone.js';

const R = Math.PI / 180;
const CFG = {
  seconds: 20,
  speed: 50,
  limit: 75,
  lockAt: 0.95,
  dropAt: 0.85,
  lockSecs: 5,
  pointsPerSec: 10,
  pointsPerPower: 25,
  maxPower: 100,
  failThreshold: 30,
};

const svgMarkup = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120'><rect width='200' height='120' fill='#0d1b2a'/><circle cx='30' cy='25' r='12' fill='#ffd24d'/><g stroke='#ffd24d' stroke-width='2' stroke-dasharray='4 3'><line x1='40' y1='31' x2='108' y2='70'/><line x1='34' y1='37' x2='102' y2='76'/></g><rect x='85' y='72' width='60' height='8' fill='#1d3f8a' stroke='#8fb4ff' transform='rotate(120 115 76)'/><text x='14' y='112' fill='#cfe' font-size='10' font-family='sans-serif'>rays hit head-on = max power</text></svg>";
const DIAGRAM = 'data:image/svg+xml,' + encodeURIComponent(svgMarkup);

const INTRO = [
  'Hey kiddo, it\u2019s Dad! Solar panels generate power from the sun, so we need to make sure they get lots of sunlight!',
  'The panel swings back and forth all by itself. Your job is to make it turn around. Click, tap or press Space to flip its direction. The \u2190 and \u2192 keys pick a direction too.',
  'Keep the panel\u2019s little sensor pointed at the Sun. The closer it aims, the faster the green power bar fills.',
  'Stay locked on the Sun for five seconds and you\u2019ll earn a \u00d72 BONUS. You have 20 seconds. Go!',
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
.sg{display:flex;gap:10px;max-width:900px;margin:0 auto;font-family:system-ui,sans-serif}
.sg-meter{width:62px;display:flex;flex-direction:column;align-items:center;gap:6px;font-weight:700;color:#22b455}
.sg-meter small{font-size:.65rem;letter-spacing:.1em}
.sg-tube{flex:1;width:34px;min-height:240px;border:3px solid #22b455;border-radius:8px;background:#0b1a10;position:relative;overflow:hidden}
.sg-fill{position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(0deg,#1f9d4d,#7dff9a);transition:height .12s}
.sg-fill.gold{background:linear-gradient(0deg,#d49a00,#ffe066);box-shadow:0 0 14px #ffd24d}
.sg-fill.fail{background:linear-gradient(0deg,#b71c1c,#ff5252);border-color:#b71c1c}
.sg-stage{position:relative;flex:1;min-width:0}
.sg canvas{width:100%;height:auto;display:block;border:3px solid #111;border-radius:8px;touch-action:manipulation;cursor:pointer;background:#c98a5a}
.sg-start{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:700 1.1rem system-ui;padding:12px 22px;border-radius:12px;border:0;background:#ff9a4d;color:#1a0a00;cursor:pointer;box-shadow:0 4px 18px #0006}
.sg-res{max-width:900px;margin:10px auto 0;padding:10px 14px;border-radius:12px;border:1px solid var(--line,#5a3a2c);background:var(--card,#24150f);color:var(--fg,#f3e6dc);font-family:system-ui,sans-serif}
.sg-res.fail{border-color:#b71c1c;background:#2a0a0a}
`;

/**
 * Mount the Solar Alignment minigame into the container.
 * Resolves with the result after a single playthrough (no retry on fail).
 */
export async function mountSolarAlignment(container, opts = {}) {
  if (!document.getElementById('sg-css')) {
    const c = document.createElement('style');
    c.id = 'sg-css';
    c.textContent = SG_CSS;
    document.head.append(c);
  }

  container.innerHTML =
    '<h2 style="color:#ff9a4d;margin:12px 0 6px">☀️ Solar Alignment</h2>'
    + '<p style="font-size:.9rem;opacity:.8;margin:0 0 10px">Click, tap, or press Space to flip the panel. Keep it aimed at the Sun!</p>'
    + '<div class="sg"><div class="sg-meter"><span>▲</span><div class="sg-tube"><div class="sg-fill"></div></div><span>▼</span><small>POWER</small></div>'
    + '<div class="sg-stage"><canvas width="780" height="480" aria-label="Solar panel game: click to reverse the panel"></canvas>'
    + '<button class="sg-start">▶ Start mission</button></div></div>'
    + '<div class="sg-res" hidden></div>';

  const $ = (q) => container.querySelector(q);
  const cv = $('canvas'), ctx = cv.getContext('2d');
  const fill = $('.sg-fill'), btn = $('.sg-start'), resEl = $('.sg-res');

  const W = 780, H = 480;
  const P = { x: 382, y: 264 }, S = { x: 248, y: 106 };
  const sunDeg = Math.atan2(S.x - P.x, P.y - S.y) / R;
  const alignOf = (a) => Math.max(0, Math.cos((a - sunDeg) * R));

  const fresh = () => ({
    running: false, busy: false, a: -60, dir: 1, t: 0,
    level: 0, base: 0, bonus: 0, lock: 0, mult: 1, done: null,
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

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    s.a += s.dir * CFG.speed * dt;
    if (s.a > CFG.limit) { s.a = CFG.limit; s.dir = -1; }
    if (s.a < -CFG.limit) { s.a = -CFG.limit; s.dir = 1; }
    const al = alignOf(s.a);
    if (s.running) {
      s.t += dt;
      const rate = al * al;
      if (al >= CFG.lockAt) s.lock += dt; else if (al < CFG.dropAt) s.lock = 0;
      s.mult = s.lock >= CFG.lockSecs ? 2 : 1;
      const pts = rate * CFG.pointsPerSec * dt;
      s.base += pts; if (s.mult > 1) s.bonus += pts;
      s.level = Math.max(0, Math.min(100, s.level + (rate * s.mult * 14 - 4) * dt));
      if (s.t >= CFG.seconds) { s.running = false; s.done && s.done(); }
    }
    fill.style.height = s.level + '%';
    fill.classList.toggle('gold', s.mult > 1);
    draw(al);
    animId = requestAnimationFrame(frame);
  }

  function draw(al) {
    const c = ctx;
    const sky = c.createLinearGradient(0, 0, 0, H * 0.75); sky.addColorStop(0, '#c98a5a'); sky.addColorStop(1, '#f0c595');
    c.fillStyle = sky; c.fillRect(0, 0, W, H); c.fillStyle = '#8a4a2a'; c.fillRect(0, H * 0.82, W, H);
    const gl = c.createRadialGradient(S.x, S.y, 10, S.x, S.y, 120 + 60 * al);
    gl.addColorStop(0, 'rgba(255,230,120,.9)'); gl.addColorStop(1, 'rgba(255,230,120,0)');
    c.fillStyle = gl; c.fillRect(S.x - 200, S.y - 200, 400, 400);
    c.fillStyle = '#ffd24d'; c.beginPath(); c.arc(S.x, S.y, 40, 0, 7); c.fill();
    if (al > 0.05) { c.strokeStyle = `rgba(255,215,90,${al})`; c.lineWidth = 4; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(S.x + 30, S.y + 24); c.lineTo(P.x, P.y); c.stroke(); c.setLineDash([]); }
    c.fillStyle = '#555'; c.fillRect(P.x - 7, P.y, 14, H - P.y);
    c.save(); c.translate(P.x, P.y); c.rotate(s.a * R);
    c.shadowColor = '#ffd24d'; c.shadowBlur = 30 * al; c.fillStyle = '#1d3f8a'; c.fillRect(-72, -9, 144, 18); c.shadowBlur = 0;
    c.strokeStyle = '#8fb4ff'; c.lineWidth = 1.5; c.strokeRect(-72, -9, 144, 18);
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 29, -9); c.lineTo(i * 29, 9); c.stroke(); }
    c.strokeStyle = '#222'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -9); c.lineTo(0, -36); c.stroke();
    c.fillStyle = al > 0.9 ? '#ffe066' : '#fff'; c.beginPath(); c.ellipse(0, -46, 8, 11, 0, 0, 7); c.fill(); c.stroke();
    c.restore();
    c.fillStyle = '#fff'; c.font = 'bold 18px system-ui'; c.textAlign = 'center';
    c.fillText(s.dir < 0 ? '◀ turning left' : 'turning right ▶', P.x, H - 14);
    if (s.running) {
      c.fillStyle = '#0006'; c.fillRect(0, 0, W, 12); c.fillStyle = '#7dff9a'; c.fillRect(0, 0, W * (1 - s.t / CFG.seconds), 12);
      c.textAlign = 'right'; c.fillStyle = '#fff'; c.font = 'bold 24px system-ui'; c.fillText('⏱ ' + Math.ceil(CFG.seconds - s.t) + 's', W - 14, 42);
      c.textAlign = 'left'; c.font = 'bold 18px system-ui'; c.fillText('Sun lock ' + Math.round(al * 100) + '%', 14, 42);
      if (s.mult > 1) { c.textAlign = 'center'; c.fillStyle = '#fff'; c.strokeStyle = '#b8860b'; c.lineWidth = 5; c.font = 'bold 34px system-ui'; c.strokeText('☀️ ×2 BONUS!', W / 2, 80); c.fillText('☀️ ×2 BONUS!', W / 2, 80); }
    }
  }

  function calcScore() {
    const total = s.base + s.bonus, max = CFG.seconds * CFG.pointsPerSec, f = total / max;
    const pct = Math.round(f * 100);
    const failed = pct < CFG.failThreshold;
    // Penalty on fail (-15%), +25% on perfect 100%, +5% on partial 30-99%
    const powerBonus = failed ? -15 : (pct >= 100 ? 25 : 5);
    return {
      score: Math.round(total), base: Math.round(s.base), bonus: Math.round(s.bonus),
      power: Math.min(CFG.maxPower, Math.round(total / CFG.pointsPerPower)),
      stars: f >= 0.75 ? 3 : f >= 0.5 ? 2 : f >= 0.25 ? 1 : 0,
      pct, failed, powerBonus,
    };
  }

  animId = requestAnimationFrame(frame);

  const result = await new Promise((resolve) => {
    btn.onclick = async () => {
      s = fresh(); s.busy = true;
      btn.hidden = true; resEl.hidden = true;
      fill.classList.remove('fail');

      if (opts.intro !== false) await DadPhone.say({ from: 'dad', lines: INTRO });

      last = performance.now();
      s.running = true;
      await new Promise((r) => { s.done = r; });

      const res = calcScore();
      resEl.hidden = false;
      resEl.classList.toggle('fail', res.failed);
      fill.classList.toggle('fail', res.failed);

      if (res.failed) {
        // --- FAIL: NO RETRY, PENALTY APPLIED ---
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
      // Brief pause so the player sees their result card before continuing
      setTimeout(() => resolve(res), 1500);
    };
  });

  cv.removeEventListener('pointerdown', onPointer);
  window.removeEventListener('keydown', onKeydown);
  if (animId) cancelAnimationFrame(animId);
  container.innerHTML = '';

  return result;
}

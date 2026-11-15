// dadphone.js: a reusable "incoming call" dialogue system (tablet / sci-fi device look).
//
// USAGE from any other file:
//   import { DadPhone } from './dadphone.js';
//   await DadPhone.ring('Hey kiddo, check the solar array!');          // phone buzzes, tap to answer
//   await DadPhone.ring({ from: 'mom', lines: ['Hi!', { text: 'Look:', image: 'diagram.png', caption: 'Sun angle' }] });
//   DadPhone.say({ from: 'hab', lines: ['Oxygen low.'] });              // no ring, opens straight away
//   DadPhone.say({ from: 'narrator', lines: ['The sun rises.'] });      // teal narrator, no ring
//   DadPhone.registerCharacter('nasa', { name: 'Mission Control', avatar: 'assets/mc.png', color: '#9bf', speed: 20, pitch: 300 });
//   DadPhone.configure({ corner: 'top-right', sound: false });
// Also available as window.DadPhone for plain <script> pages. Every call returns a Promise that resolves when the player closes the box.
//
// A script is a string, an array of lines, or { from, lines, ring, onDone }. A line is a string or
// { text, from, name, portrait, image, caption, speed }. Everything is editable per call:
//   from      character id from the registry (name, avatar, color, speed, pitch, wave, mustache)
//   name      override the displayed name for this line only
//   portrait  emoji OR image URL replacing the character picture for this line
//   image     a science diagram shown large instead of the portrait (use with caption)

const IMG = /\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$|^data:image|^https?:\/\//i;

const cfg = { corner: 'bottom-right', sound: true };
const chars = {
  dad:      { name: 'Dad', avatar: '👨‍🚀', mustache: true, color: '#ff9a4d', speed: 30, pitch: 110, wave: 'square' },
  mom:      { name: 'Mom', avatar: '👩‍🚀', color: '#7fd6ff', speed: 24, pitch: 240, wave: 'triangle' },
  hab:      { name: 'Hab Computer', avatar: '🤖', color: '#7dff9a', speed: 14, pitch: 420, wave: 'sine' },
  narrator: { name: 'Mission Log', avatar: '🔴', color: '#00bcd4', speed: 22, pitch: 260, wave: 'sine' },
};

const CSS = `
.dp-phone,.dp-tab{--dp-accent:#ff9a4d;position:fixed;z-index:9999;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
.dp-bottom-right{right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom))}
.dp-top-right{right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top))}
.dp-phone{width:66px;height:66px;border-radius:20px;border:2px solid var(--dp-accent);background:linear-gradient(160deg,#1d2738,#0a0f17);color:#fff;font-size:32px;cursor:pointer;display:grid;place-items:center;box-shadow:0 0 20px var(--dp-accent);animation:dp-pop .35s ease-out,dp-buzz 1.2s .35s infinite}
.dp-phone::after{content:"";position:absolute;inset:-6px;border-radius:24px;border:2px solid var(--dp-accent);animation:dp-ping 1.2s .35s infinite;pointer-events:none}
.dp-phone i{position:absolute;top:-7px;right:-7px;min-width:22px;height:22px;border-radius:11px;background:#ff3b3b;color:#fff;font:700 13px/22px system-ui;text-align:center}
@keyframes dp-pop{from{transform:scale(.2) translateY(40px);opacity:0}}
@keyframes dp-buzz{0%,45%,100%{transform:none}5%{transform:translateX(-4px) rotate(-9deg)}10%{transform:translateX(4px) rotate(9deg)}15%{transform:translateX(-4px) rotate(-9deg)}20%{transform:translateX(4px) rotate(9deg)}25%{transform:translateX(-2px) rotate(-5deg)}30%{transform:translateX(2px) rotate(5deg)}}
@keyframes dp-ping{0%{transform:scale(.9);opacity:.8}70%,100%{transform:scale(1.5);opacity:0}}
.dp-tab{width:min(540px,calc(100vw - 24px));animation:dp-open .25s ease-out;filter:drop-shadow(0 0 14px var(--dp-accent))}
.dp-tab.dp-out{animation:dp-close .2s ease-in forwards}
@keyframes dp-open{from{transform:translateY(30px) scale(.9);opacity:0}}
@keyframes dp-close{to{transform:translateY(30px) scale(.9);opacity:0}}
.dp-bezel{position:relative;background:linear-gradient(145deg,#303b50,#10151f);border-radius:26px;padding:14px 12px 12px;box-shadow:inset 0 0 0 2px #46526a,0 14px 40px #000b;cursor:pointer;user-select:none}
.dp-bezel::before{content:"";position:absolute;top:5px;left:50%;width:5px;height:5px;margin-left:-2px;border-radius:50%;background:#0a0d14;box-shadow:0 0 0 1px #46526a}
.dp-screen{position:relative;overflow:hidden;border-radius:16px;border:1px solid var(--dp-accent);background:radial-gradient(120% 120% at 20% 0,#10263a,#060d16);color:#e6f6ff;padding:8px 12px 10px}
.dp-screen::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(transparent 0 2px,#0000001f 2px 3px)}
.dp-status{display:flex;gap:8px;align-items:center;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--dp-accent);border-bottom:1px dashed #ffffff30;padding-bottom:5px;margin-bottom:8px}
.dp-status b{flex:1;font-weight:600}
.dp-x{background:none;border:0;color:inherit;cursor:pointer;font:inherit;padding:0 2px}
.dp-body{display:flex;gap:12px;align-items:flex-start}
.dp-portrait{position:relative;flex:0 0 96px;height:96px;border-radius:12px;border:1px solid var(--dp-accent);background:#0b1826;display:grid;place-items:center;font-size:58px;line-height:1;overflow:hidden}
.dp-portrait.dia{flex-basis:46%;height:128px;font-size:40px}
.dp-portrait img{width:100%;height:100%;object-fit:contain}
.dp-mus{position:absolute;left:50%;top:var(--dp-mus-y,60%);width:32%;transform:translateX(-50%)}
.dp-msg{flex:1;min-width:0}
.dp-name{color:var(--dp-accent);font-weight:700;font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px}
.dp-text{min-height:5.2em;font-size:1rem;line-height:1.45;white-space:pre-wrap}
.typing .dp-text::after{content:"▌";animation:dp-blink .6s steps(2) infinite;color:var(--dp-accent)}
.dp-cap{margin-top:4px;font-size:.72rem;opacity:.7}
.dp-hint{text-align:right;font-size:.7rem;color:var(--dp-accent);margin-top:4px;animation:dp-blink 1.4s steps(2) infinite}
@keyframes dp-blink{50%{opacity:.25}}
.dp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (prefers-reduced-motion:reduce){.dp-phone,.dp-phone::after,.dp-tab,.dp-hint,.typing .dp-text::after{animation:none}}
`;

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const queue = [];
let st = null, audio = null;

function blip(ch) {
  if (!cfg.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = ch.wave || 'square';
    o.frequency.value = (ch.pitch || 150) * (0.92 + Math.random() * 0.16);
    g.gain.value = 0.03; o.connect(g); g.connect(audio.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.06); o.stop(audio.currentTime + 0.07);
  } catch (e) { /* sound is optional */ }
}

function normalize(s) {
  if (typeof s === 'string') s = { lines: [s] };
  else if (Array.isArray(s)) s = { lines: s };
  return { from: s.from || 'dad', ring: s.ring !== false, onDone: s.onDone,
           lines: (s.lines || []).map((l) => (typeof l === 'string' ? { text: l } : l)) };
}
const charFor = (line, s) => {
  const id = line.from || s.from;
  return { ...(chars[id] || { name: id }), ...(line.character || {}) };
};

function play(script) {
  return new Promise((resolve) => { queue.push({ script, resolve }); if (!st) next(); });
}
function next() { const job = queue.shift(); if (job) run(job); }

function run(job) {
  if (!document.getElementById('dp-css')) { const c = el('style'); c.id = 'dp-css'; c.textContent = CSS; document.head.append(c); }
  const s = normalize(job.script), pos = 'dp-' + cfg.corner;
  st = { job, s, i: 0, timer: 0, typing: false, full: '', phone: null, tab: null };
  addEventListener('keydown', onKey);
  const openTab = () => {
    const tab = el('div', 'dp-tab ' + pos);
    tab.setAttribute('role', 'dialog'); tab.setAttribute('aria-label', 'Dad-Phone message');
    tab.innerHTML = '<div class="dp-bezel"><div class="dp-screen"><div class="dp-status"><span>▂▄▆█</span><b>Incoming · Dad-Phone</b><button class="dp-x" aria-label="Close">✕</button></div>'
      + '<div class="dp-body"><div class="dp-portrait"></div><div class="dp-msg"><div class="dp-name"></div><div class="dp-text" aria-hidden="true"></div><div class="dp-cap"></div></div></div>'
      + '<div class="dp-hint"></div><div class="dp-sr" aria-live="polite"></div></div></div>';
    const q = (c) => tab.querySelector('.' + c);
    Object.assign(st, { tab, nameEl: q('dp-name'), textEl: q('dp-text'), capEl: q('dp-cap'), portEl: q('dp-portrait'), hintEl: q('dp-hint'), srEl: q('dp-sr') });
    q('dp-x').onclick = (e) => { e.stopPropagation(); close(); };
    q('dp-bezel').onclick = advance;
    document.body.append(tab);
    showLine();
  };
  if (!s.ring || !s.lines.length) return openTab();
  const caller = charFor(s.lines[0], s);
  const phone = el('button', 'dp-phone ' + pos, '📱<i>1</i>');
  phone.style.setProperty('--dp-accent', caller.color || '#ff9a4d');
  phone.setAttribute('aria-label', 'Incoming call from ' + (caller.name || 'Dad') + '. Tap to answer.');
  phone.onclick = () => { phone.remove(); st.phone = null; openTab(); };
  document.body.append(phone); st.phone = phone;
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

function renderPortrait(line, ch) {
  const p = st.portEl; p.innerHTML = ''; p.classList.toggle('dia', !!line.image);
  const src = line.image || line.portrait || ch.portrait || ch.avatar || '🧑‍🚀';
  if (IMG.test(src)) { const im = el('img'); im.src = src; im.alt = line.caption || ch.name || ''; p.append(im); return; }
  p.append(document.createTextNode(src));
  if (ch.mustache && !line.portrait && !line.image)
    p.insertAdjacentHTML('beforeend', '<svg class="dp-mus" viewBox="0 0 60 24"><path d="M30 8C22-2 8 2 3 12c9-4 17-2 27 2 10-4 18-6 27-2C52 2 38-2 30 8Z" fill="#3b2314"/></svg>');
}

function showLine() {
  const line = st.s.lines[st.i], ch = charFor(line, st.s);
  st.tab.style.setProperty('--dp-accent', ch.color || '#ff9a4d');
  st.nameEl.textContent = line.name || ch.name || '';
  st.capEl.textContent = line.caption || '';
  renderPortrait(line, ch);
  st.srEl.textContent = line.text || '';
  type(Array.from(line.text || ''), line.speed || ch.speed || 28, ch);
}

function hint() {
  const last = st.i >= st.s.lines.length - 1;
  st.hintEl.textContent = st.typing ? 'tap to skip ▸▸' : last ? 'tap to hang up ✕' : 'tap to continue ▸';
}

// Talks letter by letter, pausing on punctuation like real speech.
function type(chars, speed, ch) {
  clearTimeout(st.timer);
  st.full = chars.join(''); st.typing = true; st.tab.classList.add('typing'); st.textEl.textContent = ''; hint();
  let n = 0;
  const tick = () => {
    if (!st || !st.typing) return;
    if (n >= chars.length) return endLine();
    const c = chars[n++]; st.textEl.textContent = chars.slice(0, n).join('');
    if (c.trim() && n % 2 === 0) blip(ch);
    st.timer = setTimeout(tick, /[.!?]/.test(c) ? speed * 7 : /[,;:]/.test(c) ? speed * 3 : speed);
  };
  tick();
}
function endLine() {
  clearTimeout(st.timer); st.typing = false; st.tab.classList.remove('typing');
  st.textEl.textContent = st.full; hint();
}

// Click 1 = finish the line instantly. Click 2 = next line. After the last line, click = everything goes away.
function advance() {
  if (!st || !st.tab) return;
  if (st.typing) return endLine();
  if (st.i < st.s.lines.length - 1) { st.i++; showLine(); } else close();
}
function onKey(e) {
  if (!st) return;
  if (e.key === 'Escape') return close();
  if (st.tab && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); advance(); }
}

function close() {
  if (!st) return;
  const { job, s, phone, tab } = st;
  clearTimeout(st.timer); removeEventListener('keydown', onKey); st = null;
  const gone = () => { if (phone) phone.remove(); if (tab) tab.remove(); };
  if (tab) { tab.classList.add('dp-out'); setTimeout(gone, 200); } else gone();
  try { if (s.onDone) s.onDone(); } catch (e) { console.error(e); }
  job.resolve();
  next();
}

export const DadPhone = {
  ring: (script) => play(script),
  say: (script) => play({ ...normalize(script), ring: false }),
  registerCharacter: (id, def) => { chars[id] = { ...(chars[id] || {}), ...def }; },
  configure: (opts) => Object.assign(cfg, opts),
  close: (all = true) => { if (all) queue.splice(0).forEach((j) => j.resolve()); close(); },
  characters: chars,
};
if (typeof window !== 'undefined') window.DadPhone = DadPhone;
export default DadPhone;

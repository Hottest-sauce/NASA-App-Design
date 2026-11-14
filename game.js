// ============ game.js ============
// Search the project (Ctrl+Shift+F) for "LESSON" to follow the tour in order.

// LESSON 4: the HUD (resource bars) is just DATA drawn as HTML.
// Change a number in R, call hud(), and the bar width updates (see hud() below).
const R={o2:{n:'O₂',v:78,i:'🫁'},heat:{n:'Heat',v:64,i:'🌡️'},power:{n:'Power',v:55,i:'⚡'},food:{n:'Rations',v:40,i:'🥫'},queue:{n:'Research queued (MB)',v:120,max:500,i:'💾'},sent:{n:'Uploaded (MB)',v:0,max:500,i:'📡'}};
const OBJ=[
 {id:'gen',img:'assets/icons/generator.svg',t:'Refill the generator before it runs dry'},
 {id:'harvest',t:'Survive until the first potato harvest'},
 {id:'compress',t:'Post-process a dataset to shrink its file size'},
 {id:'upload',t:'Upload your first research packet to Earth'},
 {id:'eva',t:'Complete an outdoor sample mission (unlocks side missions)'}];
const done=new Set();
// LESSON 2 + 3: every room lists its hotspots. x, y, w, h are PERCENTAGES of the picture.
// Optional: img:'path' on a room = background picture; img:'path' on a hotspot = icon picture.
// Leave img out and the game falls back to the emoji (ic). Try adding an img to another hotspot!
const ROOMS=[
 {name:'Hab Core',img:'assets/rooms/hab-core.svg',sky:0,bg:['#3b2418','#241510'],hs:[
  {id:'gen',x:5,y:38,w:20,h:36,ic:'🔋',lb:'Generator',tag:'EVENT',title:'Generator Refuel',blurb:'Fissile rods or hydrogen cells run low at random. Swap them in time or the lights go out.',stub:'MINI-GAME: timed refuel sequence (find the right cell, seat it, purge the line).',fx:{power:+25},obj:'gen',line:'The generator hums, but the gauge is creeping toward red.'},
  {id:'o2',x:32,y:30,w:16,h:36,ic:'💨',lb:'O₂ Scrubber',tag:'PASSIVE',title:'Oxygen Scrubber',blurb:'Simple on/off. Running it eats power and keeps oxygen up. Outdoor missions drain the finite tank.',stub:'TOGGLE: on / off with a power-draw readout.',fx:{o2:+10,power:-6},line:'Every breath of this air was made by this machine.'},
  {id:'heat',x:55,y:34,w:15,h:30,ic:'🔥',lb:'Thermostat',tag:'PASSIVE',title:'Heating Control',blurb:'Heat is lost by convection and gained from sun exposure (calculated from the geometric data of the panels and windows) or the heater.',stub:'DIAL: heater on/off plus a sun-angle heat gain readout.',fx:{heat:+8,power:-5},line:'Mars is cold. Colder than the stories say.'},
  {id:'rations',x:76,y:40,w:18,h:34,ic:'🥫',lb:'Ration Shelf',tag:'MENU',title:'Rations',blurb:'Eat from the stockpile while you wait for the next crop. Count the sols carefully.',stub:'MENU: choose how many rations to eat per sol.',fx:{food:-4},line:'Ration packs. Ten sols left if I stretch them.'}]},
 {name:'Greenhouse & Lab',img:'assets/rooms/greenhouse.svg',sky:0,bg:['#1f3a26','#16261a'],hs:[
  {id:'potato',x:6,y:46,w:26,h:30,ic:'🥔',lb:'Potato Beds',tag:'TIMER',title:'Potato Beds',blurb:'Water and tend the crop. It needs a set number of sols to grow, and your rations must last until harvest.',stub:'MINI-GAME: water, light and soil-nutrient balancing.',fx:{food:+6},obj:'harvest',line:'Tiny green leaves. They are the whole future of this house.'},
  {id:'spec',x:40,y:34,w:18,h:34,ic:'🔬',lb:'Soil Spectrometer',tag:'PASSIVE',title:'Soil Spectrometer',blurb:'Like the jukebox in FNAF: start it, then let it run. It slowly produces research data with little oversight.',stub:'PASSIVE MACHINE: start, monitor a progress bar, collect data.',fx:{queue:+40,power:-4},line:'Data trickles in while I do other things.'},
  {id:'board',x:68,y:24,w:24,h:36,ic:'📋',lb:'Mission Board',tag:'MENU',title:'Mission Board',blurb:'Requests from space agencies. Finish tasks to unlock more indoor and outdoor side missions.',stub:'MENU: list of client requests, rewards and unlock tree.',fx:{},line:'Three requests from Earth. Each one pays in research.'}]},
 {name:'Comms & Airlock',img:'assets/rooms/comms.svg',sky:1,bg:['#2a2030','#1b1424'],hs:[
  {game:'dish',id:'dish',x:4,y:20,w:20,h:34,ic:'📡',lb:'Satellite Uplink',tag:'MINI-GAME',title:'Satellite Uplink',blurb:'Upload data to Earth. Satellites pass overhead and overlap, and transmit speed depends on dish positioning.',stub:'MINI-GAME: aim the dish at the best satellite window.',fx:{queue:-60,sent:+60,power:-5},obj:'upload',line:'Two relays overhead. If I time the overlap, the signal is strong.'},
  {id:'term',x:30,y:44,w:18,h:30,ic:'🖥️',lb:'Data Terminal',tag:'MINI-GAME',title:'Post-Processing',blurb:'Run analysis on the limited computers to shrink file sizes, so less needs to go through the satellite link.',stub:'MINI-GAME: allocate CPU between jobs, with a compression result.',fx:{queue:-30,power:-6},obj:'compress',line:'The old computers crunch the numbers slowly but steadily.'},
  {game:'solar',id:'solar',x:54,y:12,w:18,h:26,ic:'☀️',lb:'Solar Window',tag:'MINI-GAME',title:'Solar Array Control',blurb:'Align the array to the sun and shield it from storms. This is the earlier Solar Array game, folded into the base.',stub:'MINI-GAME: your Solar Array Commander prototype goes here.',fx:{power:+12},line:'Out there, the panels wait for the sun.'},
  {id:'lock',x:76,y:30,w:18,h:44,ic:'🚪',lb:'Airlock',tag:'EVA',title:'Outdoor Mission',blurb:'Leave the base for off-site research. Uses the finite oxygen supply, so plan the trip.',stub:'MINI-GAME: suit up, pick a destination, collect samples.',fx:{o2:-20,queue:+80},obj:'eva',line:'Beyond that door: red dust and silence.'}]}];
let cur=0,lines=[],li=0,typing=null;
const $=s=>document.querySelector(s),sc=$('#scene');
function hud(){$('#hud').innerHTML=Object.values(R).map(r=>`<div class="res">${r.i} ${r.n} <b>${Math.round(r.v)}</b><i><span style="width:${Math.min(100,r.v/(r.max||100)*100)}%"></span></i></div>`).join('')+'<button id="ob">📋 Objectives</button>';$('#ob').onclick=objs}
// LESSON 1: a GUI is LAYERS. Bottom layer = background (this SVG fallback, or your image).
// Middle layer = hotspots. Top layer = dialogue box, menus, pop-ups.
function bgSvg(r){const[a,b]=r.bg;return `<svg class="bg" viewBox="0 0 160 90" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1d2a"/><stop offset=".6" stop-color="#d9733a"/><stop offset="1" stop-color="#8a3b22"/></linearGradient></defs><rect width="160" height="90" fill="url(#g)"/><rect y="72" width="160" height="18" fill="#00000055"/>${r.sky?'<rect x="76" y="8" width="30" height="24" rx="3" fill="url(#m)" stroke="#8a6a58" stroke-width="1.5"/>':''}<g stroke="#ffffff10">${[20,50,80,110,140].map(x=>`<line x1="${x}" y1="0" x2="${x}" y2="72"/>`).join('')}</g></svg>`}
function show(i){cur=(i+ROOMS.length)%ROOMS.length;const r=ROOMS[cur];
 sc.querySelectorAll('.bg,.hs').forEach(e=>e.remove());
 // LESSON 1 + 3: draw the background layer. Use the picture if the room has one.
 sc.insertAdjacentHTML('afterbegin',r.img?`<img class="bg" src="${r.img}" alt="">`:bgSvg(r));
 r.hs.forEach(h=>{const d=document.createElement('div');d.className='hs'+(done.has(h.obj)?' done':'');d.tabIndex=0;d.setAttribute('role','button');
  d.style.cssText=`left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%`;// LESSON 3: picture icon if h.img exists, otherwise emoji
  d.innerHTML=`${h.img?`<img class="ic-img" src="${h.img}" alt="">`:`<span class="ic">${h.ic}</span>`}<span class="lb">${h.lb}</span>`;
  d.onclick=()=>open(h);d.onkeydown=e=>{if(e.key==='Enter')open(h)};d.onmouseenter=()=>say(h.line,true);sc.appendChild(d)});
 $('#roomname').textContent=`${r.name}  ·  room ${cur+1}/${ROOMS.length}`;say(`You step into the ${r.name}.`,true)}
function say(t,quick,who){$('#vn .who').textContent=who||'You';const el=$('#vn .txt');clearInterval(typing);if(quick){el.textContent=t;return}let i=0;el.textContent='';typing=setInterval(()=>{el.textContent=t.slice(0,++i);if(i>=t.length)clearInterval(typing)},22)}
function intro(){lines=['Sol 1. The first family on Mars. That is us. That was supposed to be a thing to be proud of.','Mom and Dad left on a multi-day mission. The uplink says they will be back in a few sols.','Until then, I hold down the fort: air, heat, power, food, and the research Earth is waiting for.','Click things around the base. Keep us alive, and send home as much data as you can.'];li=0;say(lines[0],false,'Narrator')}
$('#vn').onclick=()=>{if(li<lines.length-1){li++;say(lines[li],false,'Narrator')}};
function open(h){if(h.game)return start(h);const m=$('#modal');m.style.display='flex';
 m.innerHTML=`<div class="panel"><span class="tag">${h.tag}</span><h2>${h.title}</h2><p>${h.blurb}</p><div class="stub"><b>PROTOTYPE PLACEHOLDER</b>${h.stub}</div><small>Effect of the stub button: ${Object.entries(h.fx).map(([k,v])=>`${R[k].n} ${v>0?'+':''}${v}`).join(', ')||'none'}</small><br><div class="row"><button id="go">Run stub</button><button id="x">Close</button></div></div>`;
 $('#x').onclick=()=>m.style.display='none';
 $('#go').onclick=()=>{for(const k in h.fx)R[k].v=Math.max(0,Math.min(R[k].max||100,R[k].v+h.fx[k]));if(h.obj)done.add(h.obj);hud();toast(h.title+' done (stub)');m.style.display='none';show(cur)}}
function objs(){const m=$('#obj');m.style.display='flex';m.innerHTML=`<div class="panel"><h2>📋 Objectives</h2><ul class="o">${OBJ.map(o=>`<li>${done.has(o.id)?'✅':'⬜'} ${o.t}</li>`).join('')}</ul><small>Final score: total research uploaded to Earth (${R.sent.v} MB so far).</small><br><div class="row"><button id="c">Close</button></div></div>`;$('#c').onclick=()=>m.style.display='none'}
function toast(t){const e=$('#toast');e.textContent=t;e.style.opacity=1;setTimeout(()=>e.style.opacity=0,1400)}
$('#prev').onclick=()=>show(cur-1);$('#next').onclick=()=>show(cur+1);
addEventListener('keydown',e=>{if(G&&e.key!=='Escape')return;if(e.key==='ArrowLeft')show(cur-1);if(e.key==='ArrowRight')show(cur+1);if(e.key==='Escape'){G=null;$('#modal').style.display='none';$('#obj').style.display='none'}});

// LESSON 5: CANVAS = a blank page you draw on with code. Great for minigames and anything that rotates.
// ROTATING: a panel at angle a is a line whose endpoints are  center ± length*(sin a, -cos a).
// ALIGNMENT SCORE: cos(sun angle - panel angle) is 1 when aimed perfectly, 0 at 90 degrees off.
// LESSON 6: ANIMATION LOOP: loop() runs every frame via requestAnimationFrame: update numbers, then draw().
let G=null;const DUR=20;
// HOOK: replace with DONKI / NASA sun-direction data (needs a proxy; direct API calls are blocked on this host)
const sunAng=t=>25+t*6;
const sats=[[0,9],[60,6],[130,-7]];
const satAng=(s,t)=>((s[0]+s[1]*t)%180+180)%180;
const TIP={solar:'Dad-phone: Solar panels make power from the sun, so line them up with it! Fold the array away when a storm comes.',dish:'Dad-phone: Point the dish at a satellite to send our data home. Two satellites overhead means a stronger signal!'};
function start(h){const k=h.game,m=$('#modal');m.style.display='flex';
 m.innerHTML=`<div class="panel"><span class="tag">MINI-GAME</span><h2>${h.title}</h2><p>${TIP[k]}</p><canvas id="cv" width="480" height="230" style="width:100%;border-radius:8px;background:#1a0f0b"></canvas><label>${k=='solar'?'Panel':'Dish'} angle <b id="av">90</b>°<input id="sl" type="range" min="0" max="180" step="1" value="90" style="width:100%"></label><div id="st" style="font-size:.85rem;margin:6px 0"></div><div class="row">${k=='solar'?'<button id="tg">Fold array</button>':''}<button id="x">Abort</button></div></div>`;
 G={k,t:0,pts:0,mb:0,open:true,sig:0,al:0,sun:25,last:performance.now()};
 const sl=$('#sl');sl.oninput=()=>$('#av').textContent=sl.value;
 if(k=='solar')$('#tg').onclick=e=>{G.open=!G.open;e.target.textContent=G.open?'Fold array':'Open array'};
 $('#x').onclick=()=>{G=null;m.style.display='none'};requestAnimationFrame(loop)}
function loop(n){if(!G)return;const dt=Math.min(.1,(n-G.last)/1000);G.last=n;G.t+=dt;const a=+$('#sl').value,t=G.t;
 if(G.k=='solar'){G.sun=sunAng(t);G.storm=t>8&&t<13;G.warn=t>6&&t<=8;
  G.al=G.open?Math.max(0,Math.cos((G.sun-a)*Math.PI/180)):0;
  G.pts+=G.al*dt*5;if(G.storm&&G.open)G.pts=Math.max(0,G.pts-10*dt)}
 else{const d=sats.map(s=>Math.max(0,1-Math.abs(satAng(s,t)-a)/22));
  G.sig=Math.min(1.3,Math.max(...d)*(d.filter(x=>x>.05).length>1?1.3:1));G.mb=Math.min(R.queue.v,G.mb+G.sig*8*dt)}
 draw(a);if(t>=DUR)return finish();requestAnimationFrame(loop)}
function draw(a){const c=$('#cv').getContext('2d'),r=Math.PI/180,cx=240,cy=205,P=(g,L)=>[cx-L*Math.cos(g*r),cy-L*Math.sin(g*r)];
 c.clearRect(0,0,480,230);c.fillStyle='#4a2a1c';c.fillRect(0,cy,480,25);
 c.strokeStyle='#ffffff18';c.lineWidth=1;c.beginPath();for(let i=0;i<=180;i+=3){const[p,q]=P(i,170);i?c.lineTo(p,q):c.moveTo(p,q)}c.stroke();
 if(G.k=='solar'){const[sx,sy]=P(G.sun,170);c.fillStyle='#ffd24d';c.beginPath();c.arc(sx,sy,14,0,7);c.fill();
  if(G.al>0){c.strokeStyle=`rgba(255,210,77,${G.al})`;c.lineWidth=3;c.beginPath();c.moveTo(sx,sy);c.lineTo(cx,cy-6);c.stroke()}
  c.lineWidth=9;c.strokeStyle=G.open?'#6aa8ff':'#556';c.beginPath();
  if(G.open){const s=Math.sin(a*r),k=Math.cos(a*r);c.moveTo(cx-45*s,cy-6+45*k);c.lineTo(cx+45*s,cy-6-45*k)}else{c.moveTo(cx-45,cy-6);c.lineTo(cx+45,cy-6)}
  c.stroke();
  if(G.storm||G.warn){if(G.storm){c.fillStyle='rgba(120,40,40,.35)';c.fillRect(0,0,480,230)}c.fillStyle='#ff9a8a';c.font='16px system-ui';c.fillText(G.storm?'⚠ DUST STORM: fold the array!':'Storm incoming…',140,28)}
  $('#st').textContent=`Sun ${Math.round(G.sun)}° · alignment ${Math.round(G.al*100)}% · points ${Math.round(G.pts)} · ${Math.ceil(DUR-G.t)}s left`}
 else{sats.forEach(s=>{const[x,y]=P(satAng(s,G.t),170);c.fillStyle='#9fd0ff';c.fillRect(x-6,y-4,12,8)});
  const[bx,by]=P(a,190);c.strokeStyle=`rgba(120,255,160,${Math.max(.15,Math.min(1,G.sig))})`;c.lineWidth=3;c.beginPath();c.moveTo(cx,cy-6);c.lineTo(bx,by);c.stroke();
  c.fillStyle='#ccc';c.beginPath();c.arc(cx,cy-6,10,Math.PI,0);c.fill();
  $('#st').textContent=`Signal ${Math.round(G.sig*100)}% · ${(G.sig*8).toFixed(1)} MB/s · ${G.mb.toFixed(0)} MB sent · ${Math.ceil(DUR-G.t)}s left`}}
function finish(){const g=G;G=null;const f={};let msg;
 if(g.k=='solar'){f.power=Math.round(g.pts*.25);msg=`Array harvested ${Math.round(g.pts)} points: +${f.power} power`}
 else{const mb=Math.round(g.mb);f.queue=-mb;f.sent=mb;f.power=-5;msg=`Uploaded ${mb} MB to Earth`;done.add('upload')}
 for(const k in f)R[k].v=Math.max(0,Math.min(R[k].max||100,R[k].v+f[k]));
 hud();toast(msg);$('#modal').style.display='none';show(cur)}
hud();show(0);intro();

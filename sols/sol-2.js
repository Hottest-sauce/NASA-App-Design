// sols/sol-2.js — Act 4: Day 2 Recovery, Satellite Uplink, Interactive Flowchart & NASA Mission Log
import { DadPhone } from '../shared/dadphone.js';

export async function mountSol2(container, state) {
  // Determine 3-letter path from previous decisions:
  // Decision 1 (Sol 0): 1A -> 'A', 1B -> 'B'
  // Decision 2 (Sol 1): 'A' or 'B'
  // Decision 3 (Sol 1 night): 'A' or 'B'
  const d1 = state.choices[0] === '1A' ? 'A' : 'B';
  const d2 = state.choices[1] || 'B';
  const d3 = state.choices[2] || 'A';
  const full3Path = d1 + d2 + d3;
  state.path = full3Path;

  function renderHUD() {
    return `
      <div style="background:#0a192f; border:1px solid #1f4068; border-radius:10px; padding:12px 16px; margin-bottom:16px; display:flex; flex-wrap:wrap; gap:14px; font-size:.88rem; align-items:center;">
        <div>⚡ Base Power: <b style="color:#00e5ff;">${state.power}%</b></div>
        <div>💧 Water: <b style="color:#64b5f6;">${state.water} kg</b></div>
        <div>🫁 Oxygen: <b style="color:#81c784;">${state.oxygen} kg</b></div>
        <div>📡 Comms: <b style="color:${state.communications ? '#4caf50' : '#f44336'};">${state.communications ? 'ONLINE' : 'OFFLINE'}</b></div>
        <div>📍 Path Code: <b style="color:#ffd54f;">${full3Path}</b></div>
      </div>
    `;
  }

  // Descriptions and endings for all 8 paths
  const endings = {
    'AAA': {
      title: 'Path AAA: Scientific Discovery Uplink',
      badge: '🧬 Science Pioneer',
      color: '#00bcd4',
      story: `The final trek to retrieve the wind-shifted depot rocks requires <b>2.225 kg of Oxygen</b>, but after your Neretva Vallis detour you only have <b>${state.oxygen} kg</b> left. 
      However, the solar alignment bonus in Sol 0 ensured your base batteries are high (${state.power}%). With your communication dish clean and powered, you connect to the MRO/ISS orbital relay to broadcast a completion of half the primary mission alongside your extraordinary <b>Neretva Vallis ice discovery</b>!`,
      status: 'Partial Sample Collection + Major Scientific Breakthrough transmitted.'
    },
    'ABA': {
      title: 'Path ABA: Flawless Mission & Uplink',
      badge: '🏆 Golden Astronaut',
      color: '#4caf50',
      story: `You secured maximum power for the base in Sol 0 and adhered to the optimal route without unnecessary early supply drains. Even though last night's dust storm shifted the depot rocks 30 minutes away, you woke up with plenty of water (<b>${state.water} kg</b>) and oxygen (<b>${state.oxygen} kg</b>) to comfortably recover them on Day 2! 
      Your clean telecommunication system transmits the full dataset back to Earth right on schedule.`,
      status: '100% Core Objectives Achieved + Complete Telemetry Transmitted.'
    },
    'AAB': {
      title: 'Path AAB: The Silent Hoard',
      badge: '📦 Resource Heavy, Comms Dark',
      color: '#ff9800',
      story: `You achieved extra power in Sol 0 and successfully recovered every sample—both the Neretva Vallis ice and the depot rocks! But rushing out into the midnight gale allowed grit to foul the dish motors. 
      Telecommunications are completely down. Your samples and habitat are secure, but Earth won't know of your triumph until your parents return from their expedition!`,
      status: 'All Samples Secured; Telecommunications Dish Offline.'
    },
    'ABB': {
      title: 'Path ABB: Battered But Complete',
      badge: '🛠️ Field Hardened',
      color: '#ffb74d',
      story: `You started with strong power and completed the core sample retrieval in the storm. However, the midnight sortie exhausted your consumables and jammed communications with dust. 
      You rely on base power (${state.power}%) to scrub the indoor air while awaiting the arrival of your parents' rover.`,
      status: 'Core Samples Secured; Transceiver Motor Jammed.'
    },
    'BAA': {
      title: 'Path BAA: Survival on the Margins',
      badge: '⚠️ Strained Resources',
      color: '#e040fb',
      story: `By skipping manual panel calibration, your base power began at 50%. You took the Neretva Vallis detour, leaving oxygen too low to fetch the storm-shifted depot rocks. 
      Thankfully, your clean communications let you uplink your ice findings to NASA, but base systems must strictly conserve power until rescue.`,
      status: 'Ice Samples Reported; Power and Oxygen Margins Critical.'
    },
    'BAB': {
      title: 'Path BAB: Critical Overextension',
      badge: '🚨 Emergency Protocol',
      color: '#f44336',
      story: `With base power baseline at 50%, you undertook both the detour and the midnight storm run. You secured the rocks, but returned with empty oxygen tanks, fouled communications, and high dust contamination. 
      You initiate emergency habitat sealing and wait by the airlock for your family's return.`,
      status: 'Extreme Resource Depletion; Emergency Life Support Active.'
    },
    'BBA': {
      title: 'Path BBA: Disciplined Field Operations',
      badge: '🧭 Methodical Scout',
      color: '#81c784',
      story: `You conserved consumables throughout Sol 1 and wisely sheltered during the storm. On Day 2, you have sufficient water and oxygen to make the extended trek for the shifted rocks. 
      With intact communications, you report full mission success to Mission Control.`,
      status: 'Systematic Recovery & Successful Flyover Uplink.'
    },
    'BBB': {
      title: 'Path BBB: Gritty Endurance',
      badge: '🌪️ Dust Storm Survivor',
      color: '#ff7043',
      story: `You braved the storm to retrieve the rocks, but the combination of auto-mode solar power and storm infiltration left the base dusty and communications offline. 
      You have the samples in hand and power remaining to hold down the fort until the rover returns.`,
      status: 'Offline Field Victory; Awaiting Family Arrival.'
    }
  };

  const currentEnding = endings[full3Path] || endings['ABA'];

  container.innerHTML = `
    <div id="hud-bar">${renderHUD()}</div>

    <div class="scene">
      <h1>📡 Act 4: Day 2 Recovery & Satellite Uplink</h1>
      <p class="subtitle">Sol 2 · Jezero Crater Outpost</p>
      <p>The dawn of <b>Sol 2</b> breaks over Jezero Crater. The night dust storm has blown past, leaving fine silt across the plain. Your parents' expedition will return by sunset.</p>
      <p>To finalize your mission, access the station terminal, process your scientific telemetry, and initiate the <b>NASA Satellite Flyover Uplink Window</b>.</p>
    </div>

    <!-- Base Station Console -->
    <div class="scene" id="terminal-scene">
      <h2>Base Station Console — Telemetry Uplink</h2>
      <div style="background:#050c14; border:1px solid #1a365d; border-radius:10px; padding:16px; font-family:monospace; margin-bottom:14px; font-size:.9rem;">
        <div style="color:#00e5ff; margin-bottom:8px;">[MARS OUTPOST OS v4.22 // JEZERO CRATER STATION]</div>
        <div>ACTIVE PATH CODE: <b style="color:#ffd54f;">${full3Path}</b></div>
        <div>SOL 0 SOLAR CALIBRATION: ${d1 === 'A' ? '<span style="color:#4caf50;">MANUAL (Choice 1A)</span>' : '<span style="color:#ff9800;">AUTO-MODE (Choice 1B)</span>'}</div>
        <div>SOL 1 RIVERBED DETOUR: ${d2 === 'A' ? '<span style="color:#00e5ff;">NERETVA VALLIS (Ice Collected)</span>' : '<span style="color:#bbb;">BYPASSED (Direct)</span>'}</div>
        <div>SOL 1 NIGHT STORM ACTION: ${d3 === 'A' ? '<span style="color:#4caf50;">SHELTERED (Comms Clean)</span>' : '<span style="color:#f44336;">STORM RUN (Comms Offline)</span>'}</div>
        <div>TELECOMMUNICATIONS: <b style="color:${state.communications ? '#4caf50' : '#f44336'};">${state.communications ? 'ONLINE (Dish Ready)' : 'OFFLINE (Grit Jammed)'}</b></div>
      </div>

      <div class="choices" id="uplink-action">
        <button class="choice-btn" id="btn-start-uplink">
          <span class="label">Step 1 — Process Data & Initiate Satellite Uplink</span>
          Align antenna, encode research files, and initiate data burst during the orbital flyover window.
        </button>
      </div>

      <div id="uplink-progress" class="hidden" style="margin-top:14px;">
        <div style="font-size:.9rem; color:#80cbc4; margin-bottom:6px;">Uplinking packet to Mars Reconnaissance Orbiter (MRO) / ISS Relay...</div>
        <div style="background:#0b1a10; border:2px solid #22b455; border-radius:8px; height:24px; overflow:hidden;">
          <div id="progress-bar" style="height:100%; width:0%; background:linear-gradient(90deg,#00bcd4,#4caf50); transition:width .08s;"></div>
        </div>
      </div>

      <div id="ending-container" class="hidden"></div>
    </div>
  `;

  await DadPhone.say({
    from: 'narrator',
    lines: [
      'Sol 2 begins. The night storm has blown past.',
      'The NASA satellite flyover window is approaching.',
      'Access the terminal to process your research data and transmit your report.'
    ]
  });

  const btnUplink = container.querySelector('#btn-start-uplink');
  const uplinkAction = container.querySelector('#uplink-action');
  const progressBox = container.querySelector('#uplink-progress');
  const progressBar = container.querySelector('#progress-bar');
  const endingContainer = container.querySelector('#ending-container');

  await new Promise((resolve) => {
    btnUplink.onclick = resolve;
  });

  uplinkAction.classList.add('hidden');
  progressBox.classList.remove('hidden');

  // Simulated Uplink progress bar
  await new Promise((resolve) => {
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      progressBar.style.width = p + '%';
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(resolve, 400);
      }
    }, 45);
  });

  progressBox.classList.add('hidden');

  // Render the ending outcome + Flowchart Visualizer + Official NASA Mission Log
  endingContainer.innerHTML = `
    <!-- Narrative Ending Card -->
    <div class="outcome" style="border:2px solid ${currentEnding.color}; background:#081524; margin-top:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h2 style="color:${currentEnding.color}; margin:0;">${currentEnding.title}</h2>
        <span style="background:#112233; border:1px solid ${currentEnding.color}; border-radius:12px; padding:4px 10px; font-size:.8rem; color:${currentEnding.color}; font-weight:700;">
          ${currentEnding.badge}
        </span>
      </div>
      <p style="margin:14px 0 10px; line-height:1.6;">${currentEnding.story}</p>
      
      <div style="background:#050c14; border-left:3px solid ${currentEnding.color}; padding:10px 14px; border-radius:0 8px 8px 0; font-size:.9rem; margin-bottom:12px;">
        <b>Final Assessment:</b> ${currentEnding.status}
      </div>
    </div>

    <!-- Interactive Detroit: Become Human Style Flowchart Visualizer -->
    <div class="flowchart-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0; color:#00bcd4; font-size:1.1rem;">🗺️ Decision Tree & Mission Branches</h3>
        <span style="font-size:.8rem; color:#ffd54f; font-family:monospace;">YOUR PATH: ${full3Path}</span>
      </div>
      <p style="font-size:.82rem; opacity:.8; margin:0 0 16px;">See how your engineering decisions shaped your mission outcome. Active path is highlighted in cyan & green. Click other paths to see hints!</p>

      <div class="fc-tree">
        <!-- Level 0: Sol 0 Choice -->
        <div class="fc-row">
          <div class="fc-node ${d1 === 'A' ? 'active' : ''}">
            <div class="fc-label">SOL 0</div>
            <b>1A: Solar Align</b><br>
            <span style="font-size:.7rem;">Manual Sun Lock</span>
          </div>
          <div class="fc-node ${d1 === 'B' ? 'active' : ''}">
            <div class="fc-label">SOL 0</div>
            <b>1B: Quick Start</b><br>
            <span style="font-size:.7rem;">Auto-Mode (+30m)</span>
          </div>
        </div>

        <!-- Level 1: Sol 1 Riverbed Choice -->
        <div class="fc-row">
          <div class="fc-node ${d1 === 'A' && d2 === 'A' ? 'active' : ''}">
            <div class="fc-label">SOL 1 (from 1A)</div>
            <b>A: Neretva Detour</b><br>
            <span style="font-size:.7rem;">Ice Collected (-Water)</span>
          </div>
          <div class="fc-node ${d1 === 'A' && d2 === 'B' ? 'active' : ''}">
            <div class="fc-label">SOL 1 (from 1A)</div>
            <b>B: Direct Route</b><br>
            <span style="font-size:.7rem;">Conserve Stock</span>
          </div>
          <div class="fc-node ${d1 === 'B' && d2 === 'A' ? 'active' : ''}">
            <div class="fc-label">SOL 1 (from 1B)</div>
            <b>A: Neretva Detour</b><br>
            <span style="font-size:.7rem;">Ice Collected (-Water)</span>
          </div>
          <div class="fc-node ${d1 === 'B' && d2 === 'B' ? 'active' : ''}">
            <div class="fc-label">SOL 1 (from 1B)</div>
            <b>B: Direct Route</b><br>
            <span style="font-size:.7rem;">Conserve Stock</span>
          </div>
        </div>

        <!-- Level 2: All 8 Endings -->
        <div class="fc-row" style="gap:6px;">
          ${['AAA', 'AAB', 'ABA', 'ABB', 'BAA', 'BAB', 'BBA', 'BBB'].map(pathKey => `
            <div class="fc-node ending-node ${pathKey === full3Path ? 'active' : ''}" style="cursor:pointer;" title="Click to view outcome details" data-path="${pathKey}">
              <div class="fc-label">${pathKey}</div>
              <b>${pathKey === full3Path ? '★ ' + endings[pathKey].badge : endings[pathKey].badge}</b>
            </div>
          `).join('')}
        </div>
      </div>
      <div id="path-preview-box" style="margin-top:14px; padding:10px 14px; background:#081422; border-radius:8px; border:1px solid #1a365d; font-size:.85rem; display:none;"></div>
    </div>

    <!-- Official NASA Mission Log & Certificate -->
    <div class="nasa-cert" id="printable-mission-log">
      <div class="nasa-cert-header">
        <div class="nasa-meatball">
          <span style="color:#00bcd4; font-size:1.6rem;">🔴</span>
          <span>NASA // JEZERO OUTPOST MISSION LOG</span>
        </div>
        <div style="font-family:monospace; font-size:.8rem; color:#80cbc4; text-align:right;">
          DOC-ID: MARS-2026-APPS<br>
          CREW: ASTRO-KID COMMANDER
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:16px;">
        <div style="background:#091424; padding:12px; border-radius:8px; border:1px solid #1f3a56;">
          <div style="font-size:.75rem; color:#80cbc4; text-transform:uppercase;">Outpost Power Reserve</div>
          <div style="font-size:1.3rem; font-weight:800; color:#00e5ff;">${state.power}%</div>
          <div style="font-size:.75rem; opacity:.75;">Solar Photovoltaic Grid</div>
        </div>

        <div style="background:#091424; padding:12px; border-radius:8px; border:1px solid #1f3a56;">
          <div style="font-size:.75rem; color:#80cbc4; text-transform:uppercase;">Life Support Consumables</div>
          <div style="font-size:1.1rem; font-weight:700; color:#64b5f6;">H₂O: ${state.water} kg | O₂: ${state.oxygen} kg</div>
          <div style="font-size:.75rem; opacity:.75;">Remaining Exploration Stock</div>
        </div>

        <div style="background:#091424; padding:12px; border-radius:8px; border:1px solid #1f3a56;">
          <div style="font-size:.75rem; color:#80cbc4; text-transform:uppercase;">Scientific Research Transmitted</div>
          <div style="font-size:1.3rem; font-weight:800; color:#ffd54f;">${state.research} MB</div>
          <div style="font-size:.75rem; opacity:.75;">${state.iceSamples ? '✓ Neretva Ice Cores Included' : 'Baseline Rover Tube Telemetry'}</div>
        </div>

        <div style="background:#091424; padding:12px; border-radius:8px; border:1px solid #1f3a56;">
          <div style="font-size:.75rem; color:#80cbc4; text-transform:uppercase;">Telecommunications Status</div>
          <div style="font-size:1.1rem; font-weight:700; color:${state.communications ? '#4caf50' : '#f44336'};">
            ${state.communications ? 'ONLINE (Uplink Complete)' : 'OFFLINE (Grit Jammed)'}
          </div>
          <div style="font-size:.75rem; opacity:.75;">Deep Space Network Link</div>
        </div>
      </div>

      <div style="background:#03070d; border-left:4px solid #00bcd4; padding:12px 16px; border-radius:0 8px 8px 0; margin-bottom:16px; font-size:.88rem; line-height:1.5;">
        <b>FLIGHT DIRECTOR EVALUATION:</b><br>
        Commander navigated Jezero Crater across 3 full Martian Sols, balancing life support trade-offs, nocturnal wind storms (peaking at 8 m/s), and power management. 
        Mission outcome: <b>${currentEnding.title}</b>.
      </div>

      <!-- Real NASA Open Data Attribution Block -->
      <div style="border-top:1px dashed #26574a; padding-top:12px; font-size:.75rem; opacity:.85; display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px;">
        <div>
          <b>NASA Open Data Sources Referenced:</b><br>
          • <i>InSight & Perseverance MEDA:</i> Near-surface diurnal wind velocity patterns in Jezero Crater (Viúdez-Moreiras et al.)<br>
          • <i>NASA NTRS 20190027563:</i> Dust storm impacts on human Mars exploration and outdoor equipment maintenance (M.A. Rucker)<br>
          • <i>NASA OSDR:</i> Plant photoperiods and crop hydration requirements in Martian greenhouse analogues
        </div>
        <div style="text-align:right; font-family:monospace; color:#80cbc4;">
          VERIFIED & APPROVED<br>
          NASA SPACE APPS CHALLENGE
        </div>
      </div>
    </div>

    <!-- Replay / Action Buttons -->
    <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:20px;">
      <button class="choice-btn" id="btn-print-cert" style="flex:1; width:auto; text-align:center; background:linear-gradient(135deg,#00695c,#004d40);">
        🖨️ Print / Save NASA Mission Log
      </button>
      <button class="choice-btn" id="btn-restart" style="flex:1; width:auto; text-align:center;">
        ↻ Play Again (Explore Another Path)
      </button>
    </div>
  `;
  endingContainer.classList.remove('hidden');

  // Wire up flowchart interactive preview
  const previewBox = container.querySelector('#path-preview-box');
  container.querySelectorAll('.ending-node').forEach(node => {
    node.addEventListener('click', () => {
      const p = node.dataset.path;
      const endData = endings[p];
      previewBox.style.display = 'block';
      previewBox.innerHTML = `
        <b style="color:${endData.color}; font-size:.95rem;">${endData.title}</b> (${endData.badge})<br>
        <p style="margin:6px 0 0; opacity:.9;">${endData.story.replace(/<[^>]+>/g, '').slice(0, 160)}...</p>
        <span style="color:#ffd54f; font-size:.75rem; font-family:monospace;">Outcome: ${endData.status}</span>
      `;
    });
  });

  // Wire up Print button
  container.querySelector('#btn-print-cert').onclick = () => {
    window.print();
  };

  // Wire up Restart button
  container.querySelector('#btn-restart').onclick = () => {
    window.location.reload();
  };

  // Final DadPhone call
  if (state.communications) {
    await DadPhone.ring({
      from: 'dad',
      lines: [
        'Kiddo! We just received your uplink packet while en route back to base!',
        `Your telemetry log came through loud and clear on Path ${full3Path}.`,
        'We are so proud of how you held down the outpost. See you at the airlock in 20 minutes!'
      ]
    });
  } else {
    await DadPhone.say({
      from: 'narrator',
      lines: [
        'Satellite passes overhead, but the dish drive motors remain jammed from last night\'s storm.',
        'Data saved locally to station hard drives.',
        'Dust plumes in the distance signal your parents\' rover approaching the airlock. You survived your days on Mars!'
      ]
    });
  }
}

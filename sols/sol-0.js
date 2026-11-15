// sols/sol-0.js — Act 1: Morning Prep, FNAF Habitat Hub & Solar Calibration
import { DadPhone } from '../shared/dadphone.js';
import { mountSolarAlignment } from '../minigames/solar-alignment.js';
import { playCutscene } from '../shared/video-player.js';

export async function mountSol0(container, state) {
  const temp = state.temperature || { currentAvg: -64.2, currentMin: -97.1, currentMax: -15.3, latestSol: '1222' };
  const sun = state.sunAngle || { elevation: 36.4, azimuth: 108.2 };

  // Render the initial FNAF Habitat Hub Monitor
  container.innerHTML = `
    <div class="scene">
      <h1>🔴 Perseverance Challenge</h1>
      <p class="subtitle">Act 1 · Sol 0 Morning Prep (Jezero Crater Outpost [18.97° N, 77.60° E])</p>
      <p>Your family was selected as the first human family on Mars. With your parents away on an expedition, you are in command of the Jezero Outpost. Before heading out to retrieve <b>Perseverance's sample tubes</b>, monitor and calibrate your base systems from the central habitat console.</p>
    </div>

    <!-- FNAF Habitat Hub Screen -->
    <div class="hab-monitor" id="hab-hub">
      <div class="hab-screen-header">
        <span>SECURITY FEED // OUTPOST JEZERO-1</span>
        <span>🌡️ EXT TEMP: <b style="color:#ffb74d;">${temp.currentAvg}°C</b> (NASA InSight)</span>
        <span>☀️ SUN ELEV: <b style="color:#ffd54f;">${sun.elevation}°</b></span>
        <span>⚡ POWER: <b id="header-power">${state.power}%</b></span>
      </div>

      <!-- Camera / Station Selector Buttons -->
      <div class="hab-cam-grid">
        <button class="hab-cam-btn active" data-cam="solar">
          <span class="cam-id">CAM 01</span>
          <span class="cam-title">☀️ Solar Array</span>
          <span class="cam-status" id="status-cam-solar">Efficiency: Baseline (50%)</span>
        </button>

        <button class="hab-cam-btn" data-cam="hydro">
          <span class="cam-id">CAM 02</span>
          <span class="cam-title">🥔 Plant Watering</span>
          <span class="cam-status" id="status-cam-hydro">Soil Moisture: 38% (Low)</span>
        </button>

        <button class="hab-cam-btn" data-cam="comms">
          <span class="cam-id">CAM 03</span>
          <span class="cam-title">📡 Comms Array</span>
          <span class="cam-status">Dish: Operational (Online)</span>
        </button>

        <button class="hab-cam-btn" data-cam="airlock">
          <span class="cam-id">CAM 04</span>
          <span class="cam-title">🚪 Airlock & Rover</span>
          <span class="cam-status" id="status-cam-airlock">Status: Prep Incomplete</span>
        </button>
      </div>

      <!-- Station Viewscreen -->
      <div class="hab-viewscreen" id="cam-viewscreen">
        <div class="scanline"></div>
        <div id="cam-content"></div>
      </div>
    </div>

    <div id="minigame-mount"></div>
  `;

  const viewscreen = container.querySelector('#cam-content');
  const camButtons = container.querySelectorAll('.hab-cam-btn');
  const headerPower = container.querySelector('#header-power');
  const minigameMount = container.querySelector('#minigame-mount');
  const habHubEl = container.querySelector('#hab-hub');

  let activeCam = 'solar';
  let solarCalibrated = false;

  // Station render logic
  function renderCamView(cam) {
    activeCam = cam;
    camButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.cam === cam));

    if (cam === 'solar') {
      if (!solarCalibrated) {
        viewscreen.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <b style="color:#ff9a4d; font-size:1.05rem;">☀️ CAM 01: EXTERIOR SOLAR ARRAY</b>
            <span style="font-family:monospace; color:#ffd54f;">SUN AZ: ${sun.azimuth}° | EL: ${sun.elevation}°</span>
          </div>
          <p>The sun is rising over Jezero Crater (Outside: <b>${temp.currentAvg}°C</b>). The photovoltaic panel is currently unaligned on auto-mode. Battery reserves are at <b>${state.power}%</b>.</p>
          <p style="font-size:.88rem; color:#80cbc4;">Calibrating the panel angles toward NASA's ephemeris coordinates captures max solar flux, charging batteries faster so water pumps can hydrate the indoor potato crops.</p>

          <div class="choices" style="margin-top:14px;">
            <button class="choice-btn" id="hub-btn-1a">
              <span class="label">Option 1A — Engage Manual Alignment Minigame</span>
              Align the panel with the Sun's real-time position. (Risk: &lt;30% incurs -15% motor drain penalty; 100% gives +25% power).
            </button>
            <button class="choice-btn" id="hub-btn-1b">
              <span class="label">Option 1B — Quick Start (Leave Auto-Mode)</span>
              Leave panels on auto-mode and head straight to the airlock. Power stays at 50%, but you gain +30 min daylight.
            </button>
          </div>
        `;
        wireChoiceButtons();
      } else {
        viewscreen.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <b style="color:#00e5ff; font-size:1.05rem;">☀️ CAM 01: EXTERIOR SOLAR ARRAY [CALIBRATED]</b>
            <span style="font-family:monospace; color:#4caf50;">STATUS: ACTIVE</span>
          </div>
          <p>Solar calibration sequence completed based on NASA sun trajectory. Total Habitat Power: <b style="color:#00e5ff; font-size:1.1rem;">${state.power}%</b>.</p>
          <div class="tip" style="margin-top:10px;">
            <span>📋 System Status:</span> Power is being routed to the life support distribution grid and the hydroponics pumps. Check <b>CAM 04 (Airlock)</b> to cycle through to your mission!
          </div>
        `;
      }
    } else if (cam === 'hydro') {
      viewscreen.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <b style="color:#81c784; font-size:1.05rem;">🥔 CAM 02: HYDROPONICS GROW DOME</b>
          <span style="font-family:monospace; color:#81c784;">BIOLOGY OSDR-44</span>
        </div>
        <p>Indoor potato crops are insulated against the harsh Martian exterior (<b>${temp.currentAvg}°C</b>, Low: <b>${temp.currentMin}°C</b>, High: <b>${temp.currentMax}°C</b> from NASA InSight data). Grow lamps require steady electrical wattage.</p>
        <div style="background:#030810; padding:10px 14px; border-radius:8px; border:1px solid #1a365d; font-family:monospace; font-size:.85rem; margin-top:8px;">
          <div>SOIL HYDRATION: <b style="color:${state.power >= 55 ? '#4caf50' : '#ff9800'};">${state.power >= 55 ? 'OPTIMAL (Pumps Powered)' : 'DEFICIT (Awaiting Power)'}</b></div>
          <div>DOME THERMAL SHIELD: <b style="color:#00e5ff;">+19.2°C (Controlled)</b> vs Exterior ${temp.currentAvg}°C</div>
          <div>GROW LIGHTS: <b style="color:${state.power >= 50 ? '#00e5ff' : '#f44336'};">${state.power >= 50 ? 'NOMINAL' : 'LOW POWER SURGE'}</b></div>
          <div>TARGET HARVEST: Sol 45 (Essential for long-term crew food security)</div>
        </div>
      `;
    } else if (cam === 'comms') {
      viewscreen.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <b style="color:#64b5f6; font-size:1.05rem;">📡 CAM 03: DEEP SPACE TELECOMMUNICATIONS DISH</b>
          <span style="font-family:monospace; color:#4caf50;">STATUS: TRACKING</span>
        </div>
        <p>The high-gain parabolic antenna is aligned toward Mars orbiters and NASA's Deep Space Network.</p>
        <div style="background:#030810; padding:10px 14px; border-radius:8px; border:1px solid #1a365d; font-family:monospace; font-size:.85rem; margin-top:8px;">
          <div>BASE LOCATION: <b>18.97278° N, 77.60234° E</b> (Jezero Crater)</div>
          <div>EARTH-MARS LIGHT DELAY: <b>~14.2 MINUTES</b></div>
          <div>ATMOSPHERIC PRESSURE: <b>${temp.currentPressure || 742} Pa</b> (InSight MEDA)</div>
          <div>SESSION TELEMETRY CACHE: <b>SYNCHRONIZED (UTC)</b></div>
        </div>
      `;
    } else if (cam === 'airlock') {
      if (!solarCalibrated) {
        viewscreen.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <b style="color:#ffb74d; font-size:1.05rem;">🚪 CAM 04: AIRLOCK & ROVER BAY</b>
            <span style="font-family:monospace; color:#ff9800;">PREPARATION REQUIRED</span>
          </div>
          <p>The pressurized exploration rover is docked. Outside temperature is cold at <b>${temp.currentAvg}°C</b>. Exploration gear is prepped with 11 kg water and 3.5 kg oxygen for the Jezero Crater trek.</p>
          <p style="color:#ffb74d;">⚠️ <i>Habitat power check is required before cycling the main airlock door. Select <b>CAM 01 (Solar Array)</b> to calibrate or initiate quick start.</i></p>
        `;
      } else {
        viewscreen.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <b style="color:#4caf50; font-size:1.05rem;">🚪 CAM 04: AIRLOCK & ROVER BAY [READY]</b>
            <span style="font-family:monospace; color:#4caf50;">CLEARANCE GRANTED</span>
          </div>
          <p>The outpost systems are stabilized. The rover airlock is pressurized and cleared for egress into Jezero Crater.</p>
          <button class="choice-btn" id="hub-btn-depart" style="margin-top:14px; background:linear-gradient(135deg,#00695c,#00897b); font-size:1.05rem;">
            🚪 Cycle Airlock & Depart for Jezero Crater (Begin Sol 1 Trek) →
          </button>
        `;
        const departBtn = viewscreen.querySelector('#hub-btn-depart');
        if (departBtn) {
          departBtn.onclick = async () => {
            // Play leaving base cutscene video before departing for Sol 1
            await playCutscene('assets/videos/Leaving Base Video.mp4', 'Airlock Depressurization & Egress');
            resolveDeparture();
          };
        }
      }
    }
  }

  // Camera button click listener
  camButtons.forEach(btn => {
    btn.addEventListener('click', () => renderCamView(btn.dataset.cam));
  });

  // Initial narrator speech
  await DadPhone.say({
    from: 'narrator',
    lines: [
      'Welcome to the Jezero Outpost Habitat Console.',
      `Live NASA telemetry synchronized: Outside temperature is ${temp.currentAvg}°C.`,
      'Check your station feeds. Select CAM 01 to align panels with the Sun\'s position.'
    ]
  });

  renderCamView('solar');

  let resolveDeparture;
  const departurePromise = new Promise(res => { resolveDeparture = res; });

  function wireChoiceButtons() {
    const btn1A = viewscreen.querySelector('#hub-btn-1a');
    const btn1B = viewscreen.querySelector('#hub-btn-1b');

    if (btn1A) {
      btn1A.onclick = async () => {
        state.choices.push('1A');

        // Play Solar Panel cutscene video before starting minigame
        await playCutscene('assets/videos/Solar Panel Video.mp4', 'Solar Array Calibration Deployment');

        // Hide Habitat Hub monitor temporarily to focus on minigame
        habHubEl.classList.add('hidden');

        // Mount the solar minigame with the live NASA Sun Angle
        const result = await mountSolarAlignment(minigameMount, {
          intro: true,
          outro: true,
          sunAngle: state.sunAngle,
        });

        // Update power state
        state.power = Math.max(0, state.power + result.powerBonus);
        headerPower.textContent = state.power + '%';
        solarCalibrated = true;

        // Bring the FNAF Habitat Hub Screen BACK into view at the end of the minigame
        habHubEl.classList.remove('hidden');

        // Update camera button status indicators
        const solarStatusEl = container.querySelector('#status-cam-solar');
        const hydroStatusEl = container.querySelector('#status-cam-hydro');
        const airlockStatusEl = container.querySelector('#status-cam-airlock');

        if (result.failed) {
          solarStatusEl.textContent = 'Actuator Strain (35%)';
          solarStatusEl.style.color = '#ff5252';
          hydroStatusEl.textContent = 'Pumps in Power Save';
        } else if (result.powerBonus >= 25) {
          solarStatusEl.textContent = 'Peak Lock (75%)';
          solarStatusEl.style.color = '#4caf50';
          hydroStatusEl.textContent = 'Pumps Active (Optimal)';
          hydroStatusEl.style.color = '#4caf50';
        } else {
          solarStatusEl.textContent = 'Calibrated (55%)';
          hydroStatusEl.textContent = 'Pumps Operational';
        }

        airlockStatusEl.textContent = 'Status: Cleared for Egress';
        airlockStatusEl.style.color = '#4caf50';

        renderCamView('solar');

        if (result.failed) {
          await DadPhone.say({
            from: 'narrator',
            lines: [
              'Returning to the Habitat Hub.',
              `Power deficit recorded: ${state.power}%. Solar actuators took excessive strain.`,
              'Base systems are in energy-save mode. Head to CAM 04 (Airlock) to depart.'
            ]
          });
        } else {
          await DadPhone.say({
            from: 'narrator',
            lines: [
              'Returning to the Habitat Hub.',
              `Power level updated to ${state.power}%. Solar trajectory aligned with NASA ephemeris.`,
              'Outpost prep complete! Switch to CAM 04 (Airlock) to begin your Sol 1 trek.'
            ]
          });
        }
      };
    }

    if (btn1B) {
      btn1B.onclick = async () => {
        state.choices.push('1B');
        state.daylight += 30;
        solarCalibrated = true;

        const airlockStatusEl = container.querySelector('#status-cam-airlock');
        airlockStatusEl.textContent = 'Status: Cleared for Egress';
        airlockStatusEl.style.color = '#4caf50';

        renderCamView('solar');

        await DadPhone.say({
          from: 'narrator',
          lines: [
            'Panels remain on auto-mode. Base power holds at 50%.',
            'You gained 30 extra minutes of daylight for the trek.',
            'Switch to CAM 04 (Airlock) to cycle through to Sol 1.'
          ]
        });
      };
    }
  }

  // Await clicking the departure button in the airlock camera view
  await departurePromise;
}

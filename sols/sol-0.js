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
      <p class="subtitle">Act 1 · Sol 0 Morning Prep (Jezero Crater Outpost [17.81° N, 76.00° E])</p>
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
        <button class="hab-cam-btn" data-cam="solar">
          <span class="cam-id">CAM 01</span>
          <span class="cam-title">☀️ Solar Power</span>
          <span class="cam-status" id="status-cam-solar">Efficiency: Baseline (50%)</span>
        </button>

        <button class="hab-cam-btn" data-cam="hydro">
          <span class="cam-id">CAM 02</span>
          <span class="cam-title">🥔 Potato Farm</span>
          <span class="cam-status" id="status-cam-hydro" style="color:#ff5252; font-weight:700;">Soil Moisture: 38% (Low)</span>
        </button>

        <button class="hab-cam-btn" data-cam="comms">
          <span class="cam-id">CAM 03</span>
          <span class="cam-title">📡 Comms </span>
          <span class="cam-status">Dish: Operational (Online)</span>
        </button>

        <button class="hab-cam-btn" data-cam="airlock">
          <span class="cam-id">CAM 04</span>
          <span class="cam-title">🚪 Oxygen & Rover</span>
          <span class="cam-status" id="status-cam-airlock" style="color:#ff5252; font-weight:700;">Status: Prep Incomplete</span>
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

  let activeCam = null;
  let solarCalibrated = false;

  // Station overview screen (shown before any camera feed is selected)
  function renderOverview() {
    activeCam = null;
    camButtons.forEach(btn => btn.classList.remove('active'));
    viewscreen.innerHTML = `
      <div style="padding:10px 14px; font-family:system-ui,sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1a365d; padding-bottom:8px; margin-bottom:12px;">
          <b style="color:#00e5ff; font-size:1.05rem; letter-spacing:0.05em;">🛰️ HABITAT CENTRAL MONITOR // JEZERO OUTPOST</b>
          <span style="font-family:monospace; color:#4caf50;">ONLINE • UTC TELEMETRY</span>
        </div>
        <p style="color:#cfd8dc; font-size:0.92rem; margin-bottom:14px;">
          Base systems are operating under baseline autonomous routines. Exterior temperature is <b>${temp.currentAvg}°C</b>.
          Select a camera feed above to inspect module telemetry or calibrate station arrays.
        </p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-family:monospace; font-size:0.85rem;">
          <div style="background:#040c17; border:1px solid #1f3a60; border-radius:6px; padding:8px 12px;">
            <span style="color:#ffd54f; font-weight:700;">☀️ CAM 01: SOLAR POWER</span><br>
            <span style="color:#80cbc4; font-size:0.78rem;">Status: Awaiting Calibration (50%)</span>
          </div>
          <div style="background:#040c17; border:1px solid #1f3a60; border-radius:6px; padding:8px 12px;">
            <span style="color:#81c784; font-weight:700;">🥔 CAM 02: PLANT WATERING</span><br>
            <span style="color:#80cbc4; font-size:0.78rem;">Status: Soil Moisture 38% (Low)</span>
          </div>
          <div style="background:#040c17; border:1px solid #1f3a60; border-radius:6px; padding:8px 12px;">
            <span style="color:#64b5f6; font-weight:700;">📡 CAM 03: COMMS</span><br>
            <span style="color:#80cbc4; font-size:0.78rem;">Status: DSN Locked (14.2m delay)</span>
          </div>
          <div style="background:#040c17; border:1px solid #1f3a60; border-radius:6px; padding:8px 12px;">
            <span style="color:#ffb74d; font-weight:700;">🚪 CAM 04: OXYGEN & ROVER</span><br>
            <span style="color:#80cbc4; font-size:0.78rem;">Status: Pre-Egress Checklist</span>
          </div>
        </div>
        <div style="margin-top:14px; color:#ffd54f; font-family:monospace; font-size:0.85rem; text-align:center;">
          👆 Click a camera button above to switch feeds.
        </div>
      </div>
    `;
  }

  // Station render logic
  function renderCamView(cam, force = false) {
    if (!force && activeCam === cam) return;
    activeCam = cam;
    camButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.cam === cam));

    if (cam === 'solar') {
      if (!solarCalibrated) {
        viewscreen.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <b style="color:#ff9a4d; font-size:1.05rem;">☀️ CAM 01: EXTERIOR SOLAR ARRAY</b>
            <span style="font-family:monospace; color:#ffd54f;">SUN AZ: ${sun.azimuth}° | EL: ${sun.elevation}°</span>
          </div>
          <p>The sun is rising over Jezero Crater (Outside: <b>${temp.currentAvg}°C</b>). The solar panel is currently unaligned on auto-mode. Battery reserves are at <b>${state.power}%</b>.</p>
          <p style="font-size:.88rem; color:#80cbc4;">Calibrating the panel angles toward NASA's solar panel captures max solar flux, charging batteries faster so water pumps can hydrate the indoor potato crops.</p>

          <div class="choices" style="margin-top:14px;">
            <button class="choice-btn" id="hub-btn-1a">
              <span class="label">Option 1A — Engage Manual Alignment Minigame</span>
              Align the panel with the Sun's real-time position. (Risk: &lt;30% incurs -15% motor drain penalty; 100% gives +25% power).
            </button>
            <button class="choice-btn" id="hub-btn-1b">
              <span class="label">Option 1B — Quick Start (Leave Auto-Mode)</span>
              Leave panels on auto-mode and head straight to the oxygen system. Power stays at 50%, but you gain +30 min daylight.
            </button>
          </div>
        `;
        wireChoiceButtons();
      } else {
        viewscreen.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <b style="color:#00e5ff; font-size:1.05rem;">☀️ CAM 01: EXTERIOR SOLAR POWER [CALIBRATED]</b>
            <span style="font-family:monospace; color:#4caf50;">STATUS: ACTIVE</span>
          </div>
          <p>Solar calibration sequence completed based on NASA sun trajectory. Total Habitat Power: <b style="color:#00e5ff; font-size:1.1rem;">${state.power}%</b>.</p>
          <div class="tip" style="margin-top:10px;">
            <span>📋 System Status:</span> Power is being routed to life support and the water pumps. Check <b>CAM 04 (Airlock)</b> to cycle through to your mission!
          </div>
        `;
      }
    } else if (cam === 'hydro') {
      viewscreen.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <b style="color:#81c784; font-size:1.05rem;">🥔 CAM 02: PLANT FARM</b>
          <span style="font-family:monospace; color:#81c784;">BIOLOGY OSDR-44</span>
        </div>
        <p>Indoor potato crops are protected against the harsh Martian exterior (<b>${temp.currentAvg}°C</b>, Low: <b>${temp.currentMin}°C</b>, High: <b>${temp.currentMax}°C</b> from NASA InSight data). Grow lamps require steady electrical wattage.</p>

        <!-- Camera 02 Surveillance Feed (Farm Interior with Static Overlay) -->
        <div class="cam-preview-frame">
          <img src="assets/images/farm_interior.png" alt="Hydroponics Farm Interior Feed" class="cam-panning-img" />
          <img src="assets/videos/static-effect.gif" alt="Surveillance Feed Static Overlay" class="cam-static-overlay" />
          
          <div class="cam-hud-badge">
            <span class="cam-rec-dot"></span>
            <span>LIVE // CAM-02: BIO-DOME</span>
          </div>
          <div class="cam-hud-info">
            <span>NASA OSDR-44 • 1080p 24FPS</span>
          </div>
          <div class="cam-hud-bottom">
            <span>PTZ HORIZON SWEEP [AUTO]</span>
            <span>SECTOR: HYDROPONIC GREENHOUSE</span>
          </div>
        </div>

        <div style="background:#030810; padding:10px 14px; border-radius:8px; border:1px solid #1a365d; font-family:monospace; font-size:.85rem; margin-top:8px;">
          <div>SOIL HYDRATION: <b style="color:${state.power >= 55 ? '#4caf50' : '#ff9800'};">${state.power >= 55 ? 'OPTIMAL (Pumps Powered)' : 'DEFICIT (Awaiting Power)'}</b></div>
          <div>DOME HEATING SHIELD: <b style="color:#00e5ff;">+19.2°C (Controlled)</b> vs Exterior ${temp.currentAvg}°C</div>
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

        <!-- Camera 03 Surveillance Feed (Satellite Static View with Static Overlay) -->
        <div class="cam-preview-frame" style="border-color:#1976d2;">
          <img src="assets/images/satellite.jpg" alt="Deep Space Satellite Relay" class="cam-static-img" />
          <img src="assets/videos/static-effect.gif" alt="Surveillance Feed Static Overlay" class="cam-static-overlay" />
          
          <div class="cam-hud-badge" style="color:#00e5ff; border-color:rgba(0,229,255,0.4);">
            <span class="cam-rec-dot" style="background:#00e5ff; box-shadow:0 0 8px #00e5ff;"></span>
            <span>LIVE // CAM-03: ORBITAL SAT-LINK</span>
          </div>
          <div class="cam-hud-info">
            <span>NASA MRO RELAY • DSN 70M</span>
          </div>
          <div class="cam-hud-bottom">
            <span>TRANSMISSION: STATIC CARRIER LOCK</span>
            <span>POLAR ORBIT: 320 KM ALT</span>
          </div>
        </div>

        <div style="background:#030810; padding:10px 14px; border-radius:8px; border:1px solid #1a365d; font-family:monospace; font-size:.85rem; margin-top:8px;">
          <div>BASE LOCATION: <b>17.80514° N, 75.99765° E</b> (Jezero Crater)</div>
          <div>EARTH-MARS LIGHT DELAY: <b>~14.2 MINUTES</b></div>
          <div>ATMOSPHERIC PRESSURE: <b>${temp.currentPressure || 742} Pa</b> (InSight MEDA)</div>
          <div>SESSION TELEMETRY CACHE: <b>SYNCHRONIZED (UTC)</b></div>
        </div>
      `;
    } else if (cam === 'airlock') {
      if (!solarCalibrated) {
        viewscreen.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <b style="color:#ffb74d; font-size:1.05rem;">🚪 CAM 04: OXYGEN & ROVER BAY</b>
            <span style="font-family:monospace; color:#ff5252; font-weight:700;">PREPARATION REQUIRED</span>
          </div>
          <p>The pressurized exploration rover is docked. Outside temperature is cold at <b>${temp.currentAvg}°C</b>. Exploration gear is prepped with 11 kg water and 3.5 kg oxygen for the Jezero Crater trek.</p>

          <!-- Camera 04 Surveillance Feed (Rover Bay with Static Overlay) -->
          <div class="cam-preview-frame" style="border-color:#f57c00;">
            <img src="assets/images/rover.png" alt="Exploration Rover Bay" class="cam-static-img" style="object-fit:cover; background:#08131e;" />
            <img src="assets/videos/static-effect.gif" alt="Surveillance Feed Static Overlay" class="cam-static-overlay" />
            
            <div class="cam-hud-badge" style="color:#ffb74d; border-color:rgba(255,183,77,0.4);">
              <span class="cam-rec-dot" style="background:#ffb74d; box-shadow:0 0 8px #ffb74d;"></span>
              <span>LIVE // CAM-04: ROVER BAY</span>
            </div>
            <div class="cam-hud-info">
              <span>CABIN PRESSURE: 101.3 kPa</span>
            </div>
            <div class="cam-hud-bottom">
              <span>STATUS: DOCKED AT AIRLOCK 01</span>
              <span>LIFE SUPPORT: HOLD FOR POWER CHECK</span>
            </div>
          </div>

          <p style="color:#ffb74d;">⚠️ <i>Habitat power check is required before cycling the main airlock door. Select <b>CAM 01 (Solar Array)</b> to set or initiate quick start.</i></p>
        `;
      } else {
        viewscreen.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <b style="color:#4caf50; font-size:1.05rem;">🚪 CAM 04: OXYGEN & ROVER BAY [READY]</b>
            <span style="font-family:monospace; color:#4caf50;">CLEARANCE GRANTED</span>
          </div>
          <p>The outpost systems are stabilized. The rover oxygen system is pressurized and cleared for egress into Jezero Crater.</p>

          <!-- Camera 04 Surveillance Feed (Rover Bay with Static Overlay) -->
          <div class="cam-preview-frame" style="border-color:#4caf50;">
            <img src="assets/images/rover.png" alt="Exploration Rover Bay" class="cam-static-img" style="object-fit:cover; background:#08131e;" />
            <img src="assets/videos/static-effect.gif" alt="Surveillance Feed Static Overlay" class="cam-static-overlay" />
            
            <div class="cam-hud-badge" style="color:#76ff03; border-color:rgba(118,255,3,0.4);">
              <span class="cam-rec-dot" style="background:#76ff03; box-shadow:0 0 8px #76ff03;"></span>
              <span>LIVE // CAM-04: ROVER BAY</span>
            </div>
            <div class="cam-hud-info">
              <span>CABIN PRESSURE: 101.3 kPa (STABLE)</span>
            </div>
            <div class="cam-hud-bottom">
              <span>STATUS: READY FOR EGRESS</span>
              <span>HATCH: PRESSURIZED</span>
            </div>
          </div>

          <button class="choice-btn" id="hub-btn-depart" style="margin-top:14px; background:linear-gradient(135deg,#00695c,#00897b); font-size:1.05rem;">
            🚪 Cycle Oxygen System & Depart for Jezero Crater (Begin Sol 1 Trek) →
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

  // Render overview first (does not immediately open CAM 01)
  renderOverview();

  // Initial narrator speech
  await DadPhone.say({
    from: 'narrator',
    lines: [
      'Welcome to the Jezero Outpost Habitat Console.',
      `Live NASA connection synchronized: Outside temperature is ${temp.currentAvg}°C.`,
      'Check your station feeds. Select CAM 01 to align panels with the Sun\'s position.'
    ]
  });


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

        renderCamView('solar', true);

        if (result.failed) {
          await DadPhone.say({
            from: 'narrator',
            lines: [
              'Returning to the Habitat Hub.',
              `Power deficit recorded: ${state.power}%. Solar actuators took excessive strain.`,
              'Base systems are in energy-save mode. Head to CAM 04 (Airlock) to depart.'
            ]
          });
          await DadPhone.ring({
            from: 'dad',
            lines: [
              { from: 'dad', text: 'Hey kiddo, we see the actuator strain from out here in our field rover.' },
              { from: 'mom', text: 'Don\'t worry sweetie, our backup battery banks will hold. Keep your suit heaters conservative on your trek!' },
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
          await DadPhone.ring({
            from: 'dad',
            lines: [
              { from: 'dad', text: 'Look at that power readout, kiddo! Batteries are humming at peak efficiency.' },
              { from: 'mom', text: 'Telemetry confirmed from our rover console! Head to the airlock when you\'re ready. We love you!' },
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

        renderCamView('solar', true);

        await DadPhone.say({
          from: 'narrator',
          lines: [
            'Panels remain on auto-mode. Base power holds at 50%.',
            'You gained 30 extra minutes of daylight for the trek.',
            'Switch to CAM 04 (Airlock) to cycle through to Sol 1.'
          ]
        });

        await DadPhone.ring({
          from: 'dad',
          lines: [
            { from: 'dad', text: 'Sensible call saving time on calibration, kiddo!' },
            { from: 'mom', text: 'You’ve got 30 extra daylight minutes for the trek. Double-check your suit seals before cycling the airlock!' },
          ]
        });
      };
    }
  }

  // Await clicking the departure button in the airlock camera view
  await departurePromise;
}

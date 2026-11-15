// sols/sol-1.js — Act 2 & Act 3: Jezero Crater Detour & Night Dust Storm (Sol 1)
import { DadPhone } from '../shared/dadphone.js';
import { mountCliffClimb } from '../minigames/cliff-climb.js';

export async function mountSol1(container, state) {
  const temp = state.temperature || { currentAvg: -64.2, currentMin: -97.1, currentMax: -15.3, latestSol: '1222' };

  function renderHUD() {
    // Water and oxygen represented with visual bars rather than numbers
    const waterPct = Math.min(100, Math.max(0, (state.water / 7.0) * 100));
    const oxyPct = Math.min(100, Math.max(0, (state.oxygen / 2.5) * 100));
    const batPct = state.roverBattery !== undefined ? Math.min(100, Math.max(0, state.roverBattery)) : 100;

    return `
      <div id="hud-bar-container" style="max-width:680px; margin:0 auto 14px; background:#0a192f; border:1px solid #1f4068; border-radius:10px; padding:12px 16px; display:flex; flex-wrap:wrap; gap:16px; font-size:.88rem; align-items:center;">
        <div>⚡ Base: <b style="color:#00e5ff;">${state.power}%</b></div>
        
        <!-- Rover Battery Bar (Pixel Art matching lower minigame battery) -->
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-family:monospace; font-size:.78rem; color:#80cbc4;">🔋 ROVER:</span>
          <div style="display:flex; align-items:center;">
            <div style="
              width:56px; height:24px; border:3px solid #1b4320; border-radius:2px;
              background:#a4cca4; position:relative; padding:2px; display:flex; gap:3px;
              box-sizing:border-box;
            ">
              <div id="top-bat-seg-1" style="flex:1; background:${batPct > 0 ? (batPct > 25 ? '#38761d' : '#e65100') : 'transparent'}; border:1px solid #274e13; border-radius:1px; transition:background .2s;"></div>
              <div id="top-bat-seg-2" style="flex:1; background:${batPct > 25 ? '#38761d' : 'transparent'}; border:1px solid #274e13; border-radius:1px; transition:background .2s;"></div>
              <div id="top-bat-seg-3" style="flex:1; background:${batPct > 60 ? '#38761d' : 'transparent'}; border:1px solid #274e13; border-radius:1px; transition:background .2s;"></div>
            </div>
            <div style="width:4px; height:10px; background:#a4cca4; border:2px solid #1b4320; border-left:none; border-radius:0 2px 2px 0; margin-left:-1px;"></div>
          </div>
          <b id="top-battery-num" style="color:#00e5ff; font-family:monospace; font-size:.9rem;">${batPct}%</b>
        </div>

        <!-- Water Bar (Bar representation rather than numbers) -->
        <div style="display:flex; align-items:center; gap:8px;">
          <span>💧 Water:</span>
          <div title="Water Supply" style="width:100px; height:14px; background:#051528; border:1.5px solid #1976d2; border-radius:4px; padding:1px; overflow:hidden; box-shadow:inset 0 0 5px rgba(0,0,0,0.8);">
            <div style="width:${waterPct.toFixed(1)}%; height:100%; background:linear-gradient(90deg, #0288d1, #4fc3f7); border-radius:2px; transition:width .4s ease;"></div>
          </div>
        </div>

        <!-- Oxygen Bar (Bar representation rather than numbers) -->
        <div style="display:flex; align-items:center; gap:8px;">
          <span>🫁 Oxygen:</span>
          <div title="Oxygen Supply" style="width:100px; height:14px; background:#061e0e; border:1.5px solid #2e7d32; border-radius:4px; padding:1px; overflow:hidden; box-shadow:inset 0 0 5px rgba(0,0,0,0.8);">
            <div style="width:${oxyPct.toFixed(1)}%; height:100%; background:linear-gradient(90deg, #2e7d32, #81c784); border-radius:2px; transition:width .4s ease;"></div>
          </div>
        </div>

        <div>🌡️ Temp: <b style="color:#ffb74d;">${temp.currentAvg}°C</b></div>
        <div>📡 Comms: <b style="color:${state.communications ? '#4caf50' : '#f44336'};">${state.communications ? 'ONLINE' : 'OFFLINE'}</b></div>
      </div>
    `;
  }

  // --- MINIGAME: CLIFF-FACE ROVER CLIMB (1 MINUTE VERTICAL AUTOSCROLLER) ---
  // Occurs after Sol 0 airlock egress and before Node 2.0 (Neretva Vallis)
  container.innerHTML = `
    <div id="hud-bar">${renderHUD()}</div>
    <div id="cliff-minigame-wrapper"></div>
  `;

  await DadPhone.say({
    from: 'narrator',
    lines: [
      'Sol 1 begins. The rover rolls down the airlock ramp onto Martian regolith.',
      'Ahead lies the steep canyon ascent leading to the Jezero rim overlook.',
      'Dodge boulders and potholes! Watch out for rock cracks limiting your steering lane.',
      'Steer with Arrow Keys, A/D, or drag across the track. 2 hits maximum before battery failure!'
    ]
  });

  const cliffWrapper = container.querySelector('#cliff-minigame-wrapper');
  const climbResult = await mountCliffClimb(cliffWrapper, {
    durationSec: 60,
    initialBattery: state.power || 100
  });

  // Handle outcome & penalties (no retry permitted!)
  if (climbResult.survived) {
    state.roverBattery = climbResult.finalBattery;
  } else {
    // Fail state: no retry given with penalty
    state.roverBattery = 0;
    state.cliffFailed = true;
    const waterPenalty = 0.93;
    const oxyPenalty = 0.45;
    state.water = +(Math.max(1.0, state.water - waterPenalty)).toFixed(2);
    state.oxygen = +(Math.max(0.4, state.oxygen - oxyPenalty)).toFixed(2);
  }

  // IMMEDIATELY advance to the next section (Node 2.0: Neretva Vallis) so player is never left on the canvas!
  container.innerHTML = `
    <div id="hud-bar">${renderHUD()}</div>

    ${state.cliffFailed ? `
      <div style="background:#260d0d; border:2px solid #f44336; border-radius:8px; padding:12px 16px; margin-bottom:16px;">
        <b style="color:#ff5252; font-size:1.02rem;">⚠️ CLIFF-FACE ASCENT FAILURE — EMERGENCY RECOVERY PENALTY</b>
        <p style="margin:6px 0 0; font-size:.88rem; color:#ffcdd2;">
          The rover battery was completely drained during the cliff ascent. Manual emergency winch recovery was required to haul the rover onto the rim: <b>Water and Oxygen supplies were deducted</b>. Mission protocol forbids retries.
        </p>
      </div>
    ` : ''}

    <div class="scene" id="stage1-scene">
      <h1>🔴 Perseverance Challenge</h1>
      <p class="subtitle">Sol 1 · Jezero Crater & Neretva Vallis Exploration</p>
      <p>Before you lies <b>Neretva Vallis</b> — an ancient river channel within Jezero Crater known for previously being a large water canal. It is prime territory for potential life samples, traces of ice, and rock formations containing vital clues for alien life research.</p>
      <p>The standard baseline trip to retrieve the rover samples requires <b>5.58 kg of water</b> and <b>1.78 kg of oxygen</b>.</p>
    </div>

    <div class="scene" id="node2">
      <h2>Node 2.0 — The Travel Option</h2>
      <p>A longer travel option adds approximately <b>one hour</b> to the journey in exchange for exploring Neretva Vallis:</p>

      <div class="choices" id="stage1-choices">
        <button class="choice-btn" id="btn-choice-a">
          <span class="label">Option A — Explore Neretva Vallis Detour</span>
          Take the detour. Dig into tomorrow's water supply: takes an extra <b>1.86 kg of water</b> and <b>0.915 kg of oxygen</b>.
        </button>
        <button class="choice-btn" id="btn-choice-b">
          <span class="label">Option B — Stay on Direct Route</span>
          Continue directly on the trip without taking the detour. Conserve supplies, but possibly miss out on a major research opportunity.
        </button>
      </div>

      <div style="margin-top:14px; font-size:.82rem; opacity:.8;">
        Scientific References:<br>
        • <a href="https://ntrs.nasa.gov/api/citations/20190027563/downloads/20190027563.pdf" target="_blank" style="color:#00e5ff;">NASA NTRS: 20190027563.pdf</a><br>
        • <a href="https://science.nasa.gov/photojournal/nasas-perseverance-views-dust-at-neretva-vallis/" target="_blank" style="color:#00e5ff;">NASA Photojournal: Perseverance Views Dust at Neretva Vallis</a>
      </div>

      <div id="stage1-outcome"></div>
    </div>
  `;

  // Narrate outcome while already displaying Stage 1
  if (climbResult.survived) {
    await DadPhone.say({
      from: 'narrator',
      lines: [
        'Transit complete! You navigated the canyon and parked at Jezero Cliff Overlook.',
        `Rover battery holds at ${climbResult.finalBattery}%. Pressurization nominal as you step out onto the surface.`,
        'Ahead lies the geological expanse of Neretva Vallis.'
      ]
    });
  } else {
    await DadPhone.say({
      from: 'narrator',
      lines: [
        'CRITICAL ALERT: Rover battery was drained after obstacle impacts on the cliff ascent!',
        'Emergency winch protocol deployed to reach the overlook on auxiliary power.',
        'PENALTY APPLIED: Water and Oxygen supplies reduced for manual winch recovery.',
        'Mission protocol forbids retries. You step out onto the rim to proceed with the expedition.'
      ]
    });
  }

  await DadPhone.say({
    from: 'narrator',
    lines: [
      'Sol 1 begins. Jezero Crater spreads before your rover wheels.',
      'Neretva Vallis is nearby — an ancient water canal that may hold traces of ice and signs of past Martian life.',
      'Decide whether to take the extra hour detour and consume additional life support reserves.'
    ]
  });

  const stage1Choice = await new Promise((resolve) => {
    container.querySelector('#btn-choice-a').onclick = () => resolve('A');
    container.querySelector('#btn-choice-b').onclick = () => resolve('B');
  });

  container.querySelector('#stage1-choices').classList.add('hidden');
  const stage1OutcomeEl = container.querySelector('#stage1-outcome');

  if (stage1Choice === 'A') {
    state.choices.push('A');
    state.water = 3.72;
    state.oxygen = 0.865;
    state.iceSamples = true;
    state.research += 80;

    stage1OutcomeEl.innerHTML = `
      <div class="outcome">
        <b>Sample Acquired: Subsurface Ice & Channel Sediments!</b>
        <p>You took an extra 1.86 kg of water and 0.915 kg of oxygen, making the total water supply go down to <b>3.72 kg</b> and oxygen to <b>0.865 kg</b>, and you collected samples of ice.</p>
        <blockquote style="margin:8px 0; padding:8px 12px; border-left:3px solid #00e5ff; background:#08222b;">
          “Congrats you found a really good opportunity to show a side research opportunity on Mars based on intuition.”
        </blockquote>
        <button class="choice-btn" id="btn-proceed-storm" style="margin-top:12px;">→ Proceed to Evening Approach</button>
      </div>
    `;

    await DadPhone.say({
      from: 'narrator',
      lines: [
        'You took an extra 1.86 kg of water and 0.915 kg of oxygen.',
        'Total water supply down to 3.72 kg, oxygen to 0.865 kg. You collected prime samples of ice!',
        '“Congrats you found a really good opportunity to show a side research opportunity on Mars based on intuition.”'
      ]
    });
  } else {
    state.choices.push('B');
    state.water = 5.58;
    state.iceSamples = false;

    stage1OutcomeEl.innerHTML = `
      <div class="outcome">
        <b>Direct Route Preserved.</b>
        <p>You didn't take the extra route. Water stays at <b>5.58 kg</b> for the trip to go collect the rover samples.</p>
        <blockquote style="margin:8px 0; padding:8px 12px; border-left:3px solid #ff9a4d; background:#24190e;">
          “Missed out on a big research opportunity”
        </blockquote>
        <button class="choice-btn" id="btn-proceed-storm" style="margin-top:12px;">→ Proceed to Evening Approach</button>
      </div>
    `;

    await DadPhone.say({
      from: 'narrator',
      lines: [
        'You bypassed Neretva Vallis to conserve supplies.',
        'Water stays at 5.58 kg for the trip to collect the rover samples.',
        '“Missed out on a big research opportunity.”'
      ]
    });
  }

  container.querySelector('#hud-bar').innerHTML = renderHUD();

  await new Promise((resolve) => {
    container.querySelector('#btn-proceed-storm').onclick = resolve;
  });

  // --- STAGE 2: NIGHT DUST STORM APPROACH & SAMPLE DEPOT DECISION ---
  container.innerHTML = `
    <div id="hud-bar">${renderHUD()}</div>

    <div class="scene">
      <h1>🌪️ Approaching Night Dust Storm</h1>
      <p>You have retrieved the samples from the rover successfully! But daylight is fading fast, and a severe dust storm is approaching the base for the night.</p>
      <p>You know from a research paper your father was working on that dust storms on Mars commonly arrive at night. The trade-off is here: the storm is bearing down, winds are predicted to peak at <b>8 m/s</b> around midnight, and you must make a critical decision regarding the remaining sample rocks at the depot.</p>
    </div>

    <div class="scene">
      <h2>Node 2.1 — Night Storm Dilemma</h2>
      <p>Will you risk leaving the base to collect the rocks before wind storms scatter them, or shelter inside to safeguard the outpost?</p>

      <div class="choices" id="stage2-choices">
        <button class="choice-btn" id="btn-storm-a">
          <span class="label">Option A — Retrieve Rocks Before Storm</span>
          Head out to collect the remaining rocks from the depot before wind storms (reaching max 8 m/s) blow them away.
        </button>
        <button class="choice-btn" id="btn-storm-b">
          <span class="label">Option B — Shelter in Outpost</span>
          Stay for the night. Massive amounts of dust could compromise oxygen tanks or telecommunications if left unattended.
        </button>
      </div>

      <div id="stage2-outcome"></div>
    </div>
  `;

  await DadPhone.say({
    from: 'narrator',
    lines: [
      'Daylight is fading over Jezero Crater.',
      'A dense dust storm is closing in. Wind speeds will ramp up toward midnight.',
      'Choose: make a dash for the sample depot in high winds, or stay to protect habitat systems?'
    ]
  });

  const stormChoice = await new Promise((resolve) => {
    container.querySelector('#btn-storm-a').onclick = () => resolve('A');
    container.querySelector('#btn-storm-b').onclick = () => resolve('B');
  });

  container.querySelector('#stage2-choices').classList.add('hidden');
  const stage2OutcomeEl = container.querySelector('#stage2-outcome');

  const fullPath = stage1Choice + stormChoice; // AA, AB, BA, BB
  state.path = fullPath;
  state.choices.push(stormChoice);

  if (fullPath === 'AA') {
    // Stage 1 took detour (A), Stage 2 stayed in base (A in storm options = shelter)
    // Prompt specification:
    // AA) "You stay in the base, you are tired from the extra exercise from that day and you take that time to rest up and keep the outpost tidy during the storm in the night. But the rocks did move another half hour out of range."
    state.baseClean = true;
    state.rocksMovedMinutes = 30;
    state.communications = true;

    stage2OutcomeEl.innerHTML = `
      <div class="outcome">
        <b>Path AA: Sheltered in Base (Rest & Maintenance)</b>
        <p>You stay in the base; you are tired from the extra exercise from that day and take the time to rest up and keep the outpost tidy during the storm in the night. But the rocks did move another half hour out of range.</p>
        <blockquote style="margin:8px 0; padding:10px 14px; border-left:3px solid #ff9a4d; background:#1b1b24; font-size:.9rem;">
          “EVA crews could spend a considerable portion of their day maintaining outdoor equipment, leaving less time for science or exploration.”<br>
          <small style="color:#aaa;">— (Dust Storm Impacts on Human Mars Mission Equipment and Operations, M.A. Rucker)</small>
        </blockquote>
      </div>
    `;

    await DadPhone.say({
      from: 'narrator',
      lines: [
        'You stay inside the habitat.',
        'You are tired from the detour exercise, so you rest and keep equipment clean and maintained.',
        'The storm sweeps the depot outside — the rocks have moved another half hour out of range.'
      ]
    });

  } else if (fullPath === 'AB') {
    // Stage 1 took detour (A), Stage 2 went outside (B in storm options)
    // Prompt specification:
    // AB) "You decide to leave to try and get the samples before the storm at the Depot you get tired but return the remaining samples using another 2.30 kg of water and 1.00 kg of oxygen leaving the total to be 2.56 kg but the interior of the base is completely dusty and communications is not operational."
    state.water = 2.56;
    state.oxygen = 0.0; // Consumed 1.00 kg from 0.865 kg remaining!
    state.depotSamples = true;
    state.baseClean = false;
    state.communications = false;

    stage2OutcomeEl.innerHTML = `
      <div class="outcome" style="border-color:#ff5252;">
        <b style="color:#ff5252;">Path AB: Risky Depot Retrieval in Peak Wind</b>
        <p>You decide to leave to try and get the samples before the storm at the Depot. You get tired but return the remaining samples using another <b>2.30 kg of water</b> and <b>1.00 kg of oxygen</b> (leaving total water at <b>2.56 kg</b>).</p>
        <p style="color:#ff7043;">⚠️ The interior of the base is completely dusty and <b>communications is not operational</b>!</p>
        <blockquote style="margin:8px 0; padding:10px 14px; border-left:3px solid #00bcd4; background:#08222b; font-size:.9rem;">
          “After ~21.5 h, wind speeds gradually increased, peaking with a local maximum around Midnight.”<br>
          <small style="color:#aaa;">— (Winds at the Mars 2020 landing site. Part 1: Near-surface wind patterns at Jezero Crater, D. Viúdez-Moreiras et al.)</small>
        </blockquote>
      </div>
    `;

    await DadPhone.say({
      from: 'narrator',
      lines: [
        'You forced your way into the howling wind to secure the depot samples.',
        'Water consumed: 2.30 kg (2.56 kg remaining). Oxygen reserves depleted.',
        'You returned with the rocks, but sand infiltrated the airlock: communications are dead and systems are choked with dust.'
      ]
    });

  } else if (fullPath === 'BA') {
    // Stage 1 took direct route (B), Stage 2 sheltered in base (A)
    // Prompt specification:
    // BA) "You stay in the base and the rocks move another half hour travel distance away from the outpost but everything is clean in the outpost after the storm passes the night."
    state.baseClean = true;
    state.rocksMovedMinutes = 30;
    state.communications = true;

    stage2OutcomeEl.innerHTML = `
      <div class="outcome">
        <b>Path BA: Sheltered in Base (Pristine Systems)</b>
        <p>You stay in the base and the rocks move another half hour travel distance away from the outpost, but everything is clean in the outpost after the storm passes the night.</p>
        <blockquote style="margin:8px 0; padding:10px 14px; border-left:3px solid #00bcd4; background:#08222b; font-size:.9rem;">
          “After ~21.5 h, wind speeds gradually increased, peaking with a local maximum around Midnight.”<br>
          <small style="color:#aaa;">— (Winds at the Mars 2020 landing site. Part 1: Near-surface wind patterns at Jezero Crater, D. Viúdez-Moreiras et al.)</small>
        </blockquote>
      </div>
    `;

    await DadPhone.say({
      from: 'narrator',
      lines: [
        'You batten down the hatches and shelter in the habitat.',
        'The storm peaks around midnight. The depot samples are shifted 30 minutes farther away.',
        'Inside, communications remain online and all life support seals held clean.'
      ]
    });

  } else if (fullPath === 'BB') {
    // Stage 1 took direct route (B), Stage 2 went outside (B)
    // Prompt specification:
    // BB) "You go and take the risky mission to retrieve the rocks before the storm reaches its peak and succeed and use 2.3 kg of water and 1.00 kg of oxygen. But return to the base being all dirty, communications are not operational and communications not being operational."
    state.water = +(state.water - 2.3).toFixed(2); // 5.58 - 2.3 = 3.28 kg
    state.oxygen = +(Math.max(0, state.oxygen - 1.0)).toFixed(2);
    state.depotSamples = true;
    state.baseClean = false;
    state.communications = false;

    stage2OutcomeEl.innerHTML = `
      <div class="outcome" style="border-color:#ff5252;">
        <b style="color:#ff5252;">Path BB: Storm Sortie Success, Severe Base Infiltration</b>
        <p>You go and take the risky mission to retrieve the rocks before the storm reaches its peak and succeed, using <b>2.3 kg of water</b> and <b>1.00 kg of oxygen</b>. But you return to the base being all dirty, and <b>communications are not operational</b>.</p>
        <blockquote style="margin:8px 0; padding:10px 14px; border-left:3px solid #ff9a4d; background:#1b1b24; font-size:.9rem;">
          “EVA crews could spend a considerable portion of their day maintaining outdoor equipment, leaving less time for science or exploration.”<br>
          <small style="color:#aaa;">— (Dust Storm Impacts on Human Mars Mission Equipment and Operations, M.A. Rucker)</small>
        </blockquote>
      </div>
    `;

    await DadPhone.say({
      from: 'narrator',
      lines: [
        'You brave the gale and haul the depot rocks back before winds blow them away.',
        `Used 2.3 kg of water and 1.00 kg of oxygen. Water remaining: ${state.water} kg.`,
        'Fine Martian dust has fouled the habitat transceiver — telecommunications are completely down.'
      ]
    });
  }

  // Add proceed to Sol 2 button in the outcome
  const nextBtn = document.createElement('button');
  nextBtn.className = 'choice-btn';
  nextBtn.id = 'btn-proceed-sol2';
  nextBtn.style.marginTop = '14px';
  nextBtn.textContent = '→ Proceed to Sol 2: Day 2 Recovery & Satellite Uplink';
  stage2OutcomeEl.appendChild(nextBtn);

  container.querySelector('#hud-bar').innerHTML = renderHUD();

  await new Promise((resolve) => {
    nextBtn.onclick = resolve;
  });
}

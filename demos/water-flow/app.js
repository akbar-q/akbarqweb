/* WaterFlow mock app - Ras Al Khaimah, UAE */
(function() {
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  const state = {
    city: 'Ras Al Khaimah',
    dailyGoal: 600,
    todayLiters: 210,
    pointsToday: 85,
    badges: ['Drop Saver','Leak Hunter'],
    members: ['You'],
    activities: [],
    lowSupply: false,
    // Habit-to-hardware bridge: Water Credits power the AI watering
    waterCredits: 65,
    // Hardware telemetry mock
    pvIrradiance: 650, // W/m²
    pvPanelWattsNominal: 40, // W
    batteryVoltage: 6.0, // V
    batterySoc: 68, // %
    loadWatts: 25, // W
    controllerMode: 'MPPT',
    inverterEfficiency: 0.88, // fraction
    systemTemp: 38, // °C
  };

  const els = {
    app: document.getElementById('app'),
    splash: document.getElementById('splash'),
    todayLiters: document.getElementById('todayLiters'),
    goalLiters: document.getElementById('goalLiters'),
    points: document.getElementById('points'),
    meterFill: document.getElementById('meterFill'),
    meterTarget: document.getElementById('meterTarget'),
    badges: document.getElementById('badges'),
    members: document.getElementById('members'),
    memberName: document.getElementById('memberName'),
    addMember: document.getElementById('addMember'),
    activityList: document.getElementById('activityList'),
    settingsModal: document.getElementById('settingsModal'),
    inputDailyGoal: document.getElementById('inputDailyGoal'),
    inputCity: document.getElementById('inputCity'),
    openSettings: document.getElementById('openSettings'),
    startDemo: document.getElementById('startDemo'),
    saveSettings: document.getElementById('saveSettings'),
    closeSettings: document.getElementById('closeSettings'),
    simulateLowSupply: document.getElementById('simulateLowSupply'),
    alertBar: document.getElementById('alertBar'),
    dismissAlert: document.getElementById('dismissAlert'),
    demoOverlay: document.getElementById('demoOverlay'),
    demoText: document.getElementById('demoText'),
    skipDemo: document.getElementById('skipDemo'),
    // Telemetry elements
    irradianceSlider: document.getElementById('irradianceSlider'),
    loadSlider: document.getElementById('loadSlider'),
    irradianceVal: document.getElementById('irradianceVal'),
    loadVal: document.getElementById('loadVal'),
    pvOutput: document.getElementById('pvOutput'),
    batteryVoltage: document.getElementById('batteryVoltage'),
    batterySoc: document.getElementById('batterySoc'),
    controllerMode: document.getElementById('controllerMode'),
    inverterEff: document.getElementById('inverterEff'),
    systemTemp: document.getElementById('systemTemp'),
    socFill: document.getElementById('socFill'),

    // AI watering elements
    aiCard: document.getElementById('aiCard'),
    waterCredits: document.getElementById('waterCredits'),
    waterCreditsHint: document.getElementById('waterCreditsHint'),
    soilMoisture: document.getElementById('soilMoisture'),
    soilFill: document.getElementById('soilFill'),
    pumpState: document.getElementById('pumpState'),
    pumpFlow: document.getElementById('pumpFlow'),
    tankLevel: document.getElementById('tankLevel'),
    tankFill: document.getElementById('tankFill'),
    aiDecision: document.getElementById('aiDecision'),
    aiBoost: document.getElementById('aiBoost'),
    aiReset: document.getElementById('aiReset'),
  };

  // Load from localStorage
  const saved = localStorage.getItem('waterflow');
  if (saved) {
    try {
      Object.assign(state, JSON.parse(saved));
    } catch (e) {
      // Corrupt storage should never break the demo UX
      localStorage.removeItem('waterflow');
    }
  }

  function save() {
    localStorage.setItem('waterflow', JSON.stringify(state));
  }

  // ---------------------------------------------------------------------------
  // AI Watering (Arduino Solar Integrated Watering mock engine)
  // ---------------------------------------------------------------------------
  let asiw = null;
  let asiwUnsub = null;
  const asiwUi = {
    snapshot: null,
    lastSampleIso: null,
    decision: '—',
    lastApplied: {
      automationEnabled: null,
      moistureTargetPct: null,
      pumpMaxOnSec: null,
      cooldownSec: null,
      hysteresisPct: null,
    }
  };

  function ensureAsiwEngine() {
    if (!window.ASIW_MockEngine || !window.ASIW_MockEngine.createBrowserMockEngine) return null;
    if (asiw) return asiw;
    asiw = window.ASIW_MockEngine.createBrowserMockEngine();
    asiw.start();
    asiwUnsub = asiw.subscribe((evt) => {
      if (!evt || evt.type !== 'telemetry') return;
      asiwUi.snapshot = evt.payload && evt.payload.snapshot ? evt.payload.snapshot : null;
      const sample = evt.payload && evt.payload.sample ? evt.payload.sample : null;
      if (sample && sample.time) {
        // Spend credits based on real watered volume
        if (asiwUi.lastSampleIso) {
          const prev = new Date(asiwUi.lastSampleIso).getTime();
          const curr = new Date(sample.time).getTime();
          const dtSec = Math.max(0, (curr - prev) / 1000);
          const waterDeltaL = (sample.flowLpm || 0) / 60 * dtSec;
          if (waterDeltaL > 0) {
            // Water is valuable: spending makes the habit loop visible
            state.waterCredits = clamp(state.waterCredits - waterDeltaL * 6, 0, 160);
          }
        }
        asiwUi.lastSampleIso = sample.time;
      }

      if (els.aiCard) render();
    });
    return asiw;
  }

  function resetAsiw() {
    try {
      if (asiwUnsub) asiwUnsub();
      asiwUnsub = null;
      if (asiw) asiw.stop();
    } catch (e) {
      // ignore
    }
    asiw = null;
    asiwUi.snapshot = null;
    asiwUi.lastSampleIso = null;
    asiwUi.decision = '—';
    asiwUi.lastApplied = {
      automationEnabled: null,
      moistureTargetPct: null,
      pumpMaxOnSec: null,
      cooldownSec: null,
      hysteresisPct: null,
    };
    ensureAsiwEngine();
  }

  function applyAiPolicy() {
    if (!els.aiCard) return;
    const engine = ensureAsiwEngine();
    if (!engine) return;

    const snap = engine.snapshot();
    const credits = state.waterCredits;
    const points = state.pointsToday;

    const mode = credits < 18 ? 'Paused' : (credits < 55 ? 'Eco' : (credits < 105 ? 'Balanced' : 'Boost'));
    const automationEnabled = mode !== 'Paused';
    const pumpMaxOnSec = mode === 'Eco' ? 10 : (mode === 'Balanced' ? 18 : 26);

    // “AI” chooses target based on your habit score (credits/points)
    // Higher credits => plant can be kept happier; low credits => conserve.
    const target = clamp(50 + (credits - 50) / 10 + Math.min(8, points / 20), 35, 72);
    const hysteresisPct = 3;
    const cooldownSec = 22;

    // If a pump run would start while credits are empty, stop it.
    if (credits < 6 && snap.actuators && snap.actuators.pump && snap.actuators.pump.isOn) {
      engine.applyControl({ pump: 'off' });
      asiwUi.decision = 'AI paused watering: earn more Water Credits to keep the plant healthy.';
    }

    function applyIfChanged(key, value) {
      if (asiwUi.lastApplied[key] === value) return;
      asiwUi.lastApplied[key] = value;
      engine.applyControl({ [key]: value });
    }

    applyIfChanged('automationEnabled', automationEnabled);
    applyIfChanged('moistureTargetPct', target);
    applyIfChanged('pumpMaxOnSec', pumpMaxOnSec);
    applyIfChanged('cooldownSec', cooldownSec);
    applyIfChanged('hysteresisPct', hysteresisPct);

    // Friendly “why” string
    const moisture = snap.sensors ? snap.sensors.moisturePct : null;
    const pumpOn = snap.actuators && snap.actuators.pump ? snap.actuators.pump.isOn : false;
    if (!asiwUi.decision || asiwUi.decision === '—') {
      asiwUi.decision = `Mode: ${mode}. Target moisture: ${Math.round(target)}%. ${pumpOn ? 'Watering now.' : 'Monitoring soil.'}`;
    } else {
      // keep any explicit message for a moment; then revert
      setTimeout(() => {
        asiwUi.decision = `Mode: ${mode}. Target moisture: ${Math.round(target)}%. ${pumpOn ? 'Watering now.' : 'Monitoring soil.'}`;
        render();
      }, 3500);
    }

    // Keep UI reactive
    asiwUi.snapshot = snap;
  }

  // Splash animation and app reveal
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Animate splash out
      gsap.to('#splash .splash-inner', { y: -20, opacity: 0, duration: 0.4, ease: 'power2.out' });
      gsap.to('#splash', { opacity: 0, duration: 0.5, onComplete: () => {
        els.splash.classList.add('hidden');
        els.app.classList.remove('hidden');
        enterAnimations();
        render();
      } });
    }, 900);
  });

  function enterAnimations() {
    gsap.from('.topbar .brand', { y: -12, opacity: 0, duration: 0.4 });
    gsap.from('.meter-card', { y: 10, opacity: 0, duration: 0.5, delay: 0.1 });
    gsap.from('.context-card', { y: 10, opacity: 0, duration: 0.5, delay: 0.2 });
    gsap.utils.toArray('.card').forEach((c, i) => {
      gsap.from(c, { y: 14, opacity: 0, duration: 0.5, delay: 0.3 + i * 0.08 });
    });
  }

  function render() {
    els.todayLiters.textContent = `${state.todayLiters} L`;
    els.goalLiters.textContent = `${state.dailyGoal} L`;
    els.points.textContent = `+${state.pointsToday} pts`;
    const pct = Math.min(100, Math.round(state.todayLiters / state.dailyGoal * 100));
    els.meterFill.style.width = pct + '%';
    els.meterTarget.style.left = Math.min(100, 100) + '%';

    // badges
    els.badges.innerHTML = '';
    state.badges.forEach(b => {
      const el = document.createElement('span');
      el.className = 'badge';
      el.innerHTML = `<img src="assets/badge.svg" alt=""> ${b}`;
      els.badges.appendChild(el);
      gsap.from(el, { scale: 0.9, opacity: 0, duration: 0.3 });
    });

    // members
    els.members.innerHTML = '';
    state.members.forEach((m, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${m}</span> <button class="btn small ghost" data-remove="${idx}">Remove</button>`;
      els.members.appendChild(li);
    });

    // activity
    els.activityList.innerHTML = '';
    state.activities.slice().reverse().forEach(a => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${a.label}</span><span>${a.liters} L</span>`;
      els.activityList.appendChild(li);
    });

    // Alert
    els.alertBar.classList.toggle('hidden', !state.lowSupply);

    // Telemetry renders
    if (els.irradianceVal) {
      els.irradianceVal.textContent = `${state.pvIrradiance} W/m²`;
      els.loadVal.textContent = `${state.loadWatts} W`;
      const pvOut = computePvOutput();
      els.pvOutput.textContent = `${pvOut.toFixed(1)} W`;
      els.batteryVoltage.textContent = `${state.batteryVoltage.toFixed(2)} V`;
      els.batterySoc.textContent = `${Math.round(state.batterySoc)}%`;
      els.controllerMode.textContent = state.controllerMode;
      els.inverterEff.textContent = `${Math.round(state.inverterEfficiency*100)}%`;
      els.systemTemp.textContent = `${Math.round(state.systemTemp)}°C`;
      if (els.socFill) {
        els.socFill.style.width = Math.min(100, Math.max(0, state.batterySoc)) + '%';
        els.socFill.style.background = state.batterySoc < 25 ? 'linear-gradient(90deg,#ef4444,#f59e0b)' : 'linear-gradient(90deg,#10b981,#22d3ee)';
      }
    }

    // AI watering renders
    if (els.aiCard) {
      const engine = ensureAsiwEngine();
      const snap = asiwUi.snapshot || (engine ? engine.snapshot() : null);

      const credits = clamp(state.waterCredits || 0, 0, 160);
      els.waterCredits.textContent = `${Math.round(credits)} cr`;
      const goalBand = credits < 18 ? 'Low — complete a habit challenge' : (credits < 55 ? 'OK — conserve a bit more' : 'Good — AI can water comfortably');
      els.waterCreditsHint.textContent = goalBand;

      if (snap && snap.sensors && snap.actuators) {
        const m = clamp(snap.sensors.moisturePct || 0, 0, 100);
        const tank = clamp(snap.sensors.tankLevelPct || 0, 0, 100);
        const pumpOn = !!(snap.actuators.pump && snap.actuators.pump.isOn);
        const flow = snap.sensors.flowLpm || 0;

        els.soilMoisture.textContent = String(Math.round(m));
        els.soilFill.style.width = `${m}%`;
        els.soilFill.style.background = m < 35 ? 'linear-gradient(90deg,#ef4444,#f59e0b)' : 'linear-gradient(90deg,var(--primary),var(--accent))';

        els.tankLevel.textContent = String(Math.round(tank));
        els.tankFill.style.width = `${tank}%`;
        els.tankFill.style.background = tank < 15 ? 'linear-gradient(90deg,#ef4444,#f59e0b)' : 'linear-gradient(90deg,var(--primary),var(--accent))';

        els.pumpState.textContent = pumpOn ? 'ON' : 'OFF';
        els.pumpFlow.textContent = flow.toFixed(2);
      }

      if (els.aiDecision) els.aiDecision.textContent = asiwUi.decision || '—';
    }
  }

  // Weekly chart mock
  let weeklyChart;
  function renderChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    const data = mockWeekly();
    if (weeklyChart) weeklyChart.destroy();
    weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'],
        datasets: [{
          label: 'Liters',
          data,
          backgroundColor: 'rgba(34, 211, 238, 0.35)',
          borderRadius: 8,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8aa2b6' } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#8aa2b6' } }
        },
      }
    });
  }

  function mockWeekly() {
    const base = 550;
    return [base-80, base-60, base+30, base-20, base+10, base-50, base-10].map(n => Math.max(120, n));
  }

  // Telemetry chart
  let pvChart;
  const telemetryHistory = { labels: [], pv: [], load: [], soc: [] };
  function renderPvChart() {
    const canvas = document.getElementById('pvChart');
    if (!canvas) return;
    if (pvChart) pvChart.destroy();
    pvChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: telemetryHistory.labels,
        datasets: [
          { label: 'PV W', data: telemetryHistory.pv, borderColor: '#22d3ee', tension: 0.3 },
          { label: 'Load W', data: telemetryHistory.load, borderColor: '#f59e0b', tension: 0.3 },
          { label: 'Battery SoC %', data: telemetryHistory.soc, borderColor: '#10b981', tension: 0.3, yAxisID: 'y1' }
        ]
      },
      options: {
        plugins: { legend: { labels: { color: '#8aa2b6' } } },
        scales: {
          x: { ticks: { color: '#8aa2b6' }, grid: { display: false } },
          y: { position: 'left', ticks: { color: '#8aa2b6' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y1: { position: 'right', ticks: { color: '#8aa2b6' }, grid: { drawOnChartArea: false }, min: 0, max: 100 }
        }
      }
    });
  }

  function computePvOutput() {
    // Simple model: output = nominal * (irradiance / 1000) * panelEfficiency (0.72)
    return state.pvPanelWattsNominal * (state.pvIrradiance / 1000) * 0.72;
  }

  function updateTelemetry() {
    const pvOut = computePvOutput();
    const net = pvOut - state.loadWatts; // positive => charging
    // Battery SoC dynamics
    state.batterySoc += net * 0.005; // scale factor
    state.batterySoc = Math.min(100, Math.max(0, state.batterySoc));
    // Voltage approximation
    state.batteryVoltage = 5.8 + (state.batterySoc / 100) * 0.6; // 5.8V to 6.4V range
    // Temp drift
    state.systemTemp += (net > 0 ? 0.15 : 0.35) * (Math.random() - 0.4);
    state.systemTemp = Math.min(55, Math.max(30, state.systemTemp));
    // Controller mode changes
    state.controllerMode = pvOut < 5 ? 'Idle' : (net > 2 ? 'Bulk' : (net > 0 ? 'Absorb' : 'Discharge'));
    // History update
    const tsLabel = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
    telemetryHistory.labels.push(tsLabel);
    telemetryHistory.pv.push(Number(pvOut.toFixed(1)));
    telemetryHistory.load.push(state.loadWatts);
    telemetryHistory.soc.push(Math.round(state.batterySoc));
    if (telemetryHistory.labels.length > 20) {
      Object.keys(telemetryHistory).forEach(k => telemetryHistory[k].shift());
    }
    save();
    render();
    renderPvChart();
  }

  // Interactions
  document.querySelectorAll('[data-log]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-log');
      const map = { shower: 50, dishwasher: 15, laundry: 70 };
      const liters = map[type] || 20;
      const labelMap = { shower: 'Shower', dishwasher: 'Dishwasher', laundry: 'Laundry' };
      state.activities.push({ label: `${labelMap[type] || 'Activity'}`, liters, ts: Date.now() });
      state.todayLiters += liters;
      // points
      const pts = state.lowSupply ? 10 : 5;
      state.pointsToday += pts;

      // Credits: conserve to earn, waste to spend
      state.waterCredits = clamp((state.waterCredits || 0) - liters / 8, 0, 160);
      // badge rewards
      if (type === 'shower' && state.activities.filter(a=>a.label==='Shower').length === 3) {
        if (!state.badges.includes('Quick Shower Champ')) state.badges.push('Quick Shower Champ');
      }
      save();
      render();
      renderChart();
    });
  });

  document.querySelectorAll('[data-complete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-complete');
      let reward = 20;
      if (type === 'shower') reward = 30;
      state.pointsToday += reward;

      // Habits earn credits too (stronger effect than logging usage)
      const creditReward = (state.lowSupply ? 1.4 : 1) * (reward * 0.9);
      state.waterCredits = clamp((state.waterCredits || 0) + creditReward, 0, 160);
      if (type === 'laundry') {
        if (!state.badges.includes('Load Master')) state.badges.push('Load Master');
      }
      gsap.to(btn, { scale: 0.95, yoyo: true, repeat: 1, duration: 0.1 });
      save();
      render();
    });
  });

  els.addMember.addEventListener('click', () => {
    const name = (els.memberName.value || '').trim();
    if (!name) return;
    state.members.push(name);
    els.memberName.value = '';
    save();
    render();
  });

  els.members.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-remove]');
    if (!btn) return;
    const idx = parseInt(btn.getAttribute('data-remove'), 10);
    state.members.splice(idx, 1);
    save();
    render();
  });

  // Settings
  function openSettings() {
    els.inputDailyGoal.value = String(state.dailyGoal);
    els.inputCity.value = state.city;
    els.settingsModal.classList.remove('hidden');
    gsap.from('.modal-dialog', { y: 16, opacity: 0, duration: 0.25 });
  }
  function closeSettings() {
    els.settingsModal.classList.add('hidden');
  }
  els.openSettings.addEventListener('click', openSettings);
  els.closeSettings.addEventListener('click', closeSettings);
  els.saveSettings.addEventListener('click', () => {
    const goal = parseInt(els.inputDailyGoal.value, 10);
    if (!isNaN(goal) && goal >= 100) state.dailyGoal = goal;
    const city = (els.inputCity.value || '').trim();
    if (city) state.city = city;
    save();
    closeSettings();
    render();
    renderChart();
  });

  // Low supply simulation — playful alert
  els.simulateLowSupply.addEventListener('click', () => {
    state.lowSupply = true;
    // Bonus credits to make the demo feel rewarding
    state.waterCredits = clamp((state.waterCredits || 0) + 12, 0, 160);
    save();
    render();
    gsap.from('#alertBar', { y: 12, opacity: 0, duration: 0.25 });
  });
  els.dismissAlert.addEventListener('click', () => {
    state.lowSupply = false;
    save();
    render();
  });

  // Telemetry sliders
  if (els.irradianceSlider) {
    els.irradianceSlider.addEventListener('input', e => {
      state.pvIrradiance = parseInt(e.target.value, 10);
      save();
      render();
    });
  }
  if (els.loadSlider) {
    els.loadSlider.addEventListener('input', e => {
      state.loadWatts = parseInt(e.target.value, 10);
      save();
      render();
    });
  }

  // Settings usability improvements
  // Force hide modal on initial load if persisted (defensive)
  els.settingsModal.classList.add('hidden');
  // Backdrop click closes
  els.settingsModal.addEventListener('click', (e) => {
    if (e.target === els.settingsModal) closeSettings();
  });
  // ESC key closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.settingsModal.classList.contains('hidden')) {
      closeSettings();
    }
  });

  // Carousel tips subtle animation
  const tips = document.getElementById('tipsCarousel');
  if (tips) {
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % tips.children.length;
      Array.from(tips.children).forEach((li, i) => {
        li.style.opacity = (i === idx) ? 1 : 0.35;
      });
    }, 3000);
  }

  // Initial chart render
  renderChart();
  renderPvChart();
  // Periodic telemetry updates
  setInterval(updateTelemetry, 4000);

  // AI loop (fast enough to feel alive)
  ensureAsiwEngine();
  setInterval(() => {
    applyAiPolicy();
    save();
  }, 1200);

  // AI actions
  if (els.aiBoost) {
    els.aiBoost.addEventListener('click', () => {
      const engine = ensureAsiwEngine();
      if (!engine) return;
      if ((state.waterCredits || 0) < 12) {
        asiwUi.decision = 'Not enough credits to boost — complete a habit challenge.';
        render();
        return;
      }
      state.waterCredits = clamp(state.waterCredits - 12, 0, 160);
      engine.applyControl({ pumpMaxOnSec: 14, pump: 'on' });
      asiwUi.decision = 'Boosting plant now (credits spent).';
      save();
      render();
    });
  }
  if (els.aiReset) {
    els.aiReset.addEventListener('click', () => {
      state.waterCredits = 65;
      resetAsiw();
      asiwUi.decision = 'Plant reset. Try earning credits again.';
      save();
      render();
    });
  }

  // ---------------------------------------------------------------------------
  // Demo Mode (self-presenting tour)
  // ---------------------------------------------------------------------------
  let demoRunning = false;
  let demoCanceled = false;

  function clearDemoFocus() {
    document.querySelectorAll('.demo-focus').forEach(el => el.classList.remove('demo-focus'));
  }

  function focusEl(selector) {
    clearDemoFocus();
    const el = document.querySelector(selector);
    if (!el) return null;
    el.classList.add('demo-focus');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return el;
  }

  function setDemoText(text) {
    if (!els.demoText) return;
    els.demoText.textContent = text;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runDemo() {
    if (demoRunning) return;
    demoRunning = true;
    demoCanceled = false;
    if (els.demoOverlay) els.demoOverlay.classList.remove('hidden');

    setDemoText('Two systems, one habit loop: save water → earn credits → power smart watering.');
    focusEl('#usageCard');
    await sleep(9000);
    if (demoCanceled) return stopDemo();

    setDemoText('This is your daily score. Logging high-usage habits spends credits.');
    focusEl('#activityCard');
    // simulate a quick log
    const logBtn = document.querySelector('[data-log="shower"]');
    if (logBtn) logBtn.click();
    await sleep(11000);
    if (demoCanceled) return stopDemo();

    setDemoText('Now flip it: completing a challenge earns points AND Water Credits.');
    focusEl('#gamificationCard');
    const completeBtn = document.querySelector('[data-complete="shower"]');
    if (completeBtn) completeBtn.click();
    await sleep(11000);
    if (demoCanceled) return stopDemo();

    setDemoText('Credits unlock the AI watering system. Watch the plant’s soil + tank + pump.');
    focusEl('#aiCard');
    await sleep(8000);
    if (demoCanceled) return stopDemo();

    setDemoText('Boost demo: spend credits to water now (you can do this manually too).');
    const boostBtn = els.aiBoost;
    if (boostBtn) boostBtn.click();
    await sleep(12000);
    if (demoCanceled) return stopDemo();

    setDemoText('Solar/battery constraints still apply: the AI is conservative when resources are low.');
    focusEl('#telemetryCard');
    await sleep(12000);
    if (demoCanceled) return stopDemo();

    setDemoText('Repeatable habit loop: tiny actions, tiny rewards, better routines. Demo will keep running.');
    focusEl('#aiCard');
    await sleep(16000);

    // Keep it lightly alive (no infinite looping)
    stopDemo();
  }

  function stopDemo() {
    demoCanceled = true;
    demoRunning = false;
    clearDemoFocus();
    if (els.demoOverlay) els.demoOverlay.classList.add('hidden');
    setDemoText('—');
  }

  if (els.skipDemo) {
    els.skipDemo.addEventListener('click', stopDemo);
  }
  if (els.startDemo) {
    els.startDemo.addEventListener('click', runDemo);
  }

  // Autostart demo if not interacted (short-attention-span friendly)
  let userInteracted = false;
  ['click', 'keydown', 'pointerdown', 'touchstart'].forEach(ev => {
    window.addEventListener(ev, () => { userInteracted = true; }, { once: true, passive: true });
  });

  window.addEventListener('load', () => {
    const url = new URL(window.location.href);
    const wantsDemo = url.searchParams.get('demo') === '1';
    setTimeout(() => {
      if (wantsDemo || !userInteracted) runDemo();
    }, 1400);
  });
})();


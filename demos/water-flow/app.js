/* WaterFlow mock app - Ras Al Khaimah, UAE */
(function() {
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  const hasGsap = () => typeof window.gsap !== 'undefined' && window.gsap && typeof window.gsap.to === 'function';
  const hasChart = () => typeof window.Chart !== 'undefined' && window.Chart;

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
    assistantBar: document.getElementById('assistantBar'),
    assistantText: document.getElementById('assistantText'),
    assistantNext: document.getElementById('assistantNext'),
    assistantHide: document.getElementById('assistantHide'),
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

    // Mini game
    gameCard: document.getElementById('gameCard'),
    pipeGrid: document.getElementById('pipeGrid'),
    gameLevel: document.getElementById('gameLevel'),
    gameHint: document.getElementById('gameHint'),
    gameStatus: document.getElementById('gameStatus'),
    gameReset: document.getElementById('gameReset'),
    gameNext: document.getElementById('gameNext'),
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
      const finish = () => {
        if (els.splash) els.splash.classList.add('hidden');
        if (els.splash) els.splash.style.pointerEvents = 'none';
        if (els.app) els.app.classList.remove('hidden');
        enterAnimations();
        render();
      };

      // Animate splash out (fallback to instant if GSAP not available)
      if (hasGsap()) {
        window.gsap.to('#splash .splash-inner', { y: -20, opacity: 0, duration: 0.4, ease: 'power2.out' });
        window.gsap.to('#splash', { opacity: 0, duration: 0.5, onComplete: finish });
      } else {
        // Avoid an invisible full-screen overlay blocking clicks
        finish();
      }
    }, 900);

    // Failsafe: if anything went wrong, force-unblock clicks.
    setTimeout(() => {
      try {
        if (els.app) els.app.classList.remove('hidden');
        if (els.splash) {
          els.splash.classList.add('hidden');
          els.splash.style.pointerEvents = 'none';
          els.splash.style.display = 'none';
        }
        document.body.style.pointerEvents = 'auto';
      } catch (e) {
        // ignore
      }
    }, 2500);
  });

  function enterAnimations() {
    if (!hasGsap()) return;
    window.gsap.from('.topbar .brand', { y: -12, opacity: 0, duration: 0.4 });
    window.gsap.from('.meter-card', { y: 10, opacity: 0, duration: 0.5, delay: 0.1 });
    window.gsap.from('.context-card', { y: 10, opacity: 0, duration: 0.5, delay: 0.2 });
    window.gsap.utils.toArray('.card').forEach((c, i) => {
      window.gsap.from(c, { y: 14, opacity: 0, duration: 0.5, delay: 0.3 + i * 0.08 });
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
      if (hasGsap()) window.gsap.from(el, { scale: 0.9, opacity: 0, duration: 0.3 });
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
    if (els.assistantBar) {
      els.assistantBar.classList.toggle('with-alert', !!state.lowSupply);
    }

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
    if (!hasChart()) return;
    const data = mockWeekly();
    if (weeklyChart) weeklyChart.destroy();
    weeklyChart = new window.Chart(ctx, {
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
    if (!hasChart()) return;
    if (pvChart) pvChart.destroy();
    pvChart = new window.Chart(canvas, {
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
      if (hasGsap()) window.gsap.to(btn, { scale: 0.95, yoyo: true, repeat: 1, duration: 0.1 });
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
    if (hasGsap()) window.gsap.from('.modal-dialog', { y: 16, opacity: 0, duration: 0.25 });
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
  if (els.simulateLowSupply) els.simulateLowSupply.addEventListener('click', () => {
    state.lowSupply = true;
    // Bonus credits to make the demo feel rewarding
    state.waterCredits = clamp((state.waterCredits || 0) + 12, 0, 160);
    save();
    render();
    if (hasGsap()) window.gsap.from('#alertBar', { y: 12, opacity: 0, duration: 0.25 });
  });
  if (els.dismissAlert) els.dismissAlert.addEventListener('click', () => {
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
  // AquaGuide (AI assistant text bar)
  // ---------------------------------------------------------------------------
  let guideStepIdx = 0;
  let guideAuto = false;
  let guideTimer = null;

  const guideSteps = [
    {
      text: 'Hi, I\'m AquaGuide (AI). Quick tour: your habits earn Water Credits that power smart watering.',
      focus: '#usageCard'
    },
    {
      text: 'Logging high-usage actions spends Water Credits. Try: “Log Shower (50L)”.',
      focus: '#activityCard',
      action() {
        const btn = document.querySelector('[data-log="shower"]');
        if (btn) btn.click();
      }
    },
    {
      text: 'Completing challenges earns points + Water Credits. Try completing “5-minute showers”.',
      focus: '#gamificationCard',
      action() {
        const btn = document.querySelector('[data-complete="shower"]');
        if (btn) btn.click();
      }
    },
    {
      text: 'These credits unlock the AI watering loop. Watch soil moisture, tank, and pump decisions.',
      focus: '#aiCard'
    },
    {
      text: 'Mini-game break: solve the pipe puzzle to earn bonus Water Credits.',
      focus: '#gameCard'
    },
    {
      text: 'That\'s the loop: tiny actions → tiny rewards → better habits → healthier plants.',
      focus: '#aiCard'
    }
  ];

  function clearGuideFocus() {
    document.querySelectorAll('.demo-focus').forEach(el => el.classList.remove('demo-focus'));
  }

  function focusGuide(selector) {
    clearGuideFocus();
    const el = selector ? document.querySelector(selector) : null;
    if (!el) return;
    el.classList.add('demo-focus');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setAssistantText(text) {
    if (!els.assistantText) return;
    els.assistantText.textContent = text;
  }

  function showGuideStep(idx, { runAction } = { runAction: true }) {
    const s = guideSteps[idx];
    if (!s) return;
    guideStepIdx = idx;
    setAssistantText(s.text);
    if (s.focus) focusGuide(s.focus);
    if (runAction && typeof s.action === 'function') s.action();
  }

  function stopGuideAuto() {
    guideAuto = false;
    if (guideTimer) {
      clearTimeout(guideTimer);
      guideTimer = null;
    }
  }

  function runGuideAuto() {
    stopGuideAuto();
    guideAuto = true;
    const scheduleNext = () => {
      if (!guideAuto) return;
      guideTimer = setTimeout(() => {
        const next = Math.min(guideSteps.length - 1, guideStepIdx + 1);
        showGuideStep(next);
        if (next < guideSteps.length - 1) scheduleNext();
        else stopGuideAuto();
      }, 9500);
    };
    scheduleNext();
  }

  if (els.assistantNext) {
    els.assistantNext.addEventListener('click', () => {
      stopGuideAuto();
      const next = Math.min(guideSteps.length - 1, guideStepIdx + 1);
      showGuideStep(next);
    });
  }
  if (els.assistantHide) {
    els.assistantHide.addEventListener('click', () => {
      stopGuideAuto();
      clearGuideFocus();
      if (els.assistantBar) els.assistantBar.classList.toggle('hidden');
    });
  }

  if (els.startDemo) {
    els.startDemo.addEventListener('click', () => {
      if (els.assistantBar && els.assistantBar.classList.contains('hidden')) {
        els.assistantBar.classList.remove('hidden');
      }
      showGuideStep(0, { runAction: false });
      runGuideAuto();
    });
  }

  // Autostart the guide unless the user already interacted
  let userInteracted = false;
  ['click', 'keydown', 'pointerdown', 'touchstart'].forEach(ev => {
    window.addEventListener(ev, () => { userInteracted = true; }, { once: true, passive: true });
  });
  window.addEventListener('load', () => {
    const url = new URL(window.location.href);
    const wantsDemo = url.searchParams.get('demo') === '1';
    setTimeout(() => {
      if (wantsDemo || !userInteracted) {
        if (els.assistantBar) els.assistantBar.classList.remove('hidden');
        showGuideStep(0, { runAction: false });
        runGuideAuto();
      }
    }, 1400);
  });

  // Contextual “AI-ish” nudges (when not in auto tour)
  setInterval(() => {
    if (!els.assistantBar || els.assistantBar.classList.contains('hidden')) return;
    if (guideAuto) return;
    const credits = clamp(state.waterCredits || 0, 0, 160);
    if (state.lowSupply) {
      setAssistantText('Low supply mode: points + credits are boosted. Complete a challenge for a quick win.');
      return;
    }
    if (credits < 18) {
      setAssistantText('Tip: Water Credits are low — complete a habit challenge to re-enable stronger AI watering.');
      return;
    }
  }, 8000);

  // ---------------------------------------------------------------------------
  // Mini game: Pipe Puzzle (Where\'s-my-water inspired)
  // ---------------------------------------------------------------------------
  const DIRS = ['N', 'E', 'S', 'W'];
  const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
  const VEC = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

  function tileEdges(tile) {
    if (!tile) return [];
    const r = ((tile.rot || 0) % 4 + 4) % 4;
    if (tile.type === 'S') {
      return r % 2 === 0 ? ['N', 'S'] : ['E', 'W'];
    }
    if (tile.type === 'L') {
      // base: N + E
      const map = [
        ['N', 'E'],
        ['E', 'S'],
        ['S', 'W'],
        ['W', 'N']
      ];
      return map[r];
    }
    return [];
  }

  const levels = [
    {
      w: 5,
      h: 5,
      source: [0, 2],
      target: [4, 2],
      hint: 'Warm-up. Short path, few turns.',
      tiles: [
        null, null, null, null, null,
        null, { type: 'L', rot: 1 }, { type: 'S', rot: 1 }, { type: 'L', rot: 2 }, null,
        'SRC', { type: 'S', rot: 1 }, null, { type: 'S', rot: 1 }, 'TGT',
        null, { type: 'L', rot: 0 }, { type: 'S', rot: 1 }, { type: 'L', rot: 3 }, null,
        null, null, null, null, null,
      ]
    },
    {
      w: 5,
      h: 5,
      source: [0, 1],
      target: [4, 3],
      hint: 'Two bends. Keep the flow connected.',
      tiles: [
        null, null, null, null, null,
        'SRC', { type: 'L', rot: 2 }, { type: 'S', rot: 0 }, { type: 'L', rot: 1 }, null,
        null, { type: 'S', rot: 1 }, null, { type: 'S', rot: 1 }, null,
        null, { type: 'L', rot: 0 }, { type: 'S', rot: 1 }, { type: 'L', rot: 3 }, 'TGT',
        null, null, null, null, null,
      ]
    },
    {
      w: 5,
      h: 5,
      source: [0, 2],
      target: [4, 2],
      hint: 'A bit longer. Rotate until the path clicks.',
      tiles: [
        null, { type: 'L', rot: 0 }, { type: 'S', rot: 1 }, { type: 'L', rot: 3 }, null,
        null, { type: 'S', rot: 0 }, null, { type: 'S', rot: 0 }, null,
        'SRC', { type: 'L', rot: 1 }, { type: 'S', rot: 1 }, { type: 'L', rot: 2 }, 'TGT',
        null, { type: 'S', rot: 0 }, null, { type: 'S', rot: 0 }, null,
        null, { type: 'L', rot: 2 }, { type: 'S', rot: 1 }, { type: 'L', rot: 1 }, null,
      ]
    }
  ];

  let gameLevelIdx = 0;
  let gameTiles = [];
  let gameSolved = false;

  function idxOf(x, y, w) {
    return y * w + x;
  }

  function cloneLevelTiles(level) {
    return level.tiles.map((t) => {
      if (!t || t === 'SRC' || t === 'TGT') return t;
      return { type: t.type, rot: t.rot };
    });
  }

  function svgForTile(tile, highlightEdges) {
    const size = 44;
    const c = 22;
    const edges = tileEdges(tile);
    const active = new Set(highlightEdges || []);

    function edgePoint(d) {
      if (d === 'N') return [c, 6];
      if (d === 'E') return [38, c];
      if (d === 'S') return [c, 38];
      return [6, c];
    }

    const lines = edges.map((d) => {
      const [x2, y2] = edgePoint(d);
      const dim = active.size ? (!active.has(d)) : false;
      return `<line class="pipe-line${dim ? ' dim' : ''}" x1="${c}" y1="${c}" x2="${x2}" y2="${y2}" />`;
    }).join('');

    return `
      <svg class="pipe-svg" viewBox="0 0 ${size} ${size}" aria-hidden="true">
        ${lines}
        <circle class="pipe-node" cx="${c}" cy="${c}" r="6" />
      </svg>
    `;
  }

  function computeFlowPath(level, tiles) {
    const w = level.w;
    const h = level.h;
    const src = level.source;
    const tgt = level.target;

    const srcKey = src[1] + ',' + src[0];
    const seen = new Set();
    const q = [{ x: src[0], y: src[1] }];
    seen.add(srcKey);

    // source provides flow to the east
    function tileAt(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return null;
      return tiles[idxOf(x, y, w)];
    }

    const flowEdges = new Map(); // key "x,y" -> Set(edges with flow)
    function addFlow(x, y, dir) {
      const k = `${x},${y}`;
      if (!flowEdges.has(k)) flowEdges.set(k, new Set());
      flowEdges.get(k).add(dir);
    }

    while (q.length) {
      const cur = q.shift();
      const x = cur.x;
      const y = cur.y;

      if (x === tgt[0] && y === tgt[1]) {
        // Reached target cell; connectivity validated by edge checks below
      }

      const here = tileAt(x, y);
      let edges = [];
      if (here === 'SRC') edges = ['E'];
      else if (here === 'TGT') edges = ['W'];
      else edges = tileEdges(here);

      for (const d of edges) {
        const [dx, dy] = VEC[d];
        const nx = x + dx;
        const ny = y + dy;
        const next = tileAt(nx, ny);
        if (!next) continue;

        let nextEdges = [];
        if (next === 'SRC') nextEdges = ['E'];
        else if (next === 'TGT') nextEdges = ['W'];
        else nextEdges = tileEdges(next);

        if (!nextEdges.includes(OPP[d])) continue;

        addFlow(x, y, d);
        addFlow(nx, ny, OPP[d]);

        const nk = `${nx},${ny}`;
        if (!seen.has(nk)) {
          seen.add(nk);
          q.push({ x: nx, y: ny });
        }
      }
    }

    return {
      flowEdges,
      reachedTarget: seen.has(`${tgt[0]},${tgt[1]}`)
    };
  }

  function renderGame() {
    if (!els.pipeGrid || !els.gameCard) return;
    const level = levels[gameLevelIdx];
    if (!level) return;

    if (els.gameLevel) els.gameLevel.textContent = `Level ${gameLevelIdx + 1} / ${levels.length}`;
    if (els.gameHint) els.gameHint.textContent = level.hint;

    const { flowEdges, reachedTarget } = computeFlowPath(level, gameTiles);
    gameSolved = !!reachedTarget;

    els.pipeGrid.style.gridTemplateColumns = `repeat(${level.w}, minmax(44px, 56px))`;
    els.pipeGrid.innerHTML = '';

    for (let y = 0; y < level.h; y++) {
      for (let x = 0; x < level.w; x++) {
        const t = gameTiles[idxOf(x, y, level.w)];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pipe-tile';
        btn.setAttribute('aria-label', `Tile ${x + 1}, ${y + 1}`);

        const key = `${x},${y}`;
        const edgesWithFlow = flowEdges.get(key) ? Array.from(flowEdges.get(key)) : [];

        if (t === 'SRC') {
          btn.classList.add('source');
          btn.innerHTML = svgForTile({ type: 'S', rot: 1 }, edgesWithFlow.length ? ['E'] : []);
          btn.setAttribute('aria-disabled', 'true');
          btn.disabled = true;
          btn.setAttribute('aria-label', 'Tap (water source)');
        } else if (t === 'TGT') {
          btn.classList.add('target');
          btn.innerHTML = svgForTile({ type: 'S', rot: 1 }, edgesWithFlow.length ? ['W'] : []);
          btn.setAttribute('aria-disabled', 'true');
          btn.disabled = true;
          btn.setAttribute('aria-label', 'Plant (target)');
        } else if (!t) {
          btn.setAttribute('aria-disabled', 'true');
          btn.disabled = true;
          btn.innerHTML = '<div style="opacity:0.25">•</div>';
        } else {
          btn.innerHTML = svgForTile(t, edgesWithFlow);
          btn.addEventListener('click', () => {
            if (gameSolved) return;
            t.rot = ((t.rot || 0) + 1) % 4;
            renderGame();
          });
        }

        if (gameSolved) btn.classList.add('solved');
        els.pipeGrid.appendChild(btn);
      }
    }

    if (els.gameNext) {
      els.gameNext.disabled = !gameSolved || gameLevelIdx >= levels.length - 1;
    }
    if (els.gameStatus) {
      els.gameStatus.textContent = gameSolved
        ? `Solved! +15 Water Credits unlocked.`
        : 'Click tiles to rotate.';
    }

    if (gameSolved) {
      // award once per level solve
      const key = `waterflow_game_solved_${gameLevelIdx}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        state.waterCredits = clamp((state.waterCredits || 0) + 15, 0, 160);
        state.pointsToday += 8;
        if (gameLevelIdx === levels.length - 1) {
          if (!state.badges.includes('Pipe Puzzle Pro')) state.badges.push('Pipe Puzzle Pro');
        }
        save();
        render();
      }
    }
  }

  function loadLevel(idx) {
    gameLevelIdx = clamp(idx, 0, levels.length - 1);
    gameTiles = cloneLevelTiles(levels[gameLevelIdx]);
    gameSolved = false;
    renderGame();
  }

  if (els.gameReset) {
    els.gameReset.addEventListener('click', () => {
      loadLevel(gameLevelIdx);
      if (els.gameStatus) els.gameStatus.textContent = 'Reset. Click tiles to rotate.';
    });
  }
  if (els.gameNext) {
    els.gameNext.addEventListener('click', () => {
      if (!gameSolved) return;
      loadLevel(gameLevelIdx + 1);
      if (els.gameStatus) els.gameStatus.textContent = 'New level. Click tiles to rotate.';
    });
  }

  // init game
  if (els.gameCard) loadLevel(0);
})();


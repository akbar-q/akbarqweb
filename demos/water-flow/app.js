/* WaterFlow mock app - Ras Al Khaimah, UAE */
(function() {
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function parseCssColorToRgb(input, fallbackHex) {
    const s = String(input || '').trim() || String(fallbackHex || '').trim();
    if (!s) return { r: 230, g: 238, b: 247 };
    if (s.startsWith('#')) {
      const hex = s.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return { r, g, b };
      }
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b };
      }
    }
    const m = s.match(/rgba?\(([^)]+)\)/i);
    if (m) {
      const parts = m[1].split(',').map(p => p.trim());
      const r = Math.round(Number(parts[0]));
      const g = Math.round(Number(parts[1]));
      const b = Math.round(Number(parts[2]));
      if ([r, g, b].every(v => Number.isFinite(v))) return { r, g, b };
    }
    return parseCssColorToRgb(fallbackHex || '#e6eef7');
  }

  function rgba(rgb, a) {
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${clamp(a, 0, 1)})`;
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

    // Weather
    weatherCard: document.getElementById('weatherCard'),
    weatherSky: document.getElementById('weatherSky'),
    weatherTemp: document.getElementById('weatherTemp'),
    weatherSummary: document.getElementById('weatherSummary'),
    weatherLocation: document.getElementById('weatherLocation'),
    weatherMeta: document.getElementById('weatherMeta'),
  };

  const theme = (() => {
    try {
      const css = getComputedStyle(document.documentElement);
      return {
        accent: parseCssColorToRgb(css.getPropertyValue('--accent'), '#22d3ee'),
        primary: parseCssColorToRgb(css.getPropertyValue('--primary'), '#38bdf8'),
        muted: parseCssColorToRgb(css.getPropertyValue('--muted'), '#94a3b8'),
      };
    } catch (e) {
      return {
        accent: parseCssColorToRgb('#22d3ee', '#22d3ee'),
        primary: parseCssColorToRgb('#38bdf8', '#38bdf8'),
        muted: parseCssColorToRgb('#94a3b8', '#94a3b8'),
      };
    }
  })();

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

  // Removed feature: low-supply alert mode. Ensure persisted values don't re-enable it.
  delete state.lowSupply;

  function save() {
    localStorage.setItem('waterflow', JSON.stringify(state));
  }

  // ---------------------------------------------------------------------------
  // Weather (animated cloudy sky)
  // ---------------------------------------------------------------------------
  const weatherState = {
    locationName: 'Ras Al Khaimah',
    // Ras Al Khaimah, UAE
    lat: 25.7895,
    lon: 55.9432,
    tempC: null,
    humidityPct: null,
    windKph: null,
    cloudCoverPct: 65,
    summary: 'Cloudy',
  };

  const prefersReducedMotion = (() => {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  })();

  function setWeatherUI() {
    if (!els.weatherCard) return;
    if (els.weatherLocation) els.weatherLocation.textContent = weatherState.locationName;
    if (els.weatherTemp) {
      els.weatherTemp.textContent = typeof weatherState.tempC === 'number'
        ? `${Math.round(weatherState.tempC)}°C`
        : '--°C';
    }
    if (els.weatherSummary) {
      els.weatherSummary.textContent = weatherState.summary || '—';
    }
    if (els.weatherMeta) {
      const wind = typeof weatherState.windKph === 'number' ? `${Math.round(weatherState.windKph)} km/h` : '-- km/h';
      const hum = typeof weatherState.humidityPct === 'number' ? `${Math.round(weatherState.humidityPct)}%` : '--%';
      els.weatherMeta.textContent = `Wind ${wind} • Humidity ${hum}`;
    }
  }

  async function fetchWeatherOpenMeteo(lat, lon) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m');
    url.searchParams.set('wind_speed_unit', 'kmh');
    url.searchParams.set('timezone', 'auto');

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`weather fetch failed: ${res.status}`);
    const json = await res.json();
    if (!json || !json.current) throw new Error('weather response missing current');
    return {
      tempC: json.current.temperature_2m,
      humidityPct: json.current.relative_humidity_2m,
      cloudCoverPct: json.current.cloud_cover,
      windKph: json.current.wind_speed_10m,
    };
  }

  function summarizeClouds(cloudPct) {
    if (cloudPct == null) return 'Cloudy';
    if (cloudPct < 20) return 'Clear';
    if (cloudPct < 45) return 'Partly cloudy';
    if (cloudPct < 70) return 'Cloudy';
    return 'Overcast';
  }

  function simulateWeather() {
    // Smooth, believable local demo values
    const t = Date.now() / 1000;
    const heat = (Math.sin(t / 75) + 1) / 2;
    // Ras Al Khaimah baseline (user requested ~22°C and ~60% humidity)
    weatherState.tempC = 21.5 + heat * 1.8;
    weatherState.humidityPct = 58 + (1 - heat) * 6;
    weatherState.windKph = 11 + Math.sin(t / 18) * 3.5;
    weatherState.cloudCoverPct = clamp(25 + Math.sin(t / 42) * 18, 5, 75);
    weatherState.summary = summarizeClouds(weatherState.cloudCoverPct);
  }

  function tickWeatherDisplayNoise() {
    // Keep numbers subtly moving so it looks alive.
    if (!els.weatherCard) return;
    if (typeof weatherState.tempC !== 'number') return;
    const t = Date.now() / 1000;
    const wobble = Math.sin(t / 3.2) * 0.25;
    const wobble2 = Math.sin(t / 4.6) * 0.18;
    const temp = weatherState.tempC + wobble;
    const hum = (weatherState.humidityPct ?? 60) + wobble2 * 3;
    const wind = (weatherState.windKph ?? 10) + Math.sin(t / 2.8) * 0.6;

    if (els.weatherTemp) els.weatherTemp.textContent = `${Math.round(temp)}°C`;
    if (els.weatherMeta) {
      els.weatherMeta.textContent = `Wind ${Math.max(0, Math.round(wind))} km/h • Humidity ${clamp(Math.round(hum), 30, 95)}%`;
    }
  }

  function startWeatherLoop() {
    if (!els.weatherCard) return;

    // Initial render quickly
    setWeatherUI();

    // Fetch live weather (fallback to simulated if blocked)
    (async () => {
      try {
        const w = await fetchWeatherOpenMeteo(weatherState.lat, weatherState.lon);
        weatherState.tempC = w.tempC;
        weatherState.humidityPct = w.humidityPct;
        weatherState.windKph = w.windKph;
        weatherState.cloudCoverPct = clamp(w.cloudCoverPct, 0, 100);
        weatherState.summary = summarizeClouds(weatherState.cloudCoverPct);
        setWeatherUI();
      } catch (e) {
        simulateWeather();
        setWeatherUI();
      }
    })();

    // Keep the UI feeling alive even if live fetch is blocked
    setInterval(() => {
      if (typeof weatherState.tempC !== 'number') {
        simulateWeather();
        setWeatherUI();
      }
    }, 4000);

    // Always keep displayed numbers gently moving
    setInterval(() => {
      if (prefersReducedMotion) return;
      tickWeatherDisplayNoise();
    }, 900);

    // Refresh live weather occasionally
    setInterval(async () => {
      try {
        const w = await fetchWeatherOpenMeteo(weatherState.lat, weatherState.lon);
        weatherState.tempC = w.tempC;
        weatherState.humidityPct = w.humidityPct;
        weatherState.windKph = w.windKph;
        weatherState.cloudCoverPct = clamp(w.cloudCoverPct, 0, 100);
        weatherState.summary = summarizeClouds(weatherState.cloudCoverPct);
        setWeatherUI();
      } catch (e) {
        // ignore
      }
    }, 120000);
  }

  function startCloudySky() {
    const canvas = els.weatherSky;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function parseCssColorToRgb(input, fallbackHex) {
      const s = String(input || '').trim() || String(fallbackHex || '').trim();
      if (!s) return { r: 230, g: 238, b: 247 };
      if (s.startsWith('#')) {
        const hex = s.slice(1);
        if (hex.length === 3) {
          const r = parseInt(hex[0] + hex[0], 16);
          const g = parseInt(hex[1] + hex[1], 16);
          const b = parseInt(hex[2] + hex[2], 16);
          return { r, g, b };
        }
        if (hex.length === 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          return { r, g, b };
        }
      }
      const m = s.match(/rgba?\(([^)]+)\)/i);
      if (m) {
        const parts = m[1].split(',').map(p => p.trim());
        const r = Math.round(Number(parts[0]));
        const g = Math.round(Number(parts[1]));
        const b = Math.round(Number(parts[2]));
        if ([r, g, b].every(v => Number.isFinite(v))) return { r, g, b };
      }
      return parseCssColorToRgb(fallbackHex || '#e6eef7');
    }

    function rgba(rgb, a) {
      const alpha = clamp(a, 0, 1);
      return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
    }

    const css = getComputedStyle(document.documentElement);
    const theme = {
      bg: parseCssColorToRgb(css.getPropertyValue('--bg'), '#0b0f13'),
      bgAlt: parseCssColorToRgb(css.getPropertyValue('--bg-alt'), '#0e141a'),
      text: parseCssColorToRgb(css.getPropertyValue('--text'), '#e6eef7'),
      primary: parseCssColorToRgb(css.getPropertyValue('--primary'), '#38bdf8'),
      accent: parseCssColorToRgb(css.getPropertyValue('--accent'), '#22d3ee'),
    };

    const clouds = [];
    function resetCloud(c) {
      const w = canvas.width;
      const h = canvas.height;
      c.x = Math.random() * w;
      c.y = (h * 0.20) + Math.random() * (h * 0.45);
      c.scale = 0.55 + Math.random() * 1.1;
      c.speed = 8 + Math.random() * 18;
      c.alpha = 0.12 + Math.random() * 0.18;
      c.depth = 0.6 + Math.random() * 0.8;
    }

    for (let i = 0; i < 16; i++) {
      const c = {};
      resetCloud(c);
      c.x = Math.random() * canvas.width;
      clouds.push(c);
    }

    let last = performance.now();

    function resizeToDisplay() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const targetW = Math.max(420, Math.floor(rect.width * dpr));
      const targetH = Math.max(160, Math.floor(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        // Re-seed cloud positions within new bounds
        clouds.forEach(resetCloud);
      }
    }

    function drawCloud(x, y, s, a) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.globalAlpha = a;

      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 70);
      grad.addColorStop(0, rgba(theme.text, 0.75));
      grad.addColorStop(1, rgba(theme.text, 0));
      ctx.fillStyle = grad;

      // soft puffs
      const puffs = [
        [-35, 0, 42],
        [-10, -18, 55],
        [22, -8, 48],
        [48, 6, 38],
        [8, 16, 60]
      ];
      for (const [px, py, r] of puffs) {
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function frame(now) {
      resizeToDisplay();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const w = canvas.width;
      const h = canvas.height;
      const cloudiness = clamp(weatherState.cloudCoverPct ?? 65, 0, 100) / 100;

      // sky gradient (uses theme base colors)
      ctx.clearRect(0, 0, w, h);
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, rgba(theme.bgAlt, 0.92));
      sky.addColorStop(1, rgba(theme.bg, 0.84));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // haze
      ctx.fillStyle = rgba(theme.accent, 0.06 + cloudiness * 0.07);
      ctx.fillRect(0, 0, w, h);

      // clouds
      const targetCount = Math.round(8 + cloudiness * 10);
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        const active = i < targetCount;
        c.x += (c.speed * (0.35 + cloudiness)) * dt * c.depth;
        if (c.x > w + 160) {
          c.x = -160;
          c.y = (h * 0.18) + Math.random() * (h * 0.5);
        }
        if (active) {
          const alpha = c.alpha * (0.55 + cloudiness);
          drawCloud(c.x, c.y, c.scale * (w / 920), alpha);
        }
      }

      // subtle shimmer
      ctx.fillStyle = rgba(theme.primary, 0.03);
      ctx.fillRect(0, h * 0.62, w, h * 0.38);

      requestAnimationFrame(frame);
    }

    window.addEventListener('resize', () => {
      // next frame will handle resize
    });

    requestAnimationFrame(frame);
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
    const prev = render._prev || (render._prev = { waterCredits: null, soil: null, tank: null, pointsToday: null, todayLiters: null, batterySoc: null });
    let lastSoil = null;
    let lastTank = null;

    els.todayLiters.textContent = `${state.todayLiters} L`;
    els.goalLiters.textContent = `${state.dailyGoal} L`;
    els.points.textContent = `+${state.pointsToday} pts`;

    if (!prefersReducedMotion) {
      // subtle "alive" motion on the main stats
      els.todayLiters.classList.add('live-wiggle');
      els.points.classList.add('value-pulse');
    }

    if (prev.todayLiters !== null && prev.todayLiters !== state.todayLiters && !prefersReducedMotion) {
      els.todayLiters.classList.remove('value-pop');
      void els.todayLiters.offsetWidth;
      els.todayLiters.classList.add('value-pop');
    }
    if (prev.pointsToday !== null && prev.pointsToday !== state.pointsToday && !prefersReducedMotion) {
      els.points.classList.remove('value-pop');
      void els.points.offsetWidth;
      els.points.classList.add('value-pop');
    }
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
    const activityFlash = render._activityFlash || (render._activityFlash = new Set());
    const list = state.activities.slice().reverse();
    list.forEach(a => {
      const li = document.createElement('li');
      const ts = a.ts ? new Date(a.ts) : new Date();
      const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const key = `${a.ts || ''}|${a.label}|${a.liters}`;
      li.innerHTML = `<span>${time} • ${a.label}</span><span>${a.liters} L</span>`;
      if (activityFlash.has(key)) li.classList.add('flash');
      els.activityList.appendChild(li);
    });

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
        els.socFill.style.background = state.batterySoc < 25 ? 'linear-gradient(90deg,var(--danger),var(--warn))' : 'linear-gradient(90deg,var(--success),var(--accent))';

        if (!prefersReducedMotion && prev.batterySoc !== null && Math.round(prev.batterySoc) !== Math.round(state.batterySoc)) {
          els.batterySoc.classList.remove('value-pop');
          void els.batterySoc.offsetWidth;
          els.batterySoc.classList.add('value-pop');
        }
      }
    }

    // AI watering renders
    if (els.aiCard) {
      const engine = ensureAsiwEngine();
      const snap = asiwUi.snapshot || (engine ? engine.snapshot() : null);

      const credits = clamp(state.waterCredits || 0, 0, 160);
      els.waterCredits.textContent = `${Math.round(credits)} cr`;
      if (!prefersReducedMotion) els.waterCredits.classList.add('value-pulse');

      if (prev.waterCredits !== null && Math.round(prev.waterCredits) !== Math.round(credits) && !prefersReducedMotion) {
        els.waterCredits.classList.remove('value-pop');
        void els.waterCredits.offsetWidth;
        els.waterCredits.classList.add('value-pop');
      }
      const goalBand = credits < 18 ? 'Low — complete a habit challenge' : (credits < 55 ? 'OK — conserve a bit more' : 'Good — AI can water comfortably');
      els.waterCreditsHint.textContent = goalBand;

      if (snap && snap.sensors && snap.actuators) {
        const m = clamp(snap.sensors.moisturePct || 0, 0, 100);
        const tank = clamp(snap.sensors.tankLevelPct || 0, 0, 100);
        const pumpOn = !!(snap.actuators.pump && snap.actuators.pump.isOn);
        const flow = snap.sensors.flowLpm || 0;

        lastSoil = m;
        lastTank = tank;

        els.soilMoisture.textContent = String(Math.round(m));
        els.soilFill.style.width = `${m}%`;
        els.soilFill.style.background = m < 35 ? 'linear-gradient(90deg,var(--danger),var(--warn))' : 'linear-gradient(90deg,var(--primary),var(--accent))';

        if (!prefersReducedMotion) {
          els.soilMoisture.classList.add('live-wiggle');
          if (prev.soil !== null && Math.round(prev.soil) !== Math.round(m)) {
            els.soilMoisture.classList.remove('value-pop');
            void els.soilMoisture.offsetWidth;
            els.soilMoisture.classList.add('value-pop');
          }
        }

        els.tankLevel.textContent = String(Math.round(tank));
        els.tankFill.style.width = `${tank}%`;
        els.tankFill.style.background = tank < 15 ? 'linear-gradient(90deg,var(--danger),var(--warn))' : 'linear-gradient(90deg,var(--primary),var(--accent))';

        if (!prefersReducedMotion) {
          els.tankLevel.classList.add('live-wiggle');
          if (prev.tank !== null && Math.round(prev.tank) !== Math.round(tank)) {
            els.tankLevel.classList.remove('value-pop');
            void els.tankLevel.offsetWidth;
            els.tankLevel.classList.add('value-pop');
          }
        }

        els.pumpState.textContent = pumpOn ? 'ON' : 'OFF';
        els.pumpFlow.textContent = flow.toFixed(2);
      }

      if (els.aiDecision) els.aiDecision.textContent = asiwUi.decision || '—';
    }

    prev.waterCredits = state.waterCredits;
    if (typeof lastSoil === 'number') prev.soil = lastSoil;
    if (typeof lastTank === 'number') prev.tank = lastTank;
    prev.pointsToday = state.pointsToday;
    prev.todayLiters = state.todayLiters;
    prev.batterySoc = state.batterySoc;
  }

  // Weekly chart mock
  let weeklyChart;
  let weeklyHighlightIdx = 0;
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
          backgroundColor: rgba(theme.accent, 0.30),
          borderRadius: 8,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        animation: prefersReducedMotion ? false : { duration: 700, easing: 'easeOutQuart' },
        scales: {
          x: { grid: { display: false }, ticks: { color: rgba(theme.muted, 0.9) } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: rgba(theme.muted, 0.9) } }
        },
      }
    });
  }

  function tickWeeklyBreakdown() {
    if (!weeklyChart || !weeklyChart.data || !weeklyChart.data.datasets || !weeklyChart.data.datasets[0]) return;
    weeklyHighlightIdx = (weeklyHighlightIdx + 1) % (weeklyChart.data.labels?.length || 7);
    // tiny value drift + rotating highlight
    const base = mockWeekly();
    weeklyChart.data.datasets[0].data = base.map((n, i) => {
      const t = Date.now() / 1000;
      const drift = (Math.sin((t * 1.05) + i * 0.9) * 14) + (Math.sin((t * 0.6) + i) * 6);
      return Math.max(120, Math.round(n + drift));
    });
    weeklyChart.data.datasets[0].backgroundColor = base.map((_, i) => i === weeklyHighlightIdx ? rgba(theme.primary, 0.55) : rgba(theme.accent, 0.26));
    weeklyChart.update();
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

  // Idle telemetry motion (subtle slider/values drift)
  let lastTelemetryUserInput = Date.now();
  const telemetryDrift = {
    irr: state.pvIrradiance,
    load: state.loadWatts,
    irrVel: 0,
    loadVel: 0,
    spikeUntil: 0,
    spikeBoost: 0,
  };
  function tickTelemetryIdle() {
    if (prefersReducedMotion) return;
    const idleMs = Date.now() - lastTelemetryUserInput;
    if (idleMs < 2500) return;

    const now = Date.now();
    const t = now / 1000;

    // Occasional "weather event" spike so the plot isn't straight
    if (now > telemetryDrift.spikeUntil && Math.random() < 0.035) {
      telemetryDrift.spikeUntil = now + (4000 + Math.random() * 6000);
      telemetryDrift.spikeBoost = 160 + Math.random() * 260;
    }
    const spike = now < telemetryDrift.spikeUntil ? telemetryDrift.spikeBoost : 0;

    // Random-walk around a daylight-ish curve
    const baselineIrr = 650 + Math.sin(t / 7.5) * 160 + Math.sin(t / 2.7) * 30;
    const baselineLoad = 24 + Math.sin(t / 5.4) * 7 + Math.sin(t / 2.1) * 2.5;

    const irrAcc = (Math.random() - 0.5) * 22;
    const loadAcc = (Math.random() - 0.5) * 1.8;
    telemetryDrift.irrVel = (telemetryDrift.irrVel + irrAcc) * 0.84;
    telemetryDrift.loadVel = (telemetryDrift.loadVel + loadAcc) * 0.86;

    telemetryDrift.irr += telemetryDrift.irrVel + (baselineIrr - telemetryDrift.irr) * 0.06;
    telemetryDrift.load += telemetryDrift.loadVel + (baselineLoad - telemetryDrift.load) * 0.08;

    const irr = telemetryDrift.irr + spike;
    // when PV spikes, load usually creeps a bit too (controller activity)
    const load = telemetryDrift.load + (spike > 0 ? 2.5 + Math.sin(t * 1.6) * 1.4 : 0);

    state.pvIrradiance = Math.round(clamp(irr, 250, 1100));
    state.loadWatts = Math.round(clamp(load, 6, 60));
    if (els.irradianceSlider) els.irradianceSlider.value = String(state.pvIrradiance);
    if (els.loadSlider) els.loadSlider.value = String(state.loadWatts);
    render();
  }

  // Interactions
  document.querySelectorAll('[data-log]').forEach(btn => {
    btn.addEventListener('click', () => {
      logActivity(btn.getAttribute('data-log'));
    });
  });

  function flashActivityOnce(entry) {
    const s = render._activityFlash || (render._activityFlash = new Set());
    const key = `${entry.ts || ''}|${entry.label}|${entry.liters}`;
    s.add(key);
    // allow one render pass to display it, then clear
    setTimeout(() => s.delete(key), 900);
  }

  function logActivity(type, opts = {}) {
    const map = { shower: 50, dishwasher: 15, laundry: 70, garden: 35, carwash: 80 };
    const liters = map[type] || 20;
    const labelMap = { shower: 'Shower', dishwasher: 'Dishwasher', laundry: 'Laundry', garden: 'Garden watering', carwash: 'Car wash' };
    const entry = { label: `${labelMap[type] || 'Activity'}`, liters, ts: Date.now() };
    state.activities.push(entry);
    // cap list
    if (state.activities.length > 14) state.activities.shift();
    flashActivityOnce(entry);

    // usage + points
    state.todayLiters += liters;
    state.pointsToday += 5;

    // Credits: conserve to earn, usage spends
    state.waterCredits = clamp((state.waterCredits || 0) - liters / 8, 0, 160);

    if (type === 'shower' && state.activities.filter(a => a.label === 'Shower').length === 3) {
      if (!state.badges.includes('Quick Shower Champ')) state.badges.push('Quick Shower Champ');
    }
    if (opts.note) {
      const noteEntry = { label: opts.note, liters: 0, ts: Date.now() };
      state.activities.push(noteEntry);
      if (state.activities.length > 14) state.activities.shift();
      flashActivityOnce(noteEntry);
    }

    save();
    render();
    renderChart();
  }

  // Delegate dynamic habit completion buttons
  const gamificationCard = document.getElementById('gamificationCard');
  if (gamificationCard) {
    gamificationCard.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-complete]');
      if (!btn) return;
      const type = btn.getAttribute('data-complete');
      let reward = 20;
      if (type === 'shower') reward = 30;
      if (type === 'leak') reward = 25;
      if (type === 'timed') reward = 18;
      state.pointsToday += reward;

      // Habits earn credits too (stronger effect than logging usage)
      const creditReward = reward * 0.9;
      state.waterCredits = clamp((state.waterCredits || 0) + creditReward, 0, 160);

      if (type === 'laundry') {
        if (!state.badges.includes('Load Master')) state.badges.push('Load Master');
      }
      if (hasGsap()) window.gsap.to(btn, { scale: 0.95, yoyo: true, repeat: 1, duration: 0.1 });
      flashActivityOnce({ label: `Habit completed: ${btn.dataset.title || type}`, liters: 0, ts: Date.now() });
      save();
      render();
    });
  }

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

    // Keep Weather card aligned with the selected city (demo mapping)
    if (state.city) {
      const c = state.city.toLowerCase();
      if (c.includes('ras') || c.includes('khaimah') || c === 'rak') {
        weatherState.locationName = 'Ras Al Khaimah';
        weatherState.lat = 25.7895;
        weatherState.lon = 55.9432;
      } else if (c.includes('manchester')) {
        weatherState.locationName = 'Greater Manchester';
        weatherState.lat = 53.4808;
        weatherState.lon = -2.2426;
      } else {
        weatherState.locationName = state.city;
      }
      setWeatherUI();
    }

    save();
    closeSettings();
    render();
    renderChart();
  });

  // Removed: low-supply alert mode

  // Telemetry sliders
  if (els.irradianceSlider) {
    els.irradianceSlider.addEventListener('input', e => {
      state.pvIrradiance = parseInt(e.target.value, 10);
      lastTelemetryUserInput = Date.now();
      save();
      render();
    });
  }
  if (els.loadSlider) {
    els.loadSlider.addEventListener('input', e => {
      state.loadWatts = parseInt(e.target.value, 10);
      lastTelemetryUserInput = Date.now();
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
  setInterval(updateTelemetry, 2000);
  setInterval(tickTelemetryIdle, 900);

  // WOW mode: keep key cards visually alive
  (function applyWowClasses() {
    if (prefersReducedMotion) return;
    const map = [
      { sel: '#usageCard', classes: ['wow-card', 'floaty', 'floaty-fast', 'floaty-delay-1'] },
      { sel: '#weatherCard', classes: ['wow-card', 'floaty', 'floaty-slow', 'floaty-delay-2'] },
      { sel: '#telemetryCard', classes: ['wow-card', 'floaty', 'floaty-delay-3'] },
      { sel: '#aiCard', classes: ['wow-card', 'floaty', 'floaty-slow', 'floaty-delay-1'] },
    ];
    map.forEach(({ sel, classes }) => {
      const el = document.querySelector(sel);
      if (!el) return;
      classes.forEach(c => el.classList.add(c));
    });
  })();

  // Rotate weekly breakdown highlight
  setInterval(() => {
    if (prefersReducedMotion) return;
    tickWeeklyBreakdown();
  }, 2200);

  // Ambient activity trickle (demo feels alive)
  setInterval(() => {
    if (prefersReducedMotion) return;
    const roll = Math.random();
    if (roll < 0.55) {
      // habit earns credits
      const earn = clamp(1 + Math.random() * 3.5, 1, 4);
      state.waterCredits = clamp((state.waterCredits || 0) + earn, 0, 160);
      const entry = { label: 'AI tip followed (credits earned)', liters: 0, ts: Date.now() };
      state.activities.push(entry);
      if (state.activities.length > 14) state.activities.shift();
      flashActivityOnce(entry);
    } else {
      // small usage event
      logActivity(Math.random() < 0.5 ? 'garden' : 'dishwasher');
      return;
    }
    save();
    render();
  }, 12000);

  // Dynamic gamification tasks (appear/disappear)
  const challengesEl = document.querySelector('#gamificationCard .challenges');
  const taskPool = [
    { type: 'shower', title: '5-minute showers', desc: 'Complete 3 times this week', rewardLabel: 'Complete' },
    { type: 'laundry', title: 'Full-load laundry', desc: 'Log 2 loads', rewardLabel: 'Complete' },
    { type: 'leak', title: 'Leak sweep', desc: 'Check taps and toilets today', rewardLabel: 'Done' },
    { type: 'timed', title: 'Smart rinse', desc: 'Turn tap off while scrubbing', rewardLabel: 'Done' },
  ];
  function renderRandomTasks() {
    if (!challengesEl) return;
    const howMany = Math.random() < 0.65 ? 2 : 1;
    const shuffled = taskPool.slice().sort(() => Math.random() - 0.5).slice(0, howMany);
    challengesEl.innerHTML = '';
    shuffled.forEach(t => {
      const row = document.createElement('div');
      row.className = 'challenge';
      row.innerHTML = `
        <div>
          <strong>${t.title}</strong>
          <p>${t.desc}</p>
        </div>
        <button class="btn small" data-complete="${t.type}" data-title="${t.title}">${t.rewardLabel}</button>
      `;
      challengesEl.appendChild(row);
      if (hasGsap() && !prefersReducedMotion) window.gsap.from(row, { y: 6, opacity: 0, duration: 0.25 });
    });
  }
  renderRandomTasks();
  setInterval(() => {
    if (prefersReducedMotion) return;
    renderRandomTasks();
  }, 8500);

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
    const useHtml = typeof text === 'object' && text && typeof text.html === 'string';
    if (useHtml) {
      els.assistantText.innerHTML = text.html;
    } else {
      els.assistantText.textContent = String(text);
    }
  }

  const aquaFacts = [
    {
      html: `“Water and sanitation flow through every aspect of sustainable development.” <a href="https://www.unwater.org/water-facts" target="_blank" rel="noopener">UN‑Water</a>`
    },
    {
      html: `Global water withdrawals are ~69% agriculture, 12% municipal, 19% industrial. <a href="https://www.fao.org/aquastat/en/overview/methodology/water-use" target="_blank" rel="noopener">FAO AQUASTAT</a>`
    },
    {
      html: `In 2022, 6B people used safely managed drinking-water; 2.2B did not. <a href="https://www.who.int/news-room/fact-sheets/detail/drinking-water" target="_blank" rel="noopener">WHO</a>`
    },
    {
      html: `Unsafe drinking-water is linked to diseases and ~505,000 diarrhoeal deaths/year. <a href="https://www.who.int/news-room/fact-sheets/detail/drinking-water" target="_blank" rel="noopener">WHO</a>`
    },
  ];

  let factIdx = 0;
  function showNextFact() {
    if (!els.assistantBar || els.assistantBar.classList.contains('hidden')) return;
    if (guideAuto) return;
    // Don't override important contextual nudge
    const credits = clamp(state.waterCredits || 0, 0, 160);
    if (credits < 18) return;
    factIdx = (factIdx + 1) % aquaFacts.length;
    setAssistantText(aquaFacts[factIdx]);
  }

  function refreshTipsFromFacts() {
    const tips = document.getElementById('tipsCarousel');
    if (!tips) return;
    const items = Array.from(tips.children);
    if (!items.length) return;
    // Fill the existing 3 list items with rotating fact snippets
    for (let i = 0; i < items.length; i++) {
      const fact = aquaFacts[(factIdx + i) % aquaFacts.length];
      items[i].innerHTML = fact.html;
    }
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
    if (credits < 18) {
      setAssistantText('Tip: Water Credits are low — complete a habit challenge to re-enable stronger AI watering.');
      return;
    }
  }, 8000);

  // Keep AquaGuide noticeable + keep facts rotating when idle
  if (els.assistantBar) {
    setInterval(() => {
      if (els.assistantBar.classList.contains('hidden')) return;
      els.assistantBar.classList.add('attention');
      setTimeout(() => els.assistantBar && els.assistantBar.classList.remove('attention'), 1600);
    }, 12000);
  }

  // Facts rotation (assistant + tips)
  refreshTipsFromFacts();
  setInterval(() => {
    if (prefersReducedMotion) return;
    showNextFact();
    refreshTipsFromFacts();
  }, 10000);

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

  // Weather card (animated sky + data)
  startWeatherLoop();
  startCloudySky();
})();


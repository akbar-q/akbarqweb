const dom = {
  introPanel: document.getElementById('introPanel'),
  gamePanel: document.getElementById('gamePanel'),
  completePanel: document.getElementById('completePanel'),
  pitchOptions: document.getElementById('pitchOptions'),
  teamName: document.getElementById('teamName'),
  difficultyMode: document.getElementById('difficultyMode'),
  startBtn: document.getElementById('startBtn'),
  restartBtn: document.getElementById('restartBtn'),
  playAgainBtn: document.getElementById('playAgainBtn'),
  nextScenarioBtn: document.getElementById('nextScenarioBtn'),
  fxToggle: document.getElementById('fxToggle'),
  soundToggle: document.getElementById('soundToggle'),
  soundVolume: document.getElementById('soundVolume'),
  alarmModule: document.getElementById('alarmModule'),
  alarmLabel: document.getElementById('alarmLabel'),
  teamBadge: document.getElementById('teamBadge'),
  scenarioBadge: document.getElementById('scenarioBadge'),
  timerBadge: document.getElementById('timerBadge'),
  scenarioTitle: document.getElementById('scenarioTitle'),
  scenarioBrief: document.getElementById('scenarioBrief'),
  objectivesList: document.getElementById('objectivesList'),
  scoreStat: document.getElementById('scoreStat'),
  strikeStat: document.getElementById('strikeStat'),
  inspectStat: document.getElementById('inspectStat'),
  comboStat: document.getElementById('comboStat'),
  xpStat: document.getElementById('xpStat'),
  hintTokenStat: document.getElementById('hintTokenStat'),
  phaseStat: document.getElementById('phaseStat'),
  componentBoard: document.getElementById('componentBoard'),
  measureBoard: document.getElementById('measureBoard'),
  diagnoseRule: document.getElementById('diagnoseRule'),
  hintBtn: document.getElementById('hintBtn'),
  hintText: document.getElementById('hintText'),
  faultOptions: document.getElementById('faultOptions'),
  checkDiagnosisBtn: document.getElementById('checkDiagnosisBtn'),
  repairOptions: document.getElementById('repairOptions'),
  checkRepairBtn: document.getElementById('checkRepairBtn'),
  logFeed: document.getElementById('logFeed'),
  finalSummary: document.getElementById('finalSummary'),
  signalStat: document.getElementById('signalStat'),
  loadStat: document.getElementById('loadStat'),
  thermalStat: document.getElementById('thermalStat'),
  signalBar: document.getElementById('signalBar'),
  loadBar: document.getElementById('loadBar'),
  thermalBar: document.getElementById('thermalBar'),
  threatStat: document.getElementById('threatStat'),
  threatValue: document.getElementById('threatValue'),
  threatBar: document.getElementById('threatBar'),
  lampPower: document.getElementById('lampPower'),
  lampDiag: document.getElementById('lampDiag'),
  lampRepair: document.getElementById('lampRepair'),
  commandLine: document.getElementById('commandLine'),
  badgeRack: document.getElementById('badgeRack'),
  eventToast: document.getElementById('eventToast'),
  scopeCanvas: document.getElementById('scopeCanvas'),
  fxCanvas: document.getElementById('fxCanvas'),
  lightningFlash: document.getElementById('lightningFlash')
};

const state = {
  data: null,
  selectedPitch: 'A',
  mode: 'standard',
  teamName: 'Unassigned',
  scenarioIndex: 0,
  score: 0,
  xp: 0,
  combo: 0,
  strikes: 0,
  inspected: 0,
  diagnosed: false,
  intervalId: null,
  timeRemaining: 0,
  selectedFaults: new Set(),
  selectedRepairs: new Set(),
  measuredNodes: new Set(),
  hintTokens: 0,
  currentHints: [],
  hintCursor: 0,
  badges: new Set(),
  alertLevel: 'stable',
  fx: {
    enabled: true,
    initialized: false,
    forceMotion: false,
    canvas: null,
    ctx: null,
    drops: [],
    streams: 0,
    chars: '01ΩλΔ∑⊕⊗⟂↯⎓⎍⎐',
    rafId: null,
    lastLightningAt: 0
  },
  scope: {
    ctx: null,
    phase: 0,
    intervalId: null
  },
  audio: {
    enabled: true,
    volume: 0.45,
    ctx: null,
    master: null,
    tickIntervalId: null,
    humOsc: null,
    humGain: null,
    pulseIntervalId: null
  }
};

const modeMultiplier = {
  standard: 1,
  hard: 0.82,
  extreme: 0.7
};

const modePenalty = {
  standard: 0,
  hard: 1,
  extreme: 2
};

async function init() {
  const res = await fetch('./scenarios.json');
  state.data = await res.json();
  applyFxPreference(readFxPreference());
  restoreAudioPreferences();
  applyThemeState();
  initVisualFx();
  initScope();
  renderPitchCards();
  bindEvents();
  dom.teamName.value = 'Kirchhoff Crew';
  updateHud();
  updateBadges();
  updateCommandLine('SYS BOOT // Awaiting team authorization...');
  logLine('info', 'System ready. Choose a pitch and start the mission.');
}

function initVisualFx() {
  if (!dom.fxCanvas || shouldReduceMotion()) {
    state.fx.enabled = false;
    return;
  }

  if (state.fx.initialized) {
    state.fx.enabled = true;
    if (!state.fx.rafId) {
      animateFx();
    }
    return;
  }

  const canvas = dom.fxCanvas;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    state.fx.enabled = false;
    return;
  }

  state.fx.canvas = canvas;
  state.fx.ctx = ctx;
  state.fx.enabled = true;
  state.fx.initialized = true;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    state.fx.streams = Math.max(18, Math.floor(canvas.width / 26));
    state.fx.drops = Array.from({ length: state.fx.streams }, () => Math.random() * canvas.height);
  };

  resize();
  window.addEventListener('resize', resize);
  animateFx();
}

function animateFx() {
  if (!state.fx.enabled || !state.fx.ctx || !state.fx.canvas) {
    return;
  }

  const { ctx, canvas, drops, chars } = state.fx;
  ctx.fillStyle = 'rgba(6, 10, 16, 0.12)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '16px Oxanium, monospace';

  for (let i = 0; i < drops.length; i += 1) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    const x = i * 26;
    const y = drops[i];
    const intensity = state.alertLevel === 'critical' ? 0.95 : state.alertLevel === 'warning' ? 0.8 : 0.68;
    ctx.fillStyle = `rgba(90, 255, 180, ${intensity})`;
    ctx.fillText(char, x, y);

    const speed = state.alertLevel === 'critical' ? 5.6 : state.alertLevel === 'warning' ? 4.4 : 3.2;
    drops[i] += speed + Math.random() * 2;
    if (drops[i] > canvas.height + 20 && Math.random() > 0.95) {
      drops[i] = -18;
    }
  }

  maybeTriggerLightning();
  state.fx.rafId = window.requestAnimationFrame(animateFx);
}

function maybeTriggerLightning() {
  const now = performance.now();
  const gap = state.alertLevel === 'critical' ? 900 : state.alertLevel === 'warning' ? 1800 : 4200;
  const chance = state.alertLevel === 'critical' ? 0.08 : state.alertLevel === 'warning' ? 0.045 : 0.02;

  if (now - state.fx.lastLightningAt < gap || Math.random() > chance) {
    return;
  }

  state.fx.lastLightningAt = now;
  if (dom.lightningFlash) {
    dom.lightningFlash.classList.remove('active');
    void dom.lightningFlash.offsetWidth;
    dom.lightningFlash.classList.add('active');
    window.setTimeout(() => dom.lightningFlash.classList.remove('active'), 240);
  }

  drawLightningBolt();
}

function drawLightningBolt() {
  if (!state.fx.ctx || !state.fx.canvas) {
    return;
  }

  const { ctx, canvas } = state.fx;
  const startX = Math.random() * canvas.width;
  const segments = 9 + Math.floor(Math.random() * 6);
  let x = startX;
  let y = -10;

  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(183, 236, 255, 0.95)';
  ctx.shadowBlur = 12;
  ctx.shadowColor = 'rgba(134, 214, 255, 0.95)';
  ctx.beginPath();
  ctx.moveTo(x, y);

  for (let i = 0; i < segments; i += 1) {
    x += (Math.random() - 0.5) * 34;
    y += canvas.height / segments;
    ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.restore();
}

function renderPitchCards() {
  const entries = Object.entries(state.data.pitches);
  dom.pitchOptions.innerHTML = '';

  for (const [key, text] of entries) {
    const card = document.createElement('article');
    card.className = `pitch-card${state.selectedPitch === key ? ' active' : ''}`;
    card.dataset.pitch = key;

    const heading = document.createElement('h4');
    heading.textContent = `Option ${key}`;

    const body = document.createElement('p');
    body.textContent = text;

    card.appendChild(heading);
    card.appendChild(body);
    card.addEventListener('click', () => {
      state.selectedPitch = key;
      renderPitchCards();
      logLine('info', `Narrative selected: Option ${key}.`);
    });

    dom.pitchOptions.appendChild(card);
  }
}

function bindEvents() {
  dom.startBtn.addEventListener('click', startMission);
  dom.restartBtn.addEventListener('click', resetToIntro);
  dom.playAgainBtn.addEventListener('click', resetToIntro);
  dom.nextScenarioBtn.addEventListener('click', nextScenario);
  dom.checkDiagnosisBtn.addEventListener('click', validateDiagnosis);
  dom.checkRepairBtn.addEventListener('click', validateRepair);
  dom.hintBtn.addEventListener('click', useHintToken);
  dom.fxToggle.addEventListener('click', toggleFxPreference);
  dom.soundToggle.addEventListener('click', toggleSoundEnabled);
  dom.soundVolume.addEventListener('input', onVolumeChange);

  document.addEventListener(
    'pointerdown',
    () => {
      primeAudioContext();
    },
    { once: true }
  );
}

function shouldReduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches && !state.fx.forceMotion;
}

function readFxPreference() {
  try {
    const stored = window.localStorage.getItem('deadCircuit.forceMotion');
    if (stored === null) {
      return true;
    }
    return stored === '1';
  } catch {
    return true;
  }
}

function toggleFxPreference() {
  applyFxPreference(!state.fx.forceMotion);

  if (!shouldReduceMotion() && !state.fx.enabled) {
    initVisualFx();
    logLine('good', 'FX forced ON. Dynamic visuals enabled.');
  } else if (shouldReduceMotion()) {
    disableVisualFx();
    logLine('info', 'FX set to AUTO. Reduced-motion preference is active.');
  }
}

function applyFxPreference(forceMotion) {
  state.fx.forceMotion = forceMotion;

  try {
    window.localStorage.setItem('deadCircuit.forceMotion', forceMotion ? '1' : '0');
  } catch {
    // no-op
  }

  if (forceMotion) {
    document.body.classList.add('force-motion');
    dom.fxToggle.textContent = 'FX: ON';
    dom.fxToggle.classList.add('forced');
  } else {
    document.body.classList.remove('force-motion');
    dom.fxToggle.textContent = 'FX: AUTO';
    dom.fxToggle.classList.remove('forced');
  }
}

function disableVisualFx() {
  state.fx.enabled = false;
  if (state.fx.rafId) {
    window.cancelAnimationFrame(state.fx.rafId);
    state.fx.rafId = null;
  }
  if (state.fx.ctx && state.fx.canvas) {
    state.fx.ctx.clearRect(0, 0, state.fx.canvas.width, state.fx.canvas.height);
  }
}

function restoreAudioPreferences() {
  try {
    const enabled = window.localStorage.getItem('deadCircuit.soundEnabled');
    const volume = window.localStorage.getItem('deadCircuit.soundVolume');
    state.audio.enabled = enabled !== '0';
    if (volume !== null) {
      const parsed = Number(volume);
      if (!Number.isNaN(parsed)) {
        state.audio.volume = clamp(parsed, 0, 1);
      }
    }
  } catch {
    state.audio.enabled = true;
  }

  dom.soundVolume.value = String(Math.round(state.audio.volume * 100));
  refreshSoundUi();
}

function persistAudioPreferences() {
  try {
    window.localStorage.setItem('deadCircuit.soundEnabled', state.audio.enabled ? '1' : '0');
    window.localStorage.setItem('deadCircuit.soundVolume', String(state.audio.volume));
  } catch {
    // no-op
  }
}

function onVolumeChange() {
  state.audio.volume = clamp(Number(dom.soundVolume.value) / 100, 0, 1);
  if (state.audio.master) {
    state.audio.master.gain.value = state.audio.volume;
  }
  persistAudioPreferences();
}

function toggleSoundEnabled() {
  state.audio.enabled = !state.audio.enabled;
  refreshSoundUi();
  persistAudioPreferences();

  if (!state.audio.enabled) {
    stopTickLoop();
    stopAmbientBed();
  } else {
    primeAudioContext();
    if (!dom.gamePanel.classList.contains('hidden')) {
      startTickLoop();
      startAmbientBed();
      playSound('ui');
    }
  }
}

function refreshSoundUi() {
  if (state.audio.enabled) {
    dom.soundToggle.textContent = 'SOUND: ON';
    dom.soundToggle.classList.add('active');
    dom.soundToggle.classList.remove('muted');
    return;
  }

  dom.soundToggle.textContent = 'SOUND: OFF';
  dom.soundToggle.classList.add('muted');
  dom.soundToggle.classList.remove('active');
}

function primeAudioContext() {
  if (!state.audio.enabled) {
    return;
  }

  if (!state.audio.ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    state.audio.ctx = new AudioCtx();
    state.audio.master = state.audio.ctx.createGain();
    state.audio.master.gain.value = state.audio.volume;
    state.audio.master.connect(state.audio.ctx.destination);
  }

  if (state.audio.ctx.state === 'suspended') {
    state.audio.ctx.resume();
  }
}

function playSound(type) {
  if (!state.audio.enabled || !state.audio.ctx || !state.audio.master) {
    return;
  }

  const ctx = state.audio.ctx;
  const now = ctx.currentTime;

  if (type === 'tick') {
    beep({ freq: 680, attack: 0.001, decay: 0.045, gain: 0.06, type: 'square' });
    return;
  }

  if (type === 'good') {
    beep({ freq: 520, attack: 0.002, decay: 0.11, gain: 0.13, type: 'triangle' });
    beep({ freq: 760, attack: 0.01, decay: 0.14, gain: 0.11, type: 'sine', offset: 0.045 });
    return;
  }

  if (type === 'bad') {
    beep({ freq: 180, attack: 0.001, decay: 0.2, gain: 0.14, type: 'sawtooth' });
    return;
  }

  if (type === 'probe') {
    beep({ freq: 920, attack: 0.002, decay: 0.06, gain: 0.07, type: 'square' });
    return;
  }

  if (type === 'alarm') {
    beep({ freq: 480, attack: 0.002, decay: 0.12, gain: 0.1, type: 'square' });
    beep({ freq: 350, attack: 0.012, decay: 0.18, gain: 0.09, type: 'square', offset: 0.1 });
    return;
  }

  if (type === 'ui') {
    beep({ freq: 340, attack: 0.002, decay: 0.07, gain: 0.08, type: 'triangle' });
    beep({ freq: 430, attack: 0.006, decay: 0.06, gain: 0.06, type: 'triangle', offset: 0.03 });
    return;
  }

  beep({ freq: 420, attack: 0.001, decay: 0.08, gain: 0.08, type: 'triangle' });

  function beep({ freq, attack, decay, gain, type, offset = 0 }) {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    envelope.gain.value = 0;
    oscillator.connect(envelope);
    envelope.connect(state.audio.master);

    const start = now + offset;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(gain, start + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);

    oscillator.start(start);
    oscillator.stop(start + attack + decay + 0.02);
  }
}

function startTickLoop() {
  stopTickLoop();
  if (!state.audio.enabled) {
    return;
  }

  state.audio.tickIntervalId = window.setInterval(() => {
    playSound('tick');
  }, 1000);
}

function stopTickLoop() {
  if (state.audio.tickIntervalId) {
    window.clearInterval(state.audio.tickIntervalId);
    state.audio.tickIntervalId = null;
  }
}

function startAmbientBed() {
  if (!state.audio.enabled || !state.audio.ctx || !state.audio.master || state.audio.humOsc) {
    return;
  }

  const osc = state.audio.ctx.createOscillator();
  const gain = state.audio.ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 62;
  gain.gain.value = 0.018;

  osc.connect(gain);
  gain.connect(state.audio.master);
  osc.start();

  state.audio.humOsc = osc;
  state.audio.humGain = gain;
  updateAmbientByAlert();
}

function stopAmbientBed() {
  if (state.audio.humOsc) {
    state.audio.humOsc.stop();
    state.audio.humOsc.disconnect();
    state.audio.humOsc = null;
  }
  if (state.audio.humGain) {
    state.audio.humGain.disconnect();
    state.audio.humGain = null;
  }
  stopCriticalPulse();
}

function updateAmbientByAlert() {
  if (!state.audio.humOsc || !state.audio.humGain || !state.audio.ctx) {
    return;
  }

  const now = state.audio.ctx.currentTime;
  const targetFreq = state.alertLevel === 'critical' ? 88 : state.alertLevel === 'warning' ? 74 : 62;
  const targetGain = state.alertLevel === 'critical' ? 0.032 : state.alertLevel === 'warning' ? 0.024 : 0.018;

  state.audio.humOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
  state.audio.humGain.gain.setTargetAtTime(targetGain, now, 0.12);

  if (state.alertLevel === 'critical') {
    startCriticalPulse();
  } else {
    stopCriticalPulse();
  }
}

function startCriticalPulse() {
  if (state.audio.pulseIntervalId || !state.audio.enabled) {
    return;
  }

  state.audio.pulseIntervalId = window.setInterval(() => {
    playSound('alarm');
  }, 650);
}

function stopCriticalPulse() {
  if (state.audio.pulseIntervalId) {
    window.clearInterval(state.audio.pulseIntervalId);
    state.audio.pulseIntervalId = null;
  }
}

function initScope() {
  if (!dom.scopeCanvas) {
    return;
  }

  const ctx = dom.scopeCanvas.getContext('2d');
  if (!ctx) {
    return;
  }
  state.scope.ctx = ctx;

  if (state.scope.intervalId) {
    window.clearInterval(state.scope.intervalId);
  }
  state.scope.intervalId = window.setInterval(drawScope, 70);
}

function drawScope() {
  const ctx = state.scope.ctx;
  const canvas = dom.scopeCanvas;
  if (!ctx || !canvas) {
    return;
  }

  const w = canvas.width;
  const h = canvas.height;
  const level = state.alertLevel === 'critical' ? 1 : state.alertLevel === 'warning' ? 0.6 : 0.3;

  ctx.fillStyle = 'rgba(4, 11, 16, 0.45)';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(90, 130, 150, 0.22)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  for (let y = 0; y <= h; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = `rgba(${state.alertLevel === 'critical' ? '255,96,118' : state.alertLevel === 'warning' ? '255,209,111' : '73,232,255'}, 0.95)`;
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let x = 0; x < w; x += 4) {
    const wave = Math.sin((x + state.scope.phase) / 28) * (8 + level * 10);
    const noise = (Math.random() - 0.5) * (2 + level * 6);
    const y = h * 0.5 + wave + noise;
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
  state.scope.phase += 4 + level * 3;
}

function updateHud() {
  const scenario = state.data?.scenarios?.[state.scenarioIndex];
  const baseDifficulty = state.mode === 'extreme' ? 28 : state.mode === 'hard' ? 18 : 10;
  const timeRatio = scenario ? clamp(state.timeRemaining / Math.max(1, Math.floor(scenario.timeLimit * modeMultiplier[state.mode])), 0, 1) : 1;

  const signal = clamp(Math.round(timeRatio * 75 + (state.diagnosed ? 18 : 0) - state.strikes * 8), 2, 100);
  const load = clamp(Math.round((1 - timeRatio) * 58 + state.inspected * 1.1 + baseDifficulty), 4, 100);
  const thermal = clamp(Math.round(load * 0.72 + state.strikes * 11), 3, 100);
  const threat = clamp(Math.round(100 - signal * 0.55 + thermal * 0.38 + state.strikes * 6), 5, 100);

  dom.signalStat.textContent = `${signal}%`;
  dom.loadStat.textContent = `${load}%`;
  dom.thermalStat.textContent = `${thermal}%`;
  dom.signalBar.style.width = `${signal}%`;
  dom.loadBar.style.width = `${load}%`;
  dom.thermalBar.style.width = `${thermal}%`;

  dom.threatValue.textContent = `${threat}%`;
  dom.threatBar.style.width = `${threat}%`;
  dom.threatBar.classList.remove('warn', 'bad');

  if (threat >= 75) {
    dom.threatStat.textContent = 'SEVERE';
    dom.threatBar.classList.add('bad');
  } else if (threat >= 45) {
    dom.threatStat.textContent = 'ELEVATED';
    dom.threatBar.classList.add('warn');
  } else {
    dom.threatStat.textContent = 'LOW';
  }

  updateStatusLamps(signal, thermal);
}

function updateStatusLamps(signal, thermal) {
  setLampState(dom.lampPower, signal > 35 ? 'ok' : signal > 20 ? 'warn' : 'bad');

  const diagState = state.diagnosed ? 'ok' : state.measuredNodes.size > 0 ? 'warn' : 'bad';
  setLampState(dom.lampDiag, diagState);

  const repairState = state.diagnosed ? (state.selectedRepairs.size > 0 ? 'warn' : 'ok') : thermal > 65 ? 'bad' : 'warn';
  setLampState(dom.lampRepair, repairState);
}

function setLampState(lamp, mode) {
  if (!lamp) {
    return;
  }

  lamp.classList.remove('ok', 'warn', 'bad');
  lamp.classList.add(mode);
}

function applyThemeState() {
  document.body.classList.remove('mode-standard', 'mode-hard', 'mode-extreme');
  document.body.classList.remove('alert-warning', 'alert-critical');
  document.body.classList.add(`mode-${state.mode}`);

  if (state.alertLevel === 'warning') {
    document.body.classList.add('alert-warning');
  } else if (state.alertLevel === 'critical') {
    document.body.classList.add('alert-critical');
  }
}

function updateCommandLine(text, type = 'info') {
  if (!dom.commandLine) {
    return;
  }

  dom.commandLine.classList.remove('warn', 'bad');
  if (type === 'warn') {
    dom.commandLine.classList.add('warn');
  }
  if (type === 'bad') {
    dom.commandLine.classList.add('bad');
  }

  dom.commandLine.textContent = text;
}

function showEventToast(text, type = 'info') {
  if (!dom.eventToast) {
    return;
  }

  dom.eventToast.classList.remove('hidden', 'show', 'good', 'bad');
  if (type === 'good') {
    dom.eventToast.classList.add('good');
  }
  if (type === 'bad') {
    dom.eventToast.classList.add('bad');
  }
  dom.eventToast.textContent = text;
  void dom.eventToast.offsetWidth;
  dom.eventToast.classList.add('show');

  window.clearTimeout(showEventToast.timeoutId);
  showEventToast.timeoutId = window.setTimeout(() => {
    dom.eventToast.classList.add('hidden');
    dom.eventToast.classList.remove('show', 'good', 'bad');
  }, 1400);
}

function flashState(kind) {
  const className = kind === 'good' ? 'flash-good' : 'flash-bad';
  document.body.classList.remove('flash-good', 'flash-bad');
  void document.body.offsetWidth;
  document.body.classList.add(className);
  window.setTimeout(() => document.body.classList.remove(className), 520);
}

function initializeScenarioHints(scenario) {
  const difficultyTokens = state.mode === 'extreme' ? 1 : state.mode === 'hard' ? 2 : 3;
  state.hintTokens = difficultyTokens;
  state.hintCursor = 0;

  const faultHints = scenario.components
    .filter(component => component.isFault)
    .map(component => `Check ${component.name}: ${component.clue}`);

  const measurementHints = scenario.measurements
    .filter(entry => entry.broken !== entry.normal)
    .map(entry => `${entry.node} deviates from baseline (${entry.broken} vs ${entry.normal}).`);

  state.currentHints = [
    `Start with protection and bias path checks. ${scenario.requiredFaultCount} fault(s) exist.`,
    ...measurementHints,
    ...faultHints
  ];

  dom.hintText.textContent = 'Hints appear here when requested.';
}

function useHintToken() {
  if (state.hintTokens <= 0) {
    showEventToast('No hint tokens left this scenario.', 'bad');
    updateCommandLine('Hint request denied // token budget exhausted.', 'bad');
    playSound('bad');
    return;
  }

  const hint = state.currentHints[state.hintCursor] || 'No deeper hint remains. Trust your measurements.';
  state.hintCursor += 1;
  state.hintTokens -= 1;

  dom.hintText.textContent = hint;
  dom.hintText.classList.remove('flash');
  void dom.hintText.offsetWidth;
  dom.hintText.classList.add('flash');

  playSound('ui');
  showEventToast(`Hint delivered. Tokens left: ${state.hintTokens}.`);
  updateCommandLine(`Hint channel open // ${hint}`, 'warn');
  syncStats();
}

function grantXp(amount) {
  state.xp = Math.max(0, state.xp + amount);
}

function adjustCombo(delta, reset = false) {
  if (reset) {
    state.combo = 0;
    return;
  }

  state.combo = Math.max(0, state.combo + delta);
}

function updateBadges() {
  if (!dom.badgeRack) {
    return;
  }

  const badgeDefs = [
    { id: 'scout', label: 'Scout', active: state.inspected >= 3 },
    { id: 'analyst', label: 'Analyst', active: state.measuredNodes.size >= 2 },
    { id: 'streak', label: 'Streak', active: state.combo >= 2 },
    { id: 'veteran', label: 'Veteran', active: state.xp >= 350 }
  ];

  badgeDefs.forEach(def => {
    if (def.active) {
      state.badges.add(def.id);
    }
  });

  dom.badgeRack.innerHTML = badgeDefs
    .map(def => `<span class="badge-chip${state.badges.has(def.id) ? ' on' : ''}">${def.label}</span>`)
    .join('');
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function startMission() {
  primeAudioContext();
  state.teamName = (dom.teamName.value || '').trim() || 'Circuit Squad';
  state.mode = dom.difficultyMode.value;
  state.scenarioIndex = 0;
  state.score = 0;
  state.xp = 0;
  state.combo = 0;
  state.badges.clear();
  state.strikes = modePenalty[state.mode];
  state.inspected = 0;

  dom.teamBadge.textContent = `Team: ${state.teamName}`;
  dom.introPanel.classList.add('hidden');
  dom.completePanel.classList.add('hidden');
  dom.gamePanel.classList.remove('hidden');
  setAlertLevel('stable');
  applyThemeState();
  startTickLoop();
  startAmbientBed();
  playSound('ui');
  updateCommandLine('MISSION AUTHORIZED // Establishing diagnostic channel...');
  showEventToast('Mission started. Control console online.', 'good');

  logLine('info', `Mission started for ${state.teamName} in ${state.mode.toUpperCase()} mode.`);
  logLine('info', state.data.pitches[state.selectedPitch]);
  loadScenario(0);
}

function loadScenario(index) {
  const scenario = state.data.scenarios[index];
  if (!scenario) {
    return finishMission();
  }

  state.diagnosed = false;
  state.selectedFaults.clear();
  state.selectedRepairs.clear();
  state.measuredNodes.clear();
  initializeScenarioHints(scenario);

  dom.checkRepairBtn.disabled = true;
  dom.nextScenarioBtn.classList.add('hidden');

  dom.scenarioBadge.textContent = `Scenario ${index + 1}/${state.data.scenarios.length}`;
  dom.scenarioTitle.textContent = `${scenario.title} · ${scenario.difficulty}`;
  dom.scenarioBrief.textContent = scenario.brief;
  dom.diagnoseRule.textContent = `Select exactly ${scenario.requiredFaultCount} fault(s).`;
  dom.objectivesList.innerHTML = scenario.objectives.map(item => `<li>${item}</li>`).join('');

  renderComponents(scenario);
  renderMeasurements(scenario);
  renderFaultOptions(scenario);
  renderRepairOptions(scenario);
  setPhase('Diagnosis');

  const adjustedTime = Math.floor(scenario.timeLimit * modeMultiplier[state.mode]);
  startTimer(adjustedTime);
  syncStats();
  playSound('ui');
  updateCommandLine(`Scenario loaded: ${scenario.title} // Diagnose ${scenario.requiredFaultCount} fault(s).`);
  showEventToast(`Scenario ${index + 1} active. Timer armed.`);

  logLine('info', `Scenario loaded: ${scenario.title}. Time budget: ${adjustedTime}s.`);
}

function renderComponents(scenario) {
  dom.componentBoard.innerHTML = '';
  scenario.components.forEach(component => {
    const btn = document.createElement('button');
    btn.className = 'component-btn';
    btn.innerHTML = `<strong>${component.name}</strong><small>Tap to inspect physical clue</small>`;
    btn.addEventListener('click', () => {
      state.inspected += 1;
      grantXp(8);
      syncStats();
      playSound('probe');
      logLine('info', `${component.name}: ${component.clue}`);
      updateCommandLine(`Inspecting ${component.name}... clue captured.`);
      if (component.isFault) {
        showEventToast(`Anomaly flagged near ${component.name}.`, 'bad');
        logLine('good', `Suspicious behavior detected near ${component.name}.`);
      }
    });
    dom.componentBoard.appendChild(btn);
  });
}

function renderMeasurements(scenario) {
  dom.measureBoard.innerHTML = '';
  scenario.measurements.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'measure-btn';
    btn.textContent = `Probe ${item.node}`;
    btn.addEventListener('click', () => {
      if (state.measuredNodes.has(item.node)) {
        playSound('ui');
        logLine('info', `Probe ${item.node} already sampled.`);
        return;
      }
      state.measuredNodes.add(item.node);
      grantXp(12);
      const reading = item.broken;
      logLine('info', `${item.node} measured: ${reading} (expected ${item.normal}).`);
      state.timeRemaining = Math.max(5, state.timeRemaining - 4);
      updateTimerDisplay();
      playSound('probe');
      updateCommandLine(`Probe ${item.node} => ${reading}. Baseline ${item.normal}.`);
    });
    dom.measureBoard.appendChild(btn);
  });
}

function renderFaultOptions(scenario) {
  dom.faultOptions.innerHTML = '';
  scenario.components.forEach(item => {
    const wrapper = document.createElement('label');
    wrapper.className = 'fault-item option-item';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = item.id;
    box.addEventListener('change', () => {
      if (box.checked) {
        state.selectedFaults.add(item.id);
      } else {
        state.selectedFaults.delete(item.id);
      }
      playSound('ui');
    });

    const txt = document.createElement('span');
    txt.className = 'option-copy';
    txt.innerHTML = `<span>${item.name}</span><small>Mark as suspected fault</small>`;

    const toggleShell = document.createElement('span');
    toggleShell.className = 'toggle-shell';
    toggleShell.innerHTML = '<span class="toggle-knob"></span>';

    wrapper.appendChild(box);
    wrapper.appendChild(toggleShell);
    wrapper.appendChild(txt);
    dom.faultOptions.appendChild(wrapper);
  });
}

function renderRepairOptions(scenario) {
  dom.repairOptions.innerHTML = '';
  scenario.repairOptions.forEach(item => {
    const wrapper = document.createElement('label');
    wrapper.className = 'repair-item option-item';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = item.id;
    box.addEventListener('change', () => {
      if (box.checked) {
        state.selectedRepairs.add(item.id);
      } else {
        state.selectedRepairs.delete(item.id);
      }
      playSound('ui');
    });

    const txt = document.createElement('span');
    txt.className = 'option-copy';
    txt.innerHTML = `<span>${item.label}</span><small>Toggle to include in repair plan</small>`;

    const toggleShell = document.createElement('span');
    toggleShell.className = 'toggle-shell';
    toggleShell.innerHTML = '<span class="toggle-knob"></span>';

    wrapper.appendChild(box);
    wrapper.appendChild(toggleShell);
    wrapper.appendChild(txt);
    dom.repairOptions.appendChild(wrapper);
  });
}

function validateDiagnosis() {
  const scenario = state.data.scenarios[state.scenarioIndex];
  const expected = new Set(scenario.components.filter(c => c.isFault).map(c => c.id));
  const countOk = state.selectedFaults.size === scenario.requiredFaultCount;
  const matchOk = setEquals(expected, state.selectedFaults);

  if (countOk && matchOk) {
    state.score += 120 + state.timeRemaining;
    grantXp(90);
    adjustCombo(1);
    state.diagnosed = true;
    dom.checkRepairBtn.disabled = false;
    setPhase('Repair');
    playSound('good');
    flashState('good');
    showEventToast('Diagnosis confirmed. Repair channel unlocked.', 'good');
    updateCommandLine('Fault map validated. Proceeding to controlled repair sequence.');
    logLine('good', 'Diagnosis validated. Fault map matches measured evidence.');
  } else {
    state.strikes += 1;
    state.score = Math.max(0, state.score - 35);
    adjustCombo(0, true);
    playSound('bad');
    flashState('bad');
    showEventToast('Diagnosis mismatch. Re-check probes.', 'bad');
    updateCommandLine('Diagnosis failed // cross-check faults and retest nodes.', 'bad');
    logLine('bad', 'Diagnosis mismatch. Re-evaluate clues and measurement deltas.');
  }

  syncStats();
}

function validateRepair() {
  const scenario = state.data.scenarios[state.scenarioIndex];
  if (!state.diagnosed) {
    playSound('bad');
    showEventToast('Repair locked until diagnosis passes.', 'bad');
    logLine('bad', 'Repair phase locked. Validate diagnosis first.');
    return;
  }

  const required = new Set(scenario.repairOptions.filter(item => item.isRequired).map(item => item.id));
  const isCorrect = setEquals(required, state.selectedRepairs);

  if (isCorrect) {
    state.score += 180 + state.timeRemaining * 2;
    grantXp(140);
    adjustCombo(1);
    logLine('good', 'Repair successful. System restored before total failure.');
    logLine('info', scenario.debrief);
    clearInterval(state.intervalId);
    dom.nextScenarioBtn.classList.remove('hidden');
    setPhase('Cleared');
    playSound('good');
    flashState('good');
    showEventToast('System restored. Stage cleared.', 'good');
    updateCommandLine('Repair accepted // system nominal. Load next scenario.');
  } else {
    state.strikes += 1;
    state.score = Math.max(0, state.score - 45);
    adjustCombo(0, true);
    playSound('bad');
    flashState('bad');
    showEventToast('Unsafe or incomplete repair plan.', 'bad');
    updateCommandLine('Repair rejected // remove unsafe actions and retry.', 'bad');
    logLine('bad', 'Repair plan incomplete or unsafe. Remove unnecessary actions.');
  }

  syncStats();
}

function nextScenario() {
  state.scenarioIndex += 1;
  loadScenario(state.scenarioIndex);
}

function startTimer(seconds) {
  clearInterval(state.intervalId);
  state.timeRemaining = seconds;
  updateTimerDisplay();

  state.intervalId = setInterval(() => {
    state.timeRemaining -= 1;
    updateTimerDisplay();

    if (state.timeRemaining === 60) {
      playSound('alarm');
      showEventToast('1 minute remaining.', 'bad');
      updateCommandLine('Timer threshold reached: 60s remaining.', 'warn');
      logLine('bad', 'One minute remaining. Team, commit to a fault hypothesis now.');
    }
    if (state.timeRemaining === 30) {
      playSound('alarm');
      showEventToast('30 seconds. Final decisions.', 'bad');
      updateCommandLine('Critical threshold: 30s remaining. Commit now.', 'bad');
      logLine('bad', 'Thirty seconds. Finalize diagnosis and execute only essential repairs.');
    }

    if (state.timeRemaining <= 0) {
      clearInterval(state.intervalId);
      state.strikes += 1;
      setAlertLevel('critical');
      playSound('bad');
      flashState('bad');
      showEventToast('Timeout lock triggered.', 'bad');
      updateCommandLine('Timeout detected // scenario quarantined.', 'bad');
      logLine('bad', 'Timeout. Scenario lock triggered. Moving to next challenge.');
      syncStats();
      dom.nextScenarioBtn.classList.remove('hidden');
      setPhase('Timeout');
    }
  }, 1000);
}

function finishMission() {
  clearInterval(state.intervalId);
  stopTickLoop();
  stopAmbientBed();
  dom.gamePanel.classList.add('hidden');
  dom.completePanel.classList.remove('hidden');

  const rank = state.score >= 1300 ? 'Lab Legends' : state.score >= 900 ? 'Fault Hunters' : 'Circuit Survivors';
  dom.finalSummary.textContent = `${state.teamName} completed ${state.data.scenarios.length} scenarios with score ${state.score}, strikes ${state.strikes}, and rank ${rank}.`;
  setAlertLevel('stable');
  playSound('good');
  flashState('good');
  showEventToast(`Mission complete. Rank: ${rank}.`, 'good');

  logLine('good', `Mission complete. Final rank: ${rank}.`);
}

function resetToIntro() {
  clearInterval(state.intervalId);
  stopTickLoop();
  stopAmbientBed();
  dom.completePanel.classList.add('hidden');
  dom.gamePanel.classList.add('hidden');
  dom.introPanel.classList.remove('hidden');

  state.score = 0;
  state.xp = 0;
  state.combo = 0;
  state.strikes = 0;
  state.inspected = 0;
  state.scenarioIndex = 0;
  state.selectedFaults.clear();
  state.selectedRepairs.clear();
  state.measuredNodes.clear();
  state.badges.clear();
  state.hintTokens = 0;
  state.currentHints = [];
  state.hintCursor = 0;

  dom.logFeed.innerHTML = '';
  dom.teamBadge.textContent = 'Team: Unassigned';
  dom.scenarioBadge.textContent = 'Scenario 0/0';
  dom.timerBadge.textContent = '00:00';
  dom.hintText.textContent = 'Hints appear here when requested.';
  setAlertLevel('stable');
  syncStats();
  applyThemeState();
  updateCommandLine('SYS BOOT // Awaiting team authorization...');
  setPhase('Briefing');
  logLine('info', 'Mission reset. Configure team and relaunch.');
}

function updateTimerDisplay() {
  const min = String(Math.floor(Math.max(0, state.timeRemaining) / 60)).padStart(2, '0');
  const sec = String(Math.max(0, state.timeRemaining) % 60).padStart(2, '0');
  dom.timerBadge.textContent = `${min}:${sec}`;

  if (state.timeRemaining <= 30) {
    setAlertLevel('critical');
  } else if (state.timeRemaining <= 60) {
    setAlertLevel('warning');
  } else {
    setAlertLevel('stable');
  }

  updateHud();
}

function setAlertLevel(level) {
  const previous = state.alertLevel;
  state.alertLevel = level;
  dom.alarmModule.classList.remove('warning', 'critical');
  dom.timerBadge.classList.remove('warning', 'critical');

  if (level === 'warning') {
    dom.alarmModule.classList.add('warning');
    dom.timerBadge.classList.add('warning');
    dom.alarmLabel.textContent = 'ALARM · ELEVATED';
    if (previous !== level) {
      playSound('alarm');
    }
    updateAmbientByAlert();
    applyThemeState();
    return;
  }

  if (level === 'critical') {
    dom.alarmModule.classList.add('critical');
    dom.timerBadge.classList.add('critical');
    dom.alarmLabel.textContent = 'ALARM · CRITICAL';
    if (previous !== level) {
      playSound('alarm');
    }
    updateAmbientByAlert();
    applyThemeState();
    return;
  }

  dom.alarmLabel.textContent = 'ALARM · STABLE';
  updateAmbientByAlert();
  applyThemeState();
}

function syncStats() {
  dom.scoreStat.textContent = state.score;
  dom.strikeStat.textContent = state.strikes;
  dom.inspectStat.textContent = state.inspected;
  dom.comboStat.textContent = `x${state.combo}`;
  dom.xpStat.textContent = state.xp;
  dom.hintTokenStat.textContent = state.hintTokens;
  dom.hintBtn.disabled = state.hintTokens <= 0;
  updateHud();
  updateBadges();
}

function setPhase(phase) {
  dom.phaseStat.textContent = phase;
}

function logLine(type, text) {
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.textContent = `${new Date().toLocaleTimeString()} · ${text}`;
  dom.logFeed.prepend(line);
}

function setEquals(a, b) {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

init();

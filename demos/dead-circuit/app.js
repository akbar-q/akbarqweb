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
  phaseStat: document.getElementById('phaseStat'),
  componentBoard: document.getElementById('componentBoard'),
  measureBoard: document.getElementById('measureBoard'),
  diagnoseRule: document.getElementById('diagnoseRule'),
  faultOptions: document.getElementById('faultOptions'),
  checkDiagnosisBtn: document.getElementById('checkDiagnosisBtn'),
  repairOptions: document.getElementById('repairOptions'),
  checkRepairBtn: document.getElementById('checkRepairBtn'),
  logFeed: document.getElementById('logFeed'),
  finalSummary: document.getElementById('finalSummary'),
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
  strikes: 0,
  inspected: 0,
  diagnosed: false,
  intervalId: null,
  timeRemaining: 0,
  selectedFaults: new Set(),
  selectedRepairs: new Set(),
  measuredNodes: new Set(),
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
  initVisualFx();
  renderPitchCards();
  bindEvents();
  dom.teamName.value = 'Kirchhoff Crew';
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
  dom.fxToggle.addEventListener('click', toggleFxPreference);
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

function startMission() {
  state.teamName = (dom.teamName.value || '').trim() || 'Circuit Squad';
  state.mode = dom.difficultyMode.value;
  state.scenarioIndex = 0;
  state.score = 0;
  state.strikes = modePenalty[state.mode];
  state.inspected = 0;

  dom.teamBadge.textContent = `Team: ${state.teamName}`;
  dom.introPanel.classList.add('hidden');
  dom.completePanel.classList.add('hidden');
  dom.gamePanel.classList.remove('hidden');
  setAlertLevel('stable');

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
      syncStats();
      logLine('info', `${component.name}: ${component.clue}`);
      if (component.isFault) {
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
        logLine('info', `Probe ${item.node} already sampled.`);
        return;
      }
      state.measuredNodes.add(item.node);
      const reading = item.broken;
      logLine('info', `${item.node} measured: ${reading} (expected ${item.normal}).`);
      state.timeRemaining = Math.max(5, state.timeRemaining - 4);
      updateTimerDisplay();
    });
    dom.measureBoard.appendChild(btn);
  });
}

function renderFaultOptions(scenario) {
  dom.faultOptions.innerHTML = '';
  scenario.components.forEach(item => {
    const wrapper = document.createElement('label');
    wrapper.className = 'fault-item';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = item.id;
    box.addEventListener('change', () => {
      if (box.checked) {
        state.selectedFaults.add(item.id);
      } else {
        state.selectedFaults.delete(item.id);
      }
    });

    const txt = document.createElement('span');
    txt.textContent = ` ${item.name}`;

    wrapper.appendChild(box);
    wrapper.appendChild(txt);
    dom.faultOptions.appendChild(wrapper);
  });
}

function renderRepairOptions(scenario) {
  dom.repairOptions.innerHTML = '';
  scenario.repairOptions.forEach(item => {
    const wrapper = document.createElement('label');
    wrapper.className = 'repair-item';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = item.id;
    box.addEventListener('change', () => {
      if (box.checked) {
        state.selectedRepairs.add(item.id);
      } else {
        state.selectedRepairs.delete(item.id);
      }
    });

    const txt = document.createElement('span');
    txt.textContent = ` ${item.label}`;

    wrapper.appendChild(box);
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
    state.diagnosed = true;
    dom.checkRepairBtn.disabled = false;
    setPhase('Repair');
    logLine('good', 'Diagnosis validated. Fault map matches measured evidence.');
  } else {
    state.strikes += 1;
    state.score = Math.max(0, state.score - 35);
    logLine('bad', 'Diagnosis mismatch. Re-evaluate clues and measurement deltas.');
  }

  syncStats();
}

function validateRepair() {
  const scenario = state.data.scenarios[state.scenarioIndex];
  if (!state.diagnosed) {
    logLine('bad', 'Repair phase locked. Validate diagnosis first.');
    return;
  }

  const required = new Set(scenario.repairOptions.filter(item => item.isRequired).map(item => item.id));
  const isCorrect = setEquals(required, state.selectedRepairs);

  if (isCorrect) {
    state.score += 180 + state.timeRemaining * 2;
    logLine('good', 'Repair successful. System restored before total failure.');
    logLine('info', scenario.debrief);
    clearInterval(state.intervalId);
    dom.nextScenarioBtn.classList.remove('hidden');
    setPhase('Cleared');
  } else {
    state.strikes += 1;
    state.score = Math.max(0, state.score - 45);
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
      logLine('bad', 'One minute remaining. Team, commit to a fault hypothesis now.');
    }
    if (state.timeRemaining === 30) {
      logLine('bad', 'Thirty seconds. Finalize diagnosis and execute only essential repairs.');
    }

    if (state.timeRemaining <= 0) {
      clearInterval(state.intervalId);
      state.strikes += 1;
      setAlertLevel('critical');
      logLine('bad', 'Timeout. Scenario lock triggered. Moving to next challenge.');
      syncStats();
      dom.nextScenarioBtn.classList.remove('hidden');
      setPhase('Timeout');
    }
  }, 1000);
}

function finishMission() {
  clearInterval(state.intervalId);
  dom.gamePanel.classList.add('hidden');
  dom.completePanel.classList.remove('hidden');

  const rank = state.score >= 1300 ? 'Lab Legends' : state.score >= 900 ? 'Fault Hunters' : 'Circuit Survivors';
  dom.finalSummary.textContent = `${state.teamName} completed ${state.data.scenarios.length} scenarios with score ${state.score}, strikes ${state.strikes}, and rank ${rank}.`;
  setAlertLevel('stable');

  logLine('good', `Mission complete. Final rank: ${rank}.`);
}

function resetToIntro() {
  clearInterval(state.intervalId);
  dom.completePanel.classList.add('hidden');
  dom.gamePanel.classList.add('hidden');
  dom.introPanel.classList.remove('hidden');

  state.score = 0;
  state.strikes = 0;
  state.inspected = 0;
  state.scenarioIndex = 0;
  state.selectedFaults.clear();
  state.selectedRepairs.clear();
  state.measuredNodes.clear();

  dom.logFeed.innerHTML = '';
  dom.teamBadge.textContent = 'Team: Unassigned';
  dom.scenarioBadge.textContent = 'Scenario 0/0';
  dom.timerBadge.textContent = '00:00';
  setAlertLevel('stable');
  syncStats();
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
}

function setAlertLevel(level) {
  state.alertLevel = level;
  dom.alarmModule.classList.remove('warning', 'critical');
  dom.timerBadge.classList.remove('warning', 'critical');

  if (level === 'warning') {
    dom.alarmModule.classList.add('warning');
    dom.timerBadge.classList.add('warning');
    dom.alarmLabel.textContent = 'ALARM · ELEVATED';
    return;
  }

  if (level === 'critical') {
    dom.alarmModule.classList.add('critical');
    dom.timerBadge.classList.add('critical');
    dom.alarmLabel.textContent = 'ALARM · CRITICAL';
    return;
  }

  dom.alarmLabel.textContent = 'ALARM · STABLE';
}

function syncStats() {
  dom.scoreStat.textContent = state.score;
  dom.strikeStat.textContent = state.strikes;
  dom.inspectStat.textContent = state.inspected;
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

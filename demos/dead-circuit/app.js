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
  finalSummary: document.getElementById('finalSummary')
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
  measuredNodes: new Set()
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
  renderPitchCards();
  bindEvents();
  dom.teamName.value = 'Kirchhoff Crew';
  logLine('info', 'System ready. Choose a pitch and start the mission.');
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
  syncStats();
  setPhase('Briefing');
  logLine('info', 'Mission reset. Configure team and relaunch.');
}

function updateTimerDisplay() {
  const min = String(Math.floor(Math.max(0, state.timeRemaining) / 60)).padStart(2, '0');
  const sec = String(Math.max(0, state.timeRemaining) % 60).padStart(2, '0');
  dom.timerBadge.textContent = `${min}:${sec}`;
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

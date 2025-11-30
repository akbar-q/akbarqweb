/* WaterFlow mock app - Ras Al Khaimah, UAE */
(function() {
  const state = {
    city: 'Ras Al Khaimah',
    dailyGoal: 600,
    todayLiters: 210,
    pointsToday: 85,
    badges: ['Drop Saver','Leak Hunter'],
    members: ['You'],
    activities: [],
    lowSupply: false,
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
    saveSettings: document.getElementById('saveSettings'),
    closeSettings: document.getElementById('closeSettings'),
    simulateLowSupply: document.getElementById('simulateLowSupply'),
    alertBar: document.getElementById('alertBar'),
    dismissAlert: document.getElementById('dismissAlert'),
  };

  // Load from localStorage
  const saved = localStorage.getItem('waterflow');
  if (saved) {
    Object.assign(state, JSON.parse(saved));
  }

  function save() {
    localStorage.setItem('waterflow', JSON.stringify(state));
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
    save();
    render();
    gsap.from('#alertBar', { y: 12, opacity: 0, duration: 0.25 });
  });
  els.dismissAlert.addEventListener('click', () => {
    state.lowSupply = false;
    save();
    render();
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
})();

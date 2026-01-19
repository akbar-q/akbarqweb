/* global Chart, io */

(function () {
  "use strict";

  const siteRoot = new URL("../", document.baseURI);
  const apiBase = new URL("api/", siteRoot).toString();
  const socketPath = new URL("socket.io", siteRoot).pathname;

  const els = {
    connBadge: document.getElementById("connBadge"),
    clockBadge: document.getElementById("clockBadge"),

    moistureValue: document.getElementById("moistureValue"),
    moistureBar: document.getElementById("moistureBar"),

    pumpState: document.getElementById("pumpState"),
    pumpDot: document.getElementById("pumpDot"),
    flowValue: document.getElementById("flowValue"),

    solarV: document.getElementById("solarV"),
    solarW: document.getElementById("solarW"),

    batteryV: document.getElementById("batteryV"),
    batteryA: document.getElementById("batteryA"),
    batteryMode: document.getElementById("batteryMode"),

    deviceMeta: document.getElementById("deviceMeta"),

    tankPct: document.getElementById("tankPct"),
    env: document.getElementById("env"),

    alarms: document.getElementById("alarms"),

    autoMode: document.getElementById("autoMode"),
    automationToggle: document.getElementById("automationToggle"),
    targetRange: document.getElementById("targetRange"),
    targetLabel: document.getElementById("targetLabel"),

    pumpOnBtn: document.getElementById("pumpOnBtn"),
    pumpOffBtn: document.getElementById("pumpOffBtn"),

    controlResult: document.getElementById("controlResult"),

    eventLog: document.getElementById("eventLog"),
    clearLogBtn: document.getElementById("clearLogBtn"),

    waterFlow: document.getElementById("waterFlow")
  };

  // Gauges
  const gauges = {
    moisture: {
      fill: document.getElementById("gMoistureFill"),
      text: document.getElementById("gMoistureText")
    },
    tank: {
      fill: document.getElementById("gTankFill"),
      text: document.getElementById("gTankText")
    },
    battery: {
      fill: document.getElementById("gBatteryFill"),
      text: document.getElementById("gBatteryText")
    }
  };

  // SCADA/HMI focus elements
  const scada = {
    focusTitle: document.getElementById("focusTitle"),
    focusHint: document.getElementById("focusHint"),
    alarmCountBadge: document.getElementById("alarmCountBadge"),
    modeBadge: document.getElementById("modeBadge"),
    ackAlarmsBtn: document.getElementById("ackAlarmsBtn"),
    injectFaultBtn: document.getElementById("injectFaultBtn"),
    yearNow: document.getElementById("yearNow"),

    cards: {
      moisture: document.getElementById("cardMoisture"),
      pump: document.getElementById("cardPump"),
      solar: document.getElementById("cardSolar"),
      battery: document.getElementById("cardBattery")
    }
  };

  if (scada.yearNow) scada.yearNow.textContent = String(new Date().getFullYear());

  let pinnedFocus = null;

  function setPinnedFocus(key) {
    pinnedFocus = key;
    const entries = Object.entries(scada.cards);
    for (const [k, el] of entries) {
      if (!el) continue;
      el.classList.toggle("card-pinned", k === pinnedFocus);
    }

    const labelMap = {
      moisture: "Soil Moisture",
      pump: "Pump & Flow",
      solar: "Solar Input",
      battery: "Battery"
    };

    if (scada.focusTitle) scada.focusTitle.textContent = pinnedFocus ? labelMap[pinnedFocus] : "—";
    if (scada.focusHint) scada.focusHint.textContent = pinnedFocus
      ? "Pinned. Live updates stay visible while you work."
      : "Click any sensor card to pin it here.";
  }

  function setGauge(g, valuePct, text, color) {
    if (!g || !g.fill || !g.text) return;
    const pct = Math.max(0, Math.min(100, valuePct));
    g.fill.style.strokeDashoffset = String(100 - pct);
    if (color) g.fill.style.stroke = color;
    g.text.textContent = text;
  }

  function fmtTime(d) {
    return d.toLocaleTimeString([], { hour12: false });
  }

  function setConn(state) {
    if (state === "connected") {
      els.connBadge.className = "badge text-bg-success";
      els.connBadge.textContent = "Live";
      return;
    }
    if (state === "disconnected") {
      els.connBadge.className = "badge text-bg-danger";
      els.connBadge.textContent = "Offline";
      return;
    }
    els.connBadge.className = "badge text-bg-secondary";
    els.connBadge.textContent = "Connecting…";
  }

  function logEvent(item) {
    const div = document.createElement("div");
    div.className = "event-item";

    const time = item.time ? new Date(item.time) : new Date();
    const lvl = (item.level || "info").toUpperCase();
    const msg = item.message || JSON.stringify(item);

    div.textContent = `[${fmtTime(time)}] ${lvl}  ${msg}`;
    els.eventLog.appendChild(div);
    els.eventLog.scrollTop = els.eventLog.scrollHeight;
  }

  function setAlarms(alarms) {
    els.alarms.innerHTML = "";
    if (!alarms || alarms.length === 0) {
      const ok = document.createElement("span");
      ok.className = "alarm";
      ok.textContent = "OK";
      els.alarms.appendChild(ok);
      return;
    }

    for (const a of alarms) {
      const pill = document.createElement("span");
      pill.className = `alarm ${a.severity || "warning"}`;
      pill.textContent = `${a.code}: ${a.message}`;
      pill.role = "button";
      pill.tabIndex = 0;
      pill.addEventListener("click", () => {
        logEvent({
          level: a.severity === "critical" ? "error" : "warning",
          message: `Alarm selected: ${a.code} (${a.severity}) — ${a.message}`,
          time: new Date().toISOString()
        });
      });
      els.alarms.appendChild(pill);
    }
  }

  function moistureColor(pct) {
    if (pct < 35) return "bg-danger";
    if (pct < 50) return "bg-warning";
    return "bg-success";
  }

  // Chart
  const ctx = document.getElementById("telemetryChart");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Moisture %",
          data: [],
          borderWidth: 2,
          tension: 0.25
        },
        {
          label: "Battery V",
          data: [],
          borderWidth: 2,
          tension: 0.25
        },
        {
          label: "Solar V",
          data: [],
          borderWidth: 2,
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "rgba(255,255,255,0.95)" }
        },
        tooltip: {
          mode: "index",
          intersect: false
        }
      },
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          ticks: { color: "rgba(255,255,255,0.90)" },
          grid: { color: "rgba(255,255,255,0.10)" }
        },
        y: {
          ticks: { color: "rgba(255,255,255,0.90)" },
          grid: { color: "rgba(255,255,255,0.10)" }
        }
      }
    }
  });

  function pushChartPoint(sample) {
    const t = fmtTime(new Date(sample.time));
    const labels = chart.data.labels;
    labels.push(t);

    chart.data.datasets[0].data.push(sample.moisturePct);
    chart.data.datasets[1].data.push(sample.batteryV);
    chart.data.datasets[2].data.push(sample.solarV);

    while (labels.length > 60) {
      labels.shift();
      for (const ds of chart.data.datasets) ds.data.shift();
    }

    chart.update("none");
  }

  function applySnapshot(snapshot) {
    if (!snapshot) return;

    const s = snapshot.sensors;
    const p = snapshot.power;
    const m = snapshot.mode;
    const a = snapshot.actuators;

    els.deviceMeta.textContent = `Device: ${snapshot.meta.deviceId} • FW: ${snapshot.meta.firmware} • ${snapshot.meta.location}`;

    els.moistureValue.textContent = `${Math.round(s.moisturePct)}%`;
    els.moistureBar.style.width = `${Math.max(0, Math.min(100, s.moisturePct))}%`;
    els.moistureBar.className = `progress-bar ${moistureColor(s.moisturePct)}`;

    els.pumpState.textContent = a.pump.isOn ? "ON" : "OFF";
    els.pumpDot.classList.toggle("on", !!a.pump.isOn);
    els.flowValue.textContent = `${s.flowLpm.toFixed(2)} L/min`;

    els.solarV.textContent = `${s.solarV.toFixed(2)} V`;
    els.solarW.textContent = `${p.estSolarW.toFixed(2)} W`;

    els.batteryV.textContent = `${s.batteryV.toFixed(2)} V`;
    els.batteryA.textContent = `${s.batteryA.toFixed(2)} A`;
    els.batteryMode.textContent = p.charging ? "Charging" : "Discharging";

    els.tankPct.textContent = `${Math.round(s.tankLevelPct)}%`;
    els.env.textContent = `${s.tempC.toFixed(1)}°C / ${Math.round(s.humidityPct)}%`;

    setAlarms(snapshot.alarms);

    // Alarm count + mode badges
    const alarmCount = Array.isArray(snapshot.alarms) ? snapshot.alarms.length : 0;
    if (scada.alarmCountBadge) {
      scada.alarmCountBadge.textContent = `Alarms: ${alarmCount}`;
      scada.alarmCountBadge.className = alarmCount === 0
        ? "badge text-bg-success"
        : (snapshot.alarms.some((x) => x.severity === "critical") ? "badge text-bg-danger" : "badge text-bg-warning");
    }
    if (scada.modeBadge) {
      scada.modeBadge.textContent = `Mode: ${m.automationEnabled ? "AUTO" : "MANUAL"}`;
      scada.modeBadge.className = m.automationEnabled ? "badge text-bg-info" : "badge text-bg-secondary";
    }

    // Dials
    setGauge(gauges.moisture, s.moisturePct, `${Math.round(s.moisturePct)}%`, s.moisturePct < 35 ? "rgba(239,68,68,0.9)" : (s.moisturePct < 50 ? "rgba(245,158,11,0.9)" : "rgba(34,197,94,0.9)"));
    setGauge(gauges.tank, s.tankLevelPct, `${Math.round(s.tankLevelPct)}%`, s.tankLevelPct < 12 ? "rgba(239,68,68,0.9)" : (s.tankLevelPct < 25 ? "rgba(245,158,11,0.9)" : "rgba(56,189,248,0.88)"));
    // battery gauge uses a 9.6..12.2V range
    const battPct = ((s.batteryV - 9.6) / (12.2 - 9.6)) * 100;
    setGauge(gauges.battery, battPct, `${s.batteryV.toFixed(1)}V`, s.batteryV < 10.1 ? "rgba(239,68,68,0.9)" : "rgba(56,189,248,0.88)");

    // Animate water flow only when pump is on
    els.waterFlow.style.opacity = a.pump.isOn ? "1" : "0";

    // Controls reflect current mode
    els.automationToggle.checked = !!m.automationEnabled;
    els.autoMode.textContent = m.automationEnabled ? "Auto" : "Manual";
    els.targetRange.value = Math.round(m.moistureTargetPct);
    els.targetLabel.textContent = `${Math.round(m.moistureTargetPct)}%`;
  }

  async function postControl(body) {
    const res = await fetch(`${apiBase}control`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    return res.json();
  }

  // Card interactions
  function wireCardClick(el, key, onClick) {
    if (!el) return;
    const handler = () => {
      setPinnedFocus(key);
      if (onClick) onClick();
    };
    el.addEventListener("click", handler);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler();
      }
    });
  }

  wireCardClick(scada.cards.moisture, "moisture", () => {
    els.controlResult.textContent = "Focus pinned: Soil Moisture";
  });

  wireCardClick(scada.cards.solar, "solar", () => {
    els.controlResult.textContent = "Focus pinned: Solar Input";
  });

  wireCardClick(scada.cards.battery, "battery", () => {
    els.controlResult.textContent = "Focus pinned: Battery";
  });

  wireCardClick(scada.cards.pump, "pump", async () => {
    // Quick toggle pump for dramatic demo effect
    const desired = els.pumpState.textContent === "ON" ? "off" : "on";
    try {
      const result = await postControl({ pump: desired });
      els.controlResult.textContent = `Applied: ${JSON.stringify(result.applied)}`;
      applySnapshot(result.snapshot);
    } catch (e) {
      els.controlResult.textContent = `Error: ${e.message || e}`;
    }
  });

  // Alarm console actions
  if (scada.ackAlarmsBtn) {
    scada.ackAlarmsBtn.addEventListener("click", () => {
      logEvent({ level: "info", message: "Operator action: alarms acknowledged", time: new Date().toISOString() });
      els.controlResult.textContent = "Operator action: alarms acknowledged";
    });
  }

  if (scada.injectFaultBtn) {
    scada.injectFaultBtn.addEventListener("click", async () => {
      // In server mode this is just a log; in static mode it still adds log.
      logEvent({ level: "warning", message: "Operator action: injected simulated fault", time: new Date().toISOString() });
      els.controlResult.textContent = "Injected fault (simulated) — watch alarms.";
      // Nudge the system by forcing pump on to drain tank a bit
      try {
        const result = await postControl({ pump: "on" });
        applySnapshot(result.snapshot);
      } catch {
        // ignore
      }
    });
  }

  // UI events
  els.automationToggle.addEventListener("change", async () => {
    try {
      const result = await postControl({ automationEnabled: els.automationToggle.checked });
      els.controlResult.textContent = `Applied: ${JSON.stringify(result.applied)}`;
      applySnapshot(result.snapshot);
    } catch (e) {
      els.controlResult.textContent = `Error: ${e.message || e}`;
    }
  });

  let targetDebounce = null;
  els.targetRange.addEventListener("input", () => {
    els.targetLabel.textContent = `${els.targetRange.value}%`;
    if (targetDebounce) clearTimeout(targetDebounce);
    targetDebounce = setTimeout(async () => {
      try {
        const result = await postControl({ moistureTargetPct: Number(els.targetRange.value) });
        els.controlResult.textContent = `Applied: ${JSON.stringify(result.applied)}`;
        applySnapshot(result.snapshot);
      } catch (e) {
        els.controlResult.textContent = `Error: ${e.message || e}`;
      }
    }, 250);
  });

  els.pumpOnBtn.addEventListener("click", async () => {
    try {
      const result = await postControl({ pump: "on" });
      els.controlResult.textContent = `Applied: ${JSON.stringify(result.applied)}`;
      applySnapshot(result.snapshot);
    } catch (e) {
      els.controlResult.textContent = `Error: ${e.message || e}`;
    }
  });

  els.pumpOffBtn.addEventListener("click", async () => {
    try {
      const result = await postControl({ pump: "off" });
      els.controlResult.textContent = `Applied: ${JSON.stringify(result.applied)}`;
      applySnapshot(result.snapshot);
    } catch (e) {
      els.controlResult.textContent = `Error: ${e.message || e}`;
    }
  });

  document.querySelectorAll("button[data-profile]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const profile = btn.getAttribute("data-profile");
      const body = profile === "eco"
        ? { automationEnabled: true, moistureTargetPct: 50, hysteresisPct: 4, pumpMaxOnSec: 14, cooldownSec: 35 }
        : { automationEnabled: true, moistureTargetPct: 62, hysteresisPct: 2, pumpMaxOnSec: 22, cooldownSec: 18 };

      try {
        const result = await postControl(body);
        els.controlResult.textContent = `Applied: ${JSON.stringify(result.applied)}`;
        applySnapshot(result.snapshot);
      } catch (e) {
        els.controlResult.textContent = `Error: ${e.message || e}`;
      }
    });
  });

  els.clearLogBtn.addEventListener("click", () => {
    els.eventLog.innerHTML = "";
  });

  // Clock
  setInterval(() => {
    els.clockBadge.textContent = fmtTime(new Date());
  }, 250);

  // Initial fetch + socket
  (async () => {
    setConn("connecting");

    async function fetchJson(url, timeoutMs) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } finally {
        clearTimeout(t);
      }
    }

    // Detect whether we're running behind the Node server (API available).
    let serverMode = false;
    try {
      await fetchJson(`${apiBase}health`, 800);
      serverMode = true;
    } catch {
      serverMode = false;
    }

    // Seed UI either from server state or from static mock snapshot.
    if (serverMode) {
      try {
        const s = await fetchJson(`${apiBase}state`, 1200);
        applySnapshot(s);
        if (Array.isArray(s.recentEvents)) {
          for (const ev of s.recentEvents) logEvent(ev);
        }
      } catch {
        // ignore
      }

      // Prefill chart with recent history if available
      try {
        const h = await fetchJson(`${apiBase}metrics?windowSec=300&stepSec=2`, 1500);
        if (h && Array.isArray(h.points)) {
          for (const pt of h.points) pushChartPoint(pt);
        }
      } catch {
        // ignore
      }

      // Prefer Socket.IO, but fall back to polling if it can't connect.
      let pollingId = null;

      function startPolling() {
        if (pollingId) return;
        pollingId = setInterval(async () => {
          try {
            const s = await fetchJson(`${apiBase}state`, 1000);
            applySnapshot(s);
          } catch {
            setConn("disconnected");
          }
        }, 1000);
      }

      if (typeof window.io === "function") {
        const socket = window.io({
          path: socketPath,
          transports: ["websocket", "polling"],
          timeout: 1500
        });

        const connectTimer = setTimeout(() => {
          // if not connected quickly, treat as offline and poll
          if (!socket.connected) startPolling();
        }, 1600);

        socket.on("connect", () => {
          clearTimeout(connectTimer);
          setConn("connected");
          if (pollingId) {
            clearInterval(pollingId);
            pollingId = null;
          }
        });

        socket.on("disconnect", () => {
          setConn("disconnected");
          startPolling();
        });

        socket.on("hello", (data) => {
          if (data && data.snapshot) applySnapshot(data.snapshot);
        });

        socket.on("telemetry", (data) => {
          if (!data) return;
          if (data.sample) pushChartPoint(data.sample);
          if (data.snapshot) applySnapshot(data.snapshot);
        });

        socket.on("state", (snapshot) => {
          applySnapshot(snapshot);
        });

        socket.on("event", (ev) => {
          logEvent(ev);
        });
      } else {
        // no socket.io client loaded
        startPolling();
      }
    } else {
      // GitHub Pages / static mode: fully in-browser simulator
      setConn("connected");
      els.connBadge.className = "badge text-bg-primary";
      els.connBadge.textContent = "Simulated";

      const engine = window.ASIW_MockEngine && window.ASIW_MockEngine.createBrowserMockEngine
        ? window.ASIW_MockEngine.createBrowserMockEngine()
        : null;

      if (!engine) {
        els.connBadge.className = "badge text-bg-danger";
        els.connBadge.textContent = "No mock engine";
        return;
      }

      applySnapshot(engine.snapshot());
      engine.subscribe((evt) => {
        if (evt.type === "telemetry") {
          if (evt.payload && evt.payload.sample) pushChartPoint(evt.payload.sample);
          if (evt.payload && evt.payload.snapshot) applySnapshot(evt.payload.snapshot);
        }
        if (evt.type === "state") {
          applySnapshot(evt.payload);
        }
        if (evt.type === "event") {
          logEvent(evt.payload);
        }
      });

      // Override postControl to be local-only in static mode
      const origPostControl = postControl;
      // eslint-disable-next-line no-unused-vars
      postControl = async function (body) {
        const snap = engine.applyControl(body);
        return { ok: true, applied: body, snapshot: snap };
      };
      // keep ref to avoid lint removal
      void origPostControl;

      engine.start();
    }
  })();
})();

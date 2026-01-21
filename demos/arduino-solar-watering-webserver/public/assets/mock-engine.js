(function () {
  "use strict";

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function round(n, decimals) {
    const p = Math.pow(10, decimals);
    return Math.round(n * p) / p;
  }

  function dayFactor(tMs) {
    // “fast day/night” cycle for demo: 0..1
    const periodMs = 90_000;
    const x = (tMs % periodMs) / periodMs;
    return clamp(Math.sin(x * Math.PI), 0, 1);
  }

  function createBrowserMockEngine() {
    const startedAt = Date.now();
    let lastTick = Date.now();
    let intervalId = null;

    const state = {
      meta: {
        deviceId: "ASIW-UNO-MOCK-01",
        firmware: "mock-static-1.0.0",
        location: "Greenhouse Bay A",
        time: new Date().toISOString()
      },
      mode: {
        automationEnabled: true,
        moistureTargetPct: 55,
        hysteresisPct: 3,
        pumpMaxOnSec: 18,
        cooldownSec: 25
      },
      actuators: {
        pump: {
          isOn: false,
          dutyPct: 0,
          lastSwitchIso: new Date().toISOString()
        }
      },
      sensors: {
        moisturePct: 58,
        tempC: 23.4,
        humidityPct: 48,
        tankLevelPct: 72,
        flowLpm: 0,
        solarV: 5.6,
        batteryV: 5.06,
        batteryA: 0.18
      },
      power: {
        charging: true,
        estLoadW: 2.2,
        estSolarW: 4.7
      },
      alarms: [],
      stats: {
        totalPumpRuns: 14,
        totalPumpOnSecToday: 214,
        waterUsedLToday: 3.1
      }
    };

    const listeners = new Set();

    let pumpOnRemainingMs = 0;
    let cooldownRemainingMs = 0;

    function emit(type, payload) {
      const evt = { type, payload };
      for (const cb of listeners) cb(evt);
    }

    function pushEvent(level, message, extra) {
      emit("event", {
        time: new Date().toISOString(),
        level,
        message,
        ...(extra || {})
      });
    }

    function setPump(on) {
      if (state.actuators.pump.isOn === on) return;
      state.actuators.pump.isOn = on;
      state.actuators.pump.lastSwitchIso = new Date().toISOString();
      state.actuators.pump.dutyPct = on ? 100 : 0;
      state.sensors.flowLpm = on ? round(rand(0.7, 1.4), 2) : 0;
      pushEvent("info", on ? "Pump switched ON" : "Pump switched OFF", { pumpOn: on });
    }

    function computeAlarms() {
      const alarms = [];
      if (state.sensors.tankLevelPct < 12) {
        alarms.push({ code: "TANK_LOW", severity: "critical", message: "Water tank is critically low" });
      } else if (state.sensors.tankLevelPct < 25) {
        alarms.push({ code: "TANK_WARN", severity: "warning", message: "Water tank is getting low" });
      }
      if (state.sensors.batteryV < 4.75) {
        alarms.push({ code: "BATTERY_LOW", severity: "critical", message: "Battery voltage is low" });
      }
      state.alarms = alarms;
    }

    function snapshot() {
      return JSON.parse(JSON.stringify({
        ...state,
        stats: {
          ...state.stats,
          totalPumpOnSecToday: Math.round(state.stats.totalPumpOnSecToday)
        }
      }));
    }

    function tick() {
      const now = Date.now();
      const dt = now - lastTick;
      lastTick = now;

      state.meta.time = new Date().toISOString();

      const df = dayFactor(now - startedAt);

      // Solar / battery behavior
      const solarVTarget = lerp(0.6, 6.3, df) + rand(-0.06, 0.06);
      state.sensors.solarV = round(clamp(solarVTarget, 0, 6.6), 2);

      const loadW = state.actuators.pump.isOn ? rand(3.5, 6.5) : rand(0.4, 1.3);
      const solarW = clamp((state.sensors.solarV - 4.4) * 1.1, 0, 6.0);
      state.power.estLoadW = round(loadW, 2);
      state.power.estSolarW = round(solarW, 2);

      const netW = solarW - loadW;
      state.power.charging = netW > -0.2;

      const batteryVTarget = clamp(state.sensors.batteryV + netW * 0.0011 * (dt / 1000), 4.6, 5.25);
      state.sensors.batteryV = round(batteryVTarget + rand(-0.004, 0.004), 3);
      state.sensors.batteryA = round(clamp(netW / 5, -2.0, 2.0), 2);

      // Environment
      state.sensors.tempC = round(lerp(20.5, 27.2, df) + rand(-0.15, 0.15), 2);
      state.sensors.humidityPct = round(clamp(lerp(42, 60, 1 - df) + rand(-0.5, 0.5), 25, 85), 1);

      // Tank + soil moisture
      if (state.actuators.pump.isOn) {
        const drain = (state.sensors.flowLpm / 60) * (dt / 1000) * 100;
        state.sensors.tankLevelPct = round(clamp(state.sensors.tankLevelPct - drain, 0, 100), 2);
      } else {
        state.sensors.tankLevelPct = round(clamp(state.sensors.tankLevelPct + rand(-0.01, 0.02), 0, 100), 2);
      }

      const dryRate = lerp(0.02, 0.05, df) * (dt / 1000);
      const wetRate = state.actuators.pump.isOn ? rand(0.25, 0.55) * (dt / 1000) : 0;
      state.sensors.moisturePct = round(clamp(state.sensors.moisturePct - dryRate + wetRate + rand(-0.03, 0.03), 0, 100), 2);

      // Automation timers
      if (cooldownRemainingMs > 0) cooldownRemainingMs = Math.max(0, cooldownRemainingMs - dt);

      if (pumpOnRemainingMs > 0) {
        pumpOnRemainingMs = Math.max(0, pumpOnRemainingMs - dt);
        if (pumpOnRemainingMs === 0) {
          setPump(false);
          cooldownRemainingMs = state.mode.cooldownSec * 1000;
        }
      }

      if (state.mode.automationEnabled && !state.actuators.pump.isOn && cooldownRemainingMs === 0) {
        const thresholdOn = state.mode.moistureTargetPct - state.mode.hysteresisPct;
        if (state.sensors.moisturePct < thresholdOn) {
          if (state.sensors.tankLevelPct < 8) {
            pushEvent("error", "Automation blocked: tank empty", { code: "TANK_EMPTY" });
          } else if (state.sensors.batteryV < 4.72) {
            pushEvent("warning", "Automation blocked: low battery", { code: "BATTERY_LOW" });
          } else {
            const runSec = Math.max(3, Math.min(state.mode.pumpMaxOnSec, Math.round(rand(8, state.mode.pumpMaxOnSec))));
            pumpOnRemainingMs = runSec * 1000;
            state.stats.totalPumpRuns += 1;
            setPump(true);
          }
        }
      }

      if (state.actuators.pump.isOn) {
        state.stats.totalPumpOnSecToday += dt / 1000;
        state.stats.waterUsedLToday = round(state.stats.waterUsedLToday + (state.sensors.flowLpm / 60) * (dt / 1000), 3);
      }

      computeAlarms();

      emit("telemetry", {
        sample: {
          time: state.meta.time,
          moisturePct: state.sensors.moisturePct,
          tankLevelPct: state.sensors.tankLevelPct,
          solarV: state.sensors.solarV,
          batteryV: state.sensors.batteryV,
          batteryA: state.sensors.batteryA,
          tempC: state.sensors.tempC,
          humidityPct: state.sensors.humidityPct,
          pumpOn: state.actuators.pump.isOn,
          flowLpm: state.sensors.flowLpm
        },
        snapshot: snapshot()
      });
    }

    function applyControl(cmd) {
      if (!cmd) return snapshot();

      if (typeof cmd.automationEnabled === "boolean") {
        state.mode.automationEnabled = cmd.automationEnabled;
        pushEvent("info", cmd.automationEnabled ? "Automation enabled" : "Automation disabled");
      }

      if (typeof cmd.moistureTargetPct === "number") {
        state.mode.moistureTargetPct = clamp(cmd.moistureTargetPct, 5, 95);
        pushEvent("info", `Moisture target set to ${Math.round(state.mode.moistureTargetPct)}%`);
      }

      if (typeof cmd.hysteresisPct === "number") {
        state.mode.hysteresisPct = clamp(cmd.hysteresisPct, 1, 15);
        pushEvent("info", `Hysteresis set to ${Math.round(state.mode.hysteresisPct)}%`);
      }

      if (typeof cmd.pumpMaxOnSec === "number") {
        state.mode.pumpMaxOnSec = clamp(cmd.pumpMaxOnSec, 3, 60);
        pushEvent("info", `Max pump on-time set to ${Math.round(state.mode.pumpMaxOnSec)}s`);
      }

      if (typeof cmd.cooldownSec === "number") {
        state.mode.cooldownSec = clamp(cmd.cooldownSec, 0, 180);
        pushEvent("info", `Cooldown set to ${Math.round(state.mode.cooldownSec)}s`);
      }

      if (cmd.pump === "on") {
        pumpOnRemainingMs = state.mode.pumpMaxOnSec * 1000;
        cooldownRemainingMs = 0;
        setPump(true);
      }

      if (cmd.pump === "off") {
        pumpOnRemainingMs = 0;
        setPump(false);
        cooldownRemainingMs = state.mode.cooldownSec * 1000;
      }

      emit("state", snapshot());
      return snapshot();
    }

    function start() {
      if (intervalId) return;
      pushEvent("info", "Static mode: in-browser simulator running (GitHub Pages compatible)");
      lastTick = Date.now();
      intervalId = setInterval(tick, 1000);
      // initial tick to prime UI
      tick();
    }

    function stop() {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    }

    function subscribe(cb) {
      listeners.add(cb);
      return function () { listeners.delete(cb); };
    }

    return {
      start,
      stop,
      subscribe,
      snapshot,
      applyControl
    };
  }

  // Expose to app.js
  window.ASIW_MockEngine = {
    createBrowserMockEngine
  };
})();

"use strict";

const path = require("path");
const express = require("express");
const http = require("http");
const helmet = require("helmet");
const { Server } = require("socket.io");

const { createTelemetryEngine } = require("./telemetry");

const PORT = Number(process.env.PORT || 8080);

const app = express();
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: "256kb" }));

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir, { extensions: ["html"] }));

const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket.io",
  serveClient: true
});

const engine = createTelemetryEngine();

function nowIso() {
  return new Date().toISOString();
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "arduino-solar-watering-webserver-mock",
    capabilities: {
      socketIo: true,
      sse: false
    },
    time: nowIso(),
    uptimeSec: Math.floor(process.uptime())
  });
});

app.get("/api/state", (req, res) => {
  res.json(engine.getSnapshot());
});

app.get("/api/metrics", (req, res) => {
  const windowSec = Math.max(60, Math.min(3600, Number(req.query.windowSec || 600)));
  const stepSec = Math.max(1, Math.min(10, Number(req.query.stepSec || 2)));
  res.json(engine.getHistory({ windowSec, stepSec }));
});

app.post("/api/control", (req, res) => {
  const result = engine.applyControl(req.body || {});
  res.json(result);
});

io.on("connection", (socket) => {
  socket.emit("hello", { time: nowIso(), snapshot: engine.getSnapshot() });

  const unsub = engine.subscribe((evt) => {
    socket.emit(evt.type, evt.payload);
  });

  socket.on("control", (cmd, ack) => {
    const result = engine.applyControl(cmd || {});
    if (typeof ack === "function") ack(result);
  });

  socket.on("disconnect", () => {
    unsub();
  });
});

engine.start((evt) => {
  io.emit(evt.type, evt.payload);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock server running on http://localhost:${PORT}`);
});

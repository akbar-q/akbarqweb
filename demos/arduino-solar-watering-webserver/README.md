# Arduino Solar Integrated Watering System — Web Server (Mock)

A **self-contained mock web server + real-time dashboard** for your hardware watering system project.

- Simulates live telemetry (soil moisture, pump state, solar/battery, tank level, alarms)
- Provides a REST API (`/api/...`)
- Streams “live” updates via WebSockets (Socket.IO)
- Includes an animated dashboard UI

## Run (Windows)

From this folder:

```bash
npm install
npm start
```

Then open:

- http://localhost:8080

## GitHub Pages

This demo is **GitHub Pages compatible**.

- When hosted statically (GitHub Pages), the dashboard automatically switches to **Simulated** mode (in-browser telemetry generator).
- When run via `npm start`, it uses the local REST API + Socket.IO for “server mode”.

After publishing the repo with GitHub Pages enabled, open:

- `https://<username>.github.io/<repo>/demos/arduino-solar-watering-webserver/`

## API (mock)

- `GET /api/health`
- `GET /api/state`
- `GET /api/metrics?windowSec=600&stepSec=5`
- `POST /api/control` (simulate commands)

## Notes

This is intentionally **not connected** to real hardware yet; it’s a presentation-grade mock-up.

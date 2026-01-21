# ESP32 self-hosted version

This folder adds **ESP32 firmware** that:
- hosts the dashboard from **LittleFS** (self-hosted web UI)
- serves a REST API compatible with the existing UI (`/api/health`, `/api/state`, `/api/metrics`, `/api/control`)
- streams live updates via **SSE** (`/api/stream`) which is ESP32-friendly

## Arduino IDE (AP mode)

If you want Arduino IDE (instead of PlatformIO) and **AP mode by default**, use:

- `arduino-ide/ASIW_ESP32/ASIW_ESP32.ino`

See `arduino-ide/ASIW_ESP32/README.md` for setup and LittleFS upload steps.

## Quick start (VS Code + PlatformIO)

1) Create `config.h`
- Copy `include/config.example.h` to `include/config.h`
- Fill in `WIFI_SSID` and `WIFI_PASSWORD`

2) Sync UI into the filesystem image
- Run `./sync_data.ps1` (PowerShell)

3) Build + upload
- Upload firmware
- Build Filesystem Image
- Upload Filesystem Image

Then open the Serial Monitor to see the IP address.

## Hardware notes (important)

- Use a **voltage divider** for solar/battery ADC measurements (ESP32 ADC max is ~3.3V)
- Use a **MOSFET / relay driver** for the pump (do not drive a pump from a GPIO)
- Prefer a **capacitive soil moisture sensor** (resists corrosion)

## API

- `GET /api/health` → includes `{ capabilities: { sse: true } }`
- `GET /api/state` → dashboard snapshot
- `GET /api/metrics?windowSec=300&stepSec=2` → recent points for chart
- `POST /api/control` → toggle pump / set targets (same payloads as the mock)
- `GET /api/stream` → Server-Sent Events: `hello`, `telemetry`, `state`, `event`

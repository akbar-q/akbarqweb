# Arduino IDE (ESP32) — AP mode self-hosted dashboard

This is the Arduino IDE version of the ESP32 firmware.

## What it does
- ESP32 starts in **Wi‑Fi AP mode** (creates its own network)
- Hosts the dashboard from **LittleFS** (self-hosted)
- REST endpoints: `/api/health`, `/api/state`, `/api/metrics`, `/api/control`
- Live updates via **SSE**: `/api/stream`

## Setup

### 1) Arduino IDE + ESP32 core
- Install ESP32 board support (Espressif Systems) via Boards Manager

### 2) Libraries
Install via Library Manager:
- `ArduinoJson`

### 3) Configure
- Open `ASIW_ESP32.ino` and edit the **Config** section at the top (SSID/pass, pins, divider ratios, calibration)

### 4) Put the dashboard into LittleFS
- Run `sync_data.ps1` to copy the existing dashboard into this sketch’s `data/` folder
- Upload the filesystem using a LittleFS uploader tool for Arduino IDE (depends on your IDE version)

### 5) Flash firmware
- Open `ASIW_ESP32.ino`
- Select an ESP32 board (e.g. ESP32 Dev Module)
- Upload

## Use
- Connect your phone/laptop to the Wi‑Fi network `ASIW-ESP32`
- Browse to `http://192.168.4.1/`

## Notes
- Solar + battery ADC must be through voltage dividers (ESP32 ADC max ~3.3V)
- Pump must be driven via MOSFET/relay driver + flyback diode

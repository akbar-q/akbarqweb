# WaterFlow — Mock App (Ras Al Khaimah, UAE)

A slick dark-mode, animated web app that emulates household water tracking and gamifies conservation. Built for GitHub Pages.

- City context: Ras Al Khaimah, UAE (hot climate, higher water demand)
- Features: splash screen, animated dashboard, weekly chart, gamification (points, badges, challenges, streaks), household management, activity logging, settings, playful alert for low supply
- Data: simulated and stored in localStorage
- Tech: vanilla HTML/CSS/JS, GSAP (animations), Chart.js (charts)

## Hardware Telemetry Demo (Prototype Context)

Added a simulated telemetry panel modeling a small off‑grid prototype:

- PV panel nominal: 40 W (slider adjusts irradiance 200–1100 W/m²)
- Battery: 6 V chemistry mock (voltage derives from SoC 5.8–6.4 V)
- Load: adjustable 5–60 W consumer demand
- Charge controller modes: Idle / Bulk / Absorb / Discharge (heuristic based on net watts)
- Inverter efficiency: static 88% (display only)
- System temperature: modest drift with charging/discharging behavior
- Live chart: PV output vs Load vs Battery SoC (last 20 samples, auto-updates every 4s)

All values are algorithmically generated and not from real sensors—intended to visually communicate data flows and complexity for demo/recording purposes.

## Run locally

Open `index.html` in a browser, or start a simple server.

## Deploy on GitHub Pages

1. Commit and push this folder to your repo.
2. In GitHub, go to Settings → Pages.
3. Set the source to your default branch and the folder to `/demos/water-flow` if using a monorepo with Pages from root, or structure as a dedicated repo.
4. The app will be available at `https://<your-username>.github.io/<repo>/demos/water-flow/`.

## Notes

- This is a mock app; no real water data or external services.
- The "low supply" mode uses a playful alert and double points incentive, not harmful content.
- Hardware telemetry is simulated; do not use for engineering calculations.

## Credits / Branding

Branding and concept collaboration: **Gian-Miguel (Gian / Suyno Gang)** — aided by **Akbar (Nobita)**.

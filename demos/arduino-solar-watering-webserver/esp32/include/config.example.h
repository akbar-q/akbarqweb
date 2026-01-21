#pragma once

// Copy this file to `config.h` and fill in your Wi-Fi credentials.
// `config.h` is not committed by default.

#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// If Wi-Fi can't connect, the ESP32 starts an AP with these credentials.
#define AP_SSID "ASIW-ESP32"
#define AP_PASSWORD "asiw-control"

// Pins (adjust for your wiring / board)
// NOTE: On ESP32, ADC pins are input-only and have restrictions.
#define SOLAR_ADC_PIN 34
#define SOIL_ADC_PIN 35
#define BATTERY_ADC_PIN 32

// Pump output (use a MOSFET / driver, not direct from GPIO)
#define PUMP_PIN 26
#define PUMP_ACTIVE_HIGH 1

// Voltage divider ratios: V_in = V_adc * DIVIDER_RATIO
// Example divider: 100k (top) + 47k (bottom) => ratio ~= (100+47)/47 = 3.127
#define SOLAR_DIVIDER_RATIO 3.13f
#define BATTERY_DIVIDER_RATIO 2.00f

// Calibration factor to fine-tune ADC -> volts
#define ADC_CAL 1.00f

// Soil sensor calibration (raw ADC values)
// You MUST calibrate these for your specific probe + soil.
#define MOISTURE_RAW_DRY 3200
#define MOISTURE_RAW_WET 1500

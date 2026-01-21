#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>
// ==============================
// Config (edit in this one file)
// ==============================
// Access Point settings (AP mode is DEFAULT)
static const char* AP_SSID = "ASIW-ESP32";
static const char* AP_PASSWORD = "asiw-control"; // must be >= 8 chars

// Pins (adjust for your wiring / board)
// ADC: Use voltage dividers so ADC pin never exceeds ~3.3V.
// User hardware:
// - D18 is relay (pump)
// - D32 is moisture sensor (ADC)
// - D25 is PV voltage divider input (10:1) but PV is NOT connected yet, so we simulate PV volts.
static const int SOLAR_ADC_PIN = 25;
static const int SOIL_ADC_PIN = 32;
static const int BATTERY_ADC_PIN = -1; // not wired; battery volts are simulated for UI

// Pump output (drive a MOSFET/relay module, not the pump directly)
static const int PUMP_PIN = 18;
static const bool PUMP_ACTIVE_HIGH = true;

// Voltage divider ratios: V_in = V_adc * DIVIDER_RATIO
// Example divider: 100k top + 47k bottom => ratio ~= (100+47)/47 = 3.127
// PV divider: 10:1
static const float SOLAR_DIVIDER_RATIO = 10.0f;
static const float BATTERY_DIVIDER_RATIO = 2.00f; // unused unless you wire a battery divider

// Calibration factor to fine-tune ADC -> volts
static const float ADC_CAL = 1.00f;

// Soil sensor calibration (raw ADC values)
// You MUST calibrate these for your specific probe + soil.
static const int MOISTURE_RAW_DRY = 3200;
static const int MOISTURE_RAW_WET = 1500;

namespace {

constexpr uint16_t TELEMETRY_HZ_MS = 1000;
constexpr size_t HISTORY_MAX = 600; // ~10 minutes at 1Hz

struct Sample {
  uint32_t ms;
  float moisturePct;
  float tankLevelPct;
  float solarV;
  float batteryV;
  float batteryA;
  float tempC;
  float humidityPct;
  bool pumpOn;
  float flowLpm;
};

WebServer server(80);

WiFiClient sseClient;
bool sseConnected = false;

struct Mode {
  bool automationEnabled = true;
  float moistureTargetPct = 55;
  float hysteresisPct = 3;
  uint16_t pumpMaxOnSec = 18;
  uint16_t cooldownSec = 25;
} mode;

bool pumpOn = false;
uint32_t pumpOnRemainingMs = 0;
uint32_t cooldownRemainingMs = 0;

uint32_t totalPumpRuns = 0;
uint32_t totalPumpOnSecToday = 0;
float waterUsedLToday = 0;

Sample history[HISTORY_MAX];
size_t historyCount = 0;
size_t historyHead = 0;

float clampf(float v, float mn, float mx) {
  return v < mn ? mn : (v > mx ? mx : v);
}

float readAdcVolts(int pin) {
  uint32_t acc = 0;
  constexpr int N = 16;
  for (int i = 0; i < N; i++) {
    acc += (uint32_t)analogRead(pin);
    delayMicroseconds(250);
  }
  float raw = (float)acc / (float)N;
  float v = (raw / 4095.0f) * 3.3f;
  return v * ADC_CAL;
}

float solarVolts() {
  // PV divider input isn't connected yet, so generate a realistic "alive" PV signal.
  // Hover around 6–7V with a slow wave and tiny jitter.
  const float t = (float)millis() / 1000.0f;
  const float base = 6.55f;
  const float wave = 0.35f * sinf(t * 2.0f * PI / 22.0f);
  const float jitter = ((float)random(-500, 501) / 1000.0f) * 0.08f;
  return clampf(base + wave + jitter, 5.6f, 7.2f);
}

float batteryVolts() {
  // Not wired: simulate a 5V pack output with a small sag when pump is on.
  const float t = (float)millis() / 1000.0f;
  const float ripple = 0.02f * sinf(t * 2.0f * PI / 6.0f);
  const float sag = pumpOn ? 0.12f : 0.00f;
  return clampf(5.05f + ripple - sag, 4.70f, 5.20f);
}

float soilMoisturePct() {
  float raw = readAdcVolts(SOIL_ADC_PIN) / 3.3f * 4095.0f;
  const float dry = (float)MOISTURE_RAW_DRY;
  const float wet = (float)MOISTURE_RAW_WET;

  float pct;
  if (dry > wet) {
    pct = (dry - raw) / (dry - wet) * 100.0f;
  } else {
    pct = (raw - dry) / (wet - dry) * 100.0f;
  }
  return clampf(pct, 0.0f, 100.0f);
}

void setPump(bool on) {
  if (pumpOn == on) return;
  pumpOn = on;

  if (PUMP_ACTIVE_HIGH) {
    digitalWrite(PUMP_PIN, on ? HIGH : LOW);
  } else {
    digitalWrite(PUMP_PIN, on ? LOW : HIGH);
  }

  if (on) totalPumpRuns++;
}

void pushHistory(const Sample& s) {
  history[historyHead] = s;
  historyHead = (historyHead + 1) % HISTORY_MAX;
  if (historyCount < HISTORY_MAX) historyCount++;
}

void sseSend(const char* eventName, const String& dataJson) {
  if (!sseConnected) return;
  if (!sseClient.connected()) {
    sseConnected = false;
    return;
  }

  sseClient.print("event: ");
  sseClient.print(eventName);
  sseClient.print("\n");
  sseClient.print("data: ");
  sseClient.print(dataJson);
  sseClient.print("\n\n");
}

void fillSnapshot(JsonObject doc) {
  JsonObject meta = doc["meta"].to<JsonObject>();
  meta["deviceId"] = "ASIW-ESP32";
  meta["firmware"] = "esp32-arduino-1.0.0";
  meta["location"] = "Plant";
  // Dashboard tolerates uptime-style numeric timestamps.
  meta["time"] = (uint32_t)millis();

  JsonObject m = doc["mode"].to<JsonObject>();
  m["automationEnabled"] = mode.automationEnabled;
  m["moistureTargetPct"] = mode.moistureTargetPct;
  m["hysteresisPct"] = mode.hysteresisPct;
  m["pumpMaxOnSec"] = mode.pumpMaxOnSec;
  m["cooldownSec"] = mode.cooldownSec;

  JsonObject actuators = doc["actuators"].to<JsonObject>();
  JsonObject pump = actuators["pump"].to<JsonObject>();
  pump["isOn"] = pumpOn;
  pump["dutyPct"] = pumpOn ? 100 : 0;
  pump["lastSwitchIso"] = "";

  const float sV = clampf(solarVolts(), 0.0f, 7.5f);
  const float bV = clampf(batteryVolts(), 0.0f, 6.0f);
  const float moist = soilMoisturePct();

  // Fillers you can replace later
  const float tempC = 25.0f;
  const float humidity = 50.0f;
  const float tankLevelPct = 100.0f;
  const float flowLpm = pumpOn ? 1.0f : 0.0f;

  const float estSolarW = clampf((sV - 4.4f) * 1.1f, 0.0f, 6.0f);
  const float estLoadW = pumpOn ? 5.0f : 0.8f;
  const float netW = estSolarW - estLoadW;
  const bool charging = netW > -0.2f;
  const float bA = clampf(netW / 5.0f, -2.0f, 2.0f);

  JsonObject sensors = doc["sensors"].to<JsonObject>();
  sensors["moisturePct"] = moist;
  sensors["tempC"] = tempC;
  sensors["humidityPct"] = humidity;
  sensors["tankLevelPct"] = tankLevelPct;
  sensors["flowLpm"] = flowLpm;
  sensors["solarV"] = sV;
  sensors["batteryV"] = bV;
  sensors["batteryA"] = bA;

  JsonObject power = doc["power"].to<JsonObject>();
  power["charging"] = charging;
  power["estLoadW"] = estLoadW;
  power["estSolarW"] = estSolarW;

  JsonArray alarms = doc["alarms"].to<JsonArray>();
  if (bV < 4.75f) {
    JsonObject a = alarms.add<JsonObject>();
    a["code"] = "BATTERY_LOW";
    a["severity"] = "critical";
    a["message"] = "Battery voltage is low";
  }

  JsonObject stats = doc["stats"].to<JsonObject>();
  stats["totalPumpRuns"] = totalPumpRuns;
  stats["totalPumpOnSecToday"] = totalPumpOnSecToday;
  stats["waterUsedLToday"] = waterUsedLToday;
}

void fillSample(JsonObject doc) {
  const float sV = clampf(solarVolts(), 0.0f, 7.5f);
  const float bV = clampf(batteryVolts(), 0.0f, 6.0f);
  const float moist = soilMoisturePct();

  const float tempC = 25.0f;
  const float humidity = 50.0f;
  const float tankLevelPct = 100.0f;
  const float flowLpm = pumpOn ? 1.0f : 0.0f;

  const float estSolarW = clampf((sV - 4.4f) * 1.1f, 0.0f, 6.0f);
  const float estLoadW = pumpOn ? 5.0f : 0.8f;
  const float netW = estSolarW - estLoadW;
  const float bA = clampf(netW / 5.0f, -2.0f, 2.0f);

  doc["time"] = (uint32_t)millis();
  doc["moisturePct"] = moist;
  doc["tankLevelPct"] = tankLevelPct;
  doc["solarV"] = sV;
  doc["batteryV"] = bV;
  doc["batteryA"] = bA;
  doc["tempC"] = tempC;
  doc["humidityPct"] = humidity;
  doc["pumpOn"] = pumpOn;
  doc["flowLpm"] = flowLpm;
}

void handleApiHealth() {
  StaticJsonDocument<512> doc;
  doc["ok"] = true;
  doc["service"] = "arduino-solar-watering-esp32";
  JsonObject caps = doc["capabilities"].to<JsonObject>();
  caps["socketIo"] = false;
  caps["sse"] = true;
  doc["uptimeMs"] = millis();

  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handleApiState() {
  StaticJsonDocument<2048> doc;
  fillSnapshot(doc.to<JsonObject>());
  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handleApiMetrics() {
  uint32_t windowSec = (uint32_t)server.arg("windowSec").toInt();
  uint32_t stepSec = (uint32_t)server.arg("stepSec").toInt();
  if (windowSec < 60) windowSec = 300;
  if (windowSec > 3600) windowSec = 3600;
  if (stepSec < 1) stepSec = 2;
  if (stepSec > 10) stepSec = 10;

  StaticJsonDocument<4096> doc;
  doc["windowSec"] = windowSec;
  doc["stepSec"] = stepSec;

  JsonArray points = doc["points"].to<JsonArray>();

  const size_t n = historyCount;
  if (n > 0) {
    size_t idxOldest = (historyHead + HISTORY_MAX - n) % HISTORY_MAX;
    uint32_t lastEmitMs = 0;

    for (size_t i = 0; i < n; i++) {
      const Sample& s = history[(idxOldest + i) % HISTORY_MAX];
      if (lastEmitMs != 0 && (s.ms - lastEmitMs) < (stepSec * 1000UL)) continue;
      lastEmitMs = s.ms;

      JsonObject p = points.add<JsonObject>();
      p["time"] = s.ms;
      p["moisturePct"] = s.moisturePct;
      p["tankLevelPct"] = s.tankLevelPct;
      p["solarV"] = s.solarV;
      p["batteryV"] = s.batteryV;
      p["batteryA"] = s.batteryA;
      p["tempC"] = s.tempC;
      p["humidityPct"] = s.humidityPct;
      p["pumpOn"] = s.pumpOn;
      p["flowLpm"] = s.flowLpm;
    }
  }

  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handleApiControl() {
  StaticJsonDocument<512> in;
  StaticJsonDocument<2048> out;

  const String body = server.arg("plain");
  if (deserializeJson(in, body)) {
    out["ok"] = false;
    out["error"] = "Invalid JSON";
    String s;
    serializeJson(out, s);
    server.send(400, "application/json", s);
    return;
  }

  JsonObject applied = out["applied"].to<JsonObject>();

  if (in.containsKey("automationEnabled")) {
    mode.automationEnabled = (bool)in["automationEnabled"];
    applied["automationEnabled"] = mode.automationEnabled;
  }

  if (in.containsKey("moistureTargetPct")) {
    mode.moistureTargetPct = clampf((float)in["moistureTargetPct"], 5.0f, 95.0f);
    applied["moistureTargetPct"] = mode.moistureTargetPct;
  }

  if (in.containsKey("hysteresisPct")) {
    mode.hysteresisPct = clampf((float)in["hysteresisPct"], 1.0f, 15.0f);
    applied["hysteresisPct"] = mode.hysteresisPct;
  }

  if (in.containsKey("pumpMaxOnSec")) {
    mode.pumpMaxOnSec = (uint16_t)clampf((float)in["pumpMaxOnSec"], 3.0f, 60.0f);
    applied["pumpMaxOnSec"] = mode.pumpMaxOnSec;
  }

  if (in.containsKey("cooldownSec")) {
    mode.cooldownSec = (uint16_t)clampf((float)in["cooldownSec"], 0.0f, 180.0f);
    applied["cooldownSec"] = mode.cooldownSec;
  }

  if (in.containsKey("pump")) {
    const char* p = in["pump"].as<const char*>();
    if (p && strcmp(p, "on") == 0) {
      pumpOnRemainingMs = (uint32_t)mode.pumpMaxOnSec * 1000UL;
      cooldownRemainingMs = 0;
      setPump(true);
      applied["pump"] = "on";
    } else if (p && strcmp(p, "off") == 0) {
      pumpOnRemainingMs = 0;
      setPump(false);
      cooldownRemainingMs = (uint32_t)mode.cooldownSec * 1000UL;
      applied["pump"] = "off";
    }
  }

  out["ok"] = true;
  {
    JsonObject snap = out["snapshot"].to<JsonObject>();
    fillSnapshot(snap);
  }

  String resp;
  serializeJson(out, resp);
  server.send(200, "application/json", resp);

  // stream a state update if SSE is connected
  if (sseConnected) {
    StaticJsonDocument<2048> s;
    fillSnapshot(s.to<JsonObject>());
    String sOut;
    serializeJson(s, sOut);
    sseSend("state", sOut);
  }
}

void handleApiStream() {
  if (sseConnected && sseClient.connected()) {
    try { sseClient.stop(); } catch (...) {}
    sseConnected = false;
  }

  server.sendHeader("Cache-Control", "no-cache");
  server.sendHeader("Connection", "keep-alive");
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.setContentLength(CONTENT_LENGTH_UNKNOWN);
  server.send(200, "text/event-stream", "");

  sseClient = server.client();
  sseConnected = true;

  StaticJsonDocument<2048> hello;
  hello["time"] = (uint32_t)millis();
  {
    JsonObject snap = hello["snapshot"].to<JsonObject>();
    fillSnapshot(snap);
  }
  String out;
  serializeJson(hello, out);
  sseSend("hello", out);
}

String contentTypeForPath(const String& path) {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".ico")) return "image/x-icon";
  return "text/plain";
}

bool tryServeFromFs(const String& uriPath) {
  String path = uriPath;
  if (path.length() == 0) path = "/";
  if (path.endsWith("/")) path += "index.html";
  if (path == "/") path = "/index.html";

  if (!LittleFS.exists(path)) return false;
  File f = LittleFS.open(path, "r");
  if (!f) return false;

  server.streamFile(f, contentTypeForPath(path));
  f.close();
  return true;
}

void printLittleFsListing() {
  Serial.println("LittleFS listing:");
  File root = LittleFS.open("/", "r");
  if (!root) {
    Serial.println("  (failed to open /)");
    return;
  }
  if (!root.isDirectory()) {
    Serial.println("  (/) is not a directory");
    root.close();
    return;
  }

  File file = root.openNextFile();
  while (file) {
    Serial.print("  ");
    Serial.print(file.name());
    if (file.isDirectory()) {
      Serial.println("/");
    } else {
      Serial.print("  ");
      Serial.print(file.size());
      Serial.println(" bytes");
    }
    file = root.openNextFile();
  }
  root.close();
}

void setupApMode() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);

  Serial.println();
  Serial.println("AP mode started");
  Serial.print("SSID: ");
  Serial.println(AP_SSID);
  Serial.print("IP: ");
  Serial.println(WiFi.softAPIP());
}

void setupRoutes() {
  server.on("/api/health", HTTP_GET, handleApiHealth);
  server.on("/api/state", HTTP_GET, handleApiState);
  server.on("/api/metrics", HTTP_GET, handleApiMetrics);
  server.on("/api/control", HTTP_POST, handleApiControl);
  server.on("/api/stream", HTTP_GET, handleApiStream);

  // Serve index explicitly
  server.on("/", HTTP_GET, []() {
    if (!tryServeFromFs("/index.html")) {
      server.send(500, "text/plain",
        "Missing /index.html in LittleFS.\n"
        "Run sync_data.ps1 to populate the sketch data/ folder,\n"
        "then upload LittleFS from Arduino IDE.\n");
    }
  });

  // Static assets + SPA fallback
  server.onNotFound([]() {
    if (tryServeFromFs(server.uri())) return;
    // fallback to index for client-side routing
    if (tryServeFromFs("/index.html")) return;
    server.send(404, "text/plain", "Not found");
  });
}

} // namespace

void setup() {
  Serial.begin(115200);
  delay(250);

  randomSeed((uint32_t)micros());

  pinMode(PUMP_PIN, OUTPUT);
  setPump(false);

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  if (!LittleFS.begin(true)) {
    Serial.println("LittleFS mount failed");
  } else {
    if (!LittleFS.exists("/index.html")) {
      Serial.println("ERROR: /index.html missing in LittleFS.");
      Serial.println("Fix: run sync_data.ps1 then upload LittleFS from Arduino IDE.");
    }
    printLittleFsListing();
  }

  setupApMode();
  setupRoutes();

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  static uint32_t last = 0;

  server.handleClient();

  const uint32_t now = millis();
  const uint32_t dt = now - last;

  if (cooldownRemainingMs > 0) {
    cooldownRemainingMs = (dt >= cooldownRemainingMs) ? 0 : (cooldownRemainingMs - dt);
  }

  if (pumpOnRemainingMs > 0) {
    pumpOnRemainingMs = (dt >= pumpOnRemainingMs) ? 0 : (pumpOnRemainingMs - dt);
    if (pumpOnRemainingMs == 0) {
      setPump(false);
      cooldownRemainingMs = (uint32_t)mode.cooldownSec * 1000UL;
    }
  }

  if (mode.automationEnabled && !pumpOn && cooldownRemainingMs == 0) {
    const float moist = soilMoisturePct();
    const float thresholdOn = mode.moistureTargetPct - mode.hysteresisPct;
    const float bV = batteryVolts();

    if (moist < thresholdOn) {
      if (bV >= 4.72f) {
        pumpOnRemainingMs = (uint32_t)mode.pumpMaxOnSec * 1000UL;
        setPump(true);
      }
    }
  }

  if (now - last >= TELEMETRY_HZ_MS) {
    last = now;

    StaticJsonDocument<512> sampleDoc;
    fillSample(sampleDoc.to<JsonObject>());

    const float sV = sampleDoc["solarV"].as<float>();
    const float bV = sampleDoc["batteryV"].as<float>();
    const float moist = sampleDoc["moisturePct"].as<float>();
    const float bA = sampleDoc["batteryA"].as<float>();
    const float tempC = sampleDoc["tempC"].as<float>();
    const float humidity = sampleDoc["humidityPct"].as<float>();
    const float tank = sampleDoc["tankLevelPct"].as<float>();
    const float flow = sampleDoc["flowLpm"].as<float>();

    if (pumpOn) {
      totalPumpOnSecToday += 1;
      waterUsedLToday += (flow / 60.0f);
    }

    Sample samp{};
    samp.ms = now;
    samp.moisturePct = moist;
    samp.tankLevelPct = tank;
    samp.solarV = sV;
    samp.batteryV = bV;
    samp.batteryA = bA;
    samp.tempC = tempC;
    samp.humidityPct = humidity;
    samp.pumpOn = pumpOn;
    samp.flowLpm = flow;

    pushHistory(samp);

    if (sseConnected) {
      StaticJsonDocument<3072> packet;
      {
        JsonObject s = packet["sample"].to<JsonObject>();
        s.set(sampleDoc.as<JsonObject>());
      }
      {
        JsonObject snap = packet["snapshot"].to<JsonObject>();
        fillSnapshot(snap);
      }
      String out;
      serializeJson(packet, out);
      sseSend("telemetry", out);
    }
  }
}

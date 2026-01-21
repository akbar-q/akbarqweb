#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>
#include <time.h>

// User config
#include "config.h" // create from config.example.h

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

// Mode/config (mirrors the mock)
struct Mode {
  bool automationEnabled = true;
  float moistureTargetPct = 55;
  float hysteresisPct = 3;
  uint16_t pumpMaxOnSec = 18;
  uint16_t cooldownSec = 25;
} mode;

// Actuator state
bool pumpOn = false;
uint32_t pumpOnRemainingMs = 0;
uint32_t cooldownRemainingMs = 0;

// Stats (simple)
uint32_t totalPumpRuns = 0;
uint32_t totalPumpOnSecToday = 0;
float waterUsedLToday = 0;

Sample history[HISTORY_MAX];
size_t historyCount = 0;
size_t historyHead = 0;

float clampf(float v, float mn, float mx) {
  return v < mn ? mn : (v > mx ? mx : v);
}

bool hasValidTime() {
  time_t t = time(nullptr);
  // Rough sanity check: any timestamp after ~2023-01-01.
  return t > 1672531200;
}

String nowIso() {
  if (!hasValidTime()) return String();
  time_t t = time(nullptr);
  struct tm tmUtc;
  gmtime_r(&t, &tmUtc);
  char buf[32];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &tmUtc);
  return String(buf);
}

float readAdcVolts(int pin) {
  // ESP32 ADC is noisy; average a bit
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
  return readAdcVolts(SOLAR_ADC_PIN) * SOLAR_DIVIDER_RATIO;
}

float batteryVolts() {
  return readAdcVolts(BATTERY_ADC_PIN) * BATTERY_DIVIDER_RATIO;
}

float soilMoisturePct() {
  float raw = readAdcVolts(SOIL_ADC_PIN) / 3.3f * 4095.0f;
  // Many capacitive probes read LOWER when wetter; keep calibration flexible.
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

  if (on) {
    totalPumpRuns++;
  }
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
  // Keep the same JSON shape as the mock so the dashboard can reuse it.
  JsonObject meta = doc["meta"].to<JsonObject>();
  meta["deviceId"] = "ASIW-ESP32";
  meta["firmware"] = "esp32-1.0.0";
  meta["location"] = "Plant";
  const String iso = nowIso();
  meta["time"] = iso.length() ? iso : (uint32_t)millis();

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

  // Fillers (replace with real sensors if you add them)
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
  if (tankLevelPct < 12.0f) {
    JsonObject a = alarms.add<JsonObject>();
    a["code"] = "TANK_LOW";
    a["severity"] = "critical";
    a["message"] = "Water tank is critically low";
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

  const String iso = nowIso();
  doc["time"] = iso.length() ? iso : (uint32_t)millis();
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

  // Walk ring buffer from oldest to newest
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
  StaticJsonDocument<1024> out;

  const String body = server.arg("plain");
  DeserializationError err = deserializeJson(in, body);
  if (err) {
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

  // Also stream a state update if SSE is connected
  {
    StaticJsonDocument<2048> s;
    fillSnapshot(s.to<JsonObject>());
    String sOut;
    serializeJson(s, sOut);
    sseSend("state", sOut);
  }
}

void handleApiStream() {
  // Only one live stream at a time (simple implementation)
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

  // Hello event (matches the Node server)
  StaticJsonDocument<2048> hello;
  const String iso = nowIso();
  hello["time"] = iso.length() ? iso : (uint32_t)millis();
  {
    JsonObject snap = hello["snapshot"].to<JsonObject>();
    fillSnapshot(snap);
  }
  String out;
  serializeJson(hello, out);
  sseSend("hello", out);
}

void setupWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  const uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < 20000) {
    delay(250);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
    return;
  }

  Serial.println("WiFi failed; starting AP...");
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  Serial.print("AP started. IP: ");
  Serial.println(WiFi.softAPIP());
}

void setupRoutes() {
  server.on("/api/health", HTTP_GET, handleApiHealth);
  server.on("/api/state", HTTP_GET, handleApiState);
  server.on("/api/metrics", HTTP_GET, handleApiMetrics);
  server.on("/api/control", HTTP_POST, handleApiControl);
  server.on("/api/stream", HTTP_GET, handleApiStream);

  // Static hosting from LittleFS
  server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");

  server.onNotFound([]() {
    // SPA-like fallback to index
    File f = LittleFS.open("/index.html", "r");
    if (!f) {
      server.send(404, "text/plain", "Not found");
      return;
    }
    server.streamFile(f, "text/html");
    f.close();
  });
}

} // namespace

void setup() {
  Serial.begin(115200);
  delay(250);

  pinMode(PUMP_PIN, OUTPUT);
  setPump(false);

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  if (!LittleFS.begin(true)) {
    Serial.println("LittleFS mount failed");
  }

  // Try to get real time for ISO timestamps (optional).
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  setupWifi();
  setupRoutes();

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  static uint32_t last = 0;

  server.handleClient();

  const uint32_t now = millis();
  const uint32_t dt = now - last;

  // timers
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

  // automation
  if (mode.automationEnabled && !pumpOn && cooldownRemainingMs == 0) {
    const float moist = soilMoisturePct();
    const float thresholdOn = mode.moistureTargetPct - mode.hysteresisPct;
    const float bV = batteryVolts();

    if (moist < thresholdOn) {
      if (bV < 4.72f) {
        // blocked
      } else {
        pumpOnRemainingMs = (uint32_t)mode.pumpMaxOnSec * 1000UL;
        setPump(true);
      }
    }
  }

  // periodic telemetry
  if (now - last >= TELEMETRY_HZ_MS) {
    last = now;

    // Build a sample for history
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

    // stream to dashboard
    if (sseConnected) {
      StaticJsonDocument<3072> packet;
      {
        JsonObject s = packet["sample"].to<JsonObject>();
        // Copy from computed sample doc
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

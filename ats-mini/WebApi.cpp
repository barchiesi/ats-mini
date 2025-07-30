#include "WebApi.h"
#include "Common.h"
#include "Utils.h"
#include "Storage.h"
#include "Themes.h"
#include "Menu.h"

#include <WiFi.h>
#include <Preferences.h>
#include <ArduinoJson.h>

Preferences storedPrefs;

static const String jsonStatus()
{
  String ip = "";
  String ssid = "";
  if(WiFi.status() == WL_CONNECTED)
  {
    ip = WiFi.localIP().toString();
    ssid = WiFi.SSID();
  }
  else
  {
    ip = WiFi.softAPIP().toString();
    ssid = String(RECEIVER_NAME);
  }

  JsonDocument doc;
  JsonObject root = doc.to<JsonObject>();

  root["ip"] = ip;
  root["ssid"] = ssid;
  root["mac"] = getMACAddress();
  root["version"] = getVersion(true);
  root["band"] = getCurrentBand()->bandName;
  root["freq"] = currentMode == FM ? currentFrequency * 10 * 1000 : currentFrequency * 1000 + currentBFO;
  root["mode"] = bandModeDesc[currentMode];
  root["rssi"] = rssi;
  root["snr"] = snr;
  root["battery"] = batteryMonitor();
  root["step"] = getCurrentStep()->desc;
  root["bandwidth"] = getCurrentBandwidth()->desc;
  root["agc"] = !agcNdx && !agcIdx;
  if (agcNdx && agcIdx)
  {
    root["attenuation"] = agcNdx;
  }
  const char *time = clockGet();
  if (time)
  {
    root["time"] = time;
  }
  root["volume"] = volume;
  if(currentSquelch)
  {
    root["squelch"] = currentSquelch;
  }
  root["softMuteMaxAttIdx"] = softMuteMaxAttIdx;
  if(isSSB())
  {
    root["avc"] = SsbAvcIdx;
  }
  else if(currentMode != FM)
  {
    root["avc"] = AmAvcIdx;
  }

  if(currentMode == FM)
  {
    JsonObject rds = root["rds"].to<JsonObject>();
    uint16_t piCode = getRdsPiCode();
    if (piCode)
    {
      rds["piCode"] = String(piCode, HEX);
    }
    String stationName = getStationName();
    if (stationName != "")
    {
      rds["stationName"] = stationName;
    }
    String radioText = getRadioText();
    if (radioText != "")
    {
      rds["radioText"] = radioText;
    }
    String programInfo = getProgramInfo();
    if (programInfo != "")
    {
      rds["programInfo"] = programInfo;
    }
  }

  String json;
  serializeJson(doc, json);
  return json;
}

static const String jsonMemory()
{
  JsonDocument doc;
  JsonArray memories_array = doc.to<JsonArray>();

  for(int i = 0; i < MEMORY_COUNT; i++)
  {
    JsonObject memObj = memories_array.add<JsonObject>();

    if(!memories[i].freq)
    {
      // Add empty object for unused memory slots
      continue;
    }

    memObj["id"] = i;
    memObj["freq"] = memories[i].mode == FM ? memories[i].freq * 10 * 1000 : (memories[i].freq + memories[i].hz100 / 10.0) * 1000.0;
    memObj["band"] = bands[memories[i].band].bandName;
    memObj["mode"] = bandModeDesc[memories[i].mode];
  }

  String json;
  serializeJson(doc, json);
  return json;
}

const String jsonConfig()
{
  storedPrefs.begin("configData", true);
  String loginUsername = storedPrefs.getString("loginusername", "");
  String loginPassword = storedPrefs.getString("loginpassword", "");
  String ssid1 = storedPrefs.getString("wifissid1", "");
  String pass1 = storedPrefs.getString("wifipass1", "");
  String ssid2 = storedPrefs.getString("wifissid2", "");
  String pass2 = storedPrefs.getString("wifipass2", "");
  String ssid3 = storedPrefs.getString("wifissid3", "");
  String pass3 = storedPrefs.getString("wifipass3", "");
  storedPrefs.end();

  JsonDocument doc;
  JsonObject config = doc.to<JsonObject>();

  config["username"] = loginUsername;
  config["password"] = loginPassword;
  config["wifissid1"] = ssid1;
  config["wifipass1"] = pass1;
  config["wifissid2"] = ssid2;
  config["wifipass2"] = pass2;
  config["wifissid3"] = ssid3;
  config["wifipass3"] = pass3;
  config["brightness"] = currentBrt;
  config["calibration"] = getCurrentBand()->bandCal;
  config["rdsModeIdx"] = rdsModeIdx;
  config["utcOffsetIdx"] = utcOffsetIdx;
  config["fmRegionIdx"] = FmRegionIdx;
  config["themeIdx"] = themeIdx;
  config["uiLayoutIdx"] = uiLayoutIdx;
  config["zoomMenu"] = zoomMenu;
  config["scrollDirection"] = scrollDirection;
  config["sleepModeIdx"] = sleepModeIdx;

  String json;
  serializeJson(doc, json);
  return json;
}

void jsonSetConfig(JsonDocument request)
{
  bool eepromSave = false;

  // Start modifying storedPrefs
  storedPrefs.begin("configData", false);

  // Save user name and password
  if(request["username"].is<JsonVariant>() && request["password"].is<JsonVariant>())
  {
    String loginUsername = request["username"];
    String loginPassword = request["password"];

    storedPrefs.putString("loginusername", loginUsername);
    storedPrefs.putString("loginpassword", loginPassword);
  }

  // Save SSIDs and their passwords
  bool haveSSID = false;
  for(int j = 0; j < 3; j++)
  {
    char nameSSID[16], namePASS[16];

    sprintf(nameSSID, "wifissid%d", j + 1);
    sprintf(namePASS, "wifipass%d", j + 1);

    if(request[nameSSID].is<JsonVariant>() && request[namePASS].is<JsonVariant>())
    {
      String ssid = request[nameSSID];
      String pass = request[namePASS];
      storedPrefs.putString(nameSSID, ssid);
      storedPrefs.putString(namePASS, pass);
      haveSSID |= ssid != "" && pass != "";
    }
  }

  // Done with the storedPrefs
  storedPrefs.end();

  if(request["brightness"].is<int>())
  {
    currentBrt = request["brightness"];
    if(!sleepOn()) ledcWrite(PIN_LCD_BL, currentBrt);
    eepromSave = true;
  }

  if(request["calibration"].is<int>())
  {
    getCurrentBand()->bandCal = request["calibration"];
    if(isSSB()) updateBFO(currentBFO, true);
    eepromSave = true;
  }

  if(request["rdsModeIdx"].is<int>())
  {
    rdsModeIdx = request["rdsModeIdx"];
    if(!(getRDSMode() & RDS_CT)) clockReset();
    eepromSave = true;
  }

  // Save time zone
  if(request["utcOffsetIdx"].is<int>())
  {
    utcOffsetIdx = request["utcOffsetIdx"];
    clockRefreshTime();
    eepromSave = true;
  }

  if(request["fmRegionIdx"].is<int>())
  {
    FmRegionIdx = request["fmRegionIdx"];
    rx.setFMDeEmphasis(fmRegions[FmRegionIdx].value);
    eepromSave = true;
  }

  // Save theme
  if(request["themeIdx"].is<int>())
  {
    themeIdx = request["themeIdx"];
    eepromSave = true;
  }

  if(request["uiLayoutIdx"].is<int>())
  {
    uiLayoutIdx = request["uiLayoutIdx"];
    eepromSave = true;
  }

  if(request["zoomMenu"].is<bool>())
  {
    zoomMenu = request["zoomMenu"];
    eepromSave = true;
  }

  if(request["scrollDirection"].is<signed int>())
  {
    const unsigned int scrollDir = request["scrollDirection"].as<signed int>();
    if (scrollDir == -1 || scrollDir == 1)
    {
      scrollDirection = scrollDir;
      eepromSave = true;
    }
  }

  if(request["sleepModeIdx"].is<int>())
  {
    sleepModeIdx = request["sleepModeIdx"];
    eepromSave = true;
  }

  // Save EEPROM immediately
  if(eepromSave) eepromRequestSave(true);

  // If we are currently in AP mode, and infrastructure mode requested,
  // and there is at least one SSID / PASS pair, request network connection
  if(haveSSID && (wifiModeIdx > NET_AP_ONLY) && (WiFi.status() != WL_CONNECTED))
    netRequestConnect();
}

const String jsonConfigOptions()
{
  JsonDocument doc;

  JsonArray rdsModes = doc["rdsModes"].to<JsonArray>();
  for(int i = 0; i < getTotalRDSModes(); i++)
  {
    JsonObject rdsModeObj = rdsModes.add<JsonObject>();
    rdsModeObj["id"] = i;
    rdsModeObj["mode"] = rdsMode[i].mode;
    rdsModeObj["desc"] = rdsMode[i].desc;
  }

  JsonArray offsets = doc["UTCOffsets"].to<JsonArray>();
  for(int i = 0; i < getTotalUTCOffsets(); i++)
  {
    JsonObject offsetObj = offsets.add<JsonObject>();
    offsetObj["id"] = i;
    offsetObj["offset"] = utcOffsets[i].offset;
    offsetObj["desc"] = utcOffsets[i].desc;
    offsetObj["city"] = utcOffsets[i].city;
  }

  JsonArray fmRegionsJ = doc["fmRegions"].to<JsonArray>();
  for(int i = 0; i < getTotalFmRegions(); i++)
  {
    JsonObject fmRegionObj = fmRegionsJ.add<JsonObject>();
    fmRegionObj["id"] = i;
    fmRegionObj["value"] = fmRegions[i].value;
    fmRegionObj["desc"] = fmRegions[i].desc;
  }

  JsonArray themes = doc["themes"].to<JsonArray>();
  for(int i = 0; i < getTotalThemes(); i++)
  {
    JsonObject themeObj = themes.add<JsonObject>();
    themeObj["id"] = i;
    themeObj["name"] = theme[i].name;
  }

  JsonArray uiLayouts = doc["uiLayouts"].to<JsonArray>();
  for(int i = 0; i < getTotalUiLayouts(); i++)
  {
    JsonObject uiLayoutObj = uiLayouts.add<JsonObject>();
    uiLayoutObj["id"] = i;
    uiLayoutObj["name"] = uiLayoutDesc[i];
  }

  JsonArray sleepModes = doc["sleepModes"].to<JsonArray>();
  for(int i = 0; i < getTotalSleepModes(); i++)
  {
    JsonObject sleepModeObj = sleepModes.add<JsonObject>();
    sleepModeObj["id"] = i;
    sleepModeObj["name"] = sleepModeDesc[i];
  }

  String json;
  serializeJson(doc, json);
  return json;
}

bool checkApiAuth(AsyncWebServerRequest *request)
{
  storedPrefs.begin("configData", true);
  String loginUsername = storedPrefs.getString("loginusername", "");
  String loginPassword = storedPrefs.getString("loginpassword", "");
  storedPrefs.end();

  if(loginUsername == "" && loginPassword == "") {
    return true;
  }

  return request->authenticate(loginUsername.c_str(), loginPassword.c_str());
}

void sendJsonResponse(AsyncWebServerRequest *request, int code, String content)
{
  AsyncWebServerResponse *response = request->beginResponse(code, "application/json", content);
  response->addHeader("Access-Control-Allow-Origin", "*");
  request->send(response);
}

void addApiListeners(AsyncWebServer& server)
{
  server.on("/api/status", HTTP_GET, [] (AsyncWebServerRequest *request) {
    sendJsonResponse(request, 200, jsonStatus());
  });

  server.on("/api/memory", HTTP_GET, [] (AsyncWebServerRequest *request) {
    sendJsonResponse(request, 200, jsonMemory());
  });

  server.on("/api/config", HTTP_GET, [] (AsyncWebServerRequest *request) {
    if(!checkApiAuth(request)) {
      return request->requestAuthentication();
    }
    sendJsonResponse(request, 200, jsonConfig());
  });

  server.on("/api/config", HTTP_POST,
    [] (AsyncWebServerRequest *request) {},
    NULL,
    [] (AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      if(!checkApiAuth(request)) {
        return request->requestAuthentication();
      }

      JsonDocument jsonRequest;
      DeserializationError error = deserializeJson(jsonRequest, data, len);
      if (error)
      {
        sendJsonResponse(request, 400, "{\"error\":\"Invalid JSON\"}");
        return;
      }
      jsonSetConfig(jsonRequest);

      sendJsonResponse(request, 200, jsonConfig());
  });

  server.on("/api/configOptions", HTTP_GET, [] (AsyncWebServerRequest *request) {
    sendJsonResponse(request, 200, jsonConfigOptions());
  });

  server.on("/api", HTTP_OPTIONS, [] (AsyncWebServerRequest *request) {
    String allowedMethods = "GET, OPTIONS";
    if (request->url() == "/api/status" || request->url() == "/api/config")
    {
      allowedMethods += ", POST";
    }

    AsyncWebServerResponse *response = request->beginResponse(200);
    response->addHeader("Access-Control-Allow-Origin", "*");
    response->addHeader("Access-Control-Allow-Methods", allowedMethods);
    response->addHeader("Access-Control-Allow-Headers", request->header("Access-Control-Request-Headers"));
    request->send(response);
  });
}

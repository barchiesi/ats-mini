#include "WebApi.h"
#include "Common.h"
#include "Utils.h"
#include "Storage.h"
#include "Themes.h"
#include "Menu.h"

#include <WiFi.h>
#include <Preferences.h>
#include <ArduinoJson.h>


static inline int clamp_range(int v, int vMin, int vMax)
{
  v  = v>vMax? vMax : v<vMin? vMin : v;
  return(v);
}

const String jsonStatus()
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
  root["bandIdx"] = bandIdx;
  root["freq"] = freqToHz(currentFrequency, currentMode) + currentBFO;
  root["modeIdx"] = currentMode;
  root["rssi"] = rssi;
  root["snr"] = snr;
  root["battery"] = batteryMonitor();
  root["stepIdx"] = bands[bandIdx].currentStepIdx;
  root["bandwidthIdx"] = bands[bandIdx].bandwidthIdx;
  root["agc"] = !agcNdx && !agcIdx;
  if (agcIdx)
  {
    root["attenuation"] = agcNdx;
  }
  const char *time = clockGet();
  if (time)
  {
    root["time"] = time;
  }
  root["volume"] = volume;
  root["squelch"] = currentSquelch;
  if(currentMode != FM)
  {
    root["softMuteMaxAttIdx"] = softMuteMaxAttIdx;
  }
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

    String radioText = "";
    const char *rt = getRadioText();
    for(; *rt; rt+=strlen(rt)+1) {
      radioText += String(rt) + " ";
    }
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

void jsonSetStatus(JsonDocument request)
{
  uint32_t prefsSave = 0;

  if(request["bandIdx"].is<int>())
  {
    const uint bandIdx = clamp_range(request["bandIdx"], 0, getTotalBands() - 1);
    switchBand(bandIdx);

    prefsSave |= SAVE_SETTINGS;
    prefsSave |= SAVE_BANDS;
  }

  if(request["freq"].is<int>())
  {
    const uint freqRead = request["freq"];
    const uint16_t currentFrequencyRead = freqFromHz(freqRead, currentMode);
    const int16_t currentBFORead = currentMode == FM ? 0 : bfoFromHz(freqRead);

    updateFrequency(currentFrequencyRead, true);
    if (isSSB())
    {
      updateBFO(currentBFORead, true);
    }

    // Clear current station name and information
    clearStationInfo();
    // Check for named frequencies
    identifyFrequency(currentFrequency + currentBFO / 1000);

    prefsSave |= SAVE_SETTINGS;
    prefsSave |= SAVE_CUR_BAND;
  }

  if(request["stepIdx"].is<int>())
  {
    const uint newStepIdx = clamp_range(request["stepIdx"], 0, getLastStep(currentMode));
    switchStep(newStepIdx);

    prefsSave |= SAVE_CUR_BAND;
  }

  if(request["bandwidthIdx"].is<int>())
  {
    const uint newBdwIdx = clamp_range(request["bandwidthIdx"], 0, getLastBandwidth(currentMode));
    switchBandwidth(newBdwIdx);

    prefsSave |= SAVE_CUR_BAND;
  }

  bool setAttenuation = false;
  if(request["agc"].is<bool>() && request["attenuation"].is<int>())
  {
    bool agc = request["agc"];
    if (!agc)
    {
      int8_t attenuation = request["attenuation"];
      int8_t newAgcIdx;
      if(currentMode==FM)
        newAgcIdx = clamp_range(attenuation, 0, 26);
      else if(isSSB())
        newAgcIdx = clamp_range(attenuation, 0, 0);
      else
        newAgcIdx = clamp_range(attenuation, 0, 36);

      switchAgc(newAgcIdx + 1);
      setAttenuation = true;
    }
  }
  else if (request["agc"].is<bool>())
  {
    bool agc = request["agc"];
    switchAgc(agc ? 0 : 1);
    setAttenuation = true;
  }
  else if (request["attenuation"].is<int>())
  {
    int8_t attenuation = request["attenuation"];
    int8_t newAgcIdx;
    if(currentMode==FM)
      newAgcIdx = clamp_range(attenuation, 0, 26);
    else if(isSSB())
      newAgcIdx = clamp_range(attenuation, 0, 0);
    else
      newAgcIdx = clamp_range(attenuation, 0, 36);

    switchAgc(newAgcIdx + 1);
    setAttenuation = true;
  }
  if (setAttenuation) prefsSave |= SAVE_SETTINGS;

  if(request["volume"].is<int>())
  {
    volume = clamp_range(request["volume"], 0, 63);
    if(!muteOn()) rx.setVolume(volume);
    prefsSave |= SAVE_SETTINGS;
  }

  if(request["squelch"].is<int>())
  {
    currentSquelch = clamp_range(request["squelch"], 0, 127);
    prefsSave |= SAVE_SETTINGS;
  }

  if(currentMode != FM && request["softMuteMaxAttIdx"].is<int>())
  {
    int8_t newSoftMute = clamp_range(request["softMuteMaxAttIdx"], 0, 32);
    switchSoftMute(newSoftMute);
    prefsSave |= SAVE_SETTINGS;
  }

  if(currentMode != FM && request["avc"].is<int>())
  {
    int8_t newAvc = clamp_range(request["avc"], 12, 90);
    switchAvc(newAvc);
    prefsSave |= SAVE_SETTINGS;
  }

  // Save preferences immediately
  prefsRequestSave(prefsSave, true);
}

const String jsonStatusOptions()
{
  JsonDocument doc;

  JsonArray bandsArray = doc["bands"].to<JsonArray>();
  for(int i = 0; i < getTotalBands(); i++)
  {
    JsonObject bandOjb = bandsArray.add<JsonObject>();
    bandOjb["id"] = i;
    bandOjb["name"] = bands[i].bandName;
    bandOjb["type"] = bands[i].bandType;
    bandOjb["modeIdx"] = bands[i].bandMode;
    bandOjb["minimumFreq"] = freqToHz(bands[i].minimumFreq, bands[i].bandMode);
    bandOjb["maximumFreq"] = freqToHz(bands[i].maximumFreq, bands[i].bandMode);
    bandOjb["currentFreq"] = freqToHz(bands[i].currentFreq, bands[i].bandMode);
    bandOjb["currentStepIdx"] = bands[i].currentStepIdx;
    bandOjb["bandwidthIdx"] = bands[i].bandwidthIdx;
    bandOjb["bandCal"] = bands[i].bandCal;
  }

  JsonObject stepsObj = doc["steps"].to<JsonObject>();
  JsonArray fmStepsArray = stepsObj["fm"].to<JsonArray>();
  for(int i = 0; i < getTotalFmSteps(); i++)
  {
    JsonObject stepObj = fmStepsArray.add<JsonObject>();
    stepObj["id"] = i;
    stepObj["step"] = fmSteps[i].step;
    stepObj["desc"] = fmSteps[i].desc;
    stepObj["spacing"] = fmSteps[i].spacing;
  }
  JsonArray ssbStepsArray = stepsObj["ssb"].to<JsonArray>();
  for(int i = 0; i < getTotalSsbSteps(); i++)
  {
    JsonObject stepObj = ssbStepsArray.add<JsonObject>();
    stepObj["id"] = i;
    stepObj["step"] = ssbSteps[i].step;
    stepObj["desc"] = ssbSteps[i].desc;
    stepObj["spacing"] = ssbSteps[i].spacing;
  }
  JsonArray amStepsArray = stepsObj["am"].to<JsonArray>();
  for(int i = 0; i < getTotalAmSteps(); i++)
  {
    JsonObject stepObj = amStepsArray.add<JsonObject>();
    stepObj["id"] = i;
    stepObj["step"] = amSteps[i].step;
    stepObj["desc"] = amSteps[i].desc;
    stepObj["spacing"] = amSteps[i].spacing;
  }

  JsonObject bandwidthsObj = doc["bandwidths"].to<JsonObject>();
  JsonArray fmBandwidthsArray = bandwidthsObj["fm"].to<JsonArray>();
  for(int i = 0; i < getTotalFmBandwidths(); i++)
  {
    JsonObject stepObj = fmBandwidthsArray.add<JsonObject>();
    stepObj["id"] = i;
    stepObj["idx"] = fmBandwidths[i].idx;
    stepObj["desc"] = fmBandwidths[i].desc;
  }
  JsonArray ssbBandwidthsArray = bandwidthsObj["ssb"].to<JsonArray>();
  for(int i = 0; i < getTotalSsbBandwidths(); i++)
  {
    JsonObject stepObj = ssbBandwidthsArray.add<JsonObject>();
    stepObj["id"] = i;
    stepObj["idx"] = ssbBandwidths[i].idx;
    stepObj["desc"] = ssbBandwidths[i].desc;
  }
  JsonArray amBandwidthsArray = bandwidthsObj["am"].to<JsonArray>();
  for(int i = 0; i < getTotalAmBandwidths(); i++)
  {
    JsonObject stepObj = amBandwidthsArray.add<JsonObject>();
    stepObj["id"] = i;
    stepObj["idx"] = amBandwidths[i].idx;
    stepObj["desc"] = amBandwidths[i].desc;
  }

  JsonArray modes = doc["modes"].to<JsonArray>();
  for (int i = 0; i < getTotalModes(); i++)
  {
    JsonObject modeObj = modes.add<JsonObject>();
    modeObj["id"] = i;
    modeObj["mode"] = bandModeDesc[i];
  }

  String json;
  serializeJson(doc, json);
  return json;
}

const String jsonMemory()
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
    memObj["freq"] = memories[i].freq;
    memObj["band"] = bands[memories[i].band].bandName;
    memObj["mode"] = bandModeDesc[memories[i].mode];
    memObj["name"] = memories[i].name;
  }

  String json;
  serializeJson(doc, json);
  return json;
}

const String jsonConfig()
{
  prefs.begin("network", true, STORAGE_PARTITION);
  String loginUsername = prefs.getString("loginusername", "");
  String loginPassword = prefs.getString("loginpassword", "");
  String ssid1 = prefs.getString("wifissid1", "");
  String pass1 = prefs.getString("wifipass1", "");
  String ssid2 = prefs.getString("wifissid2", "");
  String pass2 = prefs.getString("wifipass2", "");
  String ssid3 = prefs.getString("wifissid3", "");
  String pass3 = prefs.getString("wifipass3", "");
  prefs.end();

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
  uint32_t prefsSave = 0;

  // Start modifying prefs
  prefs.begin("network", false, STORAGE_PARTITION);

  // Save user name and password
  if(request["username"].is<JsonVariant>() && request["password"].is<JsonVariant>())
  {
    String loginUsername = request["username"];
    String loginPassword = request["password"];

    prefs.putString("loginusername", loginUsername);
    prefs.putString("loginpassword", loginPassword);
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
      prefs.putString(nameSSID, ssid);
      prefs.putString(namePASS, pass);
      haveSSID |= ssid != "" && pass != "";
    }
  }

  // Done with the prefs
  prefs.end();

  if(request["brightness"].is<int>())
  {
    currentBrt = request["brightness"];
    if(!sleepOn()) ledcWrite(PIN_LCD_BL, currentBrt);
    prefsSave |= SAVE_SETTINGS;
  }

  if(request["calibration"].is<int>())
  {
    getCurrentBand()->bandCal = request["calibration"];
    if(isSSB()) updateBFO(currentBFO, true);
    prefsSave |= SAVE_CUR_BAND;
    prefsSave |= SAVE_SETTINGS;
  }

  if(request["rdsModeIdx"].is<int>())
  {
    rdsModeIdx = request["rdsModeIdx"];
    if(!(getRDSMode() & RDS_CT)) clockReset();
    prefsSave |= SAVE_SETTINGS;
  }

  // Save time zone
  if(request["utcOffsetIdx"].is<int>())
  {
    utcOffsetIdx = request["utcOffsetIdx"];
    clockRefreshTime();
    prefsSave |= SAVE_SETTINGS;
  }

  if(request["fmRegionIdx"].is<int>())
  {
    FmRegionIdx = request["fmRegionIdx"];
    rx.setFMDeEmphasis(fmRegions[FmRegionIdx].value);
    prefsSave |= SAVE_SETTINGS;
  }

  // Save theme
  if(request["themeIdx"].is<int>())
  {
    themeIdx = request["themeIdx"];
    prefsSave |= SAVE_SETTINGS;
  }

  if(request["uiLayoutIdx"].is<int>())
  {
    uiLayoutIdx = request["uiLayoutIdx"];
    prefsSave |= SAVE_SETTINGS;
  }

  if(request["zoomMenu"].is<bool>())
  {
    zoomMenu = request["zoomMenu"];
    prefsSave |= SAVE_SETTINGS;
  }

  if(request["scrollDirection"].is<signed int>())
  {
    const unsigned int scrollDir = request["scrollDirection"].as<signed int>();
    if (scrollDir == -1 || scrollDir == 1)
    {
      scrollDirection = scrollDir;
      prefsSave |= SAVE_SETTINGS;
    }
  }

  if(request["sleepModeIdx"].is<int>())
  {
    sleepModeIdx = request["sleepModeIdx"];
    prefsSave |= SAVE_SETTINGS;
  }

  // Save preferences immediately
  prefsRequestSave(prefsSave, true);

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
  prefs.begin("network", true, STORAGE_PARTITION);
  String loginUsername = prefs.getString("loginusername", "");
  String loginPassword = prefs.getString("loginpassword", "");
  prefs.end();

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

// Helper function to handle chunked request data and parse JSON
bool handleChunkedJsonRequest(AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total, JsonDocument &jsonRequest)
{
  // Allocate buffer for the complete request data if this is the first chunk
  if (index == 0)
  {
    request->_tempObject = malloc(total);
    if (!request->_tempObject)
    {
      sendJsonResponse(request, 500, "{\"error\":\"Out of memory\"}");
      return false;
    }
  }

  // Copy current chunk to the buffer
  if (request->_tempObject)
  {
    memcpy((uint8_t*)request->_tempObject + index, data, len);
  }

  // If this is not the last chunk, just return and wait for more data
  if (index + len < total)
  {
    return false;
  }

  // This is the last chunk, process the complete data
  uint8_t* completeData = (uint8_t*)request->_tempObject;

  DeserializationError error = deserializeJson(jsonRequest, completeData, total);

  // Free the allocated buffer
  free(request->_tempObject);
  request->_tempObject = nullptr;

  if (error) {
    sendJsonResponse(request, 400, "{\"error\":\"Invalid JSON\"}");
    return false;
  }

  return true;
}

void addApiListeners(AsyncWebServer& server)
{
  server.on("/api/status", HTTP_GET, [] (AsyncWebServerRequest *request) {
    sendJsonResponse(request, 200, jsonStatus());
  });

  server.on("/api/status", HTTP_POST,
    [] (AsyncWebServerRequest *request) {},
    NULL,
    [] (AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      JsonDocument jsonRequest;
      if (!handleChunkedJsonRequest(request, data, len, index, total, jsonRequest))
      {
        return; // Waiting for more chunks or error handled in the function
      }

      jsonSetStatus(jsonRequest);
      sendJsonResponse(request, 200, jsonStatus());
  });

  server.on("/api/statusOptions", HTTP_GET, [] (AsyncWebServerRequest *request) {
    sendJsonResponse(request, 200, jsonStatusOptions());
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
      if (!handleChunkedJsonRequest(request, data, len, index, total, jsonRequest))
      {
        return; // Waiting for more chunks or error handled in the function
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

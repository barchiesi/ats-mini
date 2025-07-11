#include "WebApi.h"
#include "Common.h"
#include "Utils.h"
#include "Menu.h"

#include <WiFi.h>

static const String jsonRadioInfo()
{
    String ip = "";
    String ssid = "";
    uint16_t freq = currentMode == FM?
      currentFrequency
    : currentFrequency + currentBFO;

    if(WiFi.status()==WL_CONNECTED)
    {
        ip = WiFi.localIP().toString();
        ssid = WiFi.SSID();
    }
    else
    {
        ip = WiFi.softAPIP().toString();
        ssid = String(RECEIVER_NAME);
    }

    return "{"
  "\"ip\":\"" + ip + "\","
  "\"ssid\":\"" + ssid + "\","
  "\"mac\":\"" + getMACAddress() + "\","
  "\"version\":\"" + getVersion(true) + "\","
  "\"band\":\"" + getCurrentBand()->bandName + "\","
  "\"freq\":" + freq + ","
  "\"mode\":\"" + bandModeDesc[currentMode] + "\","
  "\"rssi\":" + String(rssi) + ","
  "\"snr\":" + String(snr) + ","
  "\"battery\":" + String(batteryMonitor()) + ""
  "}";
}

static const String jsonMemory()
{
    String json = "[";
    for(int i = 0; i < MEMORY_COUNT; i++)
    {
        if(i > 0) json += ",";

        if(!memories[i].freq)
        {
            json += "{}";
            continue;
        }

        uint16_t freq = memories[i].mode == FM?
          memories[i].freq
        : memories[i].freq + memories[i].hz100;

        json += "{"
            "\"freq\":" + String(freq) + ","
            "\"band\":\"" + bands[memories[i].band].bandName + "\","
            "\"mode\":\"" + bandModeDesc[memories[i].mode] + "\""
        "}";
    }
    json += "]";
    return json;
}

void addApiListeners(AsyncWebServer& server) {
    server.on("/api/info", HTTP_GET, [] (AsyncWebServerRequest *request) {
      request->send(200, "application/json", jsonRadioInfo());
    });
    server.on("/api/memory", HTTP_GET, [] (AsyncWebServerRequest *request) {
      request->send(200, "application/json", jsonMemory());
    });
}

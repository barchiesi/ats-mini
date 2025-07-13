#include "Common.h"
#include "Storage.h"
#include "Themes.h"
#include "Utils.h"
#include "Draw.h"
#include "WebApi.h"
#include "WebUi.h"

#include <WiFi.h>
#include <WiFiUdp.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <NTPClient.h>
#include <Preferences.h>
#include <ESPmDNS.h>

#define CONNECT_TIME  3000  // Time of inactivity to start connecting WiFi

//
// Access Point (AP) mode settings
//
static const char *apSSID    = RECEIVER_NAME;
static const char *apPWD     = 0;       // No password
static const int   apChannel = 10;      // WiFi channel number (1..13)
static const bool  apHideMe  = false;   // TRUE: disable SSID broadcast
static const int   apClients = 3;       // Maximum simultaneous connected clients

static uint16_t ajaxInterval = 2500;

static bool itIsTimeToWiFi = false; // TRUE: Need to connect to WiFi
static uint32_t connectTime = millis();

static const char *eepromStatus = "No EEPROM data";

// Settings
String loginUsername = "";
String loginPassword = "";

// Network preferences saved here
Preferences preferences;

// AsyncWebServer object on port 80
AsyncWebServer server(80);

// NTP Client to get time
WiFiUDP ntpUDP;
NTPClient ntpClient(ntpUDP, "pool.ntp.org");

static bool wifiInitAP();
static bool wifiConnect();
static void webInit();

static void webSetConfig(AsyncWebServerRequest *request);
static void webReadEEPROM(AsyncWebServerRequest *request);
static void webWriteEEPROM(AsyncWebServerRequest *request, const String &filename, size_t index, uint8_t *data, size_t len, bool lastChunk);

//
// Delayed WiFi connection
//
void netRequestConnect()
{
  connectTime = millis();
  itIsTimeToWiFi = true;
}

void netTickTime()
{
  // Connect to WiFi if requested
  if(itIsTimeToWiFi && ((millis() - connectTime) > CONNECT_TIME))
  {
    netInit(wifiModeIdx);
    connectTime = millis();
    itIsTimeToWiFi = false;
  }
}

//
// Clear all settings
//
void netClearPreferences()
{
  preferences.begin("configData", false);
  preferences.clear();
  preferences.end();
}

//
// Get current connection status
// (-1 - not connected, 0 - disabled, 1 - connected, 2 - connected to network)
//
int8_t getWiFiStatus()
{
  wifi_mode_t mode = WiFi.getMode();

  switch(mode)
  {
    case WIFI_MODE_NULL:
      return(0);
    case WIFI_AP:
      return(WiFi.softAPgetStationNum()? 1 : -1);
    case WIFI_STA:
      return(WiFi.status()==WL_CONNECTED? 2 : -1);
    case WIFI_AP_STA:
      return((WiFi.status()==WL_CONNECTED)? 2 : WiFi.softAPgetStationNum()? 1 : -1);
    default:
      return(-1);
  }
}

char *getWiFiIPAddress()
{
  static char ip[16];
  return strcpy(ip, WiFi.status()==WL_CONNECTED ? WiFi.localIP().toString().c_str() : "");
}

//
// Stop WiFi hardware
//
void netStop()
{
  wifi_mode_t mode = WiFi.getMode();

  MDNS.end();

  // If network connection up, shut it down
  if((mode==WIFI_STA) || (mode==WIFI_AP_STA))
    WiFi.disconnect(true);

  // If access point up, shut it down
  if((mode==WIFI_AP) || (mode==WIFI_AP_STA))
    WiFi.softAPdisconnect(true);

  WiFi.mode(WIFI_MODE_NULL);
}

//
// Initialize WiFi network and services
//
void netInit(uint8_t netMode, bool showStatus)
{
  // Always disable WiFi first
  netStop();

  switch(netMode)
  {
    case NET_OFF:
      // Do not initialize WiFi if disabled
      return;
    case NET_AP_ONLY:
      // Start WiFi access point if requested
      WiFi.mode(WIFI_AP);
      // Let user see connection status if successful
      if(wifiInitAP() && showStatus) delay(2000);
      break;
    case NET_AP_CONNECT:
      // Start WiFi access point if requested
      WiFi.mode(WIFI_AP_STA);
      // Let user see connection status if successful
      if(wifiInitAP() && showStatus) delay(2000);
      break;
    default:
      // No access point
      WiFi.mode(WIFI_STA);
      break;
  }

  // Initialize WiFi and try connecting to a network
  if(netMode>NET_AP_ONLY && wifiConnect())
  {
    // Let user see connection status if successful
    if(netMode!=NET_SYNC && showStatus) delay(2000);

    // NTP time updates will happen every 5 minutes
    ntpClient.setUpdateInterval(5*60*1000);

    // Get NTP time from the network
    clockReset();
    for(int j=0 ; j<10 ; j++)
      if(ntpSyncTime()) break; else delay(500);
  }

  // If only connected to sync...
  if(netMode==NET_SYNC)
  {
    // Drop network connection
    WiFi.disconnect(true);
    WiFi.mode(WIFI_MODE_NULL);
  }
  else
  {
    // Initialize web server for remote configuration
    webInit();

    // Initialize mDNS
    MDNS.begin("atsmini"); // Set the hostname to "atsmini.local"
    MDNS.addService("http", "tcp", 80);
  }
}

//
// Returns TRUE if NTP time is available
//
bool ntpIsAvailable()
{
  return(ntpClient.isTimeSet());
}

//
// Update NTP time and synchronize clock with NTP time
//
bool ntpSyncTime()
{
  if(WiFi.status()==WL_CONNECTED)
  {
    ntpClient.update();

    if(ntpClient.isTimeSet())
      return(clockSet(
        ntpClient.getHours(),
        ntpClient.getMinutes(),
        ntpClient.getSeconds()
      ));
  }
  return(false);
}

//
// Initialize WiFi access point (AP)
//
static bool wifiInitAP()
{
  // These are our own access point (AP) addresses
  IPAddress ip(10, 1, 1, 1);
  IPAddress gateway(10, 1, 1, 1);
  IPAddress subnet(255, 255, 255, 0);

  // Start as access point (AP)
  WiFi.softAP(apSSID, apPWD, apChannel, apHideMe, apClients);
  WiFi.softAPConfig(ip, gateway, subnet);

  drawScreen(
    ("Use Access Point " + String(apSSID)).c_str(),
    ("IP : " + WiFi.softAPIP().toString() + " or atsmini.local").c_str()
  );

  ajaxInterval = 2500;
  return(true);
}

//
// Connect to a WiFi network
//
static bool wifiConnect()
{
  String status = "Connecting to WiFi network..";

  // Get the preferences
  preferences.begin("configData", true);
  loginUsername = preferences.getString("loginusername", "");
  loginPassword = preferences.getString("loginpassword", "");

  // Try connecting to known WiFi networks
  for(int j=0 ; (j<3) && (WiFi.status()!=WL_CONNECTED) ; j++)
  {
    char nameSSID[16], namePASS[16];
    sprintf(nameSSID, "wifissid%d", j+1);
    sprintf(namePASS, "wifipass%d", j+1);

    String ssid = preferences.getString(nameSSID, "");
    String password = preferences.getString(namePASS, "");

    if(ssid != "")
    {
      WiFi.begin(ssid, password);
      for(int j=0 ; (WiFi.status()!=WL_CONNECTED) && (j<24) ; j++)
      {
        if(!(j&7))
        {
          status += ".";
          drawScreen(status.c_str());
        }
        delay(500);
        if(digitalRead(ENCODER_PUSH_BUTTON)==LOW)
        {
          WiFi.disconnect();
          break;
        }
      }
    }
  }

  // Done with preferences
  preferences.end();

  // If failed connecting to WiFi network...
  if(WiFi.status()!=WL_CONNECTED)
  {
    // WiFi connection failed
    drawScreen(status.c_str(), "No WiFi connection");
    // Done
    return(false);
  }
  else
  {
    // WiFi connection succeeded
    drawScreen(
      ("Connected to WiFi network (" + WiFi.SSID() + ")").c_str(),
      ("IP : " + WiFi.localIP().toString() + " or atsmini.local").c_str()
    );
    // Done
    ajaxInterval = 1000;
    return(true);
  }
}

//
// Initialize internal web server
//
static void webInit()
{
  // This method saves configuration form contents
  server.on("/setconfig", HTTP_ANY, webSetConfig);

  // These methods let user read and write EEPROM
  server.on("/ats-mini-eeprom.bin", HTTP_ANY, webReadEEPROM);
  server.on("/writeeeprom", HTTP_POST, [](AsyncWebServerRequest *request) {
      request->send(200, "text/plain", eepromStatus);
      eepromStatus = "No EEPROM data";
    },
    webWriteEEPROM
  );

  addApiListeners(server);
  addUiListeners(server);

  server.onNotFound([] (AsyncWebServerRequest *request) {
    request->send(404, "text/plain", "Not found");
  });

  // Start web server
  server.begin();
}

void webSetConfig(AsyncWebServerRequest *request)
{
  bool eepromSave = false;

  // Start modifying preferences
  preferences.begin("configData", false);

  // Save user name and password
  if(request->hasParam("username", true) && request->hasParam("password", true))
  {
    loginUsername = request->getParam("username", true)->value();
    loginPassword = request->getParam("password", true)->value();

    preferences.putString("loginusername", loginUsername);
    preferences.putString("loginpassword", loginPassword);
  }

  // Save SSIDs and their passwords
  bool haveSSID = false;
  for(int j=0 ; j<3 ; j++)
  {
    char nameSSID[16], namePASS[16];

    sprintf(nameSSID, "wifissid%d", j+1);
    sprintf(namePASS, "wifipass%d", j+1);

    if(request->hasParam(nameSSID, true) && request->hasParam(namePASS, true))
    {
      String ssid = request->getParam(nameSSID, true)->value();
      String pass = request->getParam(namePASS, true)->value();
      preferences.putString(nameSSID, ssid);
      preferences.putString(namePASS, pass);
      haveSSID |= ssid != "" && pass != "";
    }
  }

  // Save time zone
  if(request->hasParam("utcoffset", true))
  {
    String utcOffset = request->getParam("utcoffset", true)->value();
    utcOffsetIdx = utcOffset.toInt();
    clockRefreshTime();
    eepromSave = true;
  }

  // Save theme
  if(request->hasParam("theme", true))
  {
    String theme = request->getParam("theme", true)->value();
    themeIdx = theme.toInt();
    eepromSave = true;
  }

  // Save scroll direction and menu zoom
  scrollDirection = request->hasParam("scroll", true)? -1 : 1;
  zoomMenu        = request->hasParam("zoom", true);
  eepromSave = true;

  // Done with the preferences
  preferences.end();

  // Save EEPROM immediately
  if(eepromSave) eepromRequestSave(true);

  // Show config page again
  request->redirect("/config");

  // If we are currently in AP mode, and infrastructure mode requested,
  // and there is at least one SSID / PASS pair, request network connection
  if(haveSSID && (wifiModeIdx>NET_AP_ONLY) && (WiFi.status()!=WL_CONNECTED))
    netRequestConnect();
}

static void webReadEEPROM(AsyncWebServerRequest *request)
{
  uint8_t buf[EEPROM_SIZE];

  if(!eepromReadBinary(buf, sizeof(buf)))
    request->send(200, "text/plain", "Failed reading EEPROM");
  else
  {
    AsyncWebServerResponse *response = request->beginResponse(200, "application/octet-stream", buf, sizeof(buf));
    char hdr[100];
    sprintf(hdr, "attachment; filename=ats-mini-eeprom-%hu-%hu.bin", APP_VERSION, EEPROM_VERSION);
    response->addHeader("Content-Disposition", hdr);
    request->send(response);
  }
}

static void webWriteEEPROM(AsyncWebServerRequest *request, const String &filename, size_t index, uint8_t *data, size_t len, bool lastChunk)
{
  static uint8_t buf[EEPROM_SIZE];

  // Fill in the buffer with incoming chunks
  if(index+len <= sizeof(buf)) memcpy(buf+index, data, len);

  // When last chunk received...
  if(lastChunk)
  {
    if(!eepromVerify(buf))
      eepromStatus = "Wrong EEPROM version";
    else if(!eepromRequestUpdate(buf, sizeof(buf)))
      eepromStatus = "Failed writing EEPROM";
    else
      eepromStatus = "Wrote EEPROM";
  }
}

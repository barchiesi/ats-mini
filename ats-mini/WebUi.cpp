#include "WebUi.h"
#include "Common.h"
#include "webui_dist.h"

void addUiListeners(AsyncWebServer& server)
{
  for(int i=0 ; i < webui_files_count; i++)
  {
    if (strcmp(webui_files[i].name, "index.html") == 0)
    {
      server.on("/", HTTP_GET, [i] (AsyncWebServerRequest *request) {
        request->send(200, webui_files[i].mimeType, webui_files[i].content);
      });
      server.on("/index.html", HTTP_GET, [i] (AsyncWebServerRequest *request) {
        request->send(200, webui_files[i].mimeType, webui_files[i].content);
      });
      continue;
    }

    const char* filename = webui_files[i].name;
    int len = strlen(filename);
    char path[64]; // Single temporary buffer

    // Check if filename ends with ".html"
    if (len > 5 && strcmp(filename + len - 5, ".html") == 0)
    {
      // Copy filename without .html extension
      path[0] = '/';
      strncpy(path + 1, filename, len - 5);
      path[len - 4] = '\0'; // len - 5 + 1 for the '/'
    } else {
      // Copy filename as is
      path[0] = '/';
      strcpy(path + 1, filename);
    }

    server.on(path, HTTP_GET, [i] (AsyncWebServerRequest *request) {
      request->send(200, webui_files[i].mimeType, webui_files[i].content);
    });
  }
}

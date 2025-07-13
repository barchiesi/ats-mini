#ifndef WEBUI_DIST_H
#define WEBUI_DIST_H

typedef struct __attribute__((packed))
{
  const char* name;
  const char* mimeType;
  const char* content;
} WebUiFile;

extern WebUiFile webui_files[];
extern const int webui_files_count;

#endif //WEBUI_DIST_H

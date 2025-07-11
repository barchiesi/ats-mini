## 2.30d (2025-08-22) - webui patchset


### Added

- All radio information **(including Mode)** is available in the status web page and automatically refreshes every second;
- All radio controls (including band, frequency, AGC/Attenuation and volume) can be changed from the web page;
- The memory web page automatically refreshes every 5 seconds;
- Memories can be tuned to from the web page;
- Memories can be set or cleared from the web page;
- **Memories can be edited from the web page;**
- All configs (excluding WiFi mode) can be changed in the config web page;
- Configs can be exported/imported to/from a downloadable JSON allowing easy restore after flashing the device;
- [JSON Api](https://barchiesi.github.io/ats-mini/jsonapi.html) supporting all of the above (OpenAPI 3.0 spec [here](https://barchiesi.github.io/ats-mini/_static/dot-dot/openapi-schema.yml));
- Static web pages generation in firmware sources replaced by a dedicated _npm_ project which simplifies development and lowers the barrier of entry for new developers;


### Fixed

- Fix AVC wrapping to avoid selecting odd AVC values.


## 2.30 (2025-08-07)


### Added

- Add Scan mode. Press the encoder for 0.5 seconds to rescan, press & rotate to tune using a larger step. The scan process can be aborted by clicking or rotating the encoder.


### Changed

- Switch from EEPROM to Preferences library to store the receiver settings. This change removes some old limitations and enables more flexible settings management. WARNING: upgrading to this firmware version from an older one will reset the settings. Also a forced reset might be required (hold the encoder and power on the receiver). https://github.com/esp32-si4732/ats-mini/issues/94
- Mute audio amp during seek action to prevent audible artifacts. https://github.com/esp32-si4732/ats-mini/issues/190
- Display "Loading SSB" message in the zoomed menu area.
- Extend the 16m broadcast band a bit to include CRI on 17490.
- Increase the number of memory slots to 99.


### Fixed

- Do not lose SSB sub kHz digits when storing Memory slots. https://github.com/esp32-si4732/ats-mini/issues/109
- Restore saved bandwidth.
- Use default step when switching modes or memories.

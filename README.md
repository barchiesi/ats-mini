# ATS Mini (webui patchset)

> [!IMPORTANT]
> This is a fork of [esp32-si4732/ats-mini](https://github.com/esp32-si4732/ats-mini) containing a patchset for a better web user interface (_by my standards - [barchiesi](https://github.com/barchiesi)_).
>
> The patchset includes the following:
> * Static web pages generation in firmware sources replaced by a dedicated _npm_ project which simplifies development and lowers the barrier of entry for new developers;
> * [JSON Api](https://barchiesi.github.io/ats-mini/jsonapi.html) for retrieving radio status or memories and updating configs (OpenAPI 3.0 spec [here](https://barchiesi.github.io/ats-mini/_static/dot-dot/openapi-schema.yml));
> * All radio information is available in the status web page and automatically refreshes;
> * All settings can be changed in the config web page;
>
> [Releases](https://github.com/barchiesi/ats-mini/releases) follow the same versioning as upstream with a _d_ suffix. They contain everything upstream has plus the patchset in this fork.
>
> The intent of this patchset is to be upstreamed.
>
> The rest of this README is identical to upstream.

![](docs/source/_static/esp32-si4732-ui-theme.jpg)

This firmware is for use on the SI4732 (ESP32-S3) Mini/Pocket Receiver

Based on the following sources:

* Volos Projects:    https://github.com/VolosR/TEmbedFMRadio
* PU2CLR, Ricardo:   https://github.com/pu2clr/SI4735
* Ralph Xavier:      https://github.com/ralphxavier/SI4735
* Goshante:          https://github.com/goshante/ats20_ats_ex
* G8PTN, Dave:       https://github.com/G8PTN/ATS_MINI

## Releases

Check out the [Releases](https://github.com/esp32-si4732/ats-mini/releases) page.

## Documentation

The hardware, software and flashing documentation is available at <https://esp32-si4732.github.io/ats-mini/>

## Discuss

* [GitHub Discussions](https://github.com/esp32-si4732/ats-mini/discussions) - the best place for feature requests, observations, sharing, etc.
* [TalkRadio Telegram Chat](https://t.me/talkradio/174172) - informal space to chat in Russian and English.
* [Si4732 Mini Receiver All Bands](https://www.facebook.com/share/g/18hjHo4HEe/) - Facebook group (unofficial).

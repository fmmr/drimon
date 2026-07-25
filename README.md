# DriMon — Drivhus Monitor

![logo](/docs/logos/1_1000x550.webp)

Greenhouse monitoring system for Rødtangen, Norway. ESP32 in the greenhouse posts sensor data every 5–15 min to ThingSpeak, a MATLAB scraper adds external weather from MET.no, and a web dashboard renders it all.

**Live site**: <https://drimon.rodland.no/>

## Repo layout

| Path | What it is |
|---|---|
| [`20240724_drimon_1_3/`](20240724_drimon_1_3/README.md) | ESP32 firmware (Arduino) |
| [`docs/`](docs/README.md) | Web dashboard (served as GitHub Pages) |
| [`matlab/`](matlab/README.md) | ThingSpeak MATLAB scraper for MET.no weather |
| [`pi-kiosk/`](pi-kiosk/README.md) | Raspberry Pi kiosk that displays the dashboard fullscreen |
| [`documentation/`](documentation/) | Cross-cutting reference docs |
| `sketches_scratchpad/` | Arduino sandbox (ignore) |

## Documentation

Start here depending on what you need:

- **[Quick Reference](documentation/QUICK_REFERENCE.md)** — LED codes, buttons, status field decoder. Print-friendly, stick on the enclosure.
- **[URL Parameters](documentation/URL_PARAMS.md)** — every query-string the live site accepts, with examples.
- **[Architecture](documentation/ARCHITECTURE.md)** — how ESP32 → ThingSpeak → MATLAB → dashboard connect. Data-flow diagram + per-channel field maps.
- **[Hardware](documentation/HARDWARE.md)** — components, sensors, PCB, power budget, Li-Ion voltage table.
- **[Telemetry](documentation/TELEMETRY.md)** — querying and analyzing the ThingSpeak status field (jq/curl pipelines).
- **[Development Guide](documentation/DEVELOPMENT.md)** — webapp architecture and code organization.
- **[Future Enhancements](documentation/FUTURE.md)** — planned and completed items.
- **[Solar Charging Debug](documentation/HARDWARE_SOLAR_CHARGING_CHECK.md)** — historical incident notes.

## ThingSpeak channels

| Channel | Contents |
|---|---|
| [2568299](https://thingspeak.com/channels/2568299) | Main sensors (temp, humidity, RSSI, distance, battery, pressure, lux) |
| [2584548](https://thingspeak.com/channels/2584548) | Plant/soil temperatures + moistures |
| [2584547](https://thingspeak.com/channels/2584547) | System/tech (RSSI, battery, wake time, internal lux) |
| [2626867](https://thingspeak.mathworks.com/channels/2626867) | External weather from MET.no (written by MATLAB scraper) |

## License

Open source under the terms in [LICENSE](LICENSE).

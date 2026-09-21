# MATLAB — MET.no Weather Scraper

Server-side ThingSpeak MATLAB Analysis that fetches nowcast weather data from MET Norway and posts it to the external weather ThingSpeak channel.

## What it does

- Reads current greenhouse temperature + humidity from ThingSpeak channel `2568299` (main sensor channel)
- Fetches nowcast weather from `https://api.met.no/weatherapi/nowcast/2.0/complete` for coordinates 59.532213, 10.418231 (Rødtangen)
- Extracts: air temperature, precipitation rate, relative humidity, UV index, wind speed
- Computes temp diff and humidity diff (greenhouse − outdoor)
- Writes 8 fields to ThingSpeak channel [`2626867`](https://thingspeak.mathworks.com/channels/2626867) (external weather channel, `EXT_CHANNEL` in the webapp)

## Where it runs

**Not on your machine.** The script lives inside ThingSpeak's MATLAB Analysis service. Two accounts are involved:

- **Trigger account** (owns channels `2568299` / `2584548` / `2584547` — the ESP32 write targets): hosts the **React trigger** and the **MATLAB Analysis** script.
- **Write-target account** (owns channel [`2626867`](https://thingspeak.mathworks.com/channels/2626867) — `EXT_CHANNEL`): receives the scraped weather. The MATLAB script authenticates to it via a **write API key** (`writeAPIKey` in `met.matlab`).

Different login credentials for each account — easy to miss when hunting for where the script lives.

To find/edit the running script:

1. Log in to the **trigger account** at <https://thingspeak.mathworks.com/>
2. Apps → **React** → "met.no trigger" (condition: any new data on channel 2568299)
3. Click through to the linked MATLAB Analysis → "Get data from MET.NO"

The file `met.matlab` in this repo is a snapshot for reference. To change behavior, edit the copy on ThingSpeak (and keep this file in sync).

## Field layout on the write channel (2626867)

| Field | Value | Consumed by |
|---|---|---|
| 1 | `metTemp` (air_temperature) | webapp: `chart-out-temp` |
| 2 | `metHum` (relative_humidity) | — |
| 3 | `tempDiff` (temp − metTemp) | webapp: `chart-temp-diff` |
| 4 | `humDiff` (hum − metHum) | — |
| 5 | `wind` (wind_speed) | webapp: `chart-wind` |
| 6 | `precipitation` (precipitation_rate) | webapp: `chart-rain` |
| 7 | `apparentTemp` (MET.no `apparent_air_temperature`, "feels like") | — (repurposed from redundant greenhouse-temp mirror on 2026-09-21) |
| 8 | `uvIndex` (ultraviolet_index_clear_sky) | webapp: `chart-uv-index` |

## Robustness

The scraper uses `webread` + `jsondecode` and looks fields up by name (`details.air_temperature`, `details.wind_speed`, …). MET adding new fields (they added `ultraviolet_index_clear_sky` in July 2026 and `apparent_air_temperature` in September 2026, both alphabetically inserted) no longer shifts anything. Each field also has a plausibility gate — the whole write is skipped if any value is out of range, so a malformed API response drops the sample rather than polluting the channel.

Historical note: earlier versions used a positional `urlfilter(url, targetString, N)` helper. It broke each time MET added a field. If you find yourself reverting to it, don't — see git history for the two prior incidents.

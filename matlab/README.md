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
| 7 | `temp` (greenhouse temp, from read channel) | — (redundant with source channel) |
| 8 | `uvIndex` (ultraviolet_index_clear_sky) | webapp: `chart-uv-index` |

## Fragility notes

The scraper uses a legacy `urlfilter(url, targetString, N)` helper that returns the first N numeric values after `targetString`. It's **positional** — MET Norway adding a field between existing ones will shift the indices. This happened once (UV index was added, shifting wind's position); see the July 2026 fix in git history.

If wind or another field starts showing garbage on the site, the MET API response format has probably changed again. Rebuild with `webread()` + JSON field lookup by name for a robust fix.

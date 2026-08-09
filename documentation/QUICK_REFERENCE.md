# DriMon Quick Reference

Print-friendly single page. Stick a copy on/near the enclosure.

## Enclosure layout (front view)

```
┌──────────┬─────────────────────────────────────────────────┬───────────┐
│ Rocker   │  LEDs   AHT temp/hum      LCD           OLED    │  🟢 Green │
│ switch   │  ↑↑↑    (white grid)    (16×2 blue)   (black)   │   ──────  │
│  I/O     │                                                 │  🔵 Blue  │
└──────────┴─────────────────────────────────────────────────┴───────────┘
   ↑                                                              ↑
 post-enable.                                                wake / reset
```

- **Far left extension**: black rocker switch (post-enable)
- **Main enclosure, left of center**: small LEDs + white AHT temperature/humidity sensor
- **Main enclosure, center**: 16×2 LCD (blue backlight)
- **Main enclosure, right of center**: OLED (128×64 monochrome)
- **Right extension**: two round push buttons stacked — green on top, blue below

## LED codes

Small LEDs on the **left of the enclosure**, between the rocker switch and the white AHT sensor.

| Signal | Meaning |
|---|---|
| 🟢 Green — 2 flashes at boot | Just booted, running setup |
| 🟢 Green — 2 flashes + 2 beeps | Cycle complete, going to sleep |
| 🔵 Blue — solid ON | Posting to ThingSpeak (2–3 s) |
| 🟢🔴 Mixed — 3 flashes after blue turns off | Per-channel POST result in order (Ch 1 / Ch 2 / Ch 3): 🟢 = success, 🔴 = failure. E.g. 🟢🟢🟢 = all posted, 🟢🔴🟢 = Ch 2 failed, 🔴🔴🔴 = all failed. |
| 🔴 Red — 3 flashes at boot (before blue) | Display init failed |
| 🔴 Red — 4 flashes at boot (before blue) | WiFi connect failed (no POST attempted) |

Post-POST 3-flash sequence disambiguates the old overlapping codes: any 🟢 in the sequence means "we got to the post phase," so display-init and WiFi-fail codes are unambiguously the ones that happen *before* the blue LED lights up.

## Buttons

Physical controls on the enclosure:

| Location | Control | Wired to | Effect |
|---|---|---|---|
| Right extension, **top** | 🟢 **Green push button** | GPIO 15 (EXT0) | **Wake** from deep sleep. Soft — preserves RTC memory (WiFi cache intact). Forces display on, triggers a measurement + post cycle. |
| Right extension, **below green** | 🔵 **Blue push button** | ESP32 EN pin | **Hardware reset**. Full cold boot. Wipes RTC → next WiFi connect is a `WF-MISS` fresh scan. Same effect as pressing EN on the dev board itself. |
| Left extension | ⚫ **Black rocker switch** (I/O) | GPIO 27 | Read at every wake. **I (down / LOW)** = post to ThingSpeak. **O (up / HIGH)** = skip posting (use during bench debugging). |

## Status field decoder

Every ThingSpeak entry carries a `status` string like:

```
T-OK_SHADE_W-OPEN_B-OK_P-HIGH_WF-HIT_BS-14918294f9c4_WT-388_FC-0_PF-0_BV-4.09_TU-5435_TV-21.4_LX-8500_WD-72_LR-200.200.200_PR-0.0.0_LTU-5312_LP-3120_LT-11250_WR-8.4_LS-42.OK_V-d9976d7_SD-0
```

Underscore-separated `PREFIX-VALUE` parts:

| Prefix | Meaning | Values |
|---|---|---|
| `T-` | Temperature classification | `COLD` (≤5 °C, frost warning) / `OK` / `HOT` (≥35 °C, heat warning) — thresholds match heat-frost.html defaults |
| (no prefix) | Light level | `NIGHT` / `DUSK` / `SHADE` / `SUN` |
| `W-` | Window state | `CLOSE` (distance <80 mm) / `OPEN` |
| `B-` | Battery state | `OK` / `LOW` (<35 %) |
| `P-` | Air pressure | `LOW` (<999) / `OK` / `HIGH` (>1010) hPa |
| `WF-` | WiFi cache outcome | `HIT` (cache used, connected first try) / `MISS` (no cache, fresh scan) / `FBK` (cache failed, fell back) / `FAIL` (unreachable in written status — no post if not connected) |
| `BS-` | Connected AP's BSSID | Full 6-byte MAC as hex, no separators (e.g. `14918294f9c4`). Note: mesh nodes usually assign their 2.4 GHz radio MAC as LAN MAC +1 (or +2, +N), so match against LAN MAC allowing a small offset in the last byte. |
| `WT-` | WiFi connect time | integer, milliseconds |
| `FC-` | Failed-connect streak (WiFi never associated) | `RTC_DATA_ATTR uint16_t`, incremented on each `WF-FAIL`, reset once at end of `postThingSpeak()` if any of the 3 channels returned HTTP 200. Saturates at 65535. Value on a status = "N wakes with no WiFi before this successful post". Wiped by cold reset / brownout / EN button. |
| `PF-` | Post-fail streak (WiFi OK but every POST failed) | `RTC_DATA_ATTR uint16_t`, incremented at end of `postThingSpeak()` when WiFi connected but no channel returned HTTP 200. Reset when any channel succeeds. Saturates at 65535. Complements FC — together they cover both classes of silent wakes. Wiped by cold reset / brownout / EN button. |
| `BV-` | Battery voltage | Volts, 2 decimals (e.g. `4.09`). Same reading as TECH_CHANNEL field 2, embedded per-status for temporal alignment. |
| `TU-` | Time used (wake duration to end of measure) | ms integer (e.g. `5435`). Same reading as TECH_CHANNEL field 4, embedded per-status. Note: excludes the 12 s display delay and POST time — set at end of `measure()`. |
| `TV-` | Aggregate temperature (Celsius) | Float, 1 decimal (e.g. `21.4`). The value driving the `T-` classification and shown on the main dashboard temp chart. Weighted average of 2×BME + AHT (+ middle DS18B20 when plausible). |
| `LX-` | Ceiling lux (raw) | Integer lux (e.g. `20651`). The value driving the light-class classification (NIGHT/DUSK/SHADE/SUN thresholds). Same as `DRIMON_CHANNEL` field 8. |
| `WD-` | Window distance (raw) | Integer mm (e.g. `72`). Raw TOF distance reading before `WINDOW_CLOSE` classification. Same as `DRIMON_CHANNEL` field 4 (before the −63 mm shift). |
| `LR-` | Last-run HTTP results (dot-separated) | Three HTTP result codes from the previous wake's 3 channel POSTs (final code after any retries), e.g. `200.200.200` all-ok, `200.429.429` rate-limited, `200.0.0` timeouts after Ch 1, `0.0.0` first wake after cold reset. RTC-persisted; wiped by brownout / EN button. |
| `PR-` | Post retries (dot-separated) | Extra attempts each channel needed in the previous wake, e.g. `0.0.0` no retries, `1.0.1` ch1 + ch3 each retried once, `2.2.2` every channel hit `MAX_POST_RETRY`. Only transient codes (`0`, `-301`, `-302`, `-303`, `-304`) trigger retries; 4xx/5xx don't. RTC-persisted; wiped by cold reset. |
| `LTU-` | Last TU (ms) | Previous wake's measure time — same value as that wake's own `TU-`, duplicated in RTC so the full timing decomposition (measure + post + display) fits on a single status row. `uint16_t`, saturates at 65535. |
| `LP-` | Last Post time (ms) | Wall-clock ms the previous wake spent inside `postThingSpeak()` — includes retries, inter-post delays, and the 3× per-channel POST. Direct signal of network cost. Grows with `PR` values. RTC-persisted; wiped by cold reset. `uint16_t`, saturates at 65535. |
| `LT-` | Last Total time (ms) | Wall-clock ms for the entire previous wake, setup start → just before `enterDeepSleep`. Sum of measure + post + display pause (`SD-`) + ~700 ms tail (flash/beep). Battery-cost proxy. Sanity check: `LTU + LP + prev_SD + ~700 ≈ LT`. RTC-persisted; wiped by cold reset. `uint16_t`, saturates at 65535. |
| `WR-` | Wake reason: `<resetReason>.<wakeupCause>` | `resetReason` = `esp_reset_reason()` — `1` POWERON, `2` EXT (EN pin), `3` SW, `4` PANIC, `5` INT_WDT, `6` TASK_WDT, `7` WDT, `8` DEEPSLEEP (normal timer/EXT0 wake — RTC preserved), `9` BROWNOUT, `10` SDIO. `wakeupCause` = `esp_sleep_get_wakeup_cause()` — `0` UNDEFINED (fresh boot), `2` EXT0 (green button), `4` TIMER. Anything but `8.*` = a cold-path reset happened and RTC was wiped. Captured at start of `setup()`. |
| `LS-` | Last stage — previous wake's serial + breadcrumb, format `<n>.<stage>` (e.g. `42.OK`, `43.WF`) | Both parts stored in NVS (flash, not RTC) so they survive panic/reset/brownout. `<n>` is a monotone `uint16_t` wake serial, incremented once at boot; wraps harmlessly at 65535 (~2 years @ 15-min intervals). `<stage>` is written at the START of each phase via `stage("XX")` in the main `.ino`; whichever phase the previous wake was *inside* when it died is what the current wake reads back. Stage codes: `SP` setupPins+Serial, `ID` initDisplays, `WF` connectToWiFi, `IS` initSensors, `MS` measure, `PS` postThingSpeak, `DP` display-pause 8 s hold, `OK` reached `enterDeepSleep()` cleanly. Special stage: `??` = first-ever boot after firmware flash (NVS key not yet written). Reading `LS-<n>.OK` = previous wake slept cleanly; anything else = crashed there, and the `WR-` on this row usually shows PANIC/WDT/BROWNOUT to match. The serial also makes every wake's status unique so identical panic-loop rows never silently merge in the status page. |
| `SD-` | Display-read pause | `0` (timer wake, no delay) or `8000` (button/fresh wake, 8 s pause — value of `DISPLAY_TIME`) |

**Naming convention**: tokens starting with `L*` (currently `LR-`, `LTU-`, `LP-`, `LT-`, `LS-`) hold data from the **previous wake** — captured in RTC memory (or NVS for `LS-`, which needs to survive panic) at the end of that wake, embedded in the next wake's status. `PR-`, `FC-`, and `PF-` also describe accumulated state from previous wakes (historical inconsistency — kept for descriptive fit and backward compatibility). All other tokens describe the current wake.

**Read the status from ThingSpeak** (any of the 3 channels works — same status on all):

- **Latest status only**: <https://api.thingspeak.com/channels/2568299/status.json?results=1>
- **Recent 10 statuses**: <https://api.thingspeak.com/channels/2568299/status.json?results=10>
- **Last ~day**: <https://api.thingspeak.com/channels/2568299/status.json?results=1000>
- **Last ~100 days**: <https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100>
- **Latest entry with all fields + status**: <https://api.thingspeak.com/channels/2568299/feeds.json?results=1&status=true>

For jq/curl analysis pipelines (WT-time trend, WF-cache histogram, etc.), see [TELEMETRY.md](TELEMETRY.md).

## Wake reasons — behavior at a glance

| Wake type | `DISPLAY_ON` | `SHOULD_POST` | 8 s display pause? |
|---|---|---|---|
| Timer wake (normal field cycle) | false | reads switch | no |
| Green button (EXT0 wake) | true | reads switch | yes |
| Cold boot from `POWERON` (battery reconnect) or `EXT` (blue EN button) | true | reads switch | yes |
| Cold boot from `PANIC` / `WDT` / `BROWNOUT` / `SW` (no human present) | false | reads switch | no |

Every wake POSTs — cold boots carry `WR-<resetReason>.0` in the status field so cold-path resets show up on ThingSpeak. The `DISPLAY_ON` split above is a whitelist: only *human-triggered* cold boots light displays. `PANIC` etc. stay headless to preserve battery — proven mattering in the 2026-08-08→09 panic-restart loop, where 11 h of `DISPLAY_ON=true` cold boots burned ~130 mAh on 8 s display-pauses (see `LS-` for where the crash happened).

## Common quick checks

- **"Is it charging?"** → check the DFR0559's charge LED (red = charging, green DONE = full). Or the battery voltage chart trend on <https://drimon.rodland.no/>.
- **"Why didn't it post?"** → post-enable switch may be HIGH.
- **"Which WiFi did it join?"** → status field contains `WF-` outcome and `WT-` connect time; historical values queryable at `https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100`.
- **"Did the previous wake crash?"** → check `LS-` in the latest status: `LS-<n>.OK` = wake #n slept cleanly, `LS-<n>.<stage>` (any other stage) = wake #n panicked inside that phase. Usually the `WR-` on the same row shows `4.*` (PANIC) or a WDT code, corroborating.
- **"Cell temperature reads 85 °C, -55 °C, or -127 °C"** → DS18B20 bogus values (power-on default / bit corruption / disconnect). Filtered on the site; firmware retries at read time. If persistent, resolder the affected wire.

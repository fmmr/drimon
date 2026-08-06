# New PCB Design — Requirements, Constraints, and Open Questions

Design brief for a Drimon PCB revision, capturing lessons learned from v1.3 and unresolved design decisions to work through in a dedicated session.

## Motivation

The current PCB works but has two persistent pain points:

1. **Off-season survival**: system has died in December 2024 and October 2025 during prolonged low-solar periods. Root cause traced to the **DFR0559 boost converter quiescent draw (~25 mA continuous = ~600 mAh/day)** which dominates the 640 mAh/day daily budget even though ESP32 wake load is only ~40 mAh/day. See `HARDWARE.md` § "Power Budget".
2. **Flashing UX**: currently requires opening the enclosure, unplugging the ESP32 dev module's USB from the DFR0559's USB-A output, plugging in the flashing USB-C, flashing, then reversing. Cumbersome.

## Current architecture (v1.3, `20240724_drimon_1_3`)

```
Solar 5 V panel ──► DFR0559 SolarPower Manager ──► 3S1P 3× 18650 (9000 mAh)
                          │
                          ├── USB-A F (5 V) ──► USB-A ↔ Micro-USB cable ──► ESP32 dev module (ESP32-WROOM-32, 30-pin p30_w11)
                          │                                                   │
                          │                                                   ├── CH340/CP2102 USB-serial (~5-10 mA quiescent)
                          │                                                   ├── AMS1117-3.3 onboard LDO (~5 mA quiescent)
                          │                                                   └── ESP32 SoC
                          │
                          └── Battery+ ──► DFR0563 MAX17043 fuel gauge (I²C, ~50 µA)

ESP32 GPIO 13 (SENSOR_POWER_PIN) gates some sensor rails today via MOSFET,
but the 5 V bus itself is always-on (via the USB path above).

Sensors on the perfboard (via ESP32 board pins):
 - BME280 (I²C) — temp/humidity/pressure
 - AHT10 (I²C) — temp/humidity
 - BH1750 ×2 (I²C, addr 0x23 + 0x5C) — lux (ceiling + internal)
 - VL53L0X (I²C) — TOF distance (window)
 - SSD1306 128×64 OLED (I²C)
 - LCD-I2C 16×2 (I²C, PCF8574 backpack)
 - 3× DS18B20 (1-Wire) on GPIO 32
 - 3× soil moisture sensors (analog, currently 2 broken)
 - MAX17043 fuel gauge (I²C)

Buttons:
 - Green — GPIO 15 (EXT0 wake, preserves RTC)
 - Blue — EN pin (hardware reset, wipes RTC)

Fritzing source: `/Users/fmr/projects/fritzing/all_on_one_with_power.fzz`
```

## Problems to fix in the new revision

| # | Problem | Impact |
|---|---|---|
| 1 | DFR0559 boost quiescent ~25 mA continuous | Dominant load. Kills off-season survival. |
| 2 | ESP32 dev module's AMS1117 + CH340 always-on quiescent (~10-15 mA) | Adds to the always-on tax even if DFR0559 boost gets gated. |
| 3 | Flashing requires enclosure disassembly | Slows iteration, discourages hotfix flashes. |
| 4 | No easy access to spare GPIOs / additional I²C sensors | Adding new sensors requires perfboard surgery. |
| 5 | Extra sensor addition means running new wires from ESP32 pins | No standard header. |

## Design goals

- **Off-season survival ≥ 25 days on battery alone** (current: ~12 days empirically)
- **Zero-effort flashing**: USB-C connector accessible on enclosure exterior, plug in, click Flash
- **Extensibility headers**: unused ESP32 GPIOs + 3V3 + 5V + GND broken out
- **I²C expansion sockets**: 2-3 additional 4-pin (V/G/SDA/SCL) headers for future sensors
- **Gated 5 V bus**: DFR0559 5V output only enabled when ESP32 wakes (extend `SENSOR_POWER_PIN` concept to the whole 5 V bus)
- **Keep DFR0563 MAX17043 fuel gauge** — its ModelGauge % may become useful for predicting deep-discharge cutoff during off-season; decision to drop it deferred until winter data is available
- **Preserve current wiring/pinouts** where practical to keep firmware changes minimal

## Proposed power architecture

```
                          ┌── [voltage divider (optional)] ── ESP32 ADC (secondary battery monitor)
                          │
Battery+ ────────┬────────┼──► [low-Iq LDO: AP2112K-3.3 or HT7333] ──► ESP32 3V3 pin (ALWAYS ON, ~55 µA / ~5 µA quiescent)
                 │        │
                 │        └──► DFR0563 MAX17043 fuel gauge (I²C, ~50 µA)
                 │
                 ├──► DFR0559 charging input from solar
                 │
                 └──► DFR0559 5V output pin ─── [P-MOSFET gated by SENSOR_POWER_PIN / new gate GPIO] ─── 5V bus
                                                                                                          │
                                                                                                          ├── OLED (SSD1306) VCC
                                                                                                          ├── LCD (I²C 16x2) VCC
                                                                                                          ├── I²C pull-up rail (usually needs 3V3 not 5V — TBD)
                                                                                                          ├── VL53L0X VCC (needs 3V3)
                                                                                                          ├── BME280 VCC (needs 3V3)
                                                                                                          ├── AHT10 VCC (needs 3V3)
                                                                                                          ├── BH1750 VCC (needs 3V3)
                                                                                                          ├── DS18B20 VDD (3V3 or 5V)
                                                                                                          └── expansion sockets

USB-C connector on PCB ──► CH340C or CP2102N USB-serial chip on-board ──► ESP32 GPIO 1/3 (UART0)
                          │                                                │
                          └── DTR/RTS auto-reset circuit ─────────────────►┴── EN pin (through the standard 2-transistor circuit)

USB VBUS (5 V) ──► ONLY powers the CH340/CP2102 (via ~0.1 µF decoupling); does NOT feed the 3V3 rail
                   → CH340 quiescent = 0 mA when USB unplugged; ~5-10 mA only during flashing sessions
                   → No AMS1117 on this design; no rail-fighting risk from dual LDOs
```

Key architectural points:
- **Always-on 3V3 rail** (via low-Iq LDO) for the ESP32 SoC and fuel gauge only
- **Gated 5V rail** for everything else (sensors, displays); off between wakes
- **Sensors that want 3V3** get it from the ESP32 dev module's 3V3 pin (already 3V3 via our LDO); may need a separate 3V3 gate for them too — see open questions
- **USB-C is a dedicated peripheral**: it only powers the CH340; it cannot back-power the 3V3 rail, so no diode-OR needed

## Voltage regulator choice — options

| Part | Iq (quiescent) | Iout max | Dropout @ 100 mA | Package | Notes |
|---|---|---|---|---|---|
| **AP2112K-3.3** | 55 µA | 600 mA | 250 mV | SOT-23-5 | Handles ESP32 WiFi TX peaks (~500 mA short burst) with output cap |
| **HT7333** | 5 µA | 250 mA | 100 mV | SOT-89 | Lowest Iq; marginal on ESP32 TX peaks — needs generous output cap |
| **MCP1700-3302** | 1.6 µA | 250 mA | 178 mV | SOT-23-3 | Excellent Iq; same peak-current caveat as HT7333 |
| **RT9013-33** | 30 µA | 500 mA | 150 mV | SOT-23-5 | Good balance |

**Recommendation**: **AP2112K-3.3** for safety margin on WiFi TX peaks. 55 µA quiescent × 24 h ≈ 1.3 mAh/day — negligible. If output caps are generous (10 µF + 220 µF) and testing shows no brownouts, HT7333 or MCP1700 would save an extra ~50 µA.

## Charger choice

Options considered:

- **Keep DFR0559** with its 5V boost pin (not USB-A) and gate the boost via MOSFET → simplest migration, retains solar charging capability. Boost enabled only during wake, so quiescent contribution drops from 25 mA continuous to ~1-2 mA average (25 mA × wake_duty_cycle).
- **Replace with TP4056** + separate always-on LDO → single-cell LiPo charger, ~2 µA quiescent, no built-in boost (would need separate 5V boost for sensors). More parts, lower quiescent.
- **Replace with MPPT-capable charger** (e.g. CN3791, LT3652) → more efficient solar harvesting on cloudy days. Higher complexity.

**Recommendation**: keep DFR0559 for solar-charging, gate its 5V output. Revisit if off-season survival is still too short after other optimizations land.

## Extensibility features

- **Unused-GPIO breakout header** — expose remaining ESP32 GPIOs (not used by current sensor wiring) as a 2×N pin header with adjacent 3V3 + 5V (gated) + GND columns
- **I²C expansion sockets** — 2–3× 4-pin JST-XH or Molex sockets: VCC (5V gated) / GND / SDA / SCL. Standard pinout so common sensor breakouts plug in directly
- **Test points**: labeled TP for battery+, 3V3, 5V, GND — makes multimeter debugging one-probe
- **Solder-jumper pads**: on/off for optional features (e.g. one jumper to bypass the AMS1117 mod, one to disable the buzzer)
- **Optional secondary EXT0 wake input** — expose GPIO 15 (or another RTC-capable GPIO) at a header pin so future external triggers (rain sensor? door reed switch?) can wake the ESP32

## Buttons

- **Green** — GPIO 15 EXT0, wake trigger. Keep as-is.
- **Blue** — EN pin, hardware reset (POWERON class). Keep as-is.
- **Switch to enable post** — need to turn off posting to thingspeak during test

- Consider a third button for a "programmatic action" (e.g. force post regardless of `SHOULD_POST` switch). Optional.

## USB-C flashing UX

- **USB-C socket on the PCB**, oriented so a cable can plug in through the enclosure wall (or via a dedicated flap/hole)
- **On-board USB-serial chip**: CH340C (cheap, common) or CP2102N (better driver support on macOS)
- **Auto-reset circuit** (standard 2-transistor DTR/RTS → EN + BOOT sequence) so `arduino-cli` can flash without pressing BOOT/EN manually
- **No dual power paths** — CH340/CP2102 is powered only from USB VBUS; the 3V3 rail is always fed by the battery LDO. When USB is unplugged, CH340 is dead (0 mA). When plugged in, CH340 wakes (~5-10 mA) but only during the flash session.

## Protection

- **Reverse-polarity protection on battery input**: P-MOSFET (e.g. SI2301) in the high-side. Nearly zero drop when correct polarity, blocks reverse.
- **Transient suppression on battery input** (optional): SMAJ5.0CA TVS diode. Cheap insurance against ESD or hot-swap sparks.
- **Fuse (polyfuse)**: 500 mA-ish polyfuse in series with battery+ line. Protects against a downstream short frying the battery.

## Open questions to resolve in the design session

1. **Do sensors that want 3V3 pull from the always-on LDO or from a gated 3V3 rail?**
   - Always-on: simpler, but adds their quiescent to the always-on budget (I²C pull-ups ~200 µA each, sensor sleep modes vary)
   - Gated: extra MOSFET but zero draw between wakes. **Probably worth it.**
2. **Should the fuel gauge stay on always-on 3V3 or on gated?**
   - It's I²C, so it needs the same rail as its bus. If pull-ups are gated, fuel gauge must also be gated.
   - Trade-off: gauge in gated position means its ModelGauge integration resets each wake → loses accuracy. Keep it always-on and accept the ~50 µA.
3. **USB-C or USB-Micro?**
   - USB-C: more physical robustness, no orientation, modern
   - USB-Micro: cheaper, ubiquitous
   - Recommendation: USB-C
4. **On-board USB-serial choice**: CH340C vs CP2102N
   - CH340C: ~$0.30, driver included in macOS 11+, works well
   - CP2102N: ~$2, better driver, higher-quality clock
   - CH340C is fine for hobby-scale flashing frequency
5. **Do we split the PCB into a "core" (always-on: LDO, fuel gauge, ESP32, USB, buttons) and a "sensors" mezzanine (gated 5V bus, all sensor sockets)?**
   - Cleaner but more BOM. Probably overkill for this scale.
6. **Solar panel connector**: JST-XH 2-pin? Screw terminal? Existing DFR0559 connector reused?
7. **Enclosure fit**: does the current enclosure accommodate the new board footprint, or does a redesign here mean a new enclosure too?
8. **DS18B20 wiring**: 4.7 kΩ pull-up on the 1-Wire line — position on PCB, or on the DS18B20 end?
9. **Soil moisture sensors** — 2 of 3 currently broken. Redesign the connector? Move to a different sensor type entirely (e.g. Adafruit capacitive)?
10. **Sensor-power topology**: single 5V gate for entire bus, or per-sensor gates for finer control?

## Reference material for the design session

- `documentation/HARDWARE.md` — current power budget, sensor list, wiring notes
- `documentation/QUICK_REFERENCE.md` — status-field decoder (understand what firmware exposes)
- `documentation/ARCHITECTURE.md` — data flow, ThingSpeak channels
- `20240724_drimon_1_3/20240724_drimon_1_3.ino` — main sketch (pin assignments live here)
- `/Users/fmr/projects/fritzing/all_on_one_with_power.fzz` — current PCB layout (Fritzing)
- **DFR0559 SolarPower Manager Micro** datasheet — for solar/boost/pin functions
- **DFR0563 MAX17043** datasheet — for fuel-gauge behavior
- ESP32 dev module (p30_w11) pinout — for which GPIOs are RTC / ADC / touch capable

## Skill level context

Owner is a strong software engineer (Kotlin / Java ) and an electrical engineer, but hasn't worked with EE.  Also not a very string C-programmer. Design guidance should:
- Explain component-choice trade-offs rather than just naming parts
- Prefer well-documented parts with good hobby-community support
- Suggest a testable path (breadboard prototype → verify quiescent draw → PCB)
- Flag any non-obvious PCB-layout gotchas (e.g. WiFi antenna keepout, ground planes, decoupling near ESP32)

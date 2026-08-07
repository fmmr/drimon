# Drimon PCB Redesign

Design brief for the next revision of the Drimon greenhouse-monitor PCB. Clean-sheet redesign, KiCad-drawn, Aisler-fabricated.

## Purpose

Replace the current PCB with a design that:

1. **Survives prolonged low-solar periods.** The current board dies after ~12–14 days on battery alone; target ≥25 days. Root cause is the DFR0559 boost converter's ~25 mA continuous quiescent draw dominating the daily budget, plus the ESP32 dev module's onboard AMS1117 LDO + CH340 adding another ~10–15 mA continuous. Both are eliminated in the new design.
2. **Flashes without disassembling the enclosure.** USB-C connector on the PCB reaches an enclosure cutout; plug in, flash, unplug.
3. **Wires cleanly.** Keyed connectors, colour-coded wire jackets, silkscreen legend that lets a future reader trace any signal in seconds. No repeat of the v1.2 wire-spaghetti.
4. **Has real headroom** for adding new sensors without hand-soldering to breakout pads.

**Non-goal**: matching v1.2's physical layout, pin assignments, connector choices, or enclosure arrangement. Only the sensor set (what data the firmware collects) is carried forward. Everything about how those sensors are mounted, connected, and routed is open.

## Sensor set (what the firmware must be able to read)

Non-negotiable. The new board must support these sensors so the firmware can drive it with only trivial pin-remap edits.

| Sensor | Protocol | I²C addr | Purpose | Physical group |
|---|---|---|---|---|
| BME280 | I²C | 0x76 | Temperature / humidity / pressure | Enclosure-mounted (in vented housing on front) |
| AHT20 | I²C | 0x38 | Temperature / humidity (cross-check) | Enclosure-mounted (with BME280 in vented housing) |
| BH1750 "internal" | I²C | 0x23 | Inside-enclosure light | Enclosure-mounted (front) |
| BH1750 "external" | I²C | 0x5C | Ambient greenhouse light — drives sleep intervals | Enclosure-mounted (side wall) |
| VL53L0X TOF | I²C | 0x29 | Window open/close distance | Enclosure-mounted (aimed at window) |
| SSD1306 OLED 128×64 | I²C | 0x3C | Local status display | Enclosure front cutout |
| PCF8574 LCD 16×2 | I²C | 0x27 | Secondary local display | Enclosure front cutout |
| MAX17043 fuel gauge | I²C | 0x36 | Battery voltage + SoC | Inside enclosure, wired direct to battery+ |
| DS18B20 ×3 | 1-Wire | — | Distributed temperature ("closest", "middle", "farthest") | Remote — long external cables |
| Capacitive soil moisture ×3 | Analog | — | Soil water content in three planters | Remote — long external cables |

Also on the enclosure (not sensors): wake button, reset button, POST-enable switch, 3 status LEDs, buzzer. Also inside: 1S3P Li-ion pack (3× 18650 in parallel, ~8400 mAh at 3.7 V nominal), solar panel input, DFR0559 charger.

## Locked design decisions

### Fab and tooling

- **Fab house**: Aisler. Design rules: 6 mil (0.15 mm) minimum trace, 0.4 mm minimum drill, 2-layer FR4.
- **EDA tool**: KiCad. Not Fritzing. Fritzing's weak DRC / ERC allowed a manufactured SCL trace cut and two disjoint 5 V nets on v1.2; KiCad catches this class of error before manufacture.

### Power architecture

Three rails, driven by the sensitivity of each load:

```
Battery+ (1S3P, ~8400 mAh @ 3.7 V nominal)
  │
  ├── MAX17043 fuel gauge                          (always-on, ~50 µA)
  │       └── I²C bus "Wire" (GPIO 21/22), pull-ups on always-on 3.3 V
  │
  ├── DFR0559 charger  ── solar in
  │                     ── (optional) USB VBUS in
  │                     └── 5 V out ── P-MOSFET (GPIO-gated) ── gated 5 V rail
  │                                                                 ├── OLED, LCD
  │                                                                 ├── All sensor VCCs
  │                                                                 └── I²C bus "Wire1" pull-ups
  │
  └── TPS2113A power mux ── LOAD ── AP2112K-3.3 LDO ── ESP32 3.3 V  (always-on)
        ▲
        └── USB-C VBUS (wins over battery when present)
```

**Why this shape**:

- **The DFR0559's ~25 mA boost quiescent** is the root cause of off-season death. Gating the 5 V output through a MOSFET kills that between wakes. Target off-season quiescent: <500 µA total board draw.
- **The ESP32 needs to be always-on** to keep RTC data across deep sleep. A dedicated low-Iq LDO (AP2112K-3.3, 55 µA Iq, 600 mA rated) from battery+ gives it a clean rail without depending on the DFR0559's boost being on.
- **The fuel gauge stays always-on** so ModelGauge keeps integrating charge in/out across wakes — needed for predicting deep-discharge cutoff in the off-season.
- **The TPS2113A power multiplexer** eliminates the manual "kill battery switch before flashing" step. USB VBUS is priority-selected when present, battery when not. No firmware special-case.
- **Two I²C buses** avoid I²C phantom-powering (pull-ups back-feeding current into powered-down sensor chips via their SDA/SCL pins). Fuel gauge on the always-on bus; everything else on the gated bus.

### Flashing

- **USB-C receptacle** on the PCB, reachable through an enclosure cutout.
- **On-board USB-serial chip** (CH340C or CP2102N — see open questions) with a standard 2-transistor auto-reset circuit (DTR/RTS → EN + BOOT).
- **TPS2113A power mux** takes over as the load source automatically when USB VBUS is present.
- **No OTA.** Rejected as adding firmware complexity (bricking risk, boot-loop rescue path, rollback logic) without saving trips — enabling OTA locally requires being at the greenhouse to press a button anyway.
- **Manual battery isolation switch** retained separately for maintenance / winter storage / hard reset — not needed for flashing.

### Connectors and wiring conventions

- **I²C sockets**: 4-pin JST-XH 2.5 mm, pinout **`SDA – SCL – VCC – GND`** — matches v1.2 header order so existing sensor plugs carry over.
- **1-Wire sockets**: 3-pin JST-XH, pinout `DATA – VCC – GND`. New cables — v1.2's cables are being replaced anyway.
- **Analog / soil-moisture sockets**: 3-pin JST-XH, pinout `SIG – VCC – GND`. New cables.
- **Continuous copper** for VCC, GND, SDA, SCL, 1-Wire across every socket in a group. No cut traces, no jumper headers acting as required-to-populate bridges.
- **Wire colour code** (silkscreen legend on PCB, used consistently on every pigtail):
  - Red = 5 V (or VCC on lower-voltage rails)
  - Black = GND
  - Yellow = I²C SDA
  - Green = I²C SCL
  - White = 1-Wire DATA
  - Blue = analog signal
  - Orange = digital GPIO
- **Battery is 1S3P** (3× 18650 in parallel, 3.7 V nominal). Charger and gauge are both single-cell parts.
- **Button naming**: "green" is reserved for the existing wake button and does not change. Any new switches/buttons get distinct names.

## Sensor placement — three physical groups

Groups drive the connector strategy. Where a sensor lives determines how its cable enters the enclosure and what connector it uses.

**Group A — on the PCB itself** (no external cabling, everything hard-connected):
ESP32 module, buzzer, TPS2113A power mux, LDO, USB-C, sensor-power MOSFET, LEDs (via 220 Ω resistors), pigtail headers for the enclosure-front buttons/switches.

**Group B — enclosure-mounted, short internal cables (10–20 cm)**:
OLED, LCD, BME280 + AHT20 (in vented housing on front), BH1750 internal (front), BH1750 external (side wall), VL53L0X (aimed at window), wake button, reset button, POST switch, status LEDs (if they mount on the enclosure wall rather than the PCB). Each on a JST-XH pigtail to a labelled connector on the PCB.

**Group C — remote, long external cables (1–5 m)**:
3× DS18B20 (distributed across greenhouse), 3× soil moisture sensors (buried in planters), solar panel (to the DFR0559). Cables exit the enclosure through cable glands or panel-mount waterproof connectors — see open questions.

**Expansion headroom**:
- **I²C** on `Wire1`: 3 spare sockets on the gated bus.
- **1-Wire**: 1 spare 3-pin socket for extending the chain.
- **Analog**: no free ESP32 ADC1 pins currently (all 4 are used by soil sensors). If more analog inputs matter, add an **on-board ADS1115** (16-bit ADC on I²C, ~$1, 4 more channels) — treat as a default-yes.
- **General-purpose GPIO**: 6–8 spare ESP32 GPIOs broken out to a labelled 0.1" header row with adjacent 3.3 V / 5 V / GND columns.

## Open design questions

Grouped by subsystem, split into "needs discussion" vs. "sensible defaults that just need a nod".

### A. Needs BOSS input (architectural)

**A1. Enclosure — redesign or keep?**
Current setup is clip-together clear plastic boxes joined side-by-side. Hard to reach into, not IP-rated. Options: keep-and-adapt (constrain the new PCB to fit the current cutout layout); design a new enclosure (3D-printed, laser-cut, or off-the-shelf project box, likely IP54+); somewhere in between. This decision drives PCB size, connector positions, and how sensors mount.

**A2. DFR0559 — integrate onto the main PCB or keep as a separate module?**
Today it's a separate carrier board wired in. Integrating saves the loose wires and Wago connectors but couples the DFR0559 tightly to the main PCB (harder to swap if it dies). Trade-off: cleaner wiring vs. reworkability.

**A3. MAX17043 fuel gauge — bare chip on PCB, or keep the DFR0563 breakout as a separate module?**
Same trade-off as A2. Bare chip is a few passives + the QFN; well-documented reference schematic.

**A4. Cable exit from the enclosure for remote sensors.**
Three approaches, ranked by cost and weatherproofing:
- **PG7/PG9 cable glands** (~$1 each): the sensor cable enters the box directly through a strain-relieved gland; cable is spliced/soldered to a PCB header inside. Cheapest, no plug-in/out.
- **M8 or M12 panel-mount waterproof connectors** (~$5 each): the sensor cable ends in an M-connector plug; matching receptacle screws into the enclosure wall; short pigtail inside to the PCB. Plug-in/out for maintenance, IP67-rated.
- **GX12 aviation connectors** (~$2 each): middle ground; plug-in/out but only splash-rated.

**A5. Soil moisture — sensor type and connector.**
Current 3× capacitive setup is unreliable (2 of 3 fail intermittently). Options: better-brand capacitive (Adafruit STEMMA soil), switch to gypsum blocks (longer-lived but slower to respond), tensiometers (accurate but fragile), or drop soil-moisture from this rev and revisit. Also: connector at PCB and at sensor end (JST-XH vs waterproof panel-mount).

**A6. Rescue-flash pigtail header — yes or no?**
Standard 6-pin FTDI-pinout header inside the enclosure as a fallback if the on-board USB-serial chip dies. Cost: one 0.1" header (pennies). Upside: robustness. Downside: one more thing to lay out.

### B. Defaults to confirm (implementation details — quick nods)

Each of these has a proposed default; unless BOSS pushes back, they land as-is.

- **B1. USB-serial chip**: **CH340C** (~$0.30, macOS 11+ driver built-in). Cheaper, adequate. CP2102N is available if the CH340C driver ever misbehaves.
- **B2. LDO for always-on 3.3 V**: **AP2112K-3.3** (55 µA Iq, 600 mA rated) — comfortable margin for WiFi TX peaks with proper bulk decoupling.
- **B3. Wire1 pin pair**: **GPIO 25 and 26** — both free (currently on the vestigial HC-SR04 footprint), no ADC/RTC conflicts for use as I²C.
- **B4. 1-Wire pull-up position**: **4.7 kΩ on the PCB**, at the DS18B20 chain header. Cleaner than pull-up at the sensor end.
- **B5. 1-Wire chain topology**: **single chain**, three DS18B20s on one cable with taps at each sensor. Simpler than three parallel cables. New cables anyway.
- **B6. ADS1115 for analog expansion**: **yes**, on-board. ~$1, gives 4 more analog inputs on the I²C bus, decouples us from ESP32 ADC1 saturation.
- **B7. Battery isolation switch**: **SPST rocker or slide switch** on the enclosure side, in series with battery+ before it hits the TPS2113A. Not needed for flashing (the mux handles that) — used for maintenance / storage.
- **B8. USB-C VBUS routed to DFR0559 USB input**: **yes** — essentially free (one extra trace) and gives battery top-up during flashing sessions. Confirm concurrent USB + solar input safety in DFR0559 datasheet.
- **B9. Auto-reset circuit**: **standard 2-transistor DTR/RTS → EN + BOOT**. Reference schematic straight from any ESP32 dev-board design.
- **B10. Sensor-power MOSFET**: **P-channel logic-level MOSFET rated ≥1 A** (e.g. SI2301, DMG3415-7). Gate driven by an ESP32 GPIO through a small pull-up (P-MOSFET is normally-off with gate high, on with gate low; ESP32 drives gate low to enable, floats/high to disable — pick a MOSFET whose Vgs threshold is compatible with 3.3 V drive).

## Reference material

**Session artefacts** (in `202608_new_setup/old/`):
- `aisler.png` — Aisler etching preview of the deployed v1.2 board (silkscreen "v 1.2")
- `all_on_one_with_power_common_soil_onewire_netlist.xml` — v1.2 netlist
- `IMG_2849.JPG`, `IMG_2850.JPG`, `IMG_2851.JPG` — 2026-08-07 live-setup photos (enclosure front, PCB, PCB with battery)

**Firmware — read-only reference**:
- `20240724_drimon_1_3/20240724_drimon_1_3.ino` + `3_setup.ino`, `5_measure.ino`, `8_sleep.ino`, `9_thingspeak.ino`
- `documentation/HARDWARE.md` — power budget, sensor list, wiring notes
- `documentation/QUICK_REFERENCE.md` — status-field decoder, LED codes
- `documentation/ARCHITECTURE.md` — data flow, ThingSpeak channels

**Component datasheets** (fetch as needed):
- DFR0559 Solar Power Manager 5V
- MAX17043 fuel gauge (or DFR0563 breakout)
- TPS2113A power multiplexer
- AP2112K-3.3 LDO
- CH340C / CP2102N USB-serial
- SI2301 / DMG3415-7 (P-MOSFET for sensor-power gate)
- ADS1115 (I²C ADC, for analog expansion)
- ESP32-WROOM-32 (module datasheet) + p30_w11 dev-board pinout

## Appendix: v1.2 lessons (context, not constraint)

Issues found on the deployed v1.2 board that shaped decisions above. Documented here so the new design actively protects against them:

- **A manufactured SCL trace cut** (J10↔J11) that was hand-soldered post-fab. Fritzing didn't flag it during design. → KiCad ERC + DRC catches this class of error automatically.
- **Two disjoint 5 V nets bridged only by a manual jumper header.** → No required-to-be-populated jumpers acting as invisible bridges. Single continuous 5 V rail with an explicit MOSFET gate.
- **Chaotic wire routing** — spaghetti of same-coloured wires, hard to trace. → Colour-code convention above, plus silkscreen legend on the PCB.
- **J1–J13 1-Wire pins were never used** — the only 1-Wire consumer was the separate Soil+1wire header. → Dedicated I²C-only sockets and dedicated 1-Wire-only sockets, not mixed.
- **DFR0559 boost quiescent (~25 mA) + ESP32 dev module's AMS1117 + CH340 (~10–15 mA)** dominated the always-on budget. → Gate the 5 V rail; power the ESP32 directly from a low-Iq LDO on battery+; USB-serial powered only by USB VBUS.
- **DFR0559 and MAX17043 were wired in as separate breakout modules with loose wiring.** → Open question A2/A3 above — integrate or keep modular.

## Skill-level context for collaborators

Owner is a strong Kotlin/Java/C++ dev, not an EE. Design discussions should:

- Explain hardware trade-offs from first principles, not just name parts.
- Prefer well-documented parts with good hobby-community support.
- Suggest testable paths (breadboard prototype → verify quiescent draw → PCB).
- Flag PCB-layout gotchas (WiFi antenna keepout, ground planes, decoupling near the ESP32).
- For critical or unattended workflows, prefer hardware solutions (a $2 IC) over firmware workarounds when both are viable.
- Use "BOSS" when addressing the owner directly.

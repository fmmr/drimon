# Drimon PCB Redesign

Design brief for the next revision of the Drimon greenhouse-monitor PCB. Clean-sheet redesign, KiCad-drawn, Aisler-fabricated.

## Purpose

Replace the current PCB with a design that:

1. **Survives prolonged low-solar periods.** The current board dies after ~12–14 days on battery alone; target ≥25 days. Root cause is the DFR0559 boost converter's ~25 mA continuous quiescent draw dominating the daily budget, plus the ESP32 dev module's onboard AMS1117 LDO + CH340 adding another ~10–15 mA continuous. Both are eliminated in the new design.
2. **Flashes without disassembling the enclosure.** USB-C connector on the PCB reaches an enclosure cutout; plug in, flash, unplug.
3. **Wires cleanly.** Keyed connectors, colour-coded wire jackets, silkscreen legend that lets a future reader trace any signal in seconds. No repeat of the v1.2 wire-spaghetti. **Zero hand-soldered inter-module wires** — every connection between component modules (DFR0559 charger, DFR0563 gauge, ESP32, TPS2113A, USB-C) is a PCB trace. Hand-soldered joints between BAT+/BAT− on the Charger and Gauge failed twice in v1.2 (2025 fall, 2026-08-12 dusk); making inter-module wiring impossible on the new PCB retires the entire failure class.
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

**Power interconnects — dedicated PCB connectors, no wires between modules:**

Every power-domain interface gets its own labelled, keyed connector on the PCB. All routing between them is copper trace, not hand-soldered wire. This is a hard rule — the v1.2 hand-soldered BAT+/BAT− joints between the DFR0559 (charger) and DFR0563 (gauge) failed twice, most recently 2026-08-12 (see `documentation/HARDWARE_SOLAR_CHARGING_CHECK.md`). The failure mode: joint works under trickle-charge current (small), collapses under WiFi TX burst current (large) → boost output drops → ESP32 brownouts → panic loop until sunrise restores solar-direct power.

Connector inventory:

- **Battery pack** → 2-pin JST-VH (high-current, keyed, positive latch), sized for the 1S3P pack's peak sourcing. Fans out on PCB to the DFR0559 BAT+ pads AND the DFR0563 BAT+ pads — one connector, two consumers, both via PCB trace.
- **Solar panel in** → 2-pin screw terminal or JST-VH (whichever is easier to service in the field). Routes to DFR0559 solar input pads via PCB trace.
- **USB-C** → single connector serves dual purpose: (a) VBUS goes to TPS2113A high-priority input for flashing/direct-power, (b) same VBUS tapped to feed DFR0559's USB-IN so plugging a phone charger into the same port also charges the battery. No separate "charging USB" connector needed.
- **DFR0559 5 V out** → routed on PCB to TPS2113A low-priority input. Not a wire.
- **DFR0563 I²C (SDA/SCL/VCC/GND)** → routed on PCB to the ESP32's always-on I²C bus. Not a wire.
- **Sensor rail (gated 5 V)** → routed on PCB from the P-MOSFET output to every sensor connector's VCC pin. Not a wire.

Result: every module on the board can be desoldered and replaced independently, and every external cable (battery, solar, USB, sensors) plugs into a single dedicated connector with strain relief. No solder joint between two module headers exists on the finished board.

### Power debuggability

**Motivation.** Summer 2026 burned five days debugging a battery/charger/wire path where every question ("is the battery healthy?", "is the charger healthy?", "is the gauge reading right?", "is the connection actually making contact?") required unsoldering, guessing, and hoping. The new PCB fixes this by making every rail *measurable* and every module *isolatable in seconds*, plus firmware-side telemetry so most of the same questions can be answered from the status page without walking to the greenhouse.

Answer this question — **"can I answer 'is X working?' with a multimeter probe in under 30 seconds, or via a single ThingSpeak status token, without disassembling anything?"** — for every part of the power path. If no, add the feature. The four hooks below cover it end-to-end:

**1. Labelled test points and debug header** — the PCB actively invites a multimeter. Two forms so we're not limited to one workflow:

- **Individual test loops** — 1 mm silkscreen-boxed pads (or preferably 0.5 mm through-hole loops that a probe hook can grab) at every rail listed below. Each labelled by name on silk.
- **One consolidated debug header** — a single 0.1" 2×N pin header with all rails + shared GNDs in a fixed row order (`GND · BAT · SOLAR · USB · CHG_OUT · MUX_OUT · 3V3 · 5V_GATED · GND`). Plug a pigtail into it and every rail comes out on a single ribbon for probing without contorting into the enclosure. Doubles as a bench-supply injection point for a specific rail during rework.

Both options together cost ~$0 (bare copper + solder mask + one header) and give a choice between "quick probe with one hand" (individual pads) or "hook up a probe fixture" (header).

Rails to expose:

| Test point | What it tells you if it reads wrong |
|---|---|
| `TP_BAT`      | battery raw voltage. 0 V = pack unplugged; 3.0–4.2 V = pack alive. |
| `TP_SOLAR`    | solar panel voltage into DFR0559. <5 V in sun = panel or its wire is dead. |
| `TP_USB`      | USB-C VBUS. 5 V when cable plugged, 0 otherwise. |
| `TP_CHG_OUT`  | DFR0559 5 V output. 0 V but battery OK = boost dead or shut off. |
| `TP_MUX_OUT`  | TPS2113A output. Should be = max(TP_CHG_OUT, TP_USB). |
| `TP_3V3`      | LDO output. 0 V but TP_MUX_OUT OK = LDO dead. |
| `TP_5V_GATED` | sensor rail. 0 V during a wake = MOSFET gate wrong. |
| 3× `TP_GND`   | ground probe points spread across the board. |

Each pad has a distinct silkscreen box so a multimeter probe lands cleanly without touching neighbours. Voltages readable while the board is powered and mounted — no unclipping needed. If we place the debug header near a case cutout with a small removable cover, you can probe without opening the enclosure at all.

Optional companion: a small "debug breakout" pigtail (PCB or hand-wired) with the mating 2×N connector on one end and colour-labelled banana-plug tails or DuPont leads on the other. Lives in the toolbox. Plug in during a site visit and every rail is a probe-touch away.

**2. Per-rail status LEDs** — one low-current LED (through ~20 kΩ, few µA) per power rail, silkscreen-labelled:

| LED | Purpose — visible answer to "is X up?" |
|---|---|
| `LED_BAT`    | lit → battery is providing voltage to the board (not just cell-side). Dark → connection break upstream of the LED. |
| `LED_CHG`    | lit → DFR0559 5 V output is on. |
| `LED_MUX`    | lit → TPS2113A is passing power (either from battery-boost or USB). |
| `LED_3V3`    | lit → always-on 3.3 V rail is up. If ESP32 seems dead, this LED tells you whether the LDO is the culprit. |
| `LED_SENSOR` | lit → gated sensor rail is on (helps debug "sensors read garbage" — is the rail even up?). |

Five LEDs, ~$0.05 each, ~10 µA total draw (irrelevant against ESP32 sleep current). Look at the board with a flashlight and you know immediately which rail is down without any measurement.

**3. Inline isolation resistors** — 0 Ω 0603 resistors (or 2-pin jumper headers if BOSS prefers screwdriver-free work) on every inter-module trace that isn't a bus:

| Isolator | Cutting it isolates… |
|---|---|
| `J_BAT_CHG`   | battery ⇄ DFR0559 — test if the boost fails independent of battery. |
| `J_BAT_GAUGE` | battery ⇄ DFR0563 — test gauge without battery, or reverse. |
| `J_CHG_MUX`   | DFR0559 output ⇄ TPS2113A — force USB-only power. |
| `J_MUX_LDO`   | TPS2113A ⇄ LDO — bench-power the LDO directly during rework. |
| `J_SENSOR`    | before the sensor-power MOSFET — bypass the gate for sensor-side troubleshooting. |

Removing a 0 Ω resistor takes ~5 s with a soldering iron. Splashing it back another 5 s. Compare to today's "cut a trace, hope you soldered it back cleanly" workflow.

**4. Firmware-side telemetry** — every rail readable in the status field, no probe needed:

- `BV-4.16` — battery voltage (already have, via MAX17043) ✓
- `V5-4.98` — 5 V rail voltage, via one ADC + resistor divider on ESP32
- `V3-3.28` — 3.3 V rail voltage, via ESP32's internal Vref (no external parts)
- `IB-152` (open Q — see below) — battery current in mA, if we fit an INA219 on the battery-to-charger trace. Also lets firmware compute pack internal resistance live: `Rint = (BV_rest − BV_load) / IB_load` — the answer to "is the battery pack dying?" as a single number, published every wake.
- `CHG-1` — charger status (charging / not-charging / fault) if DFR0559 exposes a status pin.

Each token above answers a specific field question that today requires a site visit and a multimeter. Extending the current status.html renderer to show them is a trivial follow-up.

**Documented decision tree** — a `POWER_DEBUG.md` in `documentation/` with a flowchart:

> ESP32 won't boot → look at LEDs.
> - `LED_3V3` dark? → measure `TP_3V3`. Still 0? → LDO or its input dead. Check `LED_MUX`.
> - `LED_MUX` dark? → measure `TP_CHG_OUT` and `TP_USB`. Both 0? → both sources dead. One >0 but `TP_MUX_OUT`=0? → TPS2113A blown.
> - All LEDs lit but ESP32 dead? → not a power problem; go to CPU/reset section.
> …etc.

No more "measure everything at random and hope you spot the anomaly". Every failure mode has a documented path from symptom → measurement → fix.

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

**A6b. Onboard battery-current sensor (INA219 or INA226)?**
The `IB-` telemetry token proposed in Power debuggability requires a shunt-based current sensor on the battery-to-charger trace. INA219 is ~$1 and puts current + voltage on the I²C bus. Upside: live pack internal resistance calculation (`Rint = ΔV / I` per wake) — early warning of a degrading pack months before it dies mid-winter. Downside: one more part, one more thing to lay out, small quiescent draw (~1 mA on the shunt + IC). Alternative: skip it and rely on the "does the boost sag under load?" ADC readback on `V5-`. Decide: is per-wake internal resistance worth the part cost?

**A7. Display power — separate rail from sensors, and how to avoid I²C phantom-power?**
Currently locked: OLED + LCD (backpack logic + backlight LED) share the sensor 5 V rail. When the firmware doesn't need to show anything, *nothing* on the display group needs power — chip, backpack, or backlight. Evidence this matters: 2026-08-08→09 11-hour panic-restart loop held an 8 s display-pause on every cold-boot wake with all displays lit, estimated ~130 mAh extra drain (battery trough dropped from a normal ~60 % to ~45 %). See the v1.2 lessons appendix for the full incident context.

Proposed change: split into two gated rails — one for sensors, one for the display group as a whole (OLED chip + LCD backpack logic + backlight LED). Complication: OLED and LCD sit on the same I²C bus (Wire1) as the sensors — if only the sensor rail is up, the displays' SDA/SCL pins back-feed through their internal ESD diodes into their unpowered Vcc net (same phantom-power failure the two-bus scheme already avoids for the fuel gauge). Two ways out:
- **(a) Coordinate the gates** — display rail on ⇒ sensor rail on (firmware rule, GPIO ordering). Free, one extra MOSFET + one GPIO, but sensors always pay display cost when displays are on.
- **(b) Bus switch on the display SDA/SCL stub** — small analog switch IC (e.g. TS3A44159, ~$0.60) or two N-MOSFETs isolate the display bus when its rail is down. Truly independent rails, one more part.

To decide: does the flexibility of (b) justify the extra part, or is (a) enough given displays are only lit on button wakes anyway?

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
- **Display group (OLED + LCD backpack + backlight LED) shares the sensor 5 V rail** — so it draws whenever any sensor cycle runs, even for headless timer wakes that don't touch the display. Surfaced by the 2026-08-08→09 panic-restart loop: 11 h of cold-boot wakes each held an 8 s display-pause with everything lit, estimated ~130 mAh of extra drain (battery trough went from a normal ~60 % to ~45 % overnight). → Open question A7 above — evaluate splitting displays onto their own gated rail (with a strategy for the I²C phantom-power issue).

## Skill-level context for collaborators

Owner is a strong Kotlin/Java/C++ dev, not an EE. Design discussions should:

- Explain hardware trade-offs from first principles, not just name parts.
- Prefer well-documented parts with good hobby-community support.
- Suggest testable paths (breadboard prototype → verify quiescent draw → PCB).
- Flag PCB-layout gotchas (WiFi antenna keepout, ground planes, decoupling near the ESP32).
- For critical or unattended workflows, prefer hardware solutions (a $2 IC) over firmware workarounds when both are viable.
- Use "BOSS" when addressing the owner directly.

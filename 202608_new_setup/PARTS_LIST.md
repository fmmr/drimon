# Parts List — Drimon v1.3 New Board

Ordered so BOSS can start acquiring parts while the schematic is still being drawn. Ships from Norway/EU where possible, from abroad where noticeably cheaper. **All prices approximate NOK per unit.** Items marked ⚠️ are >50 NOK and warrant a nod before ordering.

**Slack policy**: order 2–3× the strict minimum for cheap parts (passives, MOSFETs, connectors); order 1 spare of anything mid-priced (sensors, displays); consult before duplicating expensive items.

**Breadboardable?** Column says whether a part has a through-hole or breakout-board form we can prototype with before committing to a PCB footprint. Where the answer is "no direct DIP", either buy a hobbyist breakout board (~30–60 NOK, listed) OR skip breadboarding that block and validate on the first PCB spin.

---

## Suppliers cheat-sheet

| Supplier | Origin | Ship-to-Norway | Best for |
|---|---|---|---|
| **Kjell.com** | 🇳🇴 retail | 1–3 days | breadboards, jumper wires, cables, USB, basic tools |
| **Elfa Distrelec** (elfa.se / distrelec.no) | 🇸🇪 warehouse | 1–3 days | most ICs, passives, connectors, decent selection |
| **Mouser** (eu.mouser.com) | 🇪🇺 warehouse | 2–5 days | anything Elfa doesn't stock; huge catalogue; customs pre-paid |
| **Digi-Key** (digikey.no) | 🇺🇸/🇧🇪 | 3–7 days | same as Mouser, alternate stock |
| **LCSC** (lcsc.com) | 🇨🇳 | 1–2 weeks | dirt cheap, combine with JLCPCB fab order |
| **DFRobot direct** (dfrobot.com) | 🇨🇳 | 2–3 weeks | the DFR-branded modules (charger, gauge) |
| **AliExpress** | 🇨🇳 | 2–4 weeks | cheapest for hobby modules, quality varies |

Combining orders reduces shipping cost dramatically — try to bundle.

---

## 1. Core ICs (on-PCB)

| Part | Purpose | Qty | Est/unit | Breadboardable? | Source |
|---|---|---|---|---|---|
| **AP2112K-3.3** SOT-23-5 | Always-on 3.3 V LDO for ESP32 | 3 | ~15 NOK | Buy Adafruit breakout (~50 NOK) or DIP-adapt | Mouser / Elfa |
| **TPS2113A** MSOP-8 | USB-VBUS/battery power mux | 2 | ~40 NOK | Get eval breakout from TI or hand-solder on SOP→DIP adapter (~10 NOK) | Mouser / Digi-Key |
| **CH340C** SOP-16 | USB-serial for flashing | 3 | ~10 NOK | Any ESP32 dev board has one built-in — validate USB path on dev board first | LCSC / AliExpress |
| **SI2301** or **DMG3415-7** SOT-23 | P-MOSFET for sensor rail gate + CHG_DISC | 10 | ~5 NOK | Solder to SOT-23→DIP adapter for breadboard | LCSC / Elfa |
| **BC847** or **MMBT2222** SOT-23 | 2× NPN for USB auto-reset circuit | 10 | ~2 NOK | 2N2222 in TO-92 is drop-in for breadboarding | LCSC / Elfa |
| **ESP32-WROOM-32E** module | The MCU. Or keep using ESP32 DevKit for now. | ⚠️ 2 | ~80 NOK | Dev board (DevKit v1 style, ~150 NOK) IS the breadboard form. Get 1 spare. | Kjell / Mouser |

⚠️ **ESP32 module choice pending**: bare WROOM-32E on PCB vs. keep using a socketed DevKit? Affects footprint significantly. Decide before ordering.

---

## 2. Power system modules (already have most; get spares)

| Part | Purpose | Qty | Est/unit | Breadboardable? | Source |
|---|---|---|---|---|---|
| **DFR0559** Solar Power Manager 5V | Charger + boost (used as charger only in new design) | ⚠️ 1 spare | ~150 NOK | Yes | DFRobot / AliExpress |
| **DFR0563** Battery Gauge (MAX17043) | Fuel gauge | ⚠️ 1 spare | ~100 NOK | Yes | DFRobot / AliExpress |
| **FIT0601** Solar Panel 5V 1A | Solar input | ⚠️ 1 spare | ~150 NOK | Yes | DFRobot |
| **18650 cells** (Samsung 30Q / Sony VTC6 / LG HG2) | 1S3P battery pack | ⚠️ 6 (2 sets of 3) | ~80 NOK | Direct — need holder | Nkon.nl (EU, reputable) |
| **3-slot 18650 holder** (parallel wiring, JST-VH out) | Pack assembly | 2 | ~30 NOK | Direct | Kjell / Elfa / AliExpress |

**Nkon.nl** is the go-to EU 18650 source — verified cells, no counterfeits. Kjell doesn't stock high-drain 18650s.

---

## 3. Sensor modules (already deployed; get spares where cheap)

| Part | Purpose | Qty | Est/unit | Breadboardable? | Source |
|---|---|---|---|---|---|
| **BME280** breakout (I²C, 0x76) | Temp/humidity/pressure | 2 | ~40 NOK | Yes | Kjell / Elfa / AliExpress |
| **AHT20** breakout (I²C, 0x38) | Temp/humidity cross-check | 2 | ~25 NOK | Yes | AliExpress / Elfa |
| **BH1750** breakout (I²C, 0x23 + 0x5C) | Light — 2× (internal + external) | 3 | ~20 NOK | Yes | AliExpress / Elfa |
| **VL53L0X** breakout (I²C, 0x29) | Time-of-flight distance | 2 | ~40 NOK | Yes | Adafruit / Elfa / AliExpress |
| **DS18B20** waterproof (1-Wire) | Temp probes distributed in greenhouse | 4 | ~30 NOK | Yes | Kjell / AliExpress |
| **ADS1115** breakout (I²C ADC) | Extra analog inputs — per B6 default | 2 | ~30 NOK | Yes | Adafruit / Elfa / AliExpress |

⚠️ **Soil moisture sensors (A5 open)** — deferred until sensor type is decided. Current capacitive sensors are unreliable; considering Adafruit STEMMA (~80 NOK each, 3 needed) or gypsum blocks. Order after A5 is resolved.

---

## 4. Displays

| Part | Purpose | Qty | Est/unit | Breadboardable? | Source |
|---|---|---|---|---|---|
| **SSD1306 128×64 OLED I²C** (0x3C) | Primary status display | 2 | ~50 NOK | Yes | AliExpress / Elfa |
| **PCF8574 LCD 16×2 I²C** (0x27) | Secondary display | 2 | ~50 NOK | Yes | AliExpress / Elfa |

---

## 5. Passives — bulk (get once, use forever)

**Resistor kit** (1% 0603 SMD, E24 series, 100 pcs per value) — Elfa or AliExpress, ~200 NOK for a full kit. Alternatively, individual reels of values we know we need (below).

| Value | Purpose | Qty |
|---|---|---|
| 220 Ω | LED current-limit | 50 |
| 4.7 kΩ | I²C pull-ups, 1-Wire pull-up | 20 |
| 10 kΩ | Generic pull-up (MOSFET gates, reset lines) | 50 |
| 20 kΩ | LED indicator dim (per debug spec) | 10 |
| 100 kΩ | Voltage-divider high side for ADC rail sensing | 10 |
| Various (E12 series) | Voltage divider matching for `V5-`, `V3-` tokens | ← from kit |

**Capacitor kit** (X7R 0603 SMD, common values) — ~150 NOK. Or:

| Value | Purpose | Qty |
|---|---|---|
| 100 nF | Decoupling on every IC | 100 |
| 1 µF | LDO input | 20 |
| 10 µF | LDO output, USB VBUS bulk | 20 |
| 22 µF | ESP32 bulk decoupling near power pins | 10 |
| 4.7 µF | Miscellaneous | 20 |

**Through-hole versions of the above** for breadboarding — a small kit of leaded resistors + electrolytic caps (~50 NOK from Kjell) covers all breadboard work.

**LEDs** — 3 mm through-hole for enclosure-mounted indicators; 0603 SMD for on-board rail LEDs.

| Colour | Purpose | Qty |
|---|---|---|
| Green | BAT / MUX / 3V3 / SENSOR "rail up" | 15 (SMD) + 5 (3mm) |
| Red | CHG / warning / status | 10 (SMD) + 5 (3mm) |
| Yellow / Blue | Optional extra rail indicators | 10 SMD each |

---

## 6. Connectors

Per the "Connectors and wiring conventions" section in `NEW_PCB_DESIGN.md`.

| Part | Purpose | Qty |
|---|---|---|
| **JST-XH 2.5 mm 4-pin** through-hole right-angle | I²C sensor sockets | 20 (10 sockets + 10 plugs w/ pigtails) |
| **JST-XH 2.5 mm 3-pin** | 1-Wire, analog sensor sockets | 20 |
| **JST-VH 3.96 mm 2-pin** | Battery pack | 5 sockets + 5 plugs |
| **Screw terminal 2-pos, 3.5 mm pitch** | Solar panel input | 3 |
| **USB-C receptacle** SMD (16-pin or 24-pin) | Flashing + optional USB-IN for charger | 5 |
| **0.1" male header, 40-pin snappable** | ESP32 dev-board socket, debug header, generic pigtails | 5 strips |
| **0.1" female header, 40-pin snappable** | For sockets on the PCB (ESP32, module sockets if not solder-in) | 5 strips |
| **2×N 0.1" header** for the consolidated debug port | Rail probing | 2 |

**Pre-crimped JST-XH pigtails** in various lengths from AliExpress — much cheaper than crimping yourself, saves hours. ~30 NOK for a bundle of 20.

---

## 7. Buttons + buzzer

| Part | Purpose | Qty |
|---|---|---|
| **12 mm momentary tactile button** panel-mount | Wake (green), reset | 5 |
| **SPDT slide switch** panel-mount | POST-enable | 3 |
| **12 mm piezo buzzer** active, 3.3 V | Boot / sleep chirps | 3 |

Colour-coded button caps if the panel-mount buttons don't come pre-coloured — Kjell has these.

---

## 8. PCB prototyping supplies

| Part | Purpose | Qty |
|---|---|---|
| **Half-size breadboard** (400 tie-points) | Schematic block validation | 2 |
| **Full-size breadboard** (830 tie-points) | Full-system prototype | 1 |
| **Jumper wire kit** (M-M, M-F, F-F, ~120 pcs mixed) | Breadboarding | 1 |
| **Prototyping perfboard** (5 cm × 7 cm) | Wire-up of anything more permanent than breadboard | 5 |
| **SOT-23 → DIP adapter boards** | Breadboarding SMD MOSFETs / LDOs | 10 |
| **SOP-8 / SOP-16 → DIP adapter boards** | For TPS2113A, CH340C on breadboard | 5 each |
| **Small solder wire spool** (0.5 mm, leaded or lead-free per preference) | If you don't have | 1 |

Kjell covers most of this in one order. ~500 NOK for the whole prototyping kit.

---

## 9. LoRa / Meshtastic (new uplink path — see NEW_PCB_DESIGN.md § Radio/uplink and open question A8)

**Order this first, before committing to a PCB architecture** — need to verify Rødtangen's Meshtastic coverage before choosing between the three A8 topologies.

| Part | Purpose | Qty | Est/unit | Notes | Source |
|---|---|---|---|---|---|
| **Heltec WiFi LoRa 32 V3** | Coverage-test node — flash stock Meshtastic firmware, deploy in greenhouse for a week to measure how many public nodes are reachable and packet delivery rate. Also serves as reference hardware if we go A8-c (separate Meshtastic node UART-linked to our ESP32). | ⚠️ 1 (2 if going A8-c) | ~250 NOK | Includes ESP32-S3 + SX1262 + OLED + battery connector on one board. Direct EU shipping. | Heltec Automation EU distributor / Elfa / AliExpress |
| **SX1262 breakout** (Ebyte E22-900M22S, Adafruit RFM95W, or generic) | If we go A8-a or A8-b (SX1262 chip on our own PCB), get this to prototype before committing footprint | ⚠️ 2 | ~100 NOK | Different form factors; Ebyte is bare module, Adafruit is fully broken-out with easy pins | AliExpress / Adafruit |
| **868 MHz dipole antenna, SMA-M** | External antenna on the enclosure wall | 3 | ~30 NOK | ~86 mm length. Get spares. | AliExpress / Elfa |
| **SMA-F panel-mount to U.FL pigtail** | Bridge from SX1262 (U.FL) to enclosure-mounted SMA connector | 3 | ~15 NOK | Length: 10 cm sufficient for our enclosure size | AliExpress |
| **SMA-F panel-mount connector** (standalone) | If enclosure-side SMA isn't pre-installed on the pigtail | 3 | ~15 NOK | | Elfa / AliExpress |

**Sourcing tips:**
- **Heltec V3** ships direct from Heltec (Shenzhen) with reasonable EU delivery times (~2 weeks). Some Elfa/AliExpress resellers stock it faster.
- Buy 2 dipole antennas even if we only plan on 1 — cables and antenna threads are easy to damage.

## 10. Enclosure — deferred

A1 (enclosure) is unresolved. Once we decide 3D-print vs. off-the-shelf project box vs. laser-cut, the mechanical parts list gets its own section: box, cable glands / M8 connectors, mounting hardware, gaskets, transparent window / lens for displays and LEDs, shelf-underside bracket. **Do not order enclosure parts yet.**

---

## 11. ⚠️ Consult-first items (BOSS: nod before ordering)

Anything >50 NOK per unit or where quantities push it over:

- **ESP32 modules or DevKits** — decision on integration vs socketed pending
- **DFR0559 spare** (~150 NOK) — worth having a backup?
- **DFR0563 spare** (~100 NOK) — same
- **Solar panel spare** (~150 NOK) — probably yes
- **18650 cells** — 4 pieces at ~€6.45 (LG MJ1 unprotected) or ~€9.75 (Keeppower LT protected); buy from Nkon.nl
- **Soil moisture sensor decision + 3 pieces** — depends on A5
- **Heltec V3 for Meshtastic coverage test** (~250 NOK) — order 1 first; if A8-c is chosen, order a second as the permanent modem

Everything else in the list is cheap enough (mostly <20 NOK/unit) to order at the slack quantities suggested without further discussion.

---

## 12. Rough total budget

- Passives + connectors + prototyping supplies: **~800 NOK**
- Core ICs (in slack quantities): **~400 NOK**
- Sensor modules (with spares): **~500 NOK**
- Displays (with spares): **~200 NOK**
- Power system spares (DFR modules + solar panel): **~400 NOK**
- 18650 cells (6): **~500 NOK**
- **Subtotal**: ~2800 NOK
- **Shipping / customs / VAT**: add ~30% if mixing suppliers, ~10% if bundling well
- **Grand total ballpark**: **~3500 NOK** for a full parts set with slack

Enclosure adds separately (~500–1500 NOK depending on choice).

---

## Suggested ordering strategy

1. **Order 1 — Heltec V3 (~2 weeks from Heltec or ~1 week from EU reseller)**: **do this first** — one Heltec V3 for the Meshtastic coverage test. Verify Rødtangen coverage before locking A8 architecture. Long delivery time means it should be the first click.
2. **Order 2 (Kjell, Norwegian, 2-day delivery)**: breadboards, jumper wires, prototyping perfboard, USB cables, 3 mm LEDs, tactile buttons — everything to start breadboarding this week.
3. **Order 3 (Elfa Distrelec or Mouser, ~5 days)**: bulk passives (resistor + cap kits), core ICs (AP2112K, TPS2113A, MOSFETs), connectors, breakouts for SMD parts. Solders together a full breadboardable stack.
4. **Order 4 (Nkon.nl, ~5 days EU)**: 18650 cells + holders — separate to avoid mixing with electronics customs.
5. **Order 5 (DFRobot or AliExpress, ~2 weeks)**: DFR module spares, sensor breakouts, displays, SX1262 breakouts, 868 MHz antennas + pigtails. Slow ship, cheap.
6. **Order 6 (later, after A5 decides)**: soil moisture sensors.
7. **Order 7 (later, after A1 decides)**: enclosure + mounting hardware.

Splitting like this lets you (a) start Meshtastic coverage testing as soon as the Heltec arrives, (b) start breadboarding within days of Order 2, without waiting on the slow shipments.

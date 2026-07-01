# Solar Charging Issue — What to Check

## Context

- Solar charging stopped working **before** the board fell.
- USB charging worked fine — but only while the case was closed and pressing on the wires.
- After the board fell, the **leftmost 2 wires going into the "Charger" port** broke loose.
- These wires connect: `Charger pin 0/1` ↔ `Gauge pin 0/1` (BAT+ / BAT−).
- They are hand-soldered, so a cold/intermittent joint is the prime suspect.

## Hypothesis

The hand-soldered BAT+/BAT− wires between the **Charger** header (DFR0559) and the **Gauge** header (DFR0563) have a bad joint. Pressure from the closed case held them together well enough for USB current (small, intermittent), but the higher/continuous current path from the DFR0559 to the battery for solar charging never had a clean connection.

## Wire map (from Fritzing `all_on_one_with_usb_1.3.fzz`)

| Net | Charger pin | Bat pin | Gauge pin |
|-----|-------------|---------|-----------|
| BAT+ | 0 | 0 | 0 (B+) |
| BAT− | 1 | 1 | 1 (B−) |

All three headers should be on the same net. Fritzing shows PCB traces on the bottom copper layer, but the broken wires suggest the design may rely on the hand-soldered jumpers instead.

## Checks (in order)

1. **Visual inspection** of all 4 solder joints on the 2 wires (both ends — Charger side and Gauge side). Look for:
   - Dull/cracked solder (cold joint)
   - Wire strands not fully embedded
   - Lifted pads

2. **Continuity test** (multimeter, board powered off):
   - Charger pin 0 ↔ Bat pin 0 → expect 0 Ω
   - Charger pin 1 ↔ Bat pin 1 → expect 0 Ω
   - Charger pin 0 ↔ Gauge pin 0 → expect 0 Ω
   - Charger pin 1 ↔ Gauge pin 1 → expect 0 Ω
   - If any read open, that's your culprit — re-solder.

3. **Resolder both wires fresh.** Even if they look fine. Use enough heat to fully wet both pad and wire strands. Confirm continuity after.

4. **Polarity check before powering up:** confirm Charger pin 0 → Gauge pin 0 and Charger pin 1 → Gauge pin 1 (don't cross them).

5. **Live solar test** (multimeter, board powered, panel in sunlight):
   - Voltage on DFR0559 solar input → should be > 5 V
   - Voltage across battery terminals → should be rising slowly while charging
   - DFR0559 charging LED → should be lit

6. **If solar still won't charge after the above**, look beyond these wires:
   - DFR0559 solar input solder joints
   - Solar panel wires themselves (check open-circuit voltage at the panel in sun)
   - DFR0559 module itself (try a known-good one)

## Files / references

- Fritzing project: `/Users/fmr/projects/fritzing/all_on_one_with_usb_1.3.fzz`
- Charger module: DFR0559 Solar Power Manager 5V
- Gauge module: DFR0563 Gravity I²C 3.7 V Li Battery Fuel Gauge

# Drimon PCB v2 — Design Workspace

Working directory for the next-revision PCB design. Started August 2026 as a clean-sheet redesign to replace the v1.2 board (which dies in prolonged low-solar periods and requires enclosure disassembly to flash).

**Status**: brainstorming in progress. Locked decisions and open questions are tracked in [`NEW_PCB_DESIGN.md`](NEW_PCB_DESIGN.md).

## Files

| File | Purpose |
|---|---|
| [`NEW_PCB_DESIGN.md`](NEW_PCB_DESIGN.md) | Single source of truth for the design — purpose, sensor set, locked decisions, sensor placement, open questions. Read this first. |
| [`pcb_prompt.txt`](pcb_prompt.txt) | Self-contained resume prompt. Paste into a fresh Claude Code / chat session to pick up the design work where the last session left off. |
| [`old/`](old/) | Reference artefacts from the current v1.2 board (Aisler etching preview, exported netlist, live-setup photos). Context only — not a template for the new design. |

## How to use this directory

**To resume the design work**: open a fresh Claude session in the repo root and paste the contents of `pcb_prompt.txt`. That prompt tells the assistant to read `NEW_PCB_DESIGN.md`, walk the still-open questions in the right order (defaults first, then architectural), and update the design brief as decisions land.

**To see current design state**: read `NEW_PCB_DESIGN.md`. Its structure is stable: `Purpose → Sensor set → Locked decisions → Sensor placement → Open questions (A architectural, B defaults) → Reference → v1.2 lessons appendix`.

**To understand the v1.2 board being replaced**: browse `old/` — the Aisler preview shows the manufactured PCB, the netlist exposes the wiring bugs found during audit (SCL trace cut, disjoint 5 V nets), and the photos show the deployed enclosure.

## Constraints and hard rules for the new design

Copied here for quick reference; authoritative version is in [`NEW_PCB_DESIGN.md`](NEW_PCB_DESIGN.md):

- **Fab house**: Aisler (6 mil / 0.15 mm min trace, 0.4 mm min drill, 2-layer FR4).
- **EDA tool**: KiCad. Fritzing is not to be used.
- **Sensor set carries forward** from v1.2 (the firmware stays essentially unchanged); every other aspect of the physical design is open for redesign.
- **I²C socket pinout** is locked to `SDA – SCL – VCC – GND` so existing sensor plugs carry over.
- **This is a hardware-design session only** — do not touch firmware during it.

## Related

- Firmware that must be supported: [`../20240724_drimon_1_3/`](../20240724_drimon_1_3/)
- Current hardware documentation: [`../documentation/HARDWARE.md`](../documentation/HARDWARE.md)
- Project overview: [`../README.md`](../README.md)

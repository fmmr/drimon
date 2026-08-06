#!/usr/bin/env bash
# flash.sh — compile the drimon sketch and upload it to the ESP32 in one step.
# The prebuild hook (platform.local.txt) runs gen_version.sh first, which refuses to compile when
# the sketch folder is dirty (unless ALLOW_DIRTY_FLASH=1) — so committing before flashing is
# enforced.
set -euo pipefail

cd "$(dirname "$0")"

# See compile.sh for what each option means. Kept identical so a plain compile and a flash produce
# the same binary.
FQBN='esp32:esp32:esp32:CPUFreq=240,DebugLevel=none,EraseFlash=none,EventsCore=1,FlashFreq=80,FlashMode=qio,FlashSize=4M,JTAGAdapter=default,LoopCore=1,PartitionScheme=default,PSRAM=disabled,UploadSpeed=115200,ZigbeeMode=default'

# Serial port the ESP32 shows up on. Change if you plug into a different USB slot.
PORT='/dev/cu.usbserial-10'

# Two-stage filter mirrors compile.sh (see comment there) but adds esptool upload-phase keywords
# (Uploading/Connecting/Chip/Writing/Wrote/Hash/Hard resetting/Auto-detected/Serial port/MAC/
# esptool/Leaving) to the keep pattern so upload progress stays visible.
arduino-cli compile --upload -v --fqbn "$FQBN" --port "$PORT" "$@" . 2>&1 \
    | grep -E '^(Compiling|Linking|Using|Sketch uses|Global variables|Detecting|In file included|Uploading|Connecting|Chip|Writing|Wrote|Hash|Hard resetting|Auto-detected|Serial port|MAC|esptool|Leaving|gen_version\.sh|version\.h updated)|(error|warning|note):|^\s+[0-9]+ \||^\s+\|' \
    | grep -vE '^Using (cached library dependencies|previously compiled file)'

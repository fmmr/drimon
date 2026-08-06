#!/usr/bin/env bash
# compile.sh — compile the drimon sketch via arduino-cli.
# FQBN + all Tools-menu options mirror the Arduino IDE settings 1:1 so the resulting binary is
# byte-identical to what the IDE produces (as of 2026-08-06). The prebuild hook in
# platform.local.txt still fires, so gen_version.sh runs and the dirty-check safeguard applies.
set -euo pipefail

cd "$(dirname "$0")"

# Board = ESP32 Dev Module. Options (name = value from IDE Tools menu):
#   CPUFreq=240             "240MHz (WiFi/BT)"
#   DebugLevel=none         "Core Debug Level: None"
#   EraseFlash=none         "Erase All Flash Before Sketch Upload: Disabled"
#   EventsCore=1            "Events Run On: Core 1"
#   FlashFreq=80            "Flash Frequency: 80MHz"
#   FlashMode=qio           "Flash Mode: QIO"
#   FlashSize=4M            "Flash Size: 4MB (32Mb)"
#   JTAGAdapter=default     "JTAG Adapter: Disabled"
#   LoopCore=1              "Arduino Runs On: Core 1"
#   PartitionScheme=default "Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)"
#   PSRAM=disabled          "PSRAM: Disabled"
#   UploadSpeed=115200      "Upload Speed: 115200"  ← keep low; higher rates fail on this board.
#   ZigbeeMode=default      "Zigbee Mode: Disabled"
FQBN='esp32:esp32:esp32:CPUFreq=240,DebugLevel=none,EraseFlash=none,EventsCore=1,FlashFreq=80,FlashMode=qio,FlashSize=4M,JTAGAdapter=default,LoopCore=1,PartitionScheme=default,PSRAM=disabled,UploadSpeed=115200,ZigbeeMode=default'

arduino-cli compile -v --fqbn "$FQBN" "$@" . 2>&1 | grep -E '^(Compiling|Linking|Using|Sketch uses|Global variables|Detecting|In file included)|(error|warning|note):|^\s+[0-9]+ \||^\s+\|'
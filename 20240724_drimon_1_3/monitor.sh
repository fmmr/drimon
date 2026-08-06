#!/usr/bin/env bash
# monitor.sh — attach to the ESP32 serial output (equivalent to Arduino IDE's Serial Monitor).
# Baud matches SERIAL_BAUD in the sketch (115200). Ctrl-C to detach.
set -euo pipefail

PORT='/dev/cu.usbserial-10'
BAUD='115200'

arduino-cli monitor --port "$PORT" --config "baudrate=$BAUD"

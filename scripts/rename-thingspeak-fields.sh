#!/usr/bin/env bash
# Rename all fields on the 4 DriMon ThingSpeak channels to match reality.
# Field names on ThingSpeak had drifted (mostly bare units, a few stale
# labels from removed firmware paths) — this re-syncs them.
#
# The channels live in two ThingSpeak accounts, so two User API Keys are
# needed. Get each from Account → My Profile after logging in to that
# account. These are NOT channel Write API Keys.

# ─── EDIT THESE, then run: bash scripts/rename-thingspeak-fields.sh ───
# WARNING: do not commit this file with real keys — revert to PASTE_HERE
#          (or wipe with `git checkout -- scripts/rename-thingspeak-fields.sh`)
#          before staging.
USER_KEY_MAIN="CHANGE_ME"   # owns 2568299 (DRIVHUS), 2584547 (TECH), 2584548 (TEMP)
USER_KEY_EXT="CHANGE_ME"    # owns 2626867 (EXT)
# ──────────────────────────────────────────────────────────────────────

set -euo pipefail

for k in USER_KEY_MAIN USER_KEY_EXT; do
    if [[ "${!k}" == "PASTE_HERE" ]]; then
        echo "error: paste the User API Key into $k at the top of this script" >&2
        exit 1
    fi
done

rename() {
    local channel=$1 label=$2 key=$3 ; shift 3
    echo "== $label ($channel) =="
    local -a args=(-sS -o /tmp/ts_rename_body -w "%{http_code}"
                   -X PUT "https://api.thingspeak.com/channels/$channel.json"
                   --data-urlencode "api_key=$key")
    local i=1
    for name in "$@"; do
        args+=(--data-urlencode "field$i=$name")
        printf "  field%d = %s\n" "$i" "$name"
        i=$((i+1))
    done
    local http
    http=$(curl "${args[@]}")
    if [[ "$http" == "200" ]]; then
        # ThingSpeak returns the channel JSON on success — spot-check field1 to make sure the write actually took.
        local now
        now=$(python3 -c "import json,sys; print(json.load(open('/tmp/ts_rename_body')).get('field1',''))")
        echo "  ok (HTTP 200) — field1 now: \"$now\""
    else
        echo "  FAILED (HTTP $http) — body:"
        sed 's/^/    /' /tmp/ts_rename_body
        echo "  → the key you used probably lacks permission. This endpoint needs the account's User API Key (Account → My Profile), not a channel Write API Key."
        return 1
    fi
}

rename 2568299 "DRIVHUS" "$USER_KEY_MAIN" \
    "temperature (°C)" \
    "humidity (%)" \
    "RSSI (dBm)" \
    "window distance (mm)" \
    "battery voltage (V)" \
    "battery (%)" \
    "pressure (hPa)" \
    "lux ceiling"

rename 2584547 "DRIVHUS_TECH" "$USER_KEY_MAIN" \
    "RSSI (dBm)" \
    "battery voltage (V)" \
    "battery (%)" \
    "wake time (ms)" \
    "lux internal" \
    "(unused)" \
    "(unused)" \
    "(unused)"

rename 2584548 "DRIVHUS_TEMP" "$USER_KEY_MAIN" \
    "BME280 temp (°C)" \
    "AHT20 temp (°C)" \
    "DS18B20 1 (°C)" \
    "DS18B20 2 (°C)" \
    "DS18B20 3 (°C)" \
    "soil 1 (%)" \
    "soil 2 (%)" \
    "soil 3 (%)"

rename 2626867 "DRIVHUS_EXT" "$USER_KEY_EXT" \
    "MET temp (°C)" \
    "MET humidity (%)" \
    "temp diff (°C)" \
    "humidity diff (%)" \
    "wind (m/s)" \
    "precipitation (mm/h)" \
    "apparent temp (°C)" \
    "UV index"

echo
echo "verify:"
for id in 2568299 2584547 2584548 2626867; do
    echo "  https://thingspeak.com/channels/$id"
done

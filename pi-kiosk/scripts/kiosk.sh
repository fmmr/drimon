#!/usr/bin/env bash
# Simple kiosk script - starts Chromium with 2 tabs

export DISPLAY=:0

# Wait for X server
while ! xdpyinfo >/dev/null 2>&1; do sleep 1; done

# Wait a bit more for X server to be fully ready
sleep 3

# Setup screen blanking - 20 seconds (retry until it works)
for i in {1..5}; do
    xset s on && xset s blank && xset s 20 20 && xset +dpms && xset dpms 0 0 20
    # Check if it worked
    if xset q | grep -q "prefer blanking:  yes"; then
        echo "Screen saver configured successfully"
        break
    fi
    echo "Retry $i: X server not ready for xset commands"
    sleep 2
done

# Hide mouse cursor
unclutter -idle 1 -root &

# Clean Chromium preferences
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences 2>/dev/null || true
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences 2>/dev/null || true

# Start Chromium with both tabs
chromium-browser --start-fullscreen --noerrdialogs --disable-infobars \
  'https://drimon.rodland.no/' \
  'https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell/1-60206/Norge/Akershus/Asker/R%C3%B8dtangen'
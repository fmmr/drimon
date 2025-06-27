#!/usr/bin/env bash
# Tab cycling with smart idle detection

export DISPLAY=:0
ACTIVITY_FILE="/tmp/kiosk_activity"
IDLE_TIMEOUT=45

# Handle shutdown signals gracefully
trap 'echo "Tab cycling shutting down"; exit 0' TERM INT

# Monitor touchscreen in background
(while true; do
    timeout 1 cat /dev/input/event4 > /tmp/touch_data 2>/dev/null
    if [ -s /tmp/touch_data ]; then
        touch $ACTIVITY_FILE
        > /tmp/touch_data
    fi
    sleep 1
done) &

# Initialize activity tracking right before cycling starts
touch $ACTIVITY_FILE

# Tab cycling loop
while true; do
    # Wait for Chromium to be running
    while ! pgrep -f chromium >/dev/null; do
        sleep 5
    done
    
    # Check if user has been idle
    activity_age=$(($(date +%s) - $(stat -c %Y $ACTIVITY_FILE 2>/dev/null || echo 0)))
    
    if [ $activity_age -gt $IDLE_TIMEOUT ]; then
        # User idle - switch to tab 1 (drimon) once, then wait for activity
        if [ ! -f /tmp/kiosk_idle_state ]; then
            xdotool key ctrl+1
            touch /tmp/kiosk_idle_state
        fi
        # Wait and check for new activity
        sleep 5
        continue
    else
        # User active - remove idle state marker and resume cycling
        rm -f /tmp/kiosk_idle_state
    fi
    
    # User active - do tab cycling
    xdotool key ctrl+1  # Drimon tab
    sleep 10
    xdotool key ctrl+2  # Weather tab
    sleep 3
done
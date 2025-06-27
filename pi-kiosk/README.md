# Pi Kiosk Setup

Complete kiosk setup for Raspberry Pi displaying DriMon dashboard with intelligent tab cycling and power management.

## Features

- **Auto-start**: Chromium opens fullscreen with DriMon dashboard and weather forecast
- **Smart cycling**: Switches between tabs (10s drimon, 3s weather) when user is active
- **Intelligent idle detection**: Stops cycling after 45s of no touch activity 
- **Power management**: Screen blanks 20s after cycling stops (65s total from last touch)
- **Touch resume**: Tab cycling resumes immediately when screen is touched
- **Remote control**: Web-based shutdown/reboot buttons accessible from dashboard

## Quick Start

1. **Copy files to Pi:**
```bash
scp -r pi-kiosk/ pi@your-pi-ip:~/
```

2. **Install (one command):**
```bash
ssh pi@your-pi-ip "cd ~/pi-kiosk && ./install.sh"
```

3. **Reboot when prompted** - system is ready!

## What Gets Installed

**Packages:**
- `chromium-browser` - Web browser for kiosk display
- `nodm` - Auto-login display manager 
- `unclutter` - Hides mouse cursor
- `xdotool` - Keyboard automation for tab switching

**Services:**
- `kiosk.service` - Starts Chromium with screen saver config
- `tab-cycling.service` - Intelligent tab cycling with touch detection  
- `shutdown.service` - Web server (port 9999) for remote shutdown/reboot

**Configuration:**
- Auto-login setup for kiosk user
- Touchscreen input permissions
- Sudo permissions for passwordless shutdown
- WiFi power management disabled (prevents connection drops)
- Screen saver: 20s timeout after keystrokes stop

## File Structure

```
pi-kiosk/
├── install.sh                    # Complete setup script
├── scripts/
│   ├── kiosk.sh                 # Chromium startup with screen saver config
│   ├── tab-cycling.sh           # Smart tab cycling with touch detection
│   └── shutdown_service.py      # HTTP server for shutdown/reboot
├── systemd/                     # User systemd service definitions
│   ├── kiosk.service
│   ├── tab-cycling.service
│   └── shutdown.service
└── README.md                    # This file
```

## Behavior Timeline

1. **Boot**: Auto-login → desktop starts → services launch
2. **0s**: Chromium opens with both tabs, tab cycling begins immediately
3. **45s**: After no touch activity → switches to drimon tab, stops cycling
4. **65s**: Screen blanks (20s after cycling stopped)
5. **Touch**: Screen wakes → tab cycling resumes within seconds

## Testing & Troubleshooting

**Manual testing:**
```bash
# Test shutdown service
curl -X POST http://localhost:9999/shutdown
curl -X POST http://localhost:9999/reboot

# Check service status
systemctl --user status kiosk.service tab-cycling.service shutdown.service

# Monitor idle timer (should count up when not cycling)
while true; do xprintidle; sleep 5; done
```

**Common issues:**
- **No auto-start**: Check `systemctl status nodm`
- **Services not starting**: Run `./install.sh` again
- **No tab cycling**: Check touchscreen device exists: `ls /dev/input/event*`
- **Screen not blanking**: Verify xset config: `xset q | grep "Screen Saver"`

## Updates

- **Script changes only**: Reboot Pi
- **Service changes**: Re-run `./install.sh`
- **Fresh install**: `./install.sh` handles cleanup automatically

## Requirements

- Raspberry Pi with touchscreen
- Raspberry Pi OS (tested on Bookworm)
- Network connection for dashboard access
- User with sudo privileges
# Pi Kiosk Setup

Complete kiosk setup for Raspberry Pi displaying the DriMon dashboard.

## Features

- **Auto-start**: Chromium opens fullscreen with the DriMon dashboard
- **Power management**: Screen blanks 60s after last input
- **Touch resume**: Screen wakes when touched
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

**Services:**
- `kiosk.service` - Starts Chromium with screen saver config
- `shutdown.service` - Web server (port 9999) for remote shutdown/reboot

**Configuration:**
- Auto-login setup for kiosk user
- Sudo permissions for passwordless shutdown
- WiFi power management disabled (prevents connection drops)
- Screen saver: 60s timeout after keystrokes stop

## File Structure

```
pi-kiosk/
├── install.sh                    # Complete setup script
├── scripts/
│   ├── kiosk.sh                 # Chromium startup with screen saver config
│   └── shutdown_service.py      # HTTP server for shutdown/reboot
├── systemd/                     # User systemd service definitions
│   ├── kiosk.service
│   └── shutdown.service
└── README.md                    # This file
```

## Behavior Timeline

1. **Boot**: Auto-login → desktop starts → services launch
2. **0s**: Chromium opens fullscreen with the DriMon dashboard
3. **60s**: Screen blanks after last input
4. **Touch**: Screen wakes

## Testing & Troubleshooting

**Manual testing:**
```bash
# Test shutdown service
curl -X POST http://localhost:9999/shutdown
curl -X POST http://localhost:9999/reboot

# Check service status
systemctl --user status kiosk.service shutdown.service
```

**Common issues:**
- **No auto-start**: Check `systemctl status nodm`
- **Services not starting**: Run `./install.sh` again
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
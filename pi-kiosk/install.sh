#!/bin/bash
# Pi Kiosk Setup - Clean install
# Run this after copying pi-kiosk directory to your Pi

set -e

KIOSK_DIR="$HOME/pi-kiosk"
USER=$(whoami)

echo "============================================"
echo "Setting up Pi Kiosk"
echo "============================================"

# Verify we're in the right directory
if [ ! -d "$KIOSK_DIR" ]; then
    echo "Error: $KIOSK_DIR not found!"
    echo "Make sure you've copied the pi-kiosk directory to your home folder"
    exit 1
fi

cd "$KIOSK_DIR"

echo "1. Cleaning up old services..."
systemctl --user stop kiosk.service 2>/dev/null || true
systemctl --user stop tab-cycling.service 2>/dev/null || true
systemctl --user stop shutdown.service 2>/dev/null || true
systemctl --user stop shutdown-service.service 2>/dev/null || true
systemctl --user disable kiosk.service 2>/dev/null || true
systemctl --user disable tab-cycling.service 2>/dev/null || true
systemctl --user disable shutdown.service 2>/dev/null || true
systemctl --user disable shutdown-service.service 2>/dev/null || true

# Remove old service files
rm -f ~/.config/systemd/user/shutdown-service.service

echo "2. Setting up file permissions..."
chmod +x scripts/kiosk.sh
chmod +x scripts/tab-cycling.sh
chmod +x scripts/shutdown_service.py

echo "3. Setting up sudo permissions for shutdown..."
echo "$USER ALL=(ALL) NOPASSWD: /sbin/shutdown" | sudo tee /etc/sudoers.d/kiosk-shutdown
sudo chmod 440 /etc/sudoers.d/kiosk-shutdown

echo "4. Adding user to input group for touchscreen access..."
sudo usermod -a -G input $USER

echo "5. Installing systemd services..."
mkdir -p ~/.config/systemd/user/

# Install all services
cp systemd/kiosk.service ~/.config/systemd/user/
cp systemd/tab-cycling.service ~/.config/systemd/user/
cp systemd/shutdown.service ~/.config/systemd/user/

echo "6. Installing required packages..."
if command -v nodm >/dev/null 2>&1 && command -v chromium-browser >/dev/null 2>&1; then
    echo "Required packages already installed"
else
    echo "Installing nodm, chromium, and tools..."
    sudo apt update
    sudo apt install -y nodm unclutter xdotool chromium-browser
fi

# Configure nodm for auto-login
echo "NODM_ENABLED=true" | sudo tee /etc/default/nodm
echo "NODM_USER=$USER" | sudo tee -a /etc/default/nodm

# Disable lightdm if it exists
sudo systemctl disable lightdm 2>/dev/null || true
sudo systemctl enable nodm

echo "7. Disabling WiFi power management..."
if command -v iwconfig >/dev/null 2>&1; then
    sudo iwconfig wlan0 power off 2>/dev/null || true
    # Add to rc.local for persistence
    if [ -f /etc/rc.local ]; then
        if ! grep -q "iwconfig wlan0 power off" /etc/rc.local; then
            sudo sed -i '/exit 0/i iwconfig wlan0 power off 2>/dev/null || true' /etc/rc.local
        fi
    fi
fi

echo "8. Starting services..."
systemctl --user daemon-reload
systemctl --user enable kiosk.service
systemctl --user enable tab-cycling.service
systemctl --user enable shutdown.service

echo ""
echo "============================================"
echo "✓ Installation complete!"
echo "============================================"
echo ""
echo "Services installed:"
echo "- kiosk.service: Starts Chromium"
echo "- tab-cycling.service: Cycles between tabs"  
echo "- shutdown.service: Web server for shutdown/reboot"
echo ""
echo "After reboot:"
echo "- Desktop will auto-start"
echo "- Chromium will open with 2 tabs"
echo "- Tab cycling stops after 45s of inactivity"
echo "- Screen blanks after 20s more (65s total)"
echo "- Touch screen resumes cycling"
echo ""
echo "Ready to reboot? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Rebooting in 3 seconds..."
    sleep 3
    sudo reboot
else
    echo "Reboot manually when ready: sudo reboot"
fi
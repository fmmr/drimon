# DriMon - Drivhus Monitor

![logo](/docs/logos/1_1000x550.webp)

DriMon is a comprehensive greenhouse monitoring system that combines ESP32-based sensor hardware with a web-based visualization platform. The system provides real-time and historical data about greenhouse conditions at Rødtangen, Norway, enabling smart monitoring and analysis of plant growth environments.

## Quick Links

- [Live Dashboard](https://drimon.rodland.no/) - Real-time charts and data visualization
- [ThingSpeak Channel 1](https://thingspeak.com/channels/2568299) - Main environmental data
- [ThingSpeak Channel 2](https://thingspeak.com/channels/2584548) - Plant monitoring data
- [ThingSpeak Channel 3](https://thingspeak.com/channels/2584547) - System performance data

## Key Features

### Environmental Monitoring
- **Multi-point Temperature**: Ambient, soil, and plant-specific measurements
- **Climate Tracking**: Humidity, air pressure, and light intensity
- **Soil Monitoring**: Multiple moisture sensors for different plants
- **Window Status**: Distance-based opening detection
- **Weather Integration**: YR.no forecasts with comparative analysis

### Data Visualization
- **Interactive Charts**: Time-series data with statistical analysis
- **Multi-series Visualization**: Combined data from related sensors
- **Statistical Indicators**: Min/max/average calculations with visual markers
- **Smart Date Ranges**: Customizable time periods with chart-specific defaults
- **Cross-chart Synchronization**: Coordinated tooltips across related measurements

### System Architecture
- **Solar Powered**: Energy-efficient monitoring with battery backup
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Multi-language Support**: Norwegian, English, and Spanish translations
- **Theme Options**: Light/dark mode with system preference detection
- **Offline Capabilities**: Local caching and connectivity monitoring

## Hardware Components

The system uses ESP32 microcontrollers with a comprehensive array of sensors:

- **Environmental Sensors**: BME280 (temperature, humidity, pressure), AHT20 (precision temp/humidity)
- **Light Measurement**: BH1750 sensors for ceiling and internal light levels
- **Soil Monitoring**: Capacitive moisture sensors, DS18B20 temperature probes
- **Position Sensing**: VL53L0X Time-of-Flight distance sensor for window opening
- **Power Management**: Solar charging with LiPo battery and fuel gauge monitoring
- **Local Display**: OLED and LCD screens for on-site readings

All components are integrated on a custom PCB with optimized power management for long-term operation.

## Documentation

- [Project Overview](documentation/DRIMON.md) - Complete system description with hardware and software details
- [Development Guide](documentation/DEVELOPMENT.md) - Architecture, components, and code organization
- [Future Enhancements](documentation/FUTURE.md) - Completed features and planned improvements

## Getting Started

### Web Dashboard

The web interface can be previewed locally using any static file server:

```bash
# Using Python
python -m http.server

# Or using Node.js
npx serve
```

### Hardware Development

The Arduino code for the ESP32 is organized into multiple files:

- `20240724_drimon_1_3.ino`: Main entry point and initialization
- `3_setup.ino`: Sensor and connectivity setup
- `4_met.ino`: Weather API integration
- `5_measure.ino`: Sensor measurement routines
- `7_display.ino`: OLED and LCD display handling
- `8_sleep.ino`: Power management and deep sleep
- `9_thingspeak.ino`: Data transmission to cloud storage
- `sensordata.h`: Data structure definitions

### Configuration

Before compiling the Arduino code, you need to create a `secrets.h` file in the same directory with your specific configuration values:

```cpp
#ifndef SECRETS_H
#define SECRETS_H

// WiFi credentials
#define WIFI_SSID "YourWiFiNetworkName"
#define WIFI_PASSWORD "YourWiFiPassword"

// ThingSpeak Channel 1 - Main environmental data
#define THINGSPEAK_1_CHANNEL 2568299
#define THINGSPEAK_1_API "YOUR_16_CHAR_API_KEY"

// ThingSpeak Channel 2 - Plant monitoring data
#define THINGSPEAK_2_CHANNEL 2584548
#define THINGSPEAK_2_API "YOUR_16_CHAR_API_KEY"

// ThingSpeak Channel 3 - System performance data
#define THINGSPEAK_3_CHANNEL 2584547
#define THINGSPEAK_3_API "YOUR_16_CHAR_API_KEY"

#endif
```

Replace the placeholder values with:
- Your WiFi network name and password
- Your ThingSpeak write API keys (16-character strings from your ThingSpeak account)

The channel numbers are already configured for the DriMon system's public channels.

## System Architecture

The DriMon system consists of three main components:

### 1. Sensor Hardware
ESP32-based monitoring stations with multiple sensors, solar power, and local displays. The firmware implements sophisticated power management with adaptive sleep cycles based on light conditions.

### 2. Data Storage
ThingSpeak channels organize the data into logical groups:
- **Channel 1**: Main environmental readings
- **Channel 2**: Plant-specific monitoring
- **Channel 3**: System performance metrics

### 3. Web Visualization
A modern, responsive web interface built with:
- **Chart.js**: Interactive data visualization
- **Vanilla JavaScript**: Component-based architecture with no framework dependencies
- **Responsive Design**: Optimized for all device sizes
- **Internationalization**: Custom i18n system

## Power Management

The system implements sophisticated power conservation:

- **Solar Charging**: Primary power source with 5V solar panel
- **Battery Backup**: 3.7V LiPo with charge level monitoring
- **Adaptive Sleep**: Variable cycles based on light conditions
  - Night: 900 second intervals
  - Dusk/Dawn: 420 second intervals
  - Day: 600 second intervals
- **Sensor Power Control**: Selective power to sensors to minimize consumption

## Data Analysis

The dashboard provides advanced data analysis features:

- **Statistical Calculations**: Min/max/average values for all measurements
- **Visual Indicators**: Statistical markers on charts
- **Time Range Selection**: Customizable periods from 24 hours to 30 days
- **Synchronized Tooltips**: Related measurements shown together
- **Weather Comparison**: Indoor vs. outdoor conditions

## Future Development

Planned enhancements include:

- Webcam integration with time-lapse capabilities
- Automated watering system based on soil moisture
- Advanced analytics for plant growth optimization
- Mobile app with push notifications
- Machine learning for predictive maintenance

For a complete list of planned features, see the [Future Enhancements](documentation/FUTURE.md) document.

## License

This project is open source and available under the terms specified in the [LICENSE](LICENSE) file.

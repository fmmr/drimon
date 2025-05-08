# DriMon - Drivhus Monitor

![logo](/docs/logos/1_1000x550.webp)

DriMon is a web-based visualization platform for monitoring a greenhouse at Rødtangen, Norway. It displays sensor data from a network of ESP32-based monitoring systems installed during summer 2024.

## Quick Links

- [Live Dashboard](https://drimon.rodland.no/) - Real-time charts and data
- [ThingSpeak](https://thingspeak.com/channels/2568299) - Raw data storage

## Key Features

- **Real-time Monitoring**: Temperature, humidity, pressure, light, soil moisture, window status
- **Interactive Charts**: Time-series data with statistics (min/max/avg)
- **Mobile-Optimized**: Responsive design for all devices
- **Weather Integration**: YR.no forecast data
- **Multi-language**: Norwegian, English, Spanish support
- **Dark Mode**: Toggleable theme

## Documentation

- [Project Overview](/documentation/DRIMON.md) - Complete description of hardware and software
- [Development Guide](/documentation/DEVELOPMENT.md) - Architecture, components, and code organization
- [Testing Guidelines](/documentation/TESTING.md) - Manual testing procedures and best practices
- [Future Enhancements](/documentation/FUTURE.md) - Planned features and improvements
- [Refactoring Plan](/documentation/REFACTORING_PLAN.md) - Code refactoring roadmap

## Getting Started

To run the project locally:

```bash
# Using Python
python -m http.server

# Or using Node.js
npx serve
```

## Project Components

- **Hardware**: ESP32-based sensors with solar power and battery backup
- **Data Storage**: ThingSpeak channels for time-series data
- **Web Visualization**: Chart.js-based dashboard with responsive design
/**
 * Constants for the DriMon application
 * 
 * Centralized configuration values used across multiple modules
 */

// Geographic coordinates for Rødtangen, Norway
window.LOCATION = {
    // Røtangen coordinates
    LAT: 59.532213,
    LON: 10.418231,
    NAME: 'Rødtangen'
};

// ThingSpeak channel IDs and labels
window.THINGSPEAK = {
    CHANNELS: {
        DRIMON_CHANNEL: {
            // Main channel with temperature, humidity, window, battery, pressure, light
            id: 2568299,
            label: 'M',
            translationKey: 'drimonChannel'
        },
        EXT_CHANNEL: {
            // Channel with external weather data
            id: 2626867,
            label: 'E',
            translationKey: 'extChannel'
        },
        TECH_CHANNEL: {
            // Channel with system monitoring data
            id: 2584547,
            label: 'TX',
            translationKey: 'techChannel'
        },
        TEMP_CHANNEL: {
            // Channel with temperature monitoring data
            id: 2584548,
            label: 'TP',
            translationKey: 'detailsChannel'
        }
    },
    
    // Maintain backward compatibility with existing code
    get DRIMON_CHANNEL() { return this.CHANNELS.DRIMON_CHANNEL.id; },
    get EXT_CHANNEL() { return this.CHANNELS.EXT_CHANNEL.id; },
    get TECH_CHANNEL() { return this.CHANNELS.TECH_CHANNEL.id; },
    get TEMP_CHANNEL() { return this.CHANNELS.TEMP_CHANNEL.id; }
};
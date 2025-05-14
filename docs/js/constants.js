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

// ThingSpeak channel IDs
window.THINGSPEAK = {
    // Main channel with temperature, humidity, window, battery, pressure, light
    DRIMON_CHANNEL: 2568299,
    
    // Channel with plant monitoring data
    DETAILS_CHANNEL: 2584548,
    
    // Channel with system monitoring data
    TECH_CHANNEL: 2584547
};
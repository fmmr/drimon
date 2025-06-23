// YR.no weather integration - minimal implementation
const DEBUG_WEATHER = false; // Set to true to enable debug logging
const DEBUG_CACHE = true; // Special debug just for cache operations

// Cache TTL - 2 minutes (in milliseconds) - reduced to ensure more frequent updates
const WEATHER_CACHE_TTL = 2 * 60 * 1000;

// Store latest weather data for re-use when language changes
// Make this a global variable so forecast.js can access it
window.latestWeatherData = null;
let latestWeatherData = window.latestWeatherData;

// Get weather elements function for dynamic access
function getWeatherElements() {
    return {
        weatherIcon: document.getElementById('weather-icon-container'),
        metTemp: document.getElementById('met-temp'),
        metLink: document.getElementById('met-link')
    };
}

// Logger functions - no-op if debugging is disabled
const log = (msg, data) => DEBUG_WEATHER && console.log(`[Weather] ${msg}`, data || '');
const logCache = (msg, data) => DEBUG_CACHE && console.log(`[Weather-Cache] ${msg}`, data || '');

// Weather data fetching function
async function fetchWeather() {
    // Get elements dynamically
    const elements = getWeatherElements();
    
    // If elements aren't loaded yet, try again later
    if (!elements.metTemp || !elements.weatherIcon) {
        setTimeout(fetchWeather, 500);
        return;
    }

    // No longer skipping for Safari - our new implementation should work on all browsers

    // Use global location constants
    const url = `https://api.met.no/weatherapi/nowcast/2.0/complete?lat=${window.LOCATION.LAT}&lon=${window.LOCATION.LON}`;

    try {
        // Check cache first
        const lastFetchTime = localStorage.getItem('lastMetFetchTime');
        const currentTime = Date.now();

        // Get current hour to force cache refresh at specific times of day
        const currentHour = new Date().getHours();

        // Check if we should force a refresh based on time of day or cache age
        // Force a refresh in the morning (6-8), midday (12-13), and evening (18-19)
        // Also force refresh if the cache is older than 10 minutes, regardless of other conditions
        const cacheAgeInMinutes = lastFetchTime ? (currentTime - parseInt(lastFetchTime)) / 60000 : 999;
        const forceRefresh = (currentHour >= 6 && currentHour <= 8) ||
                            (currentHour >= 12 && currentHour <= 13) ||
                            (currentHour >= 18 && currentHour <= 19) ||
                            (cacheAgeInMinutes > 10); // Force refresh if cache is older than 10 minutes

        if (lastFetchTime &&
            (currentTime - parseInt(lastFetchTime) < WEATHER_CACHE_TTL) &&
            !forceRefresh) {
            const cachedData = localStorage.getItem('cachedMetData');
            if (cachedData) {
                // Calculate and log cache age for debugging
                const cacheAge = currentTime - parseInt(lastFetchTime);
                const cacheAgeMinutes = Math.floor(cacheAge / 60000);
                const cacheAgeSeconds = Math.floor((cacheAge % 60000) / 1000);
                
                logCache(`Using cached data (age: ${cacheAgeMinutes}m ${cacheAgeSeconds}s)`);
                updateDisplay(JSON.parse(cachedData));
                return;
            }
        }
        
        // Log cache invalidation reason
        if (forceRefresh) {
            if (cacheAgeInMinutes > 10) {
                logCache(`Cache invalidated - too old (${Math.floor(cacheAgeInMinutes)}m)`);
            } else if (currentHour >= 6 && currentHour <= 8) {
                logCache('Cache invalidated - morning refresh window');
            } else if (currentHour >= 12 && currentHour <= 13) {
                logCache('Cache invalidated - midday refresh window');
            } else if (currentHour >= 18 && currentHour <= 19) {
                logCache('Cache invalidated - evening refresh window');
            }
        }
        
        // Fetch fresh data using our centralized CORS utility
        // First ensure that the CORSUtils script has loaded
        if (!window.CORSUtils || typeof window.CORSUtils.fetchWithCORS !== 'function') {
            throw new Error('CORSUtils not loaded - check script order in HTML');
        }
        
        let data;
        let source = 'yr.no';
        
        try {
            // Use the centralized CORS utility to handle fetching with fallbacks
            const result = await window.CORSUtils.fetchWithCORS(url);
            data = result.data;
            source = result.source === 'direct' ? 'yr.no' : `yr.no (${result.source})`;
        } catch (err) {
            // If all methods fail, propagate the error
            log('All fetch attempts failed', err);
            throw err;
        }
        
        // Add source info and cache the data
        data._source = source;
        data._fetchedAt = new Date().toISOString(); // Add fetch timestamp
        localStorage.setItem('cachedMetData', JSON.stringify(data));
        localStorage.setItem('lastMetFetchTime', currentTime.toString());
        
        logCache('Fetched and cached new weather data');
        
        updateDisplay(data);
        
    } catch (error) {
        log('Weather data fetch failed', error);
        const elements = getWeatherElements();
        if (elements.metTemp) {
            elements.metTemp.innerHTML = 'Feil';
            if (elements.metLink) elements.metLink.title = 'Kunne ikke hente værdata';
        }
    }
}

// Update the UI with weather data
function updateDisplay(data) {
    // Store the latest data for language switching and sharing with forecast.js
    latestWeatherData = data;
    window.latestWeatherData = data;

    // Call the common function for updating the display
    updateWeatherDisplay();

    // Update forecast tooltip if it's active and Forecast module is loaded
    const metLink = document.getElementById('met-link');
    if (metLink && metLink.hasAttribute('data-forecast-tooltip') &&
        window.Forecast && typeof window.Forecast.attachForecastTooltip === 'function') {
        window.Forecast.attachForecastTooltip();
    }
}

// Separate function to update display that can be called when language changes
window.updateWeatherDisplay = function updateWeatherDisplay() {
    // Skip if we don't have weather data yet
    if (!latestWeatherData) return;

    const elements = getWeatherElements();
    if (!elements.metTemp) return;

    // Get all the weather data from the first timeseries entry
    const details = latestWeatherData.properties.timeseries[0].data.instant.details;
    const temperature = Math.round(details.air_temperature * 10) / 10;
    const humidity = details.relative_humidity ? Math.round(details.relative_humidity) : null;
    const windDirection = details.wind_from_direction ? Math.round(details.wind_from_direction) : null;
    const windSpeed = details.wind_speed ? Math.round(details.wind_speed * 10) / 10 : null;
    const windGust = details.wind_speed_of_gust ? Math.round(details.wind_speed_of_gust * 10) / 10 : null;

    // Get precipitation data from next_1_hours if available
    const precipitationData = latestWeatherData.properties.timeseries[0].data.next_1_hours?.details;
    const precipitation = precipitationData?.precipitation_amount !== undefined ?
                         Math.round(precipitationData.precipitation_amount * 10) / 10 : null;

    // Get all relevant timestamps:
    // 1. When the API data was updated at met.no
    const metaUpdated = latestWeatherData.properties.meta?.updated_at ?
                      moment(latestWeatherData.properties.meta.updated_at).format('HH:mm:ss') : null;
    // 2. The forecast time (showing just time since it's the current conditions)
    const forecastTime = moment(latestWeatherData.properties.timeseries[0].time).format('HH:mm:ss');
    // 3. When we fetched the data locally (current time)
    const fetchedTime = moment().format('HH:mm:ss');
    const source = latestWeatherData._source || 'yr.no';

    // Update temperature display in the data chip
    elements.metTemp.innerHTML = `${temperature} °C`;
    const tempStatus = window.getStatusFromThreshold(temperature, window.getChipConfig('weather').thresholds);
    elements.metLink.className = `data-chip ${tempStatus}`;

    // Get translated labels using I18n system
    let outTempTitle = 'Ute Temperatur';
    let updatedText = 'Oppdatert';
    let sourceText = 'Kilde';
    let humidityText = 'Luftfuktighet';
    let windDirectionText = 'Vindretning';
    let windSpeedText = 'Vindhastighet';
    let gustText = 'Vindkast';
    let precipitationText = 'Nedbør';
    let forecastTimeText = 'Prognose';
    let fetchedTimeText = 'Hentet';

    if (window.I18n && typeof window.I18n.translate === 'function') {
        outTempTitle = window.I18n.translate('outTempChart');
        updatedText = window.I18n.translate('time');
        sourceText = window.I18n.translate('source');
        humidityText = window.I18n.translate('humidity');
        windDirectionText = window.I18n.translate('windDirection');
        windSpeedText = window.I18n.translate('windSpeed');
        gustText = window.I18n.translate('gust');
        precipitationText = window.I18n.translate('precipitation');
        forecastTimeText = window.I18n.translate('forecastTime');
        fetchedTimeText = window.I18n.translate('fetchedTime');
    }

    // Helper function to convert degree to cardinal direction
    function degreesToCardinal(degrees) {
        if (degrees === null || degrees === undefined) return '';
        const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
        const index = Math.round(degrees / 22.5) % 16;
        return cardinals[index];
    }

    // Create a two-section tooltip with timestamps in the main section
    const tooltipData = {};
    
    // SECTION 1: Weather measurements with timestamps directly below precipitation
    tooltipData[outTempTitle] = `${temperature} °C`;
    
    if (humidity !== null) {
        tooltipData[humidityText] = `${humidity}%`;
    }

    if (windSpeed !== null) {
        const direction = degreesToCardinal(windDirection);
        tooltipData[windSpeedText] = `${windSpeed} m/s${direction ? ` (${direction})` : ''}`;
    }

    if (windGust !== null && windGust > windSpeed) {
        tooltipData[gustText] = `${windGust} m/s`;
    }

    if (precipitation !== null) {
        tooltipData[precipitationText] = `${precipitation} mm`;
    }
    
    // Add timestamp information directly after weather measurements in consistent order
    // 1. Forecast time (the actual time the weather data is for)
    tooltipData[forecastTimeText] = forecastTime;
    
    // 2. Nowcast updated time
    if (metaUpdated) {
        tooltipData[window.I18n.translate('nowcastUpdated')] = metaUpdated;
    }
    
    // 3. Forecast updated time
    if (window.latestForecastData && window.latestForecastData._lastUpdated) {
        tooltipData[window.I18n.translate('forecastUpdated')] = moment(window.latestForecastData._lastUpdated).format('HH:mm:ss');
    }
    
    // SECTION 2: After divider - metadata
    const dividerAfter = window.latestForecastData && window.latestForecastData._lastUpdated ? 
        window.I18n.translate('forecastUpdated') : 
        metaUpdated ? window.I18n.translate('nowcastUpdated') : 
        forecastTimeText; // Place divider after the last timestamp
    tooltipData[fetchedTimeText] = fetchedTime;
    tooltipData[sourceText] = source;

    // Generate HTML tooltip with all data and a divider
    let weatherTooltip = Utils.formatTabularTooltip(tooltipData, {
        useHTML: true,
        dividerAfter: dividerAfter
    });
    

    // Only set the tooltip data attribute if the forecast tooltip isn't active
    if (!elements.metLink.hasAttribute('data-forecast-tooltip')) {
        elements.metLink.setAttribute('data-tooltip-content', weatherTooltip);
        elements.metLink.setAttribute('data-has-tooltip', 'true');
    }
    
    // Update weather icon if available
    const symbolData = latestWeatherData.properties.timeseries[0].data.next_1_hours?.summary;
    if (symbolData?.symbol_code && elements.weatherIcon) {
        // Use direct SVG element instead of object tag for better cross-browser compatibility
        elements.weatherIcon.innerHTML = `
            <svg class="weather-svg" width="16" height="16" viewBox="0 0 100 100">
                <image href="weather-icons/${symbolData.symbol_code}.svg"
                      width="100" height="100" preserveAspectRatio="xMidYMid meet" />
            </svg>
        `;
        elements.weatherIcon.classList.add('flex');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchWeather();
    
    // Check timestamp of cached data on initialization
    const validateCacheOnLoad = () => {
        const lastFetchTime = localStorage.getItem('lastMetFetchTime');
        if (lastFetchTime) {
            const cacheAge = Date.now() - parseInt(lastFetchTime);
            // If cache is older than 5 minutes on page load, force refresh
            if (cacheAge > 5 * 60 * 1000) {
                log('Cache too old on page load, forcing refresh');
                localStorage.removeItem('lastMetFetchTime'); // Clear cache timestamp
                setTimeout(fetchWeather, 500); // Fetch fresh data
            }
        }
    };
    
    validateCacheOnLoad();
    
    // Page visibility change detection to refresh when page becomes visible again
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // When page becomes visible again, check if cache is older than 5 minutes
            const lastFetchTime = localStorage.getItem('lastMetFetchTime');
            if (lastFetchTime && (Date.now() - parseInt(lastFetchTime) > 5 * 60 * 1000)) {
                log('Page visible again with old cache, refreshing');
                fetchWeather();
            }
        }
    });
    
    // Refresh timer - slightly more frequent than the cache TTL
    setInterval(fetchWeather, WEATHER_CACHE_TTL);
    
    // Additional safety check every minute to ensure data freshness
    setInterval(() => {
        const lastFetchTime = localStorage.getItem('lastMetFetchTime');
        // If no fetch in the last 4 minutes, something might be wrong - force refresh
        if (!lastFetchTime || (Date.now() - parseInt(lastFetchTime) > 4 * 60 * 1000)) {
            log('No recent weather updates, forcing refresh');
            fetchWeather();
        }
    }, 60 * 1000); // Check every minute
});
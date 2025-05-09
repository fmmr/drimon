// YR.no weather integration - minimal implementation
const DEBUG_WEATHER = false; // Set to true to enable debug logging

// Store latest weather data for re-use when language changes
let latestWeatherData = null;

// Get weather elements function for dynamic access
function getWeatherElements() {
    return {
        weatherIcon: document.getElementById('weather-icon-container'),
        metTemp: document.getElementById('met-temp'),
        metLink: document.getElementById('met-link')
    };
}

// Logger function - no-op if debugging is disabled
const log = (msg, data) => DEBUG_WEATHER && console.log(`[Weather] ${msg}`, data || '');

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
    
    // Røtangen coordinates
    const url = 'https://api.met.no/weatherapi/nowcast/2.0/complete?lat=59.532213&lon=10.418231';
    const cacheTTL = 3 * 60 * 1000; // 3 minutes
    
    try {
        // Check cache first
        const lastFetchTime = localStorage.getItem('lastMetFetchTime');
        const currentTime = Date.now();
        
        if (lastFetchTime && (currentTime - parseInt(lastFetchTime) < cacheTTL)) {
            const cachedData = localStorage.getItem('cachedMetData');
            if (cachedData) {
                log('Using cached data');
                updateDisplay(JSON.parse(cachedData));
                return;
            }
        }
        
        // Fetch fresh data
        let data;
        let source = 'yr.no';
        
        try {
            // Check if we're on Safari
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            // For Safari, go directly to proxy to avoid CORS issues
            if (isSafari) {
                throw new Error('Safari detected, skipping direct API call');
            }

            // Try direct API call for non-Safari browsers
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'DriMon/1.0 (https://drimon.rodland.no; contact@drimon.rodland.no)'
                },
                mode: 'cors',
                credentials: 'omit' // Explicitly omit credentials to avoid CORS issues
            });

            if (!response.ok) throw new Error(`API status: ${response.status}`);
            data = await response.json();

        } catch (err) {
            // Fall back to proxy
            log('Direct API failed, trying proxy', err);

            // Use a more reliable proxy that works with Safari
            const proxyUrl = 'https://corsproxy.io/?';

            try {
                const response = await fetch(proxyUrl + encodeURIComponent(url), {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'DriMon/1.0 (https://drimon.rodland.no; contact@drimon.rodland.no)',
                        'Origin': 'https://drimon.rodland.no'
                    }
                });

                if (!response.ok) throw new Error(`Proxy status: ${response.status}`);
                data = await response.json();
                source = 'yr.no (proxy)';
            } catch (proxyErr) {
                log('Proxy failed too, trying another proxy', proxyErr);

                // Try one more proxy as a last resort
                const backupProxyUrl = 'https://api.allorigins.win/raw?url=';
                const backupResponse = await fetch(backupProxyUrl + encodeURIComponent(url), {
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!backupResponse.ok) throw proxyErr; // Re-throw if backup also fails
                data = await backupResponse.json();
                source = 'yr.no (backup proxy)';
            }
        }
        
        // Add source info and cache the data
        data._source = source;
        localStorage.setItem('cachedMetData', JSON.stringify(data));
        localStorage.setItem('lastMetFetchTime', currentTime.toString());
        
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
    // Store the latest data for language switching
    latestWeatherData = data;
    
    // Call the common function for updating the display
    updateWeatherDisplay();
}

// Separate function to update display that can be called when language changes
function updateWeatherDisplay() {
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
    elements.metTemp.innerHTML = `yr: ${temperature} °C`;
    elements.metLink.className = `data-chip weather-data-chip ${temperature > 25 ? 'high' : temperature < 15 ? 'low' : 'norm'}`;

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

    // Create custom tooltip content with all available weather data
    let weatherTooltip = `${outTempTitle}: ${temperature} °C`;

    // Add other details if available
    if (humidity !== null) {
        weatherTooltip += `\n${humidityText}: ${humidity}%`;
    }

    if (windSpeed !== null) {
        const direction = degreesToCardinal(windDirection);
        weatherTooltip += `\n${windSpeedText}: ${windSpeed} m/s`;

        if (direction) {
            weatherTooltip += ` (${direction})`;
        }
    }

    if (windGust !== null && windGust > windSpeed) {
        weatherTooltip += `\n${gustText}: ${windGust} m/s`;
    }

    if (precipitation !== null) {
        weatherTooltip += `\n${precipitationText}: ${precipitation} mm`;
    }

    // Add all timestamps and source at the end - order: Updated, Forecast, Fetched
    weatherTooltip += `\n\n`;
    if (metaUpdated) {
        weatherTooltip += `${updatedText}: ${metaUpdated}\n`;
    }
    weatherTooltip += `${forecastTimeText}: ${forecastTime}\n`;
    weatherTooltip += `${fetchedTimeText}: ${fetchedTime}\n`;
    weatherTooltip += `${sourceText}: ${source}`;

    // Set the tooltip data attribute
    elements.metLink.setAttribute('data-tooltip-content', weatherTooltip);
    elements.metLink.setAttribute('data-has-tooltip', 'true');
    
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
        elements.weatherIcon.style.display = 'flex';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchWeather();
    setInterval(fetchWeather, 3 * 60 * 1000); // Refresh every 3 minutes to match cache TTL
});
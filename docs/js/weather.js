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
    const cacheTTL = 10 * 60 * 1000; // 10 minutes
    
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
    
    const temperature = Math.round(latestWeatherData.properties.timeseries[0].data.instant.details.air_temperature * 10) / 10;
    const lastUpdated = moment(latestWeatherData.properties.timeseries[0].time).format('L LTS');
    const source = latestWeatherData._source || 'yr.no';
    
    // Update temperature display
    elements.metTemp.innerHTML = `yr: ${temperature} °C`;
    elements.metLink.className = `data-chip weather-data-chip ${temperature > 25 ? 'high' : temperature < 15 ? 'low' : 'norm'}`;
    
    // Get translated title using I18n system
    let outTempTitle = 'Ute Temperatur';
    let updatedText = 'Oppdatert';
    let sourceText = 'Kilde';

    if (window.I18n && typeof window.I18n.translate === 'function') {
        outTempTitle = window.I18n.translate('outTempChart');
        updatedText = window.I18n.translate('time');
        sourceText = window.I18n.translate('source');
    }
    
    // Create custom tooltip content
    const weatherTooltip = `${outTempTitle}: ${temperature} °C\n${updatedText}: ${lastUpdated}\n${sourceText}: ${source}`;
    
    // Set the tooltip data attribute instead of title attribute
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
    setInterval(fetchWeather, 10 * 60 * 1000); // Refresh every 10 minutes
});
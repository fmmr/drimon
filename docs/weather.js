// YR.no weather integration - minimal implementation
const DEBUG_WEATHER = false; // Set to true to enable debug logging

// DOM elements
const weatherIcon = document.getElementById('weather-icon-container');
const metTemp = document.getElementById('met-temp');
const metLink = document.getElementById('met-link');

// Logger function
const log = (msg, data) => DEBUG_WEATHER && console.log(`[Weather] ${msg}`, data || '');

// Weather data fetching function
async function fetchWeather() {
    // Skip for Safari
    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
        if (metLink) metLink.style.display = 'none';
        if (weatherIcon) weatherIcon.style.display = 'none';
        return;
    }
    
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
            // Try direct API call
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'drimon/1.0 (https://drimon.rodland.no)'
                },
                mode: 'cors'
            });
            
            if (!response.ok) throw new Error(`API status: ${response.status}`);
            data = await response.json();
            
        } catch (err) {
            // Fall back to proxy
            log('Direct API failed, trying proxy', err);
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(proxyUrl + url, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'drimon/1.0 (https://drimon.rodland.no)',
                    'Origin': 'https://drimon.rodland.no'
                }
            });
            
            if (!response.ok) throw new Error(`Proxy status: ${response.status}`);
            data = await response.json();
            source = 'yr.no (proxy)';
        }
        
        // Add source info and cache the data
        data._source = source;
        localStorage.setItem('cachedMetData', JSON.stringify(data));
        localStorage.setItem('lastMetFetchTime', currentTime.toString());
        
        updateDisplay(data);
        
    } catch (error) {
        log('Weather data fetch failed', error);
        if (metTemp) {
            metTemp.innerHTML = 'Feil';
            metLink.title = 'Kunne ikke hente værdata';
        }
    }
}

// Update the UI with weather data
function updateDisplay(data) {
    if (!metTemp) return;
    
    const temperature = Math.round(data.properties.timeseries[0].data.instant.details.air_temperature * 10) / 10;
    const lastUpdated = moment(data.properties.timeseries[0].time).format('L LTS');
    const source = data._source || 'yr.no';
    
    // Update temperature display
    metTemp.innerHTML = `yr: ${temperature} °C`;
    metLink.className = `data-chip ${temperature > 25 ? 'high' : temperature < 15 ? 'low' : 'norm'}`;
    metLink.title = `Ute Temperatur - Oppdatert: ${lastUpdated} (Kilde: ${source})`;
    
    // Update weather icon if available
    const symbolData = data.properties.timeseries[0].data.next_1_hours?.summary;
    if (symbolData?.symbol_code && weatherIcon) {
        weatherIcon.innerHTML = `
            <object type="image/svg+xml" data="weather-icons/${symbolData.symbol_code}.svg" 
                    width="16" height="16" class="weather-svg">
                <img src="weather-icons/${symbolData.symbol_code}.svg" 
                     alt="${symbolData.symbol_code}" width="16" height="16">
            </object>
        `;
        weatherIcon.style.display = 'flex';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchWeather();
    setInterval(fetchWeather, 10 * 60 * 1000); // Refresh every 10 minutes
});
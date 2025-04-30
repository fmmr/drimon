// YR.no weather integration functions
const DEBUG_WEATHER = true; // Set to true to enable debug logging

// Weather-specific elements
const weatherElements = {
    weatherIcon: document.getElementById('weather-icon-container'),
    metTemp: document.getElementById('met-temp'),
    metLink: document.getElementById('met-link')
};

// Debug logger function
function logWeather(message, data) {
    if (DEBUG_WEATHER) {
        if (data) {
            console.log(`[Weather] ${message}`, data);
        } else {
            console.log(`[Weather] ${message}`);
        }
    }
}

// Function to fetch Met.no weather data
async function fetchMetData() {
    // Detect Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // Skip weather data for Safari browsers
    if (isSafari) {
        logWeather('Safari detected - hiding weather pill');
        // Hide the weather pill completely in Safari
        if (weatherElements.metLink) {
            weatherElements.metLink.style.display = 'none';
        }
        if (weatherElements.weatherIcon) {
            weatherElements.weatherIcon.style.display = 'none';
        }
        return;
    }
    
    // Røtangen coordinates
    const metUrl = 'https://api.met.no/weatherapi/nowcast/2.0/complete?lat=59.532213&lon=10.418231';
    
    try {
        // Check localStorage cache first
        const lastFetchTime = localStorage.getItem('lastMetFetchTime');
        const currentTime = new Date().getTime();
        
        logWeather(`Checking cache. Last fetch time: ${lastFetchTime ? new Date(parseInt(lastFetchTime)).toLocaleString() : 'never'}`);
        
        // Use cached data if it's less than 10 minutes old
        if (lastFetchTime && (currentTime - parseInt(lastFetchTime) < 10 * 60 * 1000)) {
            const cachedData = localStorage.getItem('cachedMetData');
            if (cachedData) {
                logWeather('Using cached weather data');
                const data = JSON.parse(cachedData);
                updateMetDisplay(data);
                return; // Exit early with cached data
            }
        }
        
        // Try direct API call first
        try {
            logWeather('Attempting direct fetch from Met.no API');
            
            // Set required headers for Met.no API
            const response = await fetch(metUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'drimon/1.0 (https://drimon.rodland.no)' 
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`Met.no API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            logWeather('Successfully fetched data from Met.no API directly');
            
            // Add source information
            data._source = 'yr.no';
            
            // Cache the successful response
            localStorage.setItem('cachedMetData', JSON.stringify(data));
            localStorage.setItem('lastMetFetchTime', currentTime.toString());
            logWeather('Cached new weather data');
            
            updateMetDisplay(data);
            return;
        } catch (directError) {
            logWeather('Direct API fetch failed', directError);
            
            // Fall back to proxy server
            try {
                // Using a CORS proxy as fallback
                logWeather('Attempting to fetch weather data via proxy server');
                
                const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
                const response = await fetch(proxyUrl + metUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'drimon/1.0 (https://drimon.rodland.no)',
                        'Origin': 'https://drimon.rodland.no'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Proxy API responded with status: ${response.status}`);
                }
                
                const data = await response.json();
                logWeather('Successfully fetched data via proxy server');
                
                // Add source information
                data._source = 'yr.no (proxy)';
                
                // Cache the successful response
                localStorage.setItem('cachedMetData', JSON.stringify(data));
                localStorage.setItem('lastMetFetchTime', currentTime.toString());
                logWeather('Cached new weather data');
                
                updateMetDisplay(data);
                return;
            } catch (proxyError) {
                logWeather('Proxy fetch also failed', proxyError);
                throw proxyError; // Re-throw to be caught by outer catch
            }
        }
    } catch (error) {
        // All fetch attempts failed
        logWeather('All weather data fetches failed', error);
        if (weatherElements.metTemp) {
            weatherElements.metTemp.innerHTML = 'Feil';
            weatherElements.metLink.title = 'Kunne ikke hente værdata';
        }
    }
}

function updateMetDisplay(data) {
    if (!weatherElements.metTemp) {
        logWeather('Met temperature element not found in DOM');
        return;
    }
    
    const temperature = Math.round(data.properties.timeseries[0].data.instant.details.air_temperature * 10) / 10;
    const createdAt = moment(data.properties.timeseries[0].time);
    const lastUpdated = createdAt.format('L LTS');
    
    // Determine the data source
    const dataSource = data._source ? data._source : 'yr.no';
    logWeather(`Weather data source: ${dataSource}, Temperature: ${temperature}°C, Last updated: ${lastUpdated}`);
    
    // Get weather symbol code if available
    let symbolCode = '';
    if (data.properties.timeseries[0].data.next_1_hours && 
        data.properties.timeseries[0].data.next_1_hours.summary && 
        data.properties.timeseries[0].data.next_1_hours.summary.symbol_code) {
        symbolCode = data.properties.timeseries[0].data.next_1_hours.summary.symbol_code;
        logWeather(`Weather symbol code: ${symbolCode}`);
    }
    
    // Update temperature text and pill styling
    weatherElements.metTemp.innerHTML = `yr: ${temperature} °C`;
    weatherElements.metLink.className = `data-chip ${getClassName(temperature, 15, 25)}`;
    weatherElements.metLink.title = `Ute Temperatur - Oppdatert: ${lastUpdated} (Kilde: ${dataSource})`;
    
    // Update weather icon if we have a symbol code
    if (symbolCode && weatherElements.weatherIcon) {
        logWeather(`Updating weather icon with symbol: ${symbolCode}`);
        updateWeatherIcon(symbolCode);
    }
}

function updateWeatherIcon(symbolCode) {
    if (!weatherElements.weatherIcon) {
        logWeather('Weather icon container not found');
        return;
    }
    
    try {
        // Only update weather icon for non-Safari browsers
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (!isSafari) {
            // For Chrome and other browsers, use the SVG from weather-icons folder
            weatherElements.weatherIcon.innerHTML = `
                <object type="image/svg+xml" data="weather-icons/${symbolCode}.svg" width="16" height="16" class="weather-svg">
                    <img src="weather-icons/${symbolCode}.svg" alt="${symbolCode}" width="16" height="16">
                </object>
            `;
            
            // Make sure the icon container is visible
            weatherElements.weatherIcon.style.display = 'flex';
            logWeather('Weather icon updated successfully');
        }
    } catch (error) {
        logWeather('Error updating weather icon', error);
        console.error('Error updating weather icon:', error);
    }
}

// Helper function for temperature-based class names
function getClassName(value, lowThreshold, highThreshold) {
    if (value > highThreshold) return 'high';
    if (value < lowThreshold) return 'low';
    return 'norm';
}

// Initialize weather data on page load
document.addEventListener('DOMContentLoaded', function() {
    logWeather('Initializing weather module');
    fetchMetData();
    
    // Set up periodic refresh for weather data (every 10 minutes)
    setInterval(fetchMetData, 10 * 60 * 1000);
});
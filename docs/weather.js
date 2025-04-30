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
        
        // As per Met.no documentation, we need a proxy server
        // Based on met.no docs, the best approach is to use a proxy server
        try {
            // Using an API proxy specifically for weather data
            // This is a technique recommended in the Met.no documentation
            logWeather('Attempting to fetch weather data via proxy server');
            
            // Using a CORS proxy to access the Met.no API - this should work in all browsers
            // In a production environment, this should be replaced with a proper server-side proxy
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
            logWeather('Proxy fetch failed, trying direct API', proxyError);
            
            // Fall back to direct API call for browsers that support it
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
                logWeather('Direct API fetch also failed', directError);
                // Fall through to ThingSpeak fallback
            }
        }
        
        // Fallback to ThingSpeak if direct method fails or using Safari
        logWeather('Fetching weather data from ThingSpeak fallback');
        const timezone = "Europe/Oslo"; // Global timezone setting
        const thingspeakResponse = await fetch(`https://api.thingspeak.com/channels/2626867/feeds/last.json?timezone=${timezone}`);
        
        if (!thingspeakResponse.ok) {
            throw new Error(`ThingSpeak API responded with status: ${thingspeakResponse.status}`);
        }
        
        const tsData = await thingspeakResponse.json();
        logWeather('Successfully fetched data from ThingSpeak');
        
        // Format data in a compatible way for updateMetDisplay
        const formattedData = {
            properties: {
                timeseries: [{
                    time: tsData.created_at,
                    data: {
                        instant: {
                            details: {
                                air_temperature: parseFloat(tsData.field1)
                            }
                        }
                    }
                }]
            },
            // Add source information for display in the tooltip
            _source: 'ThingSpeak'
        };
        
        updateMetDisplay(formattedData);
    } catch (error) {
        // All fetch attempts failed
        logWeather('All weather data fetches failed', error);
        if (weatherElements.metTemp) {
            weatherElements.metTemp.innerHTML = 'Feil';
            weatherElements.metTemp.parentElement.title = 'Kunne ikke hente værdata';
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
    } else {
        // Fallback for ThingSpeak which doesn't have symbol code
        // Use a simple algorithm based on temperature to show a sensible icon
        const temp = data.properties.timeseries[0].data.instant.details.air_temperature;
        if (temp > 20) {
            symbolCode = 'clearsky_day'; // Hot day
        } else if (temp > 15) {
            symbolCode = 'fair_day'; // Nice day
        } else if (temp > 10) {
            symbolCode = 'partlycloudy_day'; // Cool day
        } else if (temp > 5) {
            symbolCode = 'cloudy'; // Cold day
        } else if (temp > 0) {
            symbolCode = 'rain'; // Very cold
        } else {
            symbolCode = 'snow'; // Freezing
        }
        logWeather(`No symbol code available, using fallback based on temperature: ${symbolCode}`);
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
        // Detect Safari
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        logWeather(`Updating weather icon with SVG for ${isSafari ? 'Safari' : 'Chrome'} browser`);
        
        if (isSafari) {
            // For Safari, use Font Awesome icons with appropriate colors
            const weatherIcons = {
                'clearsky_day': '<i class="fas fa-sun" style="color:#FFD700;"></i>',
                'clearsky_night': '<i class="fas fa-moon" style="color:#FFD700;"></i>',
                'clearsky_polartwilight': '<i class="fas fa-sun" style="color:#FFD700;"></i>',
                'fair_day': '<i class="fas fa-cloud-sun" style="color:#FFD700;"></i>',
                'fair_night': '<i class="fas fa-cloud-moon" style="color:#FFD700;"></i>',
                'fair_polartwilight': '<i class="fas fa-cloud-sun" style="color:#FFD700;"></i>',
                'partlycloudy_day': '<i class="fas fa-cloud-sun" style="color:#87CEEB;"></i>',
                'partlycloudy_night': '<i class="fas fa-cloud-moon" style="color:#87CEEB;"></i>',
                'partlycloudy_polartwilight': '<i class="fas fa-cloud-sun" style="color:#87CEEB;"></i>',
                'cloudy': '<i class="fas fa-cloud" style="color:#87CEEB;"></i>',
                'rainshowers_day': '<i class="fas fa-cloud-sun-rain" style="color:#4682B4;"></i>',
                'rainshowers_night': '<i class="fas fa-cloud-moon-rain" style="color:#4682B4;"></i>',
                'rainshowers_polartwilight': '<i class="fas fa-cloud-sun-rain" style="color:#4682B4;"></i>',
                'rain': '<i class="fas fa-cloud-rain" style="color:#4682B4;"></i>',
                'heavyrain': '<i class="fas fa-cloud-showers-heavy" style="color:#4682B4;"></i>',
                'fog': '<i class="fas fa-smog" style="color:#D3D3D3;"></i>',
                'snow': '<i class="fas fa-snowflake" style="color:white;"></i>',
                'sleet': '<i class="fas fa-cloud-meatball" style="color:#87CEEB;"></i>',
                'default': '<i class="fas fa-cloud" style="color:#87CEEB;"></i>'
            };
            
            // Use a default icon if we don't have a specific icon for this symbol code
            const iconHTML = weatherIcons[symbolCode] || weatherIcons['default'];
            weatherElements.weatherIcon.innerHTML = iconHTML;
        } else {
            // For Chrome and other browsers, use the SVG from weather-icons folder
            weatherElements.weatherIcon.innerHTML = `
                <object type="image/svg+xml" data="weather-icons/${symbolCode}.svg" width="16" height="16" class="weather-svg">
                    <img src="weather-icons/${symbolCode}.svg" alt="${symbolCode}" width="16" height="16">
                </object>
            `;
        }
        
        // Make sure the icon container is visible
        weatherElements.weatherIcon.style.display = 'flex';
        logWeather('Weather icon updated successfully');
    } catch (error) {
        logWeather('Error updating weather icon', error);
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
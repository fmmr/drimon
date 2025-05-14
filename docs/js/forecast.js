/**
 * Weather Forecast integration with MET Norway API
 *
 * This module fetches and processes forecast data from the MET Norway API
 * and provides a tooltip-friendly format for display.
 */

// Configurable constants
const DEBUG_FORECAST = false; // Set to true to enable debug logging
// Use the global location constants from constants.js
const FORECAST_CACHE_TTL = 30 * 60 * 1000; // 30 minute cache (reduced from 1 hour)

// Store latest forecast data for re-use - make it globally available
let latestForecastData = null;
window.latestForecastData = null;

// Logger function - no-op if debugging is disabled
const logForecast = (msg, data) => DEBUG_FORECAST && console.log(`[Forecast] ${msg}`, data || '');

/**
 * Groups forecast data by day and time period
 * @param {Object} data - The raw forecast data from MET API
 * @returns {Object} Forecast data grouped by day and time period
 */
function processForecastData(data) {
    if (!data || !data.properties || !data.properties.timeseries) {
        return null;
    }

    const timeseries = data.properties.timeseries;
    const forecastByDay = {};
    
    // Define time periods (night, morning, afternoon, evening)
    const periods = {
        night: { start: 0, end: 6 }, // 00:00 - 06:00
        morning: { start: 6, end: 12 }, // 06:00 - 12:00
        afternoon: { start: 12, end: 18 }, // 12:00 - 18:00
        evening: { start: 18, end: 24 } // 18:00 - 00:00
    };
    
    // Process all forecast entries
    timeseries.forEach(entry => {
        const time = moment(entry.time);
        const date = time.format('YYYY-MM-DD');
        const hour = time.hour();
        const temp = entry.data.instant.details.air_temperature;
        
        // Get weather symbol if available
        let symbol = null;
        if (entry.data.next_1_hours && entry.data.next_1_hours.summary && entry.data.next_1_hours.summary.symbol_code) {
            symbol = entry.data.next_1_hours.summary.symbol_code;
        } else if (entry.data.next_6_hours && entry.data.next_6_hours.summary && entry.data.next_6_hours.summary.symbol_code) {
            symbol = entry.data.next_6_hours.summary.symbol_code;
        } else if (entry.data.next_12_hours && entry.data.next_12_hours.summary && entry.data.next_12_hours.summary.symbol_code) {
            symbol = entry.data.next_12_hours.summary.symbol_code;
        }
        
        // Initialize day object if not exists
        if (!forecastByDay[date]) {
            forecastByDay[date] = {
                date: time,
                night: { temps: [], symbols: [] },
                morning: { temps: [], symbols: [] },
                afternoon: { temps: [], symbols: [] },
                evening: { temps: [], symbols: [] },
                highTemp: -100,
                lowTemp: 100
            };
        }
        
        // Determine period
        let period = null;
        for (const [name, range] of Object.entries(periods)) {
            if (hour >= range.start && hour < range.end) {
                period = name;
                break;
            }
        }
        
        if (period) {
            forecastByDay[date][period].temps.push(temp);
            if (symbol) {
                forecastByDay[date][period].symbols.push(symbol);
            }
        }
        
        // Update high/low temperature
        if (temp > forecastByDay[date].highTemp) {
            forecastByDay[date].highTemp = temp;
        }
        if (temp < forecastByDay[date].lowTemp) {
            forecastByDay[date].lowTemp = temp;
        }
    });
    
    // Process each day to get dominant symbol and average temp for each period
    Object.values(forecastByDay).forEach(day => {
        ['night', 'morning', 'afternoon', 'evening'].forEach(period => {
            const temps = day[period].temps;
            const symbols = day[period].symbols;
            
            // Calculate average temperature if we have data
            if (temps.length > 0) {
                day[period].temp = Math.round(temps.reduce((sum, t) => sum + t, 0) / temps.length);
            } else {
                day[period].temp = null;
            }
            
            // Get dominant symbol (most frequent)
            if (symbols.length > 0) {
                const symbolCount = {};
                symbols.forEach(s => {
                    symbolCount[s] = (symbolCount[s] || 0) + 1;
                });
                
                // Find most frequent symbol
                let maxCount = 0;
                let dominantSymbol = null;
                for (const [symbol, count] of Object.entries(symbolCount)) {
                    if (count > maxCount) {
                        maxCount = count;
                        dominantSymbol = symbol;
                    }
                }
                day[period].symbol = dominantSymbol;
            } else {
                day[period].symbol = null;
            }
        });
        
        // Round high/low temps
        day.highTemp = Math.round(day.highTemp);
        day.lowTemp = Math.round(day.lowTemp);
    });
    
    return forecastByDay;
}

/**
 * Fetch forecast data from MET Norway API
 * @returns {Promise<Object>} Processed forecast data
 */
async function fetchForecastData() {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${window.LOCATION.LAT}&lon=${window.LOCATION.LON}`;

    try {
        // Check cache first
        const lastFetchTime = localStorage.getItem('lastForecastFetchTime');
        const currentTime = Date.now();

        // Get current hour to force cache refresh at specific times of day
        const currentHour = new Date().getHours();

        // Check if we should force a refresh based on time of day
        // Force a refresh in the morning (6-8), midday (12-13), and evening (18-19)
        const forceRefresh = (currentHour >= 6 && currentHour <= 8) ||
                            (currentHour >= 12 && currentHour <= 13) ||
                            (currentHour >= 18 && currentHour <= 19);

        if (lastFetchTime &&
            (currentTime - parseInt(lastFetchTime) < FORECAST_CACHE_TTL) &&
            !forceRefresh) {
            const cachedData = localStorage.getItem('cachedForecastData');
            if (cachedData) {
                logForecast('Using cached forecast data');
                const parsedData = JSON.parse(cachedData);
                latestForecastData = parsedData;
                window.latestForecastData = parsedData; // Make cached data globally available
                return parsedData;
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
                credentials: 'omit'
            });

            if (!response.ok) throw new Error(`API status: ${response.status}`);
            data = await response.json();

        } catch (err) {
            // Fall back to proxy
            logForecast('Direct API failed, trying proxy', err);

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
                logForecast('Proxy failed too, trying another proxy', proxyErr);

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
        
        // Process data
        const processedData = processForecastData(data);
        
        // Add source info and cache the data
        processedData._source = source;
        processedData._lastUpdated = data.properties?.meta?.updated_at || new Date().toISOString();
        processedData._fetchedAt = new Date().toISOString();
        
        // Cache the data
        localStorage.setItem('cachedForecastData', JSON.stringify(processedData));
        localStorage.setItem('lastForecastFetchTime', currentTime.toString());
        
        // Store latest data (locally and globally)
        latestForecastData = processedData;
        window.latestForecastData = processedData;
        
        logForecast('Fetched new forecast data', processedData);
        return processedData;
        
    } catch (error) {
        logForecast('Forecast data fetch failed', error);
        return null;
    }
}

/**
 * Creates HTML for the forecast tooltip
 * @returns {string} HTML string for tooltip
 */
function createForecastTooltipHTML() {
    if (!latestForecastData) {
        return window.I18n.translate('loading');
    }

    // Get current weather data from the weather.js module
    const currentWeatherData = window.latestWeatherData;

    // Create a tooltip table
    let html = '<div class="forecast-tooltip">';

    // Add current weather section if available
    if (currentWeatherData) {
        html += '<div class="current-weather-section">';

        // Get all the weather data from the first timeseries entry
        const details = currentWeatherData.properties.timeseries[0].data.instant.details;
        const temperature = Math.round(details.air_temperature * 10) / 10;
        const humidity = details.relative_humidity ? Math.round(details.relative_humidity) : null;
        const windDirection = details.wind_from_direction ? Math.round(details.wind_from_direction) : null;
        const windSpeed = details.wind_speed ? Math.round(details.wind_speed * 10) / 10 : null;
        const windGust = details.wind_speed_of_gust ? Math.round(details.wind_speed_of_gust * 10) / 10 : null;

        // Get precipitation data from next_1_hours if available
        const precipitationData = currentWeatherData.properties.timeseries[0].data.next_1_hours?.details;
        const precipitation = precipitationData?.precipitation_amount !== undefined ?
                            Math.round(precipitationData.precipitation_amount * 10) / 10 : null;

        // Add current weather icon if available
        const symbolData = currentWeatherData.properties.timeseries[0].data.next_1_hours?.summary;
        if (symbolData?.symbol_code) {
            html += `<div class="current-weather-icon centered">`;
            html += `<img src="weather-icons/${symbolData.symbol_code}.svg" alt="${symbolData.symbol_code}" width="32" height="32">`;
            html += `</div>`;
        }

        // Add current data table
        html += '<table class="current-weather-table">';

        // Temperature
        html += '<tr>';
        html += `<td>${window.I18n.translate('temperatureChart')}</td>`;
        html += `<td>${temperature} °C</td>`;
        html += '</tr>';

        // Wind info
        if (windSpeed !== null) {
            // Helper function to convert degree to cardinal direction
            function degreesToCardinal(degrees) {
                if (degrees === null || degrees === undefined) return '';
                const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
                const index = Math.round(degrees / 22.5) % 16;
                return cardinals[index];
            }

            const direction = degreesToCardinal(windDirection);
            html += '<tr>';
            html += `<td>${window.I18n.translate('windSpeed')}</td>`;
            html += `<td>${windSpeed} m/s${direction ? ` (${direction})` : ''}</td>`;
            html += '</tr>';

            if (windGust !== null && windGust > windSpeed) {
                html += '<tr>';
                html += `<td>${window.I18n.translate('gust')}</td>`;
                html += `<td>${windGust} m/s</td>`;
                html += '</tr>';
            }
        }

        // Humidity if available
        if (humidity !== null) {
            html += '<tr>';
            html += `<td>${window.I18n.translate('humidity')}</td>`;
            html += `<td>${humidity}%</td>`;
            html += '</tr>';
        }

        // Precipitation if available
        if (precipitation !== null) {
            html += '<tr>';
            html += `<td>${window.I18n.translate('precipitation')}</td>`;
            html += `<td>${precipitation} mm</td>`;
            html += '</tr>';
        }

        // Timestamp information is added here via string replacement in the code above
        // This ensures the timestamps appear directly after the weather measurements

        html += '</table>';
        html += '</div>';

        // Add divider after all weather data including timestamps
        html += '<div class="forecast-divider"></div>';
    }

    // Get day names and time period names
    const periodTranslations = {
        night: window.I18n.translate('night'),
        morning: window.I18n.translate('morning'),
        afternoon: window.I18n.translate('afternoon'),
        evening: window.I18n.translate('evening')
    };

    // Add forecast header
    html += `<h3 class="forecast-header">${window.I18n.translate('forecastTooltip')}</h3>`;

    // Add table header
    html += '<table class="forecast-table"><thead><tr>';
    html += `<th></th>`;
    html += `<th>${periodTranslations.night}</th>`;
    html += `<th>${periodTranslations.morning}</th>`;
    html += `<th>${periodTranslations.afternoon}</th>`;
    html += `<th>${periodTranslations.evening}</th>`;
    html += `<th>${window.I18n.translate('highLow')}</th>`;
    html += '</tr></thead><tbody>';

    // Move time update info right after the current weather table
    if (currentWeatherData) {
        // 1. First add forecast time (the actual time the weather data is for)
        const forecastTime = moment(currentWeatherData.properties.timeseries[0].time).format('HH:mm:ss');
        html = html.replace('</table>', `
            <tr>
                <td>${window.I18n.translate('forecastTime')}</td>
                <td>${forecastTime}</td>
            </tr>
        </table>`);
        
        // 2. Then add nowcast updated time if available
        if (currentWeatherData.properties?.meta?.updated_at) {
            html = html.replace('</table>', `
                <tr>
                    <td>${window.I18n.translate('nowcastUpdated')}</td>
                    <td>${moment(currentWeatherData.properties.meta.updated_at).format('HH:mm:ss')}</td>
                </tr>
            </table>`);
        }
        
        // 3. Finally add forecast updated time if available
        if (latestForecastData._lastUpdated) {
            html = html.replace('</table>', `
                <tr>
                    <td>${window.I18n.translate('forecastUpdated')}</td>
                    <td>${moment(latestForecastData._lastUpdated).format('HH:mm:ss')}</td>
                </tr>
            </table>`);
        }
    }
    
    // Get forecast days, sorted by date
    const days = Object.values(latestForecastData)
        .filter(day => typeof day === 'object' && day.date)
        .sort((a, b) => a.date.valueOf() - b.date.valueOf())
        .slice(0, 7); // Limit to 7 days

    // Add rows for each day
    days.forEach(day => {
        const date = moment(day.date);
        const isToday = date.isSame(moment(), 'day');

        // Format row with day name and date
        html += '<tr>';
        html += `<td class="forecast-day${isToday ? ' today' : ''}">`;
        html += `${date.format('ddd DD. MMM')}`;
        html += '</td>';

        // Add cells for each time period
        ['night', 'morning', 'afternoon', 'evening'].forEach(period => {
            html += '<td class="forecast-period">';

            if (day[period].symbol) {
                // Add weather symbol
                html += `<div class="forecast-symbol">`;
                html += `<img src="weather-icons/${day[period].symbol}.svg" alt="${day[period].symbol}" width="24" height="24">`;
                html += `</div>`;
            }

            if (day[period].temp !== null) {
                // Add temperature
                html += `<div class="forecast-temp">${day[period].temp}°</div>`;
            }

            html += '</td>';
        });

        // Add high/low temperatures
        html += `<td class="forecast-high-low">`;
        html += `<span class="high">${day.highTemp}°</span> / `;
        html += `<span class="low">${day.lowTemp}°</span>`;
        html += `</td>`;

        html += '</tr>';
    });

    html += '</tbody></table>';

    // Add footer with data source and update time
    const lastUpdated = moment(latestForecastData._lastUpdated).format('DD.MM.YYYY HH:mm');
    html += `<div class="forecast-footer">`;
    html += `<span>${window.I18n.translate('source')}: ${latestForecastData._source}, `;
    html += `${window.I18n.translate('time')}: ${lastUpdated}</span>`;
    html += `</div>`;

    html += '</div>';

    return html;
}

/**
 * Get the latest forecast data
 * @returns {Object} Latest forecast data
 */
function getLatestForecastData() {
    return latestForecastData;
}

/**
 * Attaches forecast tooltip to the weather element
 */
function attachForecastTooltip() {
    // Get the weather data chip element
    const weatherChip = document.getElementById('met-link');
    if (!weatherChip) {
        setTimeout(attachForecastTooltip, 500); // Try again if element not found
        return;
    }

    // Create tooltip content
    const tooltipContent = createForecastTooltipHTML();

    // Update tooltip content and mark it with a special attribute so weather.js won't overwrite it
    weatherChip.setAttribute('data-tooltip-content', tooltipContent);
    weatherChip.setAttribute('data-forecast-tooltip', 'true');

    // Mark element as having a tooltip
    weatherChip.setAttribute('data-has-tooltip', 'true');

    // Make sure tooltip controller is refreshed
    if (window.TooltipController && typeof window.TooltipController.initialize === 'function') {
        setTimeout(() => {
            window.TooltipController.initialize();
        }, 200);
    }
}

/**
 * Initialize the forecast module
 */
async function initForecast() {
    try {
        await fetchForecastData();
        attachForecastTooltip();
        
        // Set up periodic refresh using the cache TTL
        setInterval(async () => {
            await fetchForecastData();
            attachForecastTooltip();
        }, FORECAST_CACHE_TTL);

        // Additional refresh on hour change to ensure proper time period display
        const checkHourChange = () => {
            const now = new Date();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();

            // If we're at the top of the hour (00:00-00:59), refresh the forecast
            if (minutes === 0 && seconds < 60) {
                fetchForecastData().then(() => {
                    attachForecastTooltip();
                    logForecast('Refreshed forecast data at hour change');
                });
            }
        };

        // Check for hour changes every minute
        setInterval(checkHourChange, 60 * 1000);
        
    } catch (error) {
        logForecast('Error initializing forecast', error);
    }
}

/**
 * Clean up old forecast and astro cache entries
 * This prevents accumulation of outdated entries in localStorage
 */
function cleanupOldCacheEntries() {
    try {
        // Get all localStorage keys
        const keys = Object.keys(localStorage);

        // Current date for comparison
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

        // Process each key
        keys.forEach(key => {
            // Check for forecast cache entries
            if (key === 'cachedForecastData' || key === 'lastForecastFetchTime') {
                // These are managed by the fetchForecastData function
                return;
            }

            // Check for astro cache entries with date
            if (key.startsWith('drimon_astro_')) {
                const dateStr = key.substring('drimon_astro_'.length);

                // If the date is not today, remove it
                if (dateStr !== todayStr) {
                    localStorage.removeItem(key);
                    logForecast('Removed outdated astro cache entry', key);
                }
            }
        });
    } catch (error) {
        logForecast('Error cleaning up old cache entries', error);
    }
}

// Initialize immediately to ensure forecast data is available early
(function init() {
    // Clean up old cache entries
    cleanupOldCacheEntries();
    
    // Load forecast data immediately to ensure it's available for tooltips
    fetchForecastData().then(data => {
        // Store globally for immediate access
        window.latestForecastData = data;
        
        // Initialize forecast tooltip with slight delay
        setTimeout(initForecast, 1000);
    });
})();

// Update when language changes
document.addEventListener('languageChanged', attachForecastTooltip);

// Export functions for global access
window.Forecast = {
    fetchForecastData,
    getLatestForecastData,
    createForecastTooltipHTML,
    attachForecastTooltip,
    cleanupOldCacheEntries
};
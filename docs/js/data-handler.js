// Generic thresholds with n values and n+1 corresponding CSS status classes
window.THRESHOLDS = {
    TEMPERATURE: {
        ranges: [16, 35],
        statuses: ['low', 'normal', 'critical']
    },
    BATTERY: {
        ranges: [60, 80, 90],
        statuses: ['critical', 'warning', 'low', 'good']
    },
    PRESSURE: {
        ranges: [1000, 1010],
        statuses: ['low-pressure', 'normal', 'high-pressure']
    },
    WEATHER: {
        ranges: [17, 25],
        statuses: ['low', 'normal', 'critical']
    },
    WINDOW: {
        ranges: [75, 100],
        texts: ['closed', 'ajar', 'open']
    },
    LIGHT: {
        ranges: [5, 500, 9000],
        texts: ['night', 'dusk', 'cloudy', 'sunny']
    }
};

window.getStatusFromThreshold = function(value, thresholdConfig, type = 'statuses') {
    const ranges = thresholdConfig.ranges;
    const results = thresholdConfig[type];
    
    if (!results) {
        throw new Error(`Invalid threshold config: missing ${type} property`);
    }
    
    if (results.length !== ranges.length + 1) {
        throw new Error(`Invalid threshold config: ${results.length} ${type} but ${ranges.length} ranges. Must be n+1.`);
    }
    
    for (let i = 0; i < ranges.length; i++) {
        if (value < ranges[i]) {
            return results[i];
        }
    }
    
    return results[results.length - 1];
}

// Get elements function for dynamic access to DOM elements 
function getElements() {
    return {
        temperature: document.getElementById('temperature'),
        battery: document.getElementById('battery'),
        // batteryVolt removed from header so don't include it here
        window: document.getElementById('window'),
        pressure: document.getElementById('pressure'),
        light: document.getElementById('light'),
        timeSince: document.getElementById('time-since'),
        title: document.getElementById('main-title'),
        metTemp: document.getElementById('met-temp')
    };
}

// Add an event listener for language changes
document.addEventListener('languageChanged', () => {
    // Update moment.js locale for proper date formatting
    if (window.moment && window.I18n) {
        const lang = window.I18n.getCurrentLanguage();
        const momentLocale = lang === 'no' ? 'nb' : lang;
        window.moment.locale(momentLocale);
    }
    
    // Update data chips with new language
    updateUIWithLatestData();
    
    // Update weather display if available
    if (typeof updateWeatherDisplay === 'function') {
        updateWeatherDisplay();
    }
    
    // Update any timestamp-based elements
    document.querySelectorAll('[data-timestamp]').forEach(el => {
        const timestamp = el.getAttribute('data-timestamp');
        if (timestamp && window.moment) {
            el.textContent = window.moment(timestamp).fromNow();
        }
    });
});

// Weather functions are now in weather.js

// Store the latest data values for re-use when language changes
// Expose globally so other components can access it
window.latestData = {
    // Initial values
    temperature: null,
    battery: null,
    batteryVolt: null,
    windowOpening: null,
    pressure: null,
    light: null,
    timeSince: null,
    lastUpdated: null,
    createdAt: null
};

// Local reference for the module
let latestData = window.latestData;

async function fetchData() {
    try {
        // Get elements dynamically (after they've been created)
        const elements = getElements();
        
        // If elements aren't loaded yet, try again later
        if (!elements.temperature || !elements.battery) {
            setTimeout(fetchData, 500);
            return;
        }
        
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const responses = await Promise.all([
            fetch(`https://api.thingspeak.com/channels/${window.THINGSPEAK.DRIMON_CHANNEL}/feeds/last.json?timezone=${timezone}&status=true`),
            fetch(`https://api.thingspeak.com/channels/${window.THINGSPEAK.TEMP_CHANNEL}/status/last.json?timezone=${timezone}`),
            fetch(`https://api.thingspeak.com/channels/${window.THINGSPEAK.TECH_CHANNEL}/status/last.json?timezone=${timezone}`),
            fetch(`https://api.thingspeak.com/channels/${window.THINGSPEAK.EXT_CHANNEL}/status/last.json?timezone=${timezone}`),
        ]);

        const [data1, data2, data3, data4] = await Promise.all(responses.map(response => response.json()));
        const statuses = [status(data1), status(data2), status(data3), status(data4)];
        const lastStatus = statuses.sort((a, b) => moment(b.date).diff(moment(a.date)))[0];

        latestData.temperature = Math.round(data1.field1 * 10) / 10;
        latestData.battery = Math.round(data1.field6 * 10) / 10;
        latestData.batteryVolt = Math.round(data1.field5 * 100) / 100;
        latestData.windowOpening = Math.round(data1.field4);
        latestData.pressure = Math.round(data1.field7);
        latestData.light = Math.round(data1.field8);
        
        latestData.createdAt = moment(lastStatus.date);
        latestData.lastUpdated = latestData.createdAt.format('L LTS');
        latestData.timeSince = latestData.createdAt.fromNow();
        
        // Store information from all channels for the expanded tooltip
        window.latestData = latestData;

        window.latestData1 = {
            createdAt: moment(data1.created_at),
            lastUpdated: moment(data1.created_at).format('L LTS')
        };

        // Create latestData2 for details channel (plants monitoring)
        window.latestData2 = {
            createdAt: moment(data2.created_at),
            lastUpdated: moment(data2.created_at).format('L LTS')
        };


        // Create latestData3 for tech channel (system monitoring)
        window.latestData3 = {
            createdAt: moment(data3.created_at),
            lastUpdated: moment(data3.created_at).format('L LTS')
        };

        // Create latestData34 for ext channel (system monitoring)
        window.latestData4 = {
            createdAt: moment(data4.created_at),
            lastUpdated: moment(data4.created_at).format('L LTS')
        };

        // Call the updateUIWithLatestData function to update the UI
        updateUIWithLatestData();
    } catch (error) {
        console.error('Error fetching data:', error);
        const elements = getElements();
        if (elements.temperature) elements.temperature.textContent = 'Temperatur: Feil';
        if (elements.battery) elements.battery.textContent = 'Batteri: Feil';
        if (elements.timeSince) elements.timeSince.textContent = 'Sist oppdatert: Feil';
    }
}

function status(data) {
    return {
        "date": data.created_at,
        "status": data.status
    };
}


/**
 * Update the UI elements with the latest data
 * This function can be called both after data fetching and after language changes
 */
function updateUIWithLatestData() {
    // Ensure we have data and elements
    if (!latestData.temperature) return;
    
    const elements = getElements();
    if (!elements.temperature) return;
    
    // Update temperature with dynamic icon
    elements.temperature.innerHTML = `${latestData.temperature} °C`;
    const tempStatus = window.getStatusFromThreshold(latestData.temperature, window.THRESHOLDS.TEMPERATURE);
    elements.temperature.parentElement.className = `data-chip ${tempStatus}`;
    
    // Tooltip is handled by temp-tooltip-updater.js
    
    // Update temperature icon based on value
    const tempIcon = elements.temperature.parentElement.querySelector('i');
    if (tempIcon) {
        if (latestData.temperature < 5) {
            tempIcon.className = 'fas fa-thermometer-empty mr-1'; // Very cold
        } else if (latestData.temperature < 10) {
            tempIcon.className = 'fas fa-thermometer-quarter mr-1'; // Cold
        } else if (latestData.temperature < 15) {
            tempIcon.className = 'fas fa-thermometer-quarter mr-1'; // Cool
        } else if (latestData.temperature < 20) {
            tempIcon.className = 'fas fa-thermometer-half mr-1'; // Moderate
        } else if (latestData.temperature < 25) {
            tempIcon.className = 'fas fa-thermometer-half mr-1'; // Warm
        } else if (latestData.temperature < 30) {
            tempIcon.className = 'fas fa-thermometer-three-quarters mr-1'; // Hot
        } else if (latestData.temperature < 33) {
            tempIcon.className = 'fas fa-thermometer-full mr-1'; // Very hot
        } else {
            tempIcon.className = 'fas fa-fire mr-1'; // Extreme heat
        }
    }

    // Update battery with dynamic icon
    elements.battery.innerHTML = `${latestData.battery} %`;
    const batteryStatus = window.getStatusFromThreshold(latestData.battery, window.THRESHOLDS.BATTERY);
    elements.battery.parentElement.className = `data-chip ${batteryStatus}`;
    
    // Set tooltip content for battery that includes voltage
    const batteryTooltipData = {
        [window.I18n.translate('battery')]: `${latestData.battery}%`,
        [window.I18n.translate('batteryVoltage')]: `${latestData.batteryVolt}V`
    };

    // Format battery tooltip using HTML tabular formatter if available
    const batteryTooltip = window.Utils && typeof window.Utils.formatTabularTooltip === 'function'
        ? window.Utils.formatTabularTooltip(batteryTooltipData, { useHTML: true })
        : `${window.I18n.translate('battery')}: ${latestData.battery}%\n${window.I18n.translate('batteryVoltage')}: ${latestData.batteryVolt}V`;

    elements.battery.parentElement.setAttribute('data-tooltip-content', batteryTooltip);
    elements.battery.parentElement.setAttribute('data-has-tooltip', 'true');
    
    // Update battery icon based on level
    const batteryIcon = elements.battery.parentElement.querySelector('i');
    if (batteryIcon) {
        if (latestData.battery < 10) {
            batteryIcon.className = 'fas fa-battery-empty mr-1';
        } else if (latestData.battery < 25) {
            batteryIcon.className = 'fas fa-battery-quarter mr-1';
        } else if (latestData.battery < 50) {
            batteryIcon.className = 'fas fa-battery-quarter mr-1';
        } else if (latestData.battery < 75) {
            batteryIcon.className = 'fas fa-battery-half mr-1';
        } else if (latestData.battery < 95) {
            batteryIcon.className = 'fas fa-battery-three-quarters mr-1';
        } else {
            batteryIcon.className = 'fas fa-battery-full mr-1';
        }
    }

    // Battery voltage element is no longer shown as a separate chip
    
    // Get translated window state using I18n system
    const windowText = window.getStatusFromThreshold(latestData.windowOpening, window.THRESHOLDS.WINDOW, 'texts');
    let displayWindowState = windowText;
    if (window.I18n && typeof window.I18n.translate === 'function') {
        displayWindowState = window.I18n.translate(windowText);
    }
    
    if (elements.window) {
        elements.window.innerHTML = displayWindowState;
        elements.window.parentElement.className = `data-chip`;
        
        // Set tooltip content to show the actual value
        const windowTooltipData = {
            [window.I18n.translate('window')]: `${latestData.windowOpening}mm`,
            [window.I18n.translate('status')]: displayWindowState
        };

        // Format window tooltip using HTML tabular formatter if available
        const windowTooltip = window.Utils && typeof window.Utils.formatTabularTooltip === 'function'
            ? window.Utils.formatTabularTooltip(windowTooltipData, { useHTML: true })
            : `${window.I18n.translate('window')}: ${latestData.windowOpening}mm\n${displayWindowState}`;

        elements.window.parentElement.setAttribute('data-tooltip-content', windowTooltip);
        elements.window.parentElement.setAttribute('data-has-tooltip', 'true');
        
        // Update window icon based on state
        const windowIcon = elements.window.parentElement.querySelector('i');
        if (windowIcon) {
            if (windowText === 'Lukket') {
                windowIcon.className = 'fas fa-window-close mr-1';
            } else if (windowText === 'Glippe') {
                windowIcon.className = 'fas fa-grip-lines-vertical mr-1';
            } else if (windowText === 'Åpent') {
                windowIcon.className = 'fas fa-window-maximize mr-1';
            }
        }
    }

    elements.pressure.innerHTML = `${latestData.pressure} hPa`;
    const pressureStatus = window.getStatusFromThreshold(latestData.pressure, window.THRESHOLDS.PRESSURE);
    elements.pressure.parentElement.className = `data-chip ${pressureStatus}`;

    // Get translated light state using I18n system
    const lightText = window.getStatusFromThreshold(latestData.light, window.THRESHOLDS.LIGHT, 'texts');
    let displayLightState = lightText;
    if (window.I18n && typeof window.I18n.translate === 'function') {
        displayLightState = window.I18n.translate(lightText);
    }
    
    if (elements.light) {
        elements.light.innerHTML = displayLightState;
        elements.light.parentElement.className = `data-chip`;
        
        // Set tooltip content to show the actual light value
        const lightTooltipData = {
            [window.I18n.translate('ceiling')]: `${latestData.light} lux`,
            [window.I18n.translate('light')]: displayLightState
        };

        // Format light tooltip using HTML tabular formatter if available
        const lightTooltip = window.Utils && typeof window.Utils.formatTabularTooltip === 'function'
            ? window.Utils.formatTabularTooltip(lightTooltipData, { useHTML: true })
            : `${window.I18n.translate('ceiling')}: ${latestData.light} lux\n${displayLightState}`;

        elements.light.parentElement.setAttribute('data-tooltip-content', lightTooltip);
        elements.light.parentElement.setAttribute('data-has-tooltip', 'true');
    }

    if (elements.timeSince) {
        // Show HH:MM in the pill instead of "X minutes ago"
        const createdDate = new Date(latestData.createdAt);
        const timeFormatted = createdDate.toLocaleTimeString('no-NO', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        elements.timeSince.textContent = timeFormatted;
        elements.timeSince.setAttribute('data-timestamp', createdDate.toISOString());
    }
    
    // Use data-tooltip-content instead of title
    const timeIndicator = elements.timeSince?.parentElement;

    const timeTooltipData = {};
    
    // Create labels using channel info from THINGSPEAK.CHANNELS
    const drimonLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.DRIMON_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.DRIMON_CHANNEL.id})`;
    const tempLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.TEMP_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.TEMP_CHANNEL.id})`;
    const techLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.TECH_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.TECH_CHANNEL.id})`;
    const extLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.EXT_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.EXT_CHANNEL.id})`;

    // Add data from different channels with translated labels
    // timeTooltipData[drimonLabel] = latestData.lastUpdated;
    
    // Get data from other channels if available
    if (window.latestData1) {
        timeTooltipData[drimonLabel] = window.latestData1.lastUpdated;
    }

    if (window.latestData2) {
        timeTooltipData[tempLabel] = window.latestData2.lastUpdated;
    }
    
    if (window.latestData3) {
        timeTooltipData[techLabel] = window.latestData3.lastUpdated;
    }
    if (window.latestData4) {
        timeTooltipData[extLabel] = window.latestData4.lastUpdated;
    }
    
    // Add local time
    timeTooltipData[window.I18n.translate('localTime')] = moment().format('L LTS');
    
    // Add weather data timestamps if available
    if (window.latestWeatherData && window.latestWeatherData.properties) {
        const weatherData = window.latestWeatherData.properties;
        
        // 1. First add the forecast time (the actual time the data is for)
        if (weatherData.timeseries && weatherData.timeseries.length > 0) {
            timeTooltipData[window.I18n.translate('forecastTime')] = moment(weatherData.timeseries[0].time).format('L LTS');
        }
        
        // 2. Then add the nowcast data update time (when met.no updated their data)
        if (weatherData.meta?.updated_at) {
            timeTooltipData[window.I18n.translate('nowcastUpdated')] = moment(weatherData.meta.updated_at).format('L LTS');
        }
    }
    
    // 3. Finally add the forecast data update time
    if (window.latestForecastData && window.latestForecastData._lastUpdated) {
        timeTooltipData[window.I18n.translate('forecastUpdated')] = moment(window.latestForecastData._lastUpdated).format('L LTS');
    } 
    // If we don't have forecast data yet but we have the Forecast module, try to get it
    else if (window.Forecast && typeof window.Forecast.fetchForecastData === 'function') {
        // Try to fetch forecast data on demand
        window.Forecast.fetchForecastData().then(data => {
            if (data && data._lastUpdated) {
                // We'll update this in the next refresh
            }
        }).catch(() => {});
    }

    // Add the "X minutes ago" text as the first item in the tooltip
    const updateTimeData = {
        [window.I18n.translate('time')]: latestData.timeSince
    };
    
    // Combine update time with other channel data
    const combinedTooltipData = { ...updateTimeData, ...timeTooltipData };
    
    // Format time tooltip using HTML tabular formatter with section divider
    const timeTooltip = window.Utils && typeof window.Utils.formatTabularTooltip === 'function'
        ? window.Utils.formatTabularTooltip(combinedTooltipData, { 
            useHTML: true, 
            dividerAfter: window.I18n.translate('time') // Divider after the time update info
          })
        : JSON.stringify(combinedTooltipData);

    if (timeIndicator) {
        timeIndicator.setAttribute('data-tooltip-content', timeTooltip);
        timeIndicator.setAttribute('data-has-tooltip', 'true');
    }
    
    if (elements.title) {
        elements.title.title = latestData.status;
    }
    
    // Update page title
    document.title = `${latestData.temperature}°C | DriMon`;
}
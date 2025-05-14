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
        
        const responses = await Promise.all([
            fetch(`https://api.thingspeak.com/channels/${window.THINGSPEAK.DRIMON_CHANNEL}/feeds/last.json?timezone=${timezone}&status=true`),
            fetch(`https://api.thingspeak.com/channels/${window.THINGSPEAK.DETAILS_CHANNEL}/status/last.json?timezone=${timezone}`),
	        fetch(`https://api.thingspeak.com/channels/${window.THINGSPEAK.TECH_CHANNEL}/status/last.json?timezone=${timezone}`),
        ]);

        const [data1, data2, data3] = await Promise.all(responses.map(response => response.json()));
        const statuses = [status(data1), status(data2), status(data3)];
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
        
        // Create latestData2 for channel 2584548 (plants monitoring)
        window.latestData2 = {
            createdAt: moment(data2.created_at),
            lastUpdated: moment(data2.created_at).format('L LTS')
        };
        
        // Create latestData3 for channel 2584547 (system monitoring)
        window.latestData3 = {
            createdAt: moment(data3.created_at),
            lastUpdated: moment(data3.created_at).format('L LTS')
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

function getClassName(value, lowThreshold, highThreshold) {
    if (value > highThreshold) return 'high';
    if (value < lowThreshold) return 'low';
    return 'norm';
}

function getBatteryClassName(battery) {
    if (battery > 80) return 'full';
    if (battery < 10) return 'bat-low';
    return 'ok';
}

function getPressureClassName(pressure) {
    if (pressure > 1010) return 'pressure-high';
    if (pressure < 1000) return 'pressure-low';
    return '';
}

function getWindowText(windowOpening) {
    if (windowOpening < 75) return 'Lukket';
    if (windowOpening < 100) return 'Glippe';
    return 'Åpent';
}

function getLightText(light) {
    if (light < 5) return 'Natt';
    if (light < 500) return 'Skumring';
    if (light < 9000) return 'Skyet';
    return 'Sol';
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
    elements.temperature.parentElement.className = `data-chip ${getClassName(latestData.temperature, 16, 35)}`;
    
    // Set tooltip content for temperature
    const tempTooltip = `${window.I18n.translate('temperature')}: ${latestData.temperature} °C`;
    elements.temperature.parentElement.setAttribute('data-tooltip-content', tempTooltip);
    elements.temperature.parentElement.setAttribute('data-has-tooltip', 'true');
    
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
    elements.battery.parentElement.className = `data-chip ${getBatteryClassName(latestData.battery)}`;
    
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
    const windowState = getWindowText(latestData.windowOpening);
    let displayWindowState = windowState;
    if (window.I18n && typeof window.I18n.translate === 'function') {
        // Map window state to translation key
        const stateKey = windowState === 'Lukket' ? 'closed' : 
                         windowState === 'Glippe' ? 'ajar' : 
                         windowState === 'Åpent' ? 'open' : windowState;
        displayWindowState = window.I18n.translate(stateKey);
    }
    
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
        if (windowState === 'Lukket') {
            windowIcon.className = 'fas fa-window-close mr-1';
        } else if (windowState === 'Glippe') {
            windowIcon.className = 'fas fa-grip-lines-vertical mr-1';
        } else if (windowState === 'Åpent') {
            windowIcon.className = 'fas fa-window-maximize mr-1';
        }
    }

    elements.pressure.innerHTML = `${latestData.pressure} hPa`;
    elements.pressure.parentElement.className = `data-chip ${getPressureClassName(latestData.pressure)}`;

    // Get translated light state using I18n system
    const lightState = getLightText(latestData.light);
    let displayLightState = lightState;
    if (window.I18n && typeof window.I18n.translate === 'function') {
        // Map light state to translation key
        const lightKey = lightState === 'Natt' ? 'night' : 
                         lightState === 'Skumring' ? 'dusk' : 
                         lightState === 'Skyet' ? 'cloudy' : 
                         lightState === 'Sol' ? 'sunny' : lightState;
        displayLightState = window.I18n.translate(lightKey);
    }
    
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

    elements.timeSince.textContent = latestData.timeSince;
    elements.timeSince.setAttribute('data-timestamp', latestData.createdAt.toISOString());
    
    // Use data-tooltip-content instead of title
    const timeIndicator = elements.timeSince.parentElement;

    const timeTooltipData = {};
    
    // Define all the labels upfront to avoid undefined references
    const drimonLabel = `${window.I18n.translate('drimonChannel')} (${window.THINGSPEAK.DRIMON_CHANNEL})`;
    const detailsLabel = `${window.I18n.translate('detailsChannel')} (${window.THINGSPEAK.DETAILS_CHANNEL})`;
    const techLabel = `${window.I18n.translate('techChannel')} (${window.THINGSPEAK.TECH_CHANNEL})`;
    
    // Add data from different channels with translated labels
    timeTooltipData[drimonLabel] = latestData.lastUpdated;
    
    // Get data from other channels if available
    if (window.latestData2) {
        timeTooltipData[detailsLabel] = window.latestData2.lastUpdated;
    }
    
    if (window.latestData3) {
        timeTooltipData[techLabel] = window.latestData3.lastUpdated;
    }
    
    // Add local time
    timeTooltipData[window.I18n.translate('localTime')] = moment().format('L LTS');
    
    // Add weather data timestamps if available
    if (window.latestWeatherData && window.latestWeatherData.properties) {
        const weatherData = window.latestWeatherData.properties;
        
        // When the API data was updated at met.no
        if (weatherData.meta?.updated_at) {
            timeTooltipData[window.I18n.translate('weatherUpdated')] = moment(weatherData.meta.updated_at).format('L LTS');
        }
        
        // The forecast time (current conditions)
        if (weatherData.timeseries && weatherData.timeseries.length > 0) {
            timeTooltipData[window.I18n.translate('forecastTime')] = moment(weatherData.timeseries[0].time).format('L LTS');
        }
    }

    // Format time tooltip using HTML tabular formatter with section divider
    const timeTooltip = window.Utils && typeof window.Utils.formatTabularTooltip === 'function'
        ? window.Utils.formatTabularTooltip(timeTooltipData, { 
            useHTML: true, 
            dividerAfter: techLabel // Variable we defined above for the Tech label
          })
        : JSON.stringify(timeTooltipData);

    timeIndicator.setAttribute('data-tooltip-content', timeTooltip);
    timeIndicator.setAttribute('data-has-tooltip', 'true');
    
    if (elements.title) {
        elements.title.title = latestData.status;
    }
    
    // Update page title
    document.title = `${latestData.temperature}°C | DriMon`;
}
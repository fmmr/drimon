// Get elements function for dynamic access to DOM elements 
function getElements() {
    return {
        temperature: document.getElementById('temperature'),
        battery: document.getElementById('battery'),
        batteryVolt: document.getElementById('batteryVolt'),
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
    if (window.moment && window.i18n) {
        const lang = window.i18n.getCurrentLanguage();
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
let latestData = {
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
            fetch(`https://api.thingspeak.com/channels/2568299/feeds/last.json?timezone=${timezone}&status=true`),
            fetch(`https://api.thingspeak.com/channels/2584548/status/last.json?timezone=${timezone}`),
	        fetch(`https://api.thingspeak.com/channels/2584547/status/last.json?timezone=${timezone}`),
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

    elements.batteryVolt.innerHTML = `${latestData.batteryVolt} v`;
    elements.batteryVolt.parentElement.className = `data-chip ${getBatteryClassName(latestData.battery)}`;
    
    // Get translated window state if i18n is available
    const windowState = getWindowText(latestData.windowOpening);
    let displayWindowState = windowState;
    if (window.i18n && typeof window.i18n.__ === 'function') {
        // Map window state to translation key
        const stateKey = windowState === 'Lukket' ? 'closed' : 
                         windowState === 'Glippe' ? 'ajar' : 
                         windowState === 'Åpent' ? 'open' : windowState;
        displayWindowState = window.i18n.__(stateKey);
    }
    
    elements.window.innerHTML = displayWindowState;
    elements.window.parentElement.className = `data-chip`;
    elements.window.parentElement.title = `${latestData.windowOpening}mm`;
    
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

    // Get translated light state if i18n is available
    const lightState = getLightText(latestData.light);
    let displayLightState = lightState;
    if (window.i18n && typeof window.i18n.__ === 'function') {
        // Map light state to translation key
        const lightKey = lightState === 'Natt' ? 'night' : 
                         lightState === 'Skumring' ? 'dusk' : 
                         lightState === 'Skyet' ? 'cloudy' : 
                         lightState === 'Sol' ? 'sunny' : lightState;
        displayLightState = window.i18n.__(lightKey);
    }
    
    elements.light.innerHTML = displayLightState;
    elements.light.parentElement.title = `${latestData.light} lux`;
    elements.light.parentElement.className = `data-chip`;

    elements.timeSince.textContent = latestData.timeSince;
    elements.timeSince.setAttribute('data-timestamp', latestData.createdAt.toISOString());
    elements.timeSince.parentElement.title = latestData.lastUpdated;
    
    if (elements.title) {
        elements.title.title = latestData.status;
    }
    
    // Update page title
    document.title = `${latestData.temperature}°C | DriMon`;
}
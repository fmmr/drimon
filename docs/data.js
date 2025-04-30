const elements = {
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

// Function to fetch Met.no weather data
async function fetchMetData() {
    // Røtangen coordinates
    const metUrl = 'https://api.met.no/weatherapi/nowcast/2.0/complete?lat=59.532213&lon=10.418231';
    
    try {
        // Check localStorage cache first
        const lastFetchTime = localStorage.getItem('lastMetFetchTime');
        const currentTime = new Date().getTime();
        
        // Use cached data if it's less than 10 minutes old
        if (lastFetchTime && (currentTime - parseInt(lastFetchTime) < 10 * 60 * 1000)) {
            const cachedData = localStorage.getItem('cachedMetData');
            if (cachedData) {
                const data = JSON.parse(cachedData);
                updateMetDisplay(data);
                return; // Exit early with cached data
            }
        }
        
        // Try direct fetch from YR.no
        try {
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
            
            // Add source information
            data._source = 'yr.no';
            
            // Cache the successful response
            localStorage.setItem('cachedMetData', JSON.stringify(data));
            localStorage.setItem('lastMetFetchTime', currentTime.toString());
            
            updateMetDisplay(data);
            return;
        } catch (yrError) {
            console.error('Direct Met.no fetch failed:', yrError);
            // Fall through to ThingSpeak fallback
        }
        
        // Fallback to ThingSpeak if direct method fails
        const thingspeakResponse = await fetch(`https://api.thingspeak.com/channels/2626867/feeds/last.json?timezone=${timezone}`);
        
        if (!thingspeakResponse.ok) {
            throw new Error(`ThingSpeak API responded with status: ${thingspeakResponse.status}`);
        }
        
        const tsData = await thingspeakResponse.json();
        
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
        console.error('All weather data fetches failed:', error);
        if (elements.metTemp) {
            elements.metTemp.innerHTML = 'Feil';
            elements.metTemp.parentElement.title = 'Kunne ikke hente værdata';
        }
    }
}

function updateMetDisplay(data) {
    if (!elements.metTemp) return;
    
    const temperature = Math.round(data.properties.timeseries[0].data.instant.details.air_temperature * 10) / 10;
    const createdAt = moment(data.properties.timeseries[0].time);
    const lastUpdated = createdAt.format('L LTS');
    
    // Determine the data source
    const dataSource = data._source ? data._source : 'yr.no';
    
    // Get weather symbol code if available
    let symbolCode = '';
    if (data.properties.timeseries[0].data.next_1_hours && 
        data.properties.timeseries[0].data.next_1_hours.summary && 
        data.properties.timeseries[0].data.next_1_hours.summary.symbol_code) {
        symbolCode = data.properties.timeseries[0].data.next_1_hours.summary.symbol_code;
    }
    
    // Update temperature text
    elements.metTemp.innerHTML = `yr: ${temperature} °C`;
    elements.metTemp.parentElement.className = `data-chip ${getClassName(temperature, 15, 25)}`;
    elements.metTemp.parentElement.title = `Ute Temperatur - Oppdatert: ${lastUpdated} (Kilde: ${dataSource})`;
    
    // Update weather icon if we have a symbol code
    if (symbolCode) {
        // Create or update the icon
        let iconElem = document.getElementById('met-icon');
        if (!iconElem) {
            // Create icon container if it doesn't exist
            iconElem = document.createElement('div');
            iconElem.id = 'met-icon';
            iconElem.className = 'met-weather-icon';
            
            // Insert before the temperature text
            elements.metTemp.parentElement.insertBefore(iconElem, elements.metTemp);
        }
        
        // Set the icon using the SVG
        iconElem.innerHTML = `<img src="weather-icons/${symbolCode}.svg" alt="${symbolCode}" width="16" height="16">`;
    }
}

async function fetchData() {
    try {
        const responses = await Promise.all([
            fetch(`https://api.thingspeak.com/channels/2568299/feeds/last.json?timezone=${timezone}&status=true`),
            fetch(`https://api.thingspeak.com/channels/2584548/status/last.json?timezone=${timezone}`),
	        fetch(`https://api.thingspeak.com/channels/2584547/status/last.json?timezone=${timezone}`),
        ]);

        const [data1, data2, data3] = await Promise.all(responses.map(response => response.json()));
        const statuses = [status(data1), status(data2), status(data3)];
        const lastStatus = statuses.sort((a, b) => moment(b.date).diff(moment(a.date)))[0];

        const temperature = Math.round(data1.field1 * 10) / 10;
        const battery = Math.round(data1.field6 * 10) / 10;
        const batteryVolt = Math.round(data1.field5 * 100) / 100;
        const windowOpening = Math.round(data1.field4);
        const pressure = Math.round(data1.field7);
        const light = Math.round(data1.field8);

        const createdAt = moment(lastStatus.date);
        const lastUpdated = createdAt.format('L LTS');
        const timeSince = createdAt.fromNow();

        // Update temperature with dynamic icon
        elements.temperature.innerHTML = `${temperature} °C`;
        elements.temperature.parentElement.className = `data-chip ${getClassName(temperature, 16, 35)}`;
        
        // Update temperature icon based on value
        const tempIcon = elements.temperature.parentElement.querySelector('i');
        if (tempIcon) {
            if (temperature < 5) {
                tempIcon.className = 'fas fa-thermometer-empty mr-1'; // Very cold
            } else if (temperature < 10) {
                tempIcon.className = 'fas fa-thermometer-quarter mr-1'; // Cold
            } else if (temperature < 15) {
                tempIcon.className = 'fas fa-thermometer-quarter mr-1'; // Cool
            } else if (temperature < 20) {
                tempIcon.className = 'fas fa-thermometer-half mr-1'; // Moderate
            } else if (temperature < 25) {
                tempIcon.className = 'fas fa-thermometer-half mr-1'; // Warm
            } else if (temperature < 30) {
                tempIcon.className = 'fas fa-thermometer-three-quarters mr-1'; // Hot
            } else if (temperature < 33) {
                tempIcon.className = 'fas fa-thermometer-full mr-1'; // Very hot
            } else {
                tempIcon.className = 'fas fa-fire mr-1'; // Extreme heat
            }
        }

        // Update battery with dynamic icon
        elements.battery.innerHTML = `${battery} %`;
        elements.battery.parentElement.className = `data-chip ${getBatteryClassName(battery)}`;
        
        // Update battery icon based on level
        const batteryIcon = elements.battery.parentElement.querySelector('i');
        if (batteryIcon) {
            if (battery < 10) {
                batteryIcon.className = 'fas fa-battery-empty mr-1';
            } else if (battery < 25) {
                batteryIcon.className = 'fas fa-battery-quarter mr-1';
            } else if (battery < 50) {
                batteryIcon.className = 'fas fa-battery-quarter mr-1';
            } else if (battery < 75) {
                batteryIcon.className = 'fas fa-battery-half mr-1';
            } else if (battery < 95) {
                batteryIcon.className = 'fas fa-battery-three-quarters mr-1';
            } else {
                batteryIcon.className = 'fas fa-battery-full mr-1';
            }
        }

        elements.batteryVolt.innerHTML = `${batteryVolt} v`;
        elements.batteryVolt.parentElement.className = `data-chip ${getBatteryClassName(battery)}`;

        const windowState = getWindowText(windowOpening);
        elements.window.innerHTML = `${windowState}`;
        elements.window.parentElement.className = `data-chip`;
        elements.window.parentElement.title = `${windowOpening}mm`;
        
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

        elements.pressure.innerHTML = `${pressure} hPa`;
        elements.pressure.parentElement.className = `data-chip ${getPressureClassName(pressure)}`;

        elements.light.innerHTML = `${getLightText(light)}`;
        elements.light.parentElement.title = `${light} lux`;
        elements.light.parentElement.className = `data-chip`;

        elements.timeSince.textContent = `${timeSince}`;
        elements.timeSince.parentElement.title = `${lastUpdated}`;
        elements.title.title = `${lastStatus.status}`;
    } catch (error) {
        console.error('Error fetching data:', error);
        elements.temperature.textContent = 'Temperatur: Feil';
        elements.battery.textContent = 'Batteri: Feil';
        elements.timeSince.textContent = 'Sist oppdatert: Feil';
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
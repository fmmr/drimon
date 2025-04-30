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
    try {
        // Use ThingSpeak channel that already has Met data to avoid CORS issues in Safari
        const response = await fetch(`https://api.thingspeak.com/channels/2626867/feeds/last.json?timezone=${timezone}`);
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Format data in a compatible way for updateMetDisplay
        const formattedData = {
            properties: {
                timeseries: [{
                    time: data.created_at,
                    data: {
                        instant: {
                            details: {
                                air_temperature: parseFloat(data.field1)
                            }
                        }
                    }
                }]
            }
        };
        
        updateMetDisplay(formattedData);
    } catch (error) {
        console.error('Error fetching Met data:', error);
        if (elements.metTemp) {
            elements.metTemp.innerHTML = 'Feil';
        }
    }
}

function updateMetDisplay(data) {
    if (!elements.metTemp) return;
    
    const temperature = Math.round(data.properties.timeseries[0].data.instant.details.air_temperature * 10) / 10;
    const createdAt = moment(data.properties.timeseries[0].time);
    const lastUpdated = createdAt.format('L LTS');
    
    elements.metTemp.innerHTML = `${temperature} °C`;
    elements.metTemp.parentElement.className = `data-chip ${getClassName(temperature, 15, 25)}`;
    elements.metTemp.parentElement.title = `Ute Temperatur - Oppdatert: ${lastUpdated}`;
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

        elements.temperature.innerHTML = `${temperature} °C`;
        elements.temperature.parentElement.className = `data-chip ${getClassName(temperature, 16, 35)}`;

        elements.battery.innerHTML = `${battery} %`;
        elements.battery.parentElement.className = `data-chip ${getBatteryClassName(battery)}`;

        elements.batteryVolt.innerHTML = `${batteryVolt} v`;
        elements.batteryVolt.parentElement.className = `data-chip ${getBatteryClassName(battery)}`;

        elements.window.innerHTML = `${getWindowText(windowOpening)}`;
        elements.window.parentElement.className = `data-chip`;
        elements.window.parentElement.title = `${windowOpening}mm`;

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
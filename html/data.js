
const elements = {
    temperature: document.getElementById('temperature'),
    battery: document.getElementById('battery'),
    batteryVolt: document.getElementById('batteryVolt'),
    window: document.getElementById('window'),
    pressure: document.getElementById('pressure'),
    light: document.getElementById('light'),
    timeSince: document.getElementById('time-since'),
    title: document.getElementById('main-title')
};

async function fetchData() {
    try {
        const responses = await Promise.all([
            fetch(`https://api.thingspeak.com/channels/2568299/feeds/last.json?timezone=${timezone}&status=true`),
            fetch(`https://api.thingspeak.com/channels/2584548/status/last.json?timezone=${timezone}`),
            fetch(`https://api.thingspeak.com/channels/2584547/status/last.json?timezone=${timezone}`)
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
        elements.temperature.className = `value ${getClassName(temperature, 16, 35)}`;

        elements.battery.innerHTML = `${battery} %`;
        elements.battery.className = `value ${getBatteryClassName(battery)}`;

        elements.batteryVolt.innerHTML = `${batteryVolt} v`;
        elements.batteryVolt.className = `value ${getBatteryClassName(battery)}`;

        elements.window.innerHTML = `${getWindowText(windowOpening)}`;
        elements.window.className = `value`;
        elements.window.title = `${windowOpening}mm`;

        elements.pressure.innerHTML = `${pressure} hPa`;
        elements.pressure.className = `value`;

        elements.light.innerHTML = `${getLightText(light)}`;
        elements.light.title = `${light} lux`;

        elements.timeSince.textContent = `${timeSince}`;
        elements.timeSince.title = `${lastUpdated}`;
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
    if (battery > 90) return 'full';
    if (battery < 10) return 'bat-low';
    return 'ok';
}

function getWindowText(windowOpening) {
    if (windowOpening < 75) return 'Lukket';
    if (windowOpening < 100) return 'Glippe';
    return 'Åpent';
}

function getLightText(light) {
    if (light < 5) return 'Natt';
    if (light < 500) return 'Skumring';
    if (light < 12000) return 'Skyet';
    return 'Sol';
}

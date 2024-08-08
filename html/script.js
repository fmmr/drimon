const iframeConfigs = [
    { src: 'https://thingspeak.com/channels/2568299/charts/1', area: '1 / 1 / 2 / 3', title: 'Temperatur' },
    { src: 'https://thingspeak.com/channels/2568299/charts/4', area: '1 / 3 / 2 / 5', title: 'Vindusåpning' },
    { src: 'https://thingspeak.com/channels/2568299/charts/8', area: '1 / 5 / 2 / 7', title: 'Lys' },
    { src: 'https://thingspeak.com/channels/2584547/charts/3', area: '1 / 7 / 2 / 9', title: 'Batteri' },

    { src: 'https://thingspeak.com/channels/2568299/charts/7', area: '2 / 1 / 3 / 3', title: 'Lufttrykk' },
    { src: 'https://thingspeak.com/channels/2568299/charts/2', area: '2 / 3 / 3 / 5', title: 'Luftfuktighet' },
    { src: 'https://thingspeak.com/channels/2584547/charts/2', area: '2 / 5 / 3 / 7', title: 'Batteri' },
    { src: 'https://thingspeak.com/channels/2584547/charts/1', area: '2 / 7 / 3 / 9', title: 'WiFi' },

    { src: 'https://thingspeak.com/channels/2584548/charts/6', area: '3 / 1 / 4 / 3', title: 'Fuktighet Agurk' },
    { src: 'https://thingspeak.com/channels/2584548/charts/7', area: '3 / 3 / 4 / 5', title: 'Fuktighet Tomat' },
    { src: 'https://thingspeak.com/channels/2584548/charts/8', area: '3 / 5 / 4 / 7', title: 'Fuktighet Paprika' },
    { src: 'https://thingspeak.com/channels/2584548/charts/3', area: '3 / 7 / 4 / 8', title: 'Agurk' },
    { src: 'https://thingspeak.com/channels/2584548/charts/5', area: '3 / 8 / 4 / 9', title: 'Paprika' },

    { src: 'https://thingspeak.com/channels/2584548/charts/1', area: '4 / 1 / 5 / 3', title: 'BME Temp' },
    { src: 'https://thingspeak.com/channels/2584548/charts/2', area: '4 / 3 / 5 / 5', title: 'AHT Temp' },
    { src: 'https://thingspeak.com/channels/2584548/charts/4', area: '4 / 5 / 5 / 7', title: 'Gulv Temp' },
    { src: 'https://thingspeak.com/channels/2584547/charts/5', area: '4 / 7 / 5 / 8', title: 'Lys Int' },
    { src: 'https://thingspeak.com/channels/2584547/charts/4', area: '4 / 8 / 5 / 9', title: 'Tid brukt' },
];

const iframeContainer = document.getElementById('iframeContainer');
const resultsInput = document.getElementById('resultsInput');
const updateButton = document.getElementById('updateButton');

const temperatureElement = document.getElementById('temperature');
const batteryElement = document.getElementById('battery');
const batteryVoltElement = document.getElementById('batteryVolt');
const windowElement = document.getElementById('window');
const pressureElement = document.getElementById('pressure');
const lightElement = document.getElementById('light');
const timeSinceElement = document.getElementById('time-since');
const updatedElement = document.getElementById('updated');
const titleElement = document.getElementById('main-title');
const format = 'YYYY-MM-DD HH:mm:ss';
const timezone = encodeURIComponent("Europe/Paris");

const startDate = moment().subtract(3, 'days').startOf('day').format(format);

function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function status(data) {
    return {
        "date": data.created_at,
        "status": data.status
    };
}

async function fetchData() {
    try {
        const responses = await Promise.all([
            fetch(`https://api.thingspeak.com/channels/2568299/feeds/last.json?timezone=${timezone}&status=true`),
            fetch(`https://api.thingspeak.com/channels/2584548/status/last.json?timezone=${timezone}`),
            fetch(`https://api.thingspeak.com/channels/2584547/status/last.json?timezone=${timezone}`)
        ]);

        const [data1, data2, data3] = await Promise.all(responses.map(response => response.json()));

        const status1 = status(data1);
        const status2 = status(data2);
        const status3 = status(data3);

        const statusArray = [status1, status2, status3];
        const lastStatus = statusArray.sort((a, b) => moment(b.date).diff(moment(a.date)))[0];

        const temperature = Math.round(data1.field1 * 10) / 10;
        const battery = Math.round(data1.field6 * 10) / 10;
        const batteryVolt = Math.round(data1.field5 * 100) / 100;

        const windowOpening = Math.round(data1.field4);
        const pressure = Math.round(data1.field7);
        const light = Math.round(data1.field8);

        const createdAt = moment(lastStatus.date);
        const lastUpdated = createdAt.format('L LTS');
        const timeSince = createdAt.fromNow();

        let temperatureClass = '';
        if (temperature > 35) {
            temperatureClass = 'high';
        } else if (temperature < 16) {
            temperatureClass = 'low';
        } else {
            temperatureClass = 'norm';
        }

        let batteryClass = '';
        if (battery > 90) {
            batteryClass = 'full';
        } else if (battery < 10) {
            batteryClass = 'low';
        } else {
            batteryClass = 'ok';
        }

        let batteryVoltClass = '';
        if (battery > 90) {
            batteryVoltClass = 'full';
        } else if (battery < 10) {
            batteryVoltClass = 'low';
        } else {
            batteryVoltClass = 'ok';
        }

        let windowText = '';
        if (windowOpening < 75) {
            windowText = 'Lukket';
        } else if (windowOpening < 100) {
            windowText = 'Glippe';
        } else {
            windowText = 'Åpent';
        }

        let lightText = '';
        if (light < 5) {
            lightText = 'Natt';
        } else if (light < 500) {
            lightText = 'Skumring';
        } else if (light < 12000) {
            lightText = 'Skyet';
        } else {
            lightText = 'Sol';
        }

        temperatureElement.innerHTML = `${temperature} °C`;
        temperatureElement.className = `value ${temperatureClass}`;

        batteryElement.innerHTML = `${battery} %`;
        batteryElement.className = `value ${batteryClass}`;

        batteryVoltElement.innerHTML = `${batteryVolt} v`;
        batteryVoltElement.className = `value ${batteryVoltClass}`;

        windowElement.innerHTML = `${windowText}`;
        windowElement.className = `value`;
        windowElement.title = `${windowOpening}mm`;

        pressureElement.innerHTML = `${pressure} hPa`;
        pressureElement.className = `value`;

        lightElement.innerHTML = `${lightText}`;
        lightElement.title = `${light} lux`;

        timeSinceElement.textContent = `${timeSince}`;
        timeSinceElement.title = `${lastUpdated}`;
        titleElement.title = `${lastStatus.status}`;
    } catch (error) {
        console.error('Error fetching data:', error);
        temperatureElement.textContent = 'Temperatur: Feil';
        batteryElement.textContent = 'Batteri: Feil';
        timeSinceElement.textContent = 'Sist oppdatert: Feil';
    }
}

function getUrl(src, title, results, start, end) {
    return `${src}?timezone=${timezone}&title=${encodeURIComponent(title)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&results=${results}&dynamic=true&width=auto&height=auto&xaxis=&round=2`;
}

function updateIframes(results, start, end) {
    const isMobile = window.innerWidth <= 768;
    iframeContainer.innerHTML = '';

    iframeConfigs.forEach(config => {
        const { src, title, area } = config;
        const container = document.createElement('div');
        container.classList.add('iframe-container');
        container.style.gridArea = area;
        if (isMobile) {
            container.style.height = '200px';
        }

        const iframe = document.createElement('iframe');
        iframe.src = getUrl(src, title, results, start, end);
        container.appendChild(iframe);
        iframeContainer.appendChild(container);
    });
}

updateButton.addEventListener('click', () => {
    const results = resultsInput.value || 8000;
    updateIframes(results);
});

resultsInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const results = resultsInput.value || 8000;
        updateIframes(results);
    }
});

// Initial load
const initialResults = getURLParameter('results') || resultsInput.value || 8000;
const initialStart = getURLParameter('startDate') || startDate;
const initialEnd = getURLParameter('endDate') || "";

fetchData();
updateIframes(initialResults, initialStart, initialEnd);

// Update data every minute
setInterval(fetchData, 60000);

let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;
let resizeTimeout;

function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Check if the resize is significant
    if (Math.abs(width - lastWidth) > 50 || Math.abs(height - lastHeight) > 50) {
        lastWidth = width;
        lastHeight = height;

        const results = getURLParameter('results') || resultsInput.value || 8000;
        const start = getURLParameter('startDate') || startDate;
        const end = getURLParameter('endDate') || "";
        updateIframes(results, start, end);
    }
}
function debounceThrottle(func, wait, immediate) {
    let timeout;
    return function (...args) {
        const context = this;
        const later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}
window.addEventListener('resize', () => {
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(handleResize, 150);
});

document.addEventListener('DOMContentLoaded', function () {
    const dateLinks = document.querySelectorAll('.date-link');

    dateLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const range = this.dataset.range;
            const now = moment();
            let startDate = '';
            let endDate = '';

            switch (range) {
                case range.match(/.*days$/)?.input:
                    let days = range.substring(0, range.indexOf("-"));
                    startDate = moment().subtract(days, 'days').startOf('day').format(format);
                    break;
                case 'start':
                    startDate = moment().startOf('year').format(format);
                    break;
                case 'today':
                    startDate = moment().startOf('day').format(format);
                    break;
                case 'this-week':
                    startDate = moment().startOf('week').format(format);
                    break;
                case 'yesterday':
                    startDate = moment().subtract(1, 'days').startOf('day').format(format);
                    endDate = moment().startOf('day').format(format);
                    break;
                case 'last-week':
                    startDate = moment().subtract(1, 'weeks').startOf('week').format(format);
                    endDate = moment().startOf('week').format(format);
                    break;
                case 'this-month':
                    startDate = moment().startOf('month').format(format);
                    break;
                case 'last-month':
                    startDate = moment().subtract(1, 'months').startOf('month').format(format);
                    endDate = moment().startOf('month').format(format);
                    break;
                case 'this-year':
                    startDate = moment().startOf('year').format(format);
                    break;
                case 'last-year':
                    startDate = moment().subtract(1, 'years').startOf('year').format(format);
                    endDate = moment().startOf('year').format(format);
                    break;
                case 'custom':
                    startDate = prompt("Startdato (YYYY-MM-DD HH:mm:ss):", "");
                    endDate = prompt("Sluttdato (YYYY-MM-DD HH:mm:ss):", "");
                    break;
            }

            let url = `${window.location.pathname}?startDate=${startDate}&endDate=${endDate}`;
            window.location.href = url;
        });
    });
});

const iframeConfigs = [
    { src: 'https://thingspeak.com/channels/2568299/charts/1', area: '1 / 1 / 2 / 2', title: 'Temperatur' },
    { src: 'https://thingspeak.com/channels/2568299/charts/4', area: '1 / 2 / 2 / 3', title: 'Vindusåpning' },
    { src: 'https://thingspeak.com/channels/2568299/charts/8', area: '1 / 3 / 2 / 4', title: 'Lys' },
    { src: 'https://thingspeak.com/channels/2584547/charts/3', area: '1 / 4 / 2 / 5', title: 'Batteri' },

    { src: 'https://thingspeak.com/channels/2568299/charts/7', area: '2 / 1 / 3 / 2', title: 'Lufttrykk' },
    { src: 'https://thingspeak.com/channels/2568299/charts/2', area: '2 / 2 / 3 / 3', title: 'Luftfuktighet' },
    { src: 'https://thingspeak.com/channels/2584547/charts/2', area: '2 / 3 / 3 / 4', title: 'Batteri' },
    { src: 'https://thingspeak.com/channels/2584547/charts/1', area: '2 / 4 / 3 / 5', title: 'WiFi' },

    { src: 'https://thingspeak.com/channels/2584548/charts/6', area: '3 / 1 / 4 / 2', title: 'Fuktighet Agurk' },
    { src: 'https://thingspeak.com/channels/2584548/charts/7', area: '3 / 2 / 4 / 3', title: 'Fuktighet Tomat' },
    { src: 'https://thingspeak.com/channels/2584548/charts/8', area: '3 / 3 / 4 / 4', title: 'Fuktighet Paprika' },
    { src: 'https://thingspeak.com/channels/2584548/charts/3', area: '3 / 4 / 4 / 4', shared: true, title: 'Temp Agurk' },
    { src: 'https://thingspeak.com/channels/2584548/charts/5', area: '3 / 4 / 4 / 4', shared: true, title: 'Temp Paprika' },

    { src: 'https://thingspeak.com/channels/2584548/charts/1', area: '4 / 1 / 5 / 2', title: 'BME Temp' },
    { src: 'https://thingspeak.com/channels/2584548/charts/2', area: '4 / 2 / 5 / 3', title: 'AHT Temp' },
    { src: 'https://thingspeak.com/channels/2584548/charts/4', area: '4 / 3 / 5 / 4', title: 'Gulv Temp' },
    { src: 'https://thingspeak.com/channels/2584547/charts/4', area: '4 / 4 / 5 / 5', title: 'Tid brukt' },
];

const iframeContainer = document.getElementById('iframeContainer');
const resultsInput = document.getElementById('resultsInput');
const updateButton = document.getElementById('updateButton');
const temperatureElement = document.getElementById('temperature');
const batteryElement = document.getElementById('battery');
const timeSinceElement = document.getElementById('time-since');

const startDate = '2024-07-25 14:00:00';

function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

async function fetchData() {
    try {
        const response = await fetch('https://api.thingspeak.com/channels/2568299/feeds/last.json?timezone=Europe/Paris&status=true');
        const data = await response.json();

        moment.locale('nb');
        const temperature = Math.round(data.field1 * 10) / 10;
        const battery = Math.round(data.field6);
        const createdAt = moment(data.created_at);
        const lastUpdated = createdAt.format('L LTS');
        const timeSince = createdAt.fromNow();

        let temperatureClass = '';
        if (temperature > 30) {
            temperatureClass = 'high';
        } else if (temperature < 16) {
            temperatureClass = 'low';
        } else {
            temperatureClass = 'norm';
        }

        let batteryClass = '';
        if (battery > 90) {
            batteryClass = 'full';
        } else if (battery < 25) {
            batteryClass = 'low';
        } else {
            batteryClass = 'ok';
        }

        temperatureElement.innerHTML = `Temperatur: <span class="${temperatureClass}">${temperature} °C</span>`;
        batteryElement.innerHTML = `Batteri: <span class="${batteryClass}">${battery} %</span>`;
        timeSinceElement.textContent = `Sist oppdatert: ${lastUpdated} (${timeSince})`;
    } catch (error) {
        console.error('Error fetching data:', error);
        temperatureElement.textContent = 'Temperatur: Feil';
        batteryElement.textContent = 'Batteri: Feil';
        timeSinceElement.textContent = 'Sist oppdatert: Feil';
    }
}

function updateIframes(results) {
    const isMobile = window.innerWidth <= 768;
    iframeContainer.innerHTML = '';

    if (isMobile) {
        iframeConfigs.forEach(config => {
            const { src, title } = config;
            const container = document.createElement('div');
            container.classList.add('iframe-container');
            container.style.height = '200px';

            const iframe = document.createElement('iframe');
            iframe.src = `${src}?title=${encodeURIComponent(title)}&start=${encodeURIComponent(startDate)}&results=${results}&dynamic=true&width=auto&height=auto`;

            container.appendChild(iframe);
            iframeContainer.appendChild(container);
        });
    } else {
        const sharedCells = {};
        iframeConfigs.forEach(config => {
            const { area, shared, title } = config;
            if (shared) {
                if (!sharedCells[area]) {
                    sharedCells[area] = [];
                }
                sharedCells[area].push(config.src + `?title=${encodeURIComponent(title)}`);
            } else {
                const container = document.createElement('div');
                container.classList.add('iframe-container');
                container.style.gridArea = area;

                const iframe = document.createElement('iframe');
                iframe.src = `${config.src}?title=${encodeURIComponent(title)}&start=${encodeURIComponent(startDate)}&results=${results}&dynamic=true&width=auto&height=auto`;

                container.appendChild(iframe);
                iframeContainer.appendChild(container);
            }
        });

        // Handle shared cells
        for (const [area, srcs] of Object.entries(sharedCells)) {
            const container = document.createElement('div');
            container.classList.add('iframe-container');
            container.style.gridArea = area;
            container.style.display = 'grid';
            container.style.gridTemplateColumns = '1fr 1fr'; // Two columns for shared iframes
            container.style.position = 'relative';

            srcs.forEach((src, index) => {
                const iframe = document.createElement('iframe');
                iframe.src = `${src}&start=${encodeURIComponent(startDate)}&results=${results}&dynamic=true&width=auto&height=auto`;
                iframe.style.gridColumn = index + 1; // Place iframe in the corresponding column
                iframe.style.width = '100%'; // Full width of the column
                iframe.style.height = '100%'; // Full height of the container
                container.appendChild(iframe);
            });

            iframeContainer.appendChild(container);
        }
    }
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
fetchData().then(() => {
    const results = getURLParameter('results') || resultsInput.value || 8000;
    updateIframes(results);
});

// Update data every minute
setInterval(fetchData, 60000);

// Handle resize event to re-check if mobile
window.addEventListener('resize', () => {
    const results = getURLParameter('results') || resultsInput.value || 8000;
    updateIframes(results);
});

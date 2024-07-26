const iframeConfigs = [
    { src: 'https://thingspeak.com/channels/2568299/charts/1', area: '1 / 1 / 2 / 2' },
    { src: 'https://thingspeak.com/channels/2584548/charts/1', area: '1 / 2 / 2 / 3' },
    { src: 'https://thingspeak.com/channels/2584548/charts/2', area: '1 / 3 / 2 / 4' },
    { src: 'https://thingspeak.com/channels/2584548/charts/4', area: '1 / 4 / 2 / 5' },
    { src: 'https://thingspeak.com/channels/2584548/charts/6', area: '2 / 1 / 3 / 2' },
    { src: 'https://thingspeak.com/channels/2584548/charts/7', area: '2 / 2 / 3 / 3' },
    { src: 'https://thingspeak.com/channels/2584548/charts/8', area: '2 / 3 / 3 / 4' },
    { src: 'https://thingspeak.com/channels/2584548/charts/3', area: '2 / 4 / 3 / 4', shared: true }, // Shared cell
    { src: 'https://thingspeak.com/channels/2584548/charts/5', area: '2 / 4 / 3 / 4', shared: true }, // Shared cell
    { src: 'https://thingspeak.com/channels/2584547/charts/1', area: '3 / 1 / 4 / 2' },
    { src: 'https://thingspeak.com/channels/2584547/charts/2', area: '3 / 2 / 4 / 3' },
    { src: 'https://thingspeak.com/channels/2584547/charts/3', area: '3 / 3 / 4 / 4' },
    { src: 'https://thingspeak.com/channels/2584547/charts/4', area: '3 / 4 / 4 / 5' },
    { src: 'https://thingspeak.com/channels/2568299/charts/8', area: '4 / 1 / 5 / 2' },
    { src: 'https://thingspeak.com/channels/2568299/charts/2', area: '4 / 2 / 5 / 3' },
    { src: 'https://thingspeak.com/channels/2568299/charts/7', area: '4 / 3 / 5 / 4' },
    { src: 'https://thingspeak.com/channels/2568299/charts/4', area: '4 / 4 / 5 / 5' }
];

const iframeContainer = document.getElementById('iframeContainer');
const resultsInput = document.getElementById('resultsInput');
const updateButton = document.getElementById('updateButton');
const temperatureElement = document.getElementById('temperature');
const batteryElement = document.getElementById('battery');
const timeSinceElement = document.getElementById('time-since');

async function fetchData() {
    try {
        const response = await fetch('https://api.thingspeak.com/channels/2568299/feeds/last.json?timezone=Europe/Paris&status=true');
        const data = await response.json();
    
        const temperature = Math.round(data.field1 * 10) / 10;
        const battery = Math.round(data.field6);
        const createdAt = moment(data.created_at);
        const now = moment();
        const duration = moment.duration(now.diff(createdAt)).humanize();

        temperatureElement.textContent = `Temperature: ${temperature} °C`;
        batteryElement.textContent = `Battery: ${battery} %`;
        timeSinceElement.textContent = `Last updated: ${duration}`;
    } catch (error) {
        console.error('Error fetching data:', error);
        temperatureElement.textContent = 'Temperature: Error';
        batteryElement.textContent = 'Battery: Error';
        timeSinceElement.textContent = 'Last updated: Error';
    }
}

function updateIframes(results) {
    iframeContainer.innerHTML = '';

    const sharedCells = {};

    iframeConfigs.forEach(config => {
        const { area, shared } = config;
        if (shared) {
            if (!sharedCells[area]) {
                sharedCells[area] = [];
            }
            sharedCells[area].push(config.src);
        } else {
            const container = document.createElement('div');
            container.classList.add('iframe-container');
            container.style.gridArea = area;

            const iframe = document.createElement('iframe');
            iframe.src = `${config.src}?width=auto&height=auto&bgcolor=%23ffffff&color=%23d62020&dynamic=true&results=${results}&type=line`;

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
        container.style.height = '100%'; // Full height of the cell

        srcs.forEach((src, index) => {
            const iframe = document.createElement('iframe');
            iframe.src = `${src}?width=auto&height=auto&bgcolor=%23ffffff&color=%23d62020&dynamic=true&results=${results}&type=line`;
            iframe.style.gridColumn = index + 1; // Place iframe in the corresponding column
            iframe.style.width = '50%'; // Half width of the container
            iframe.style.height = '100%'; // Full height of the container
            container.appendChild(iframe);
        });

        iframeContainer.appendChild(container);
    }
}

updateButton.addEventListener('click', () => {
    const results = resultsInput.value || 154;
    updateIframes(results);
});

// Initial load
fetchData().then(() => {
    updateIframes(resultsInput.value || 154);
});

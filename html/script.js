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
    { src: 'https://thingspeak.com/channels/2584548/charts/3', area: '3 / 4 / 4 / 4', shared: true, title: 'Agurk' },
    { src: 'https://thingspeak.com/channels/2584548/charts/5', area: '3 / 4 / 4 / 4', shared: true, title: 'Paprika' },

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
const batteryVoltElement = document.getElementById('batteryVolt');
const windowElement = document.getElementById('window');
const pressureElement = document.getElementById('pressure');
const lightElement = document.getElementById('light');
const timeSinceElement = document.getElementById('time-since');
const format = 'YYYY-MM-DD HH:mm:ss';

const startDate = moment().subtract(3, 'days').startOf('day').format(format);

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
        const battery = Math.round(data.field6 * 10) / 10;
        const batteryVolt = Math.round(data.field5 * 100) / 100; 

        const windowOpening = Math.round(data.field4);
        const pressure = Math.round(data.field7) ;
        const light = Math.round(data.field8) ;

        const createdAt = moment(data.created_at);
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
		if (windowOpening < 75){
			windowText = 'Lukket';
		}else if (windowOpening < 100){
			windowText = 'Glippe';
		}else{
			windowText = 'Åpent';
		}

        let lightText = '';
		if (light < 1){
			lightText = 'Natt';
		}else if (light < 50){
			lightText = 'Skumring';
		}else if (light < 600){
			lightText = 'Skyet';
		}else{
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
        pressureElement.innerHTML = `${pressure} hPa`;
		pressureElement.className = `value`;
        lightElement.innerHTML = `${lightText}`;
		pressureElement.className = `value`;
        timeSinceElement.textContent = `${timeSince}`;
    } catch (error) {
        console.error('Error fetching data:', error);
        temperatureElement.textContent = 'Temperatur: Feil';
        batteryElement.textContent = 'Batteri: Feil';
        timeSinceElement.textContent = 'Sist oppdatert: Feil';
    }
}
function getUrl(src, title, results, start, end){
	const timezone=encodeURIComponent("Europe/Paris");
	const url = `${src}?timezone=${timezone}&title=${encodeURIComponent(title)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&results=${results}&dynamic=true&width=auto&height=auto&xaxis=&round=2`;	
	// console.log(`url: ${url}`);
	return url;
}
function updateIframes(results, start, end) {
    const isMobile = window.innerWidth <= 768;
    iframeContainer.innerHTML = '';

    if (isMobile) {
        iframeConfigs.forEach(config => {
            const { src, title } = config;
            const container = document.createElement('div');
            container.classList.add('iframe-container');
            container.style.height = '200px';

            const iframe = document.createElement('iframe');
            iframe.src = getUrl(src, title, results, start, end);

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
                sharedCells[area].push(getUrl(config.src, title, results, start, end));
            } else {
                const container = document.createElement('div');
                container.classList.add('iframe-container');
                container.style.gridArea = area;

                const iframe = document.createElement('iframe');
                iframe.src = getUrl(config.src, title, results, start, end);
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
                iframe.src = `${src}`;
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
    const start = getURLParameter('startDate') || startDate;
    const end = getURLParameter('endDate') || "";
	
    updateIframes(results, start, end);
});

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
    return function(...args) {
        const context = this;
        const later = function() {
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

document.addEventListener('DOMContentLoaded', function() {
    const dateLinks = document.querySelectorAll('.date-link');

    dateLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const range = this.dataset.range;
            const now = moment();
            let startDate = '';
            let endDate = '';

            switch (range) {
			case range.match(/.*days$/)?.input:
					let days = range.substring(0, range.indexOf("-"));
					console.log("Using " + days)
                    startDate = moment().subtract(days, 'days').startOf('day').format(format);
					break;
                case 'start':
                    startDate = moment().startOf('year').format(format);
                    // Do nothing, startDate and endDate will be empty
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
                    // Custom date handling, e.g., prompt the user to enter dates
                    startDate = prompt("Startdato (YYYY-MM-DD HH:mm:ss):", "");
                    endDate = prompt("Sluttdato (YYYY-MM-DD HH:mm:ss):", "");
                    break;
            }

            let url = `${window.location.pathname}?startDate=${startDate}&endDate=${endDate}`;
            window.location.href = url;
        });
    });
});

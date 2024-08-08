const iframeContainer = document.getElementById('iframeContainer');
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
    { src: 'https://thingspeak.com/channels/2584547/charts/4', area: '4 / 8 / 5 / 9', title: 'Tid brukt' }
];

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

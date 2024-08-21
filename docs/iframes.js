const iframeContainer = document.getElementById('iframeContainer');
const iframeConfigs = [
    { channel: 2568299, chart:1, area: '1 / 1 / 2 / 3', title: 'Temperatur' },
    { channel: 2568299, chart:4, area: '1 / 3 / 2 / 5', title: 'Vindusåpning', startDate: '2024-07-25 18:00:00'  },
    { channel: 2568299, chart:8, area: '1 / 5 / 2 / 7', title: 'Lys', startDate: '2024-08-06 17:00:00'  },
    { channel: 2584547, chart:3, area: '1 / 7 / 2 / 9', title: 'Batteri (%)' },

    { channel: 2626867, chart:1, area: '2 / 1 / 3 / 3', title: 'Utetemperatur' },
    { channel: 2626867, chart:3, area: '2 / 3 / 3 / 5', title: 'Temperatur Diff' },
    { channel: 2626867, chart:5, area: '2 / 5 / 3 / 6', title: 'Vind' },
    { channel: 2626867, chart:6, area: '2 / 6 / 3 / 7', title: 'Nedbør' },
    { channel: 2568299, chart:7, area: '2 / 7 / 3 / 9', title: 'Lufttrykk' },

    { channel: 2568299, chart:2, area: '3 / 1 / 4 / 3', title: 'Luftfuktighet' },
    { channel: 2584548, chart:6, area: '3 / 3 / 4 / 5', title: 'Fuktighet Agurk', startDate: '2024-07-25 00:00:00' },
    { channel: 2584548, chart:7, area: '3 / 5 / 4 / 6', title: 'Fuktighet Tomat', startDate: '2024-07-25 00:00:00'  },
    { channel: 2584548, chart:8, area: '3 / 6 / 4 / 7', title: 'Fuktighet Paprika', startDate: '2024-07-25 00:00:00'  },
    { channel: 2584548, chart:3, area: '3 / 7 / 4 / 8', title: 'Agurk', startDate: '2024-07-25 15:00:00' },
    { channel: 2584548, chart:5, area: '3 / 8 / 4 / 9', title: 'Paprika', startDate: '2024-07-25 15:00:00' },

    { channel: 2584548, chart:1, area: '4 / 1 / 5 / 3', title: 'BME Temp', startDate: '2024-07-25 15:00:00' },
    { channel: 2584548, chart:2, area: '4 / 3 / 5 / 4', title: 'AHT Temp', startDate: '2024-07-25 15:00:00' },
    { channel: 2584548, chart:4, area: '4 / 4 / 5 / 5', title: 'Gulv Temp', startDate: '2024-07-25 15:00:00' },
    { channel: 2584547, chart:2, area: '4 / 5 / 5 / 6', title: 'Batteri (spenning)' },
    { channel: 2584547, chart:1, area: '4 / 6 / 5 / 7', title: 'WiFi', startDate: '2024-07-25 15:00:00' },
    { channel: 2584547, chart:5, area: '4 / 7 / 5 / 8', title: 'Lys Int', startDate: '2024-08-06 15:00:00'  },
    { channel: 2584547, chart:4, area: '4 / 8 / 5 / 9', title: 'Tid brukt' }
];

//     { channel: 2626867, chart:1, area: '', title: 'Ute Fuktighet' },
//     { channel: 2626867, chart:4, area: '', title: 'Fuktighet Diff' },
//     { channel: 2626867, chart:5, area: '', title: 'Vind' },
//     { channel: 2626867, chart:6, area: '', title: 'Nedbør' },


function getUrl(channel, chart, title, results, start, end) {
	let dynamic = end ? '' : '&dynamic=true';
	let hostPath = `https://thingspeak.com/channels/${channel}/charts/${chart}`
    return `${hostPath}?timezone=${timezone}&title=${encodeURIComponent(title)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&results=${results}&width=auto&height=auto&xaxis=&round=2${dynamic}`;
}

function updateIframes(results, start, end) {
    const isMobile = window.innerWidth <= 768;
    iframeContainer.innerHTML = '';

    iframeConfigs.forEach(config => {
        const { channel, chart, title, area, startDate } = config;
		let maxStartDate = start;
		
		if (startDate){
			if (start){
				maxStartDate = moment.max(moment(startDate), moment(start)).format(format);
			}else{
				maxStartDate = startDate;
			}
		}

        const container = document.createElement('div');
        container.classList.add('iframe-container');
        container.style.gridArea = area;
        if (isMobile) {
            container.style.height = '200px';
        }


        const iframe = document.createElement('iframe');
        iframe.src = getUrl(channel, chart, title, results, maxStartDate, end);
        container.appendChild(iframe);
        iframeContainer.appendChild(container);
    });
}

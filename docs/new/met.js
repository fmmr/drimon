const met_link = document.getElementById('met-link');

async function fetchMetData() {
    try {
        const response = await fetch(`https://api.met.no/weatherapi/nowcast/2.0/complete?lat=59.532213&lon=10.418231`, {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'User-Agent': 'fmr-drimon' 
				});

        const data = await  response.json();
        const temperature = Math.round(data.properties.timeseries[0].data.instant.details.air_temperature * 10) / 10;
        const createdAt = moment(data.properties.timeseries[0].time);
        const lastUpdated = createdAt.format('L LTS');
        met_link.innerHTML = `yr: ${temperature} °C`;
        met_link.className = `${getClassName(temperature, 15, 25)} value link`;
        met_link.title = `${lastUpdated}`;
    } catch (error) {
        console.error('Error fetching data:', error);
        elements.met_link.textContent = 'Temperatur: Feil';
    }
}

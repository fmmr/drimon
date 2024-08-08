const resultsInput = document.getElementById('resultsInput');
const format = 'YYYY-MM-DD HH:mm:ss';
const timezone = encodeURIComponent("Europe/Paris");
const startDate = moment().subtract(3, 'days').startOf('day').format(format);

// Initial load
const initialResults = getURLParameter('results') || resultsInput.value || 8000;
const initialStart = getURLParameter('startDate') || startDate;
const initialEnd = getURLParameter('endDate') || "";

fetchData();
updateIframes(initialResults, initialStart, initialEnd);

// Update data every minute
setInterval(fetchData, 60000);

document.getElementById('updateButton').addEventListener('click', () => {
    const results = resultsInput.value || 8000;
    updateIframes(results);
});

resultsInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const results = resultsInput.value || 8000;
        updateIframes(results);
    }
});

let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;
let resizeTimeout;

function handleResize() {
    const width = window.innerWidth;

    // Check if the resize is significant
    if (width !== lastWidth) {
        lastWidth = width;
        lastHeight = window.innerHeight;

        const results = getURLParameter('results') || resultsInput.value || 8000;
        const start = getURLParameter('startDate') || startDate;
        const end = getURLParameter('endDate') || "";
        updateIframes(results, start, end);
    }
}

window.addEventListener('resize', () => {
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(handleResize, 150);
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.date-link').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const range = event.target.dataset.range;
            const dates = getDateRange(range);
            let url = `${window.location.pathname}?startDate=${dates.startDate}&endDate=${dates.endDate}`;
            window.location.href = url;
        });
    });
});

function getDateRange(range) {
    const now = moment();
    let startDate = '';
    let endDate = '';

    if (range.match(/.*days$/)) {
        let days = range.substring(0, range.indexOf("-"));
        startDate = moment().subtract(days, 'days').startOf('day').format(format);
    } else {
        switch (range) {
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
    }
    return { startDate, endDate };
}

function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}


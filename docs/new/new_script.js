// DOM elements
const resultsInput = document.getElementById('resultsInput');
const updateButton = document.getElementById('updateButton');
const chartGrid = document.getElementById('chartGrid');

// Date format for API requests
const format = 'YYYY-MM-DD HH:mm:ss';

// Default values
const defaultStartDate = moment().subtract(3, 'days').startOf('day').format(format);
const defaultResults = 8000;

// Initial page load
document.addEventListener('DOMContentLoaded', () => {
    // Get parameters from URL or use defaults
    const results = getURLParameter('results') || resultsInput.value || defaultResults;
    const startDate = getURLParameter('startDate') || defaultStartDate;
    const endDate = getURLParameter('endDate') || "";
    
    // Set results input value
    resultsInput.value = results;
    
    // Create chart containers
    createChartContainers();
    
    // Create global tooltip container
    createGlobalTooltip();
    
    // Load initial data
    fetchData();
    fetchMetData();
    loadCharts(startDate, endDate, results);
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up data refresh
    setInterval(fetchData, 60000);
});

// Create containers for all charts
function createChartContainers() {
    chartGrid.innerHTML = '';
    
    chartConfigs.forEach(config => {
        const container = createChartContainer(config);
        chartGrid.appendChild(container);
    });
}

// Load all charts with the given parameters
function loadCharts(startDate, endDate, results) {
    chartConfigs.forEach(config => {
        drawChart(config, startDate, endDate, results);
    });
}

// Set up event listeners for UI interaction
function setupEventListeners() {
    // Results update button
    updateButton.addEventListener('click', updateResults);
    
    // Enter key in results input
    resultsInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            updateResults();
        }
    });
    
    // Date range links
    document.querySelectorAll('.date-link').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const range = event.target.dataset.range;
            const dates = getDateRange(range);
            
            // Build URL with appropriate parameters
            let url = `${window.location.pathname}?`;
            
            if (dates.startDate) {
                url += `startDate=${dates.startDate}`;
            }
            
            if (dates.endDate) {
                url += `&endDate=${dates.endDate}`;
            }
            
            if (resultsInput.value) {
                url += `&results=${resultsInput.value}`;
            }
            
            window.location.href = url;
        });
    });
    
    // Handle window resize to ensure charts adapt
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {
            // Hide tooltip on resize
            d3.select('#global-chart-tooltip').style('opacity', 0);
        }, 150);
    });
    
    // Handle scroll to hide tooltip
    document.addEventListener('scroll', () => {
        d3.select('#global-chart-tooltip').style('opacity', 0);
    });
}

// Update charts when results input changes
function updateResults() {
    const results = resultsInput.value || defaultResults;
    const startDate = getURLParameter('startDate') || defaultStartDate;
    const endDate = getURLParameter('endDate') || "";
    
    // Update URL with new results parameter
    let url = new URL(window.location.href);
    url.searchParams.set('results', results);
    window.history.replaceState({}, '', url);
    
    // Reload all charts
    loadCharts(startDate, endDate, results);
}

// Get date range based on selection
function getDateRange(range) {
    const now = moment();
    let startDate = '';
    let endDate = '';
    
    if (range.match(/^\d+$/)) {
        // If range is a number, subtract that many days
        const days = parseInt(range);
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

// Helper to get URL parameters
function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}
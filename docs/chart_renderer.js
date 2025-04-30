// Global Chart.js configuration
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#666';
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// Store all created charts to allow updates
// Export as a global variable for access by script.js
window.chartInstances = {};
const chartInstances = window.chartInstances;

// Initialize the charts layout
function initializeChartLayout() {
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.innerHTML = '';
    
    // Group charts by row (1-4) for organization for desktop view
    const rowGroups = {};
    window.chartConfigs.forEach(config => {
        if (!rowGroups[config.row]) {
            rowGroups[config.row] = [];
        }
        rowGroups[config.row].push(config);
    });
    
    // Calculate grid positions for each chart (for desktop view)
    calculateGridPositions(rowGroups);
    
    // Determine if we're in mobile mode (for class distinction)
    const isMobile = window.innerWidth <= 768;
    
    // For mobile sort by rows, then by column position to ensure a logical order
    let orderedConfigs = [...window.chartConfigs];
    
    if (isMobile) {
        // Sort by row and then by column position
        orderedConfigs.sort((a, b) => {
            // First sort by row
            if (a.row !== b.row) {
                return a.row - b.row;
            }
            
            // If same row, sort by grid column (leftmost first)
            const aColStart = parseInt(a.gridColumn.split('/')[0].trim());
            const bColStart = parseInt(b.gridColumn.split('/')[0].trim());
            return aColStart - bColStart;
        });
    }
    
    // Add all charts to the container at once
    orderedConfigs.forEach(config => {
        // Create chart div
        const chartDiv = document.createElement('div');
        chartDiv.className = 'chart';
        
        // Only set grid positions if not mobile (CSS will override these in mobile mode)
        if (!isMobile) {
            chartDiv.style.gridRow = config.gridRow;
            chartDiv.style.gridColumn = config.gridColumn;
        }
        
        // Add a data attribute for the row for potential filtering
        chartDiv.setAttribute('data-row', config.row);
        chartDiv.setAttribute('data-category', config.category || '');
        
        // Create title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'chart-title';
        titleDiv.textContent = config.title;
        titleDiv.title = config.title; // Add tooltip
        
        // Create stats container (will be populated with data later)
        const statsDiv = document.createElement('div');
        statsDiv.className = 'chart-stats';
        statsDiv.id = `stats-${config.id}`;
        
        // Create canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'chart-canvas-container';
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = config.id;
        
        // Add loading indicator - always visible initially
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.id = `loading-${config.id}`;
        loadingDiv.style.display = 'block'; // Ensure it's visible
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        const loadingText = document.createElement('div');
        loadingText.textContent = 'Laster data...';
        
        // Assemble the DOM structure
        loadingDiv.appendChild(spinner);
        loadingDiv.appendChild(loadingText);
        
        canvasContainer.appendChild(canvas);
        canvasContainer.appendChild(loadingDiv);
        
        chartDiv.appendChild(titleDiv);
        chartDiv.appendChild(statsDiv); // Add stats div below the title
        chartDiv.appendChild(canvasContainer);
        
        chartContainer.appendChild(chartDiv);
    });
    
    // Add window resize handler (but avoid duplicate listeners)
    window.removeEventListener('resize', window.resizeAllCharts);
    window.addEventListener('resize', window.resizeAllCharts);
    
    // Add a class to the container based on viewport
    chartContainer.classList.toggle('mobile-layout', isMobile);
}

// Calculate grid positions for each chart
function calculateGridPositions(rowGroups) {
    // Process each row
    Object.keys(rowGroups).sort().forEach(rowNum => {
        const chartsInRow = rowGroups[rowNum];
        const totalCharts = chartsInRow.length;
        
        // Each chart occupies one grid row based on its row number
        const gridRow = rowNum;
        
        // For charts in this row, assign grid columns
        let columnStart = 1; // Grid columns start at 1
        
        // Apply specific span rules based on number of charts in row
        const spans = [];
        
        // Follow the rules specified:
        switch (totalCharts) {
            case 1: // 1 chart: span 8
                spans.push(8);
                break;
                
            case 2: // 2 charts: each span 4
                spans.push(4, 4);
                break;
                
            case 3: // 3 charts: leftmost spans 4, the next 2 spans 2
                spans.push(4, 2, 2);
                break;
                
            case 4: // 4 charts: each span 2
                spans.push(2, 2, 2, 2);
                break;
                
            case 5: // 5 charts: 3 leftmost spans 2, the next 2 spans 1
                spans.push(2, 2, 2, 1, 1);
                break;
                
            case 6: // 6 charts: 2 leftmost spans 2, the next 4 spans 1
                spans.push(2, 2, 1, 1, 1, 1);
                break;
                
            case 7: // 7 charts: leftmost spans 2, the next 6 spans 1
                spans.push(2, 1, 1, 1, 1, 1, 1);
                break;
                
            case 8: // 8 charts: all spans 1
                for (let i = 0; i < 8; i++) spans.push(1);
                break;
                
            default: // More than 8 charts (shouldn't happen, but just in case)
                // Distribute evenly
                const baseWidth = Math.floor(8 / totalCharts);
                spans.push(...new Array(totalCharts).fill(baseWidth));
                // Distribute remainder to first charts
                const remainder = 8 - (baseWidth * totalCharts);
                for (let i = 0; i < remainder; i++) {
                    spans[i]++;
                }
                break;
        }
        
        // Assign grid column positions to each chart
        chartsInRow.forEach((chart, index) => {
            const columnSpan = spans[index];
            
            // Set the grid position
            chart.gridRow = gridRow;
            chart.gridColumn = `${columnStart} / span ${columnSpan}`;
            
            // Store column span for tick calculations
            chart.columnSpan = columnSpan;
            
            // Move to next column
            columnStart += columnSpan;
        });
    });
}

// Fetch data from ThingSpeak API
// Export this function for use by script.js
window.fetchChartData = async function(config, range = 1, results = 8000) {
    // Get date range either from range parameter or URL
    let startDateStr, endDateStr;
    
    if (typeof range === 'string') {
        const dateRange = getDateRange(range);
        startDateStr = dateRange.startDate;
        endDateStr = dateRange.endDate;
    } else if (typeof range === 'number') {
        // Backward compatibility for numeric ranges
        const dateRange = getDateRange(range.toString());
        startDateStr = dateRange.startDate;
        endDateStr = dateRange.endDate;
    } else {
        // Default to last 24 hours
        const now = moment();
        startDateStr = now.subtract(1, 'days').format(format);
        endDateStr = '';
    }
    
    // Use the start date from the configuration if specified and we're using 'start' range
    if (range === 'start' && config.startDate) {
        startDateStr = config.startDate;
    }
    
    return fetchTimeRangeData(config, startDateStr, endDateStr, results);
};

// Local reference to the function
const fetchChartData = window.fetchChartData;

async function fetchTimeRangeData(config, startDateStr, endDateStr, results = 8000) {
    // Check if this is a multi-series chart
    if (config.series && Array.isArray(config.series)) {
        // Fetch data for all series in parallel
        try {
            const seriesPromises = config.series.map(series => {
                return fetchSingleSeries(
                    series.channel, 
                    series.field,
                    startDateStr,
                    endDateStr,
                    results
                );
            });
            
            // Wait for all series data to be fetched
            const seriesData = await Promise.all(seriesPromises);
            
            // Format into a single data structure with multiple series
            const combinedData = {
                chart_id: config.id,
                series: seriesData.map((data, index) => ({
                    title: config.series[index].title,
                    channel: config.series[index].channel,
                    field: config.series[index].field,
                    color: config.series[index].color,
                    feeds: data.feeds
                })),
                feeds: seriesData[0].feeds, // Use first series for timestamps
                is_multi_series: true
            };
            
            return combinedData;
        } catch (error) {
            console.error(`Error fetching multi-series data for ${config.title}:`, error);
            return {
                chart_id: config.id,
                series: [],
                feeds: [],
                is_multi_series: true
            };
        }
    } else {
        // Single series - use original code
        return fetchSingleSeries(
            config.channel, 
            config.field, 
            startDateStr, 
            endDateStr, 
            results,
            config.title
        );
    }
}

// Helper function to fetch data for a single series
async function fetchSingleSeries(channel, field, startDateStr, endDateStr, results, title = "") {
    // Build API URL with appropriate parameters
    let url = `https://api.thingspeak.com/channels/${channel}/fields/${field}.json?timezone=Europe/Oslo&results=${results}`;
    
    if (startDateStr) {
        url += `&start=${encodeURIComponent(startDateStr)}`;
    }
    
    if (endDateStr) {
        url += `&end=${encodeURIComponent(endDateStr)}`;
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching data for channel ${channel} field ${field}:`, error);
        
        // Return empty data structure rather than null to avoid further errors
        return {
            channel: channel,
            field: field,
            feeds: []
        };
    }
}

// Create or update a Chart.js chart
function createOrUpdateChart(config, data) {
    // Get the loading element
    const loadingEl = document.getElementById(`loading-${config.id}`);
    
    // Reset loading element to its initial state
    if (loadingEl) {
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <div>Laster data...</div>
        `;
        loadingEl.style.display = 'block';
    }
    
    if (!data || !data.feeds || data.feeds.length === 0) {
        // No data available
        if (loadingEl) {
            loadingEl.innerHTML = `<div>Ingen data tilgjengelig</div>`;
        }
        return;
    }
    
    // Hide loading indicator when data is available
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    // Check if this is a multi-series chart
    let datasets = [];
    let filteredValues = [];
    let timestamps = [];
    let minValue = Infinity;
    let maxValue = -Infinity;
    let avgValue = 0;
    let hasNegativeValues = false;
    
    if (data.is_multi_series) {
        // Handle multi-series data
        if (!data.series || data.series.length === 0 || data.series[0].feeds.length === 0) {
            // No valid data for any series
            const loadingEl = document.getElementById(`loading-${config.id}`);
            if (loadingEl) {
                loadingEl.innerHTML = `<div>Ingen gyldige dataverdier</div>`;
            }
            return;
        }
        
        // Use timestamps from first series for consistency
        timestamps = data.series[0].feeds.map(feed => feed.created_at);
        
        // Process each series data
        data.series.forEach(series => {
            // Get values for this series
            const seriesValues = series.feeds.map(feed => parseFloat(feed[`field${series.field}`]));
            const seriesFiltered = seriesValues.filter(v => !isNaN(v));
            
            // Skip empty series
            if (seriesFiltered.length === 0) return;
            
            // Check for negative values
            if (seriesFiltered.some(v => v < 0)) {
                hasNegativeValues = true;
            }
            
            // Update min/max values
            const seriesMin = Math.min(...seriesFiltered);
            const seriesMax = Math.max(...seriesFiltered);
            minValue = Math.min(minValue, seriesMin);
            maxValue = Math.max(maxValue, seriesMax);
            
            // Add to filtered values for overall stats
            filteredValues = filteredValues.concat(seriesFiltered);
            
            // Create dataset for this series
            datasets.push({
                label: series.title,
                data: seriesValues,
                borderColor: series.color,
                backgroundColor: `${series.color}20`,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: false,
                tension: 0.1,
                yAxisID: series.axis || 'y' // Use specified axis or default to primary y-axis
            });
        });
    } else {
        // Handle single series data (original code)
        const values = data.feeds.map(feed => parseFloat(feed[`field${config.field}`]));
        hasNegativeValues = values.some(v => v < 0);
        
        // Calculate data range for better scaling
        filteredValues = values.filter(v => !isNaN(v));
        
        if (filteredValues.length === 0) {
            // No valid numeric values
            const loadingEl = document.getElementById(`loading-${config.id}`);
            if (loadingEl) {
                loadingEl.innerHTML = `<div>Ingen gyldige dataverdier</div>`;
            }
            return;
        }
        
        minValue = Math.min(...filteredValues);
        maxValue = Math.max(...filteredValues);
        
        // Store timestamps for cross-chart syncing
        timestamps = data.feeds.map(feed => feed.created_at);
        
        // Create dataset for single series
        datasets.push({
            label: config.title,
            data: values,
            borderColor: config.color,
            backgroundColor: hasNegativeValues ? 'rgba(0,0,0,0)' : `${config.color}20`,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: !hasNegativeValues,
            tension: 0.1,
            yAxisID: 'y' // Always use primary y-axis for single series
        });
    }
    
    // Calculate average across all series
    const sum = filteredValues.reduce((acc, val) => acc + val, 0);
    avgValue = sum / filteredValues.length;
    
    // Add 5% padding to min/max values to prevent data points from touching edges
    const range = maxValue - minValue;
    
    // Handle case where min and max are identical or very small range
    const paddingAmount = range < 0.1 ? (Math.abs(minValue) * 0.05 || 0.1) : range * 0.05;
    
    // Don't go below zero for non-negative data sets
    const paddedMinValue = hasNegativeValues ? minValue - paddingAmount : Math.max(0, minValue - paddingAmount);
    const paddedMaxValue = maxValue + paddingAmount;
    
    // Store raw data for shared tooltips
    window.chartRawData = window.chartRawData || {};
    
    if (data.is_multi_series) {
        // Store data for each series for multi-series charts
        window.chartRawData[config.id] = {
            timestamps: timestamps,
            series: data.series.map(series => ({
                title: series.title,
                values: series.feeds.map(feed => parseFloat(feed[`field${series.field}`])),
                color: series.color
            })),
            is_multi_series: true,
            title: config.title,
            category: config.category,
            unit: config.unit || ''
        };
    } else {
        // For single series charts, keep original format
        window.chartRawData[config.id] = {
            timestamps: timestamps,
            values: datasets[0].data,
            title: config.title,
            category: config.category,
            color: config.color,
            unit: config.unit || ''
        };
    }
    
    // Apply chart config minimum value if provided
    let adjustedMinValue = minValue;
    if (config.minValue !== undefined && minValue < config.minValue) {
        adjustedMinValue = config.minValue;
    }
    
    // Format values for display
    const getUnit = config.unit || '';
    const formatNumber = (val) => {
        // Use the helper function to determine if we should use integers
        if (shouldUseIntegerValues(config) || range >= 10) {
            return Math.round(val).toString();
        } else if (range < 1) {
            return val.toFixed(2); // More precision for very small ranges
        } else {
            return val.toFixed(1); // Default to 1 decimal place
        }
    };
    
    // Check if stats display is enabled
    const statsVisible = localStorage.getItem('statsVisible') !== 'false';
    
    // Update stats 
    const statsEl = document.getElementById(`stats-${config.id}`);
    if (statsEl) {
        // Get the most recent (current) value
        const currentValue = filteredValues.length > 0 ? filteredValues[filteredValues.length - 1] : null;
        
        // Always prepare the innerHTML, regardless of visibility state
        // Use both short and full labels - CSS will show appropriate one based on viewport
        statsEl.innerHTML = `
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">L:</span>
                    <span class="chart-stat-label-low"></span>
                </span>${formatNumber(adjustedMinValue)}${getUnit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">A:</span>
                    <span class="chart-stat-label-avg"></span>
                </span>${formatNumber(avgValue)}${getUnit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">H:</span>
                    <span class="chart-stat-label-high"></span>
                </span>${formatNumber(maxValue)}${getUnit}
            </div>
            <div class="chart-stat chart-stat-current">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">N:</span>
                    <span class="chart-stat-label-now"></span>
                </span>${currentValue !== null ? formatNumber(currentValue) + getUnit : '—'}
            </div>
        `;
        
        // Now set display based on visibility preference
        statsEl.style.display = statsVisible ? 'flex' : 'none';
    }
    
    const chartData = {
        labels: timestamps.map(timestamp => moment(timestamp).format('LT')),
        datasets: datasets
    };
    
    // Function for cross-chart highlighting
    function syncTooltips(chart, dataIndex) {
        // Skip if invalid index
        if (dataIndex === null || dataIndex === undefined) return;
        
        // Get the timestamp for this data point
        const timestamp = timestamps[dataIndex];
        if (!timestamp) return;
        
        // Sync tooltips across all charts
        Object.values(chartInstances).forEach(otherChart => {
            if (!otherChart || otherChart === chart) return;
            
            // Get raw data for this chart
            const chartId = otherChart.canvas.id;
            const rawData = window.chartRawData[chartId];
            if (!rawData || !rawData.timestamps) return;
            
            // Find the closest timestamp in the other chart
            let closestIndex = -1;
            let minTimeDiff = Infinity;
            
            rawData.timestamps.forEach((time, idx) => {
                const timeDiff = Math.abs(new Date(time) - new Date(timestamp));
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    closestIndex = idx;
                }
            });
            
            // Only sync if the time difference is within 5 minutes
            if (minTimeDiff <= 5 * 60 * 1000 && closestIndex !== -1) {
                const activeElements = otherChart.getElementsAtEventForMode(
                    { x: otherChart.scales.x.getPixelForValue(closestIndex), y: otherChart.chartArea.top },
                    'nearest',
                    { intersect: false },
                    false
                );
                
                // Activate the tooltip on the other chart
                otherChart.tooltip.setActiveElements(activeElements, { x: 0, y: 0 });
                otherChart.update('none');
            }
        });
    }
    
    // Get chart units based on ID
    function getUnitForChart(chartId) {
        if (chartId.includes('temp') || chartId.includes('plant') || chartId.includes('sensors')) return '°C';
        if (chartId.includes('humidity')) return '%';
        if (chartId.includes('pressure')) return 'hPa';
        if (chartId.includes('wind')) return 'm/s';
        if (chartId.includes('rain')) return 'mm';
        if (chartId.includes('battery')) return chartId.includes('voltage') ? 'V' : '%';
        if (chartId.includes('light')) return 'lux';
        if (chartId.includes('window')) return 'mm';
        if (chartId.includes('wifi')) return 'dBm';
        if (chartId.includes('soil')) return '%';
        return '';
    }
    
    // Determine which charts should have integer values only
    function shouldUseIntegerValues(config) {
        // These chart types typically have large numbers or don't need decimal precision
        return config.id.includes('light') || 
               config.id.includes('window') ||
               config.id.includes('wifi') ||
               config.id.includes('soil') ||
               config.id.includes('pressure');
    }
    
    // Function to get all related chart data (same category)
    function getRelatedChartData(category, timestamp) {
        if (!category || !timestamp) return [];
        
        const relatedData = [];
        
        Object.entries(window.chartRawData).forEach(([chartId, rawData]) => {
            if (rawData.category === category) {
                // Find closest timestamp
                let closestIndex = -1;
                let minTimeDiff = Infinity;
                
                rawData.timestamps.forEach((time, idx) => {
                    const timeDiff = Math.abs(new Date(time) - new Date(timestamp));
                    if (timeDiff < minTimeDiff) {
                        minTimeDiff = timeDiff;
                        closestIndex = idx;
                    }
                });
                
                // Only include if close enough (5 minutes)
                if (minTimeDiff <= 5 * 60 * 1000 && closestIndex !== -1) {
                    // Handle both single and multi-series charts
                    if (rawData.is_multi_series && rawData.series) {
                        // Add each series in the multi-series chart
                        rawData.series.forEach(series => {
                            relatedData.push({
                                title: `${rawData.title} (${series.title})`,
                                value: series.values[closestIndex],
                                unit: getUnitForChart(chartId),
                                color: series.color
                            });
                        });
                    } else {
                        // Single series chart
                        relatedData.push({
                            title: rawData.title,
                            value: rawData.values[closestIndex],
                            unit: getUnitForChart(chartId),
                            color: rawData.color
                        });
                    }
                }
            }
        });
        
        return relatedData;
    }
    
    // Check if this chart has a minimum value configuration
    const hasMinValue = config.minValue !== undefined;
    
    // Optimized chart options for better rendering
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Disable animation for immediate rendering
        
        layout: {
            padding: {
                left: 0,
                right: config.secondYAxis ? 20 : 2, // Add more padding if using second y-axis
                top: 2,
                bottom: 0
            }
        },
        
        scales: {
            x: {
                grid: {
                    display: false // No X grid lines
                },
                ticks: {
                    maxRotation: 0,
                    autoSkip: true,
                    // Mobile: always use 6 ticks since all charts are full width
                    // Desktop: Use columnSpan to determine tick count
                    // - Small charts (span 1): 4 ticks
                    // - Larger charts (span 2+): 6 ticks
                    maxTicksLimit: window.innerWidth <= 768 ? 6 : ((config.columnSpan && config.columnSpan >= 2) ? 6 : 4),
                    font: {
                        size: 9
                    },
                    color: '#666'
                },
                border: {
                    display: false
                }
            },
            y: {
                position: window.innerWidth <= 768 ? 'left' : 'right', // Position scale on left for mobile, right for desktop
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    lineWidth: 1,
                    drawBorder: false
                },
                // Dynamic scale based on data range with padding
                min: hasMinValue ? config.minValue : undefined, // Use hard minimum if configured
                suggestedMin: hasMinValue ? undefined : paddedMinValue, // Only use suggestedMin if no minValue configured
                suggestedMax: paddedMaxValue,
                beginAtZero: false, // Never force zero as we want to scale to data
                ticks: {
                    font: {
                        size: window.innerWidth <= 768 ? 8 : 9
                    },
                    maxTicksLimit: window.innerWidth <= 768 ? 4 : 5,
                    color: '#666',
                    padding: 0,
                    callback: function(value) {
                        // Abbreviate large numbers
                        if (value >= 1000) {
                            return (value / 1000) + 'k';
                        }
                        return value;
                    }
                },
                border: {
                    display: false
                }
            },
            // Add secondary Y axis if enabled in config
            ...(config.secondYAxis && {
                y1: {
                    position: 'left', // Put second axis on the opposite side
                    grid: {
                        display: false, // Don't show grid lines for second axis
                        drawOnChartArea: false
                    },
                    // Calculate y1 range based on second series values
                    suggestedMin: function() {
                        // Find the dataset with y1 axis
                        const y1Dataset = datasets.find(d => d.yAxisID === 'y1');
                        if (y1Dataset && y1Dataset.data.length > 0) {
                            const values = y1Dataset.data.filter(v => !isNaN(v));
                            if (values.length) {
                                const min = Math.min(...values);
                                // Add 5% padding
                                return Math.max(0, min - (min * 0.05));
                            }
                        }
                        return 0;
                    }(),
                    suggestedMax: function() {
                        // Find the dataset with y1 axis
                        const y1Dataset = datasets.find(d => d.yAxisID === 'y1');
                        if (y1Dataset && y1Dataset.data.length > 0) {
                            const values = y1Dataset.data.filter(v => !isNaN(v));
                            if (values.length) {
                                const max = Math.max(...values);
                                // Add 5% padding
                                return max + (max * 0.05);
                            }
                        }
                        return 100;
                    }(),
                    ticks: {
                        font: {
                            size: window.innerWidth <= 768 ? 8 : 9
                        },
                        maxTicksLimit: window.innerWidth <= 768 ? 4 : 5,
                        color: '#8a5a00', // Match the color of the second series
                        padding: 0,
                        callback: function(value) {
                            // Abbreviate large numbers
                            if (value >= 1000) {
                                return (value / 1000) + 'k';
                            }
                            return value;
                        }
                    },
                    border: {
                        display: false
                    }
                }
            })
        },
        
        plugins: {
            legend: {
                // Only show legend for multi-series charts
                display: data.is_multi_series === true, // Explicitly check for true to avoid false positives
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 10,
                    font: {
                        size: 10
                    }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                titleFont: {
                    size: 11
                },
                bodyFont: {
                    size: 11
                },
                padding: 6,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                callbacks: {
                    // Customize title to show full date/time
                    title: (tooltipItems) => {
                        const index = tooltipItems[0].dataIndex;
                        return moment(timestamps[index]).format('LLL');
                    },
                    
                    // Show data from all related charts in this tooltip
                    afterBody: (tooltipItems) => {
                        if (!config.category || !tooltipItems.length) return [];
                        
                        // Get timestamp for this tooltip
                        const dataIndex = tooltipItems[0].dataIndex;
                        if (dataIndex === undefined || !timestamps[dataIndex]) return [];
                        
                        const timestamp = timestamps[dataIndex];
                        
                        // Find all related data points from same category
                        const relatedData = getRelatedChartData(config.category, timestamp);
                        
                        // Don't show anything if there's only this chart
                        if (relatedData.length <= 1) return [];
                        
                        // Format lines for tooltip
                        const lines = ['', '— Andre verdier —'];
                        
                        relatedData.forEach(item => {
                            // Skip the current chart
                            if (item.title === config.title) return;
                            
                            // Create colored line for each related value
                            let formattedValue;
                            // Use similar rules as the main formatNumber function
                            if (item.title.toLowerCase().includes('light') || 
                                item.title.toLowerCase().includes('wifi') || 
                                item.title.toLowerCase().includes('window') ||
                                item.title.toLowerCase().includes('soil') ||
                                item.title.toLowerCase().includes('pressure') ||
                                Math.abs(item.value) >= 10) {
                                formattedValue = Math.round(item.value);
                            } else if (Math.abs(item.value) < 1) {
                                formattedValue = item.value.toFixed(2);
                            } else {
                                formattedValue = item.value.toFixed(1);
                            }
                            lines.push(`${item.title}: ${formattedValue} ${item.unit}`);
                        });
                        
                        return lines;
                    }
                }
            }
        },
        
        // Custom handler for hover events
        onHover: (event, elements, chart) => {
            if (!elements || !elements.length) return;
            
            const dataIndex = elements[0].index;
            syncTooltips(chart, dataIndex);
        }
    };
    
    // Create or update chart
    const canvas = document.getElementById(config.id);
    if (!canvas) return;
    
    if (chartInstances[config.id]) {
        // Update existing chart
        chartInstances[config.id].data = chartData;
        chartInstances[config.id].options = chartOptions;
        chartInstances[config.id].update('none');
    } else {
        // Create new chart
        chartInstances[config.id] = new Chart(canvas, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
    }
}

// Call this when window is resized to properly adjust all charts
// Expose globally for script.js
window.resizeAllCharts = function() {
    // Check if layout mode (mobile/desktop) has changed
    const wasMobile = document.getElementById('chartContainer').classList.contains('mobile-layout');
    const isMobile = window.innerWidth <= 768;
    
    // If layout has changed, reinitialize the entire chart layout
    if (wasMobile !== isMobile) {
        // Properly destroy all existing chart instances
        Object.keys(chartInstances).forEach(id => {
            if (chartInstances[id]) {
                chartInstances[id].destroy();
                chartInstances[id] = null;
            }
        });
        
        // Clear chart instances
        Object.keys(chartInstances).forEach(key => delete chartInstances[key]);
        
        // Reinitialize layout
        const currentRange = getURLParameter('range') || '1';
        const currentResults = parseInt(getURLParameter('results')) || 8000;
        loadAllCharts(currentRange, currentResults);
        return;
    }
    
    // For each chart instance, resize and update without animation
    Object.keys(chartInstances).forEach(id => {
        if (chartInstances[id]) {
            const chart = chartInstances[id];
            
            // Disable animation
            chart.options.animation = false;
            
            // Force resize and update
            chart.resize();
            chart.update('none');
        }
    });
}

// Load data for all charts
async function loadAllCharts(range = 1, results = 8000) {
    // Initialize chart layout first
    initializeChartLayout();
    
    // Fetch all chart data in parallel
    const dataPromises = window.chartConfigs.map(config => fetchChartData(config, range, results));
    
    // Wait for all data to be fetched
    const allData = await Promise.all(dataPromises);
    
    // Render all charts with their respective data
    window.chartConfigs.forEach((config, index) => {
        createOrUpdateChart(config, allData[index]);
    });
}

// Refresh all charts - expose globally for script.js
window.refreshCharts = function(range, results) {
    // Properly destroy all existing chart instances first
    Object.keys(chartInstances).forEach(id => {
        if (chartInstances[id]) {
            chartInstances[id].destroy();
            chartInstances[id] = null;
        }
    });
    
    // Clear chart instances object
    Object.keys(chartInstances).forEach(key => delete chartInstances[key]);
    
    // Now load all charts with new parameters
    loadAllCharts(range, results);
}

// Handle date range selection
function setupDateRangeHandlers() {
    const dateChips = document.querySelectorAll('.date-chip');
    
    // Get range and results from URL parameters or use defaults
    let currentRange = getURLParameter('range') || '1'; // Default to 2 days
    let currentResults = parseInt(getURLParameter('results')) || 8000; // Default to 8000 results
    
    // Set active state for current range
    const activeChip = document.querySelector(`.date-chip[data-range="${currentRange}"]`);
    if (activeChip) {
        activeChip.classList.add('active');
    } else {
        // Default to "2d" if no matching chip is found
        const defaultChip = document.querySelector('.date-chip[data-range="1"]');
        if (defaultChip) {
            defaultChip.classList.add('active');
        }
    }
    
    // Add click handlers to all date range chips
    dateChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all chips
            dateChips.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked chip
            chip.classList.add('active');
            
            // Get selected range
            const range = chip.getAttribute('data-range');
            currentRange = range;
            
            // Update URL with new parameters
            const url = new URL(window.location.href);
            url.searchParams.set('range', range);
            
            if (currentResults !== 8000) {
                url.searchParams.set('results', currentResults);
            } else {
                url.searchParams.delete('results');
            }
            
            // Update browser history without reloading
            window.history.replaceState({}, '', url);
            
            // Refresh charts with new range and current results
            window.refreshCharts(currentRange, currentResults);
        });
    });
    
    // Handle results input and update button
    const resultsInput = document.getElementById('resultsInput');
    const updateButton = document.getElementById('updateButton');
    
    if (resultsInput && updateButton) {
        resultsInput.value = currentResults;
        
        updateButton.addEventListener('click', () => {
            const newResults = parseInt(resultsInput.value) || 8000;
            currentResults = newResults;
            
            // Update URL with new parameters
            const url = new URL(window.location.href);
            
            if (newResults !== 8000) {
                url.searchParams.set('results', newResults);
            } else {
                url.searchParams.delete('results');
            }
            
            // Update browser history without reloading
            window.history.replaceState({}, '', url);
            
            // Refresh charts 
            window.refreshCharts(currentRange, currentResults);
        });
        
        // Also update when pressing Enter in the input
        resultsInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const newResults = parseInt(resultsInput.value) || 8000;
                currentResults = newResults;
                
                // Update URL
                const url = new URL(window.location.href);
                if (newResults !== 8000) {
                    url.searchParams.set('results', newResults);
                } else {
                    url.searchParams.delete('results');
                }
                window.history.replaceState({}, '', url);
                
                // Refresh charts
                window.refreshCharts(currentRange, currentResults);
            }
        });
    }
}

// Sort charts by category - only on mobile devices
function sortChartsByCategory(category) {
    // Only apply sorting on mobile (to avoid issues on desktop grid layout)
    if (window.innerWidth > 768) {
        return;
    }
    
    const chartContainer = document.getElementById('chartContainer');
    const charts = Array.from(chartContainer.querySelectorAll('.chart'));
    
    // Save references to the chart instances and their canvases
    // to avoid destroying them when we move elements
    const chartData = {};
    charts.forEach(chart => {
        const id = chart.querySelector('canvas').id;
        chartData[id] = {
            instance: window.chartInstances[id],
            canvasId: id
        };
    });
    
    // Create a sortable array of chart elements with their metadata
    const chartElements = charts.map(chart => {
        return {
            element: chart,
            row: parseInt(chart.getAttribute('data-row')),
            category: chart.getAttribute('data-category'),
            id: chart.querySelector('canvas').id
        };
    });
    
    // Sort charts based on category
    if (category === 'row') {
        // Sort by row number and then by column position
        chartElements.sort((a, b) => {
            if (a.row !== b.row) {
                return a.row - b.row;
            }
            
            const aCol = parseInt(a.element.style.gridColumn.split('/')[0]) || 0;
            const bCol = parseInt(b.element.style.gridColumn.split('/')[0]) || 0;
            return aCol - bCol;
        });
    } else {
        // Sort by category (matching category first, then other charts by row)
        chartElements.sort((a, b) => {
            const aMatches = a.category === category;
            const bMatches = b.category === category;
            
            if (aMatches && !bMatches) return -1;
            if (!aMatches && bMatches) return 1;
            
            // If both match or don't match the category, sort by row
            return a.row - b.row;
        });
    }
    
    // Remove all charts from container, but DO NOT destroy Chart instances
    charts.forEach(chart => chart.remove());
    
    // Reattach charts in the new order
    chartElements.forEach(item => {
        chartContainer.appendChild(item.element);
    });
    
    // Store the current sort preference
    localStorage.setItem('chartSortPreference', category);
}

// Initialize chart system when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupDateRangeHandlers();
    
    // Get range and results from URL parameters or use defaults
    const range = getURLParameter('range') || '1';
    const results = parseInt(getURLParameter('results')) || 8000;
    
    // Load charts with URL parameters
    loadAllCharts(range, results);
    
    // Set up category sorter
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        // Try to restore last used sort preference
        const lastSort = localStorage.getItem('chartSortPreference');
        if (lastSort) {
            sortSelect.value = lastSort;
            
            // Hide the sorting hint if user has already used sorting
            const chartContainer = document.getElementById('chartContainer');
            if (chartContainer) {
                chartContainer.classList.add('hint-hidden');
            }
        }
        
        sortSelect.addEventListener('change', () => {
            const category = sortSelect.value;
            sortChartsByCategory(category);
            
            // Hide the sorting hint after user has sorted
            const chartContainer = document.getElementById('chartContainer');
            if (chartContainer) {
                chartContainer.classList.add('hint-hidden');
            }
        });
        
        // Apply the initial sort if we're in mobile mode and a preference exists
        if (window.innerWidth <= 768 && lastSort) {
            setTimeout(() => sortChartsByCategory(lastSort), 500);
        }
    }
});
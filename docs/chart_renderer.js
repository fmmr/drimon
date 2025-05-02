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
        
        // Add multi-series class if needed
        if (config.series && Array.isArray(config.series) && config.series.length > 1) {
            chartDiv.classList.add('multi-series');
        }
        
        // Only set grid positions if not mobile (CSS will override these in mobile mode)
        if (!isMobile) {
            chartDiv.style.gridRow = config.gridRow;
            chartDiv.style.gridColumn = config.gridColumn;
        }
        
        // Add a data attribute for the row for potential filtering
        chartDiv.setAttribute('data-row', config.row);
        chartDiv.setAttribute('data-category', config.category || '');
        
        // Create title
        // Map chart title to an appropriate translation key
        // Instead of adding "Chart" suffix, use a map of known titles for exact matching
        let translationKey;
        
        // Map common chart titles to their translation keys
        const titleMap = {
            'Temperatur': 'temperatureChart',
            'Vindusåpning': 'windowChart',
            'Lys': 'lightChart',
            'Batteri (%)': 'batteryPercentChart',
            'Temperatur Diff': 'tempDiffChart',
            'Plante Temperaturer': 'plantsTempsChart',
            'Utetemperatur': 'outTempChart',
            'Sensor Temperaturer': 'sensorsTempsChart',
            'Luftfuktighet': 'humidityChart',
            'Lufttrykk': 'pressureChart',
            'Vind': 'windChart',
            'Nedbør': 'rainChart',
            'Jordfuktighet': 'soilMoistureChart',
            'Batteri (spenning)': 'batteryVoltageChart',
            'WiFi': 'wifiChart',
            'Tid brukt': 'timeUsedChart'
        };
        
        // Use the map or fall back to the original title (without adding Chart suffix)
        translationKey = titleMap[config.title] || config.title.toLowerCase().replace(/\s+/g, '');
            
        // Create title div with translation attributes
        const titleDiv = document.createElement('div');
        titleDiv.className = 'chart-title';
        titleDiv.setAttribute('data-i18n', translationKey);
        
        // Apply translation immediately if available, otherwise use default text
        if (window.i18n && typeof window.i18n.__ === 'function') {
            const translatedTitle = window.i18n.__(translationKey);
            titleDiv.textContent = translatedTitle;
            titleDiv.title = translatedTitle;
        } else {
            titleDiv.textContent = config.title; // Default text
            titleDiv.title = config.title; // Default tooltip
        }
        
        titleDiv.setAttribute('data-i18n-title', translationKey); // For tooltip translation
        
        // For multi-series charts, the current values are shown in the legend
        // (No longer needed to update the title)
        
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
        
        // Get translated loading text
        let loadingTextValue = 'Laster data...';
        if (window.i18n && typeof window.i18n.__ === 'function') {
            loadingTextValue = window.i18n.__('loading');
        }
        
        const loadingText = document.createElement('div');
        loadingText.textContent = loadingTextValue;
        
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

// Use data component functions for fetching data
// Create a reference to the fetchChartData function from data_components.js
window.fetchChartData = window.DataComponents.fetchChartData;

// Create or update a Chart.js chart
// Function to translate all chart labels in a dataset
// Export to global scope so it can be called from event handlers
window.translateChartLabels = function(chart) {
    if (!chart || !chart.data || !chart.data.datasets || !window.chartTranslator) {
        return;
    }

    // Get chart info
    const chartId = chart.canvas.id;
    const chartConfig = window.chartConfigs.find(c => c.id === chartId);
    const isMultiSeries = chartConfig && chartConfig.series && Array.isArray(chartConfig.series) && chartConfig.series.length > 1;
    
    // For soil moisture chart with specific series titles that need special handling
    const isSoilMoistureChart = chartId === 'chart-soil-moisture';

    // Update all dataset labels with correct translations
    chart.data.datasets.forEach((dataset, index) => {
        if (!dataset.label) return;
        
        // Get original label (without any current value)
        const originalLabel = dataset.label.split(':')[0].trim();
        let translatedLabel;
        
        // For multi-series charts, look up series titles from chart config
        if (isMultiSeries && chartConfig && chartConfig.series && chartConfig.series[index]) {
            const seriesTitle = chartConfig.series[index].title;
            translatedLabel = window.chartTranslator.translateSeriesTitle(seriesTitle);
            console.log(`Series ${index}: "${seriesTitle}" -> "${translatedLabel}"`);
        } else {
            // For single series charts, use chart title
            if (chartConfig) {
                translatedLabel = window.chartTranslator.translateChartTitle(chartConfig.title);
            } else {
                translatedLabel = originalLabel; // Fallback
            }
        }
        
        // Apply translations and preserve value part
        if (translatedLabel && translatedLabel !== originalLabel) {
            const parts = dataset.label.split(':');
            if (parts.length > 1) {
                dataset.label = `${translatedLabel}: ${parts[1].trim()}`;
            } else {
                dataset.label = translatedLabel;
            }
        }
    });
    
    // Update chart legend with translated labels
    if (chart.options && chart.options.plugins && chart.options.plugins.legend) {
        try {
            // This is a trick to force Chart.js to re-render the legend completely
            // First hide the legend
            const originalLegendDisplay = chart.options.plugins.legend.display;
            chart.options.plugins.legend.display = false;
            chart.update('none');
            
            // Then show it again with the new labels
            chart.options.plugins.legend.display = originalLegendDisplay;
            
            // Set up custom legend generator that properly handles translations
            const defaultGenerateLabels = Chart.defaults.plugins.legend.labels.generateLabels;
            chart.options.plugins.legend.labels.generateLabels = function(chart) {
                const labels = defaultGenerateLabels(chart);
                
                // For multi-series charts, handle legend labels specially
                if (isMultiSeries) {
                    labels.forEach((label, i) => {
                        if (i < chart.data.datasets.length && chartConfig && chartConfig.series && i < chartConfig.series.length) {
                            const dataset = chart.data.datasets[i];
                            
                            // Get original series title from configuration (source of truth)
                            const seriesTitle = chartConfig.series[i].title;
                            const translatedTitle = window.chartTranslator.translateSeriesTitle(seriesTitle);
                            
                            // Extract current value if present
                            let valuePart = '';
                            if (dataset && dataset.data && dataset.data.length > 0) {
                                const currentValue = dataset.data[dataset.data.length - 1];
                                if (currentValue !== undefined && !isNaN(currentValue)) {
                                    // Format based on the value range
                                    const formatNum = val => {
                                        if (Math.abs(val) >= 10) return Math.round(val);
                                        else if (Math.abs(val) < 1) return val.toFixed(2);
                                        else return val.toFixed(1);
                                    };
                                    valuePart = `: ${formatNum(currentValue)}`;
                                }
                            }
                            
                            // Special handling for soil moisture chart to ensure consistent labels
                            if (isSoilMoistureChart) {
                                // For soil moisture chart, always apply the translation directly
                                // to both the dataset label and legend text for consistency
                                const fullLabel = `${translatedTitle}${valuePart}`;
                                
                                // Update in both places to ensure consistency
                                dataset.label = fullLabel;
                                label.text = fullLabel;
                            } else {
                                // For other charts, use the dataset label as source of truth
                                label.text = dataset.label;
                            }
                        }
                    });
                }
                
                return labels;
            };
        } catch (e) {
            console.error("Error updating legend:", e);
        }
    }
    
    // Update stats labels with new translations
    const statsEl = document.getElementById(`stats-${chartId}`);
    if (statsEl) {
        // Get minimum, average and maximum values from chart data for stats display
        let minValue = Infinity;
        let maxValue = -Infinity;
        let avgValue = 0;
        let totalValues = 0;
        let totalCount = 0;
        
        // Calculate min/max/avg across all datasets
        chart.data.datasets.forEach(dataset => {
            if (!dataset.data || dataset.data.length === 0) return;
            
            const values = dataset.data.filter(v => !isNaN(v));
            if (values.length === 0) return;
            
            const datasetMin = Math.min(...values);
            const datasetMax = Math.max(...values);
            const datasetSum = values.reduce((sum, v) => sum + v, 0);
            
            minValue = Math.min(minValue, datasetMin);
            maxValue = Math.max(maxValue, datasetMax);
            totalValues += datasetSum;
            totalCount += values.length;
        });
        
        // Calculate overall average
        avgValue = totalCount > 0 ? totalValues / totalCount : 0;
        
        // Get current value (from the first dataset for simplicity)
        const currentValue = chart.data.datasets[0]?.data?.length > 0 
            ? chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1] 
            : null;
        
        // Get translated stat labels
        let lowLabel = 'L';
        let avgLabel = 'A';
        let highLabel = 'H';
        let nowLabel = 'N';
        
        if (window.i18n && typeof window.i18n.__ === 'function') {
            const lowTranslation = window.i18n.__('low');
            const avgTranslation = window.i18n.__('avg');
            const highTranslation = window.i18n.__('high');
            const nowTranslation = window.i18n.__('now');
            
            lowLabel = lowTranslation && lowTranslation.length > 0 ? lowTranslation[0].toUpperCase() : 'L';
            avgLabel = avgTranslation && avgTranslation.length > 0 ? avgTranslation[0].toUpperCase() : 'A';
            highLabel = highTranslation && highTranslation.length > 0 ? highTranslation[0].toUpperCase() : 'H';
            nowLabel = nowTranslation && nowTranslation.length > 0 ? nowTranslation[0].toUpperCase() : 'N';
        }
        
        // Get unit from chart ID
        const unit = getUnitForChart(chartId) || '';
        
        // Format numbers with appropriate precision
        const formatNumber = (val) => {
            if (typeof val !== 'number' || isNaN(val)) return '—';
            
            // Use the helper function to determine if we should use integers
            const range = maxValue - minValue;
            if (shouldUseIntegerValues(chartConfig) || range >= 10) {
                return Math.round(val).toString();
            } else if (range < 1) {
                return val.toFixed(2); // More precision for very small ranges
            } else {
                return val.toFixed(1); // Default to 1 decimal place
            }
        };
        
        // Check if this is a multi-series chart
        const isMultiSeries = chartConfig && chartConfig.series && Array.isArray(chartConfig.series) && chartConfig.series.length > 1;
        
        // Update the stats HTML
        statsEl.innerHTML = `
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${lowLabel}:</span>
                    <span class="chart-stat-label-low"></span>
                </span>${formatNumber(minValue)}${unit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${avgLabel}:</span>
                    <span class="chart-stat-label-avg"></span>
                </span>${formatNumber(avgValue)}${unit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${highLabel}:</span>
                    <span class="chart-stat-label-high"></span>
                </span>${formatNumber(maxValue)}${unit}
            </div>
            ${!isMultiSeries ? `
            <div class="chart-stat chart-stat-current">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${nowLabel}:</span>
                    <span class="chart-stat-label-now"></span>
                </span>${currentValue !== null ? formatNumber(currentValue) + unit : '—'}
            </div>
            ` : ''}
        `;
        
    }
    
    // Apply changes with a short timeout to ensure the update happens
    setTimeout(() => {
        try {
            chart.update('none');
        } catch (e) {
            // Silently ignore errors
        }
    }, 10);
}

// Listen for language changes to update all chart elements
document.addEventListener('languageChanged', (event) => {
    // 1. First update chart DOM titles
    document.querySelectorAll('.chart-title').forEach(titleEl => {
        const translationKey = titleEl.getAttribute('data-i18n');
        if (translationKey && window.i18n && typeof window.i18n.__ === 'function') {
            const translatedTitle = window.i18n.__(translationKey);
            titleEl.textContent = translatedTitle;
            if (titleEl.hasAttribute('data-i18n-title')) {
                titleEl.title = translatedTitle;
            }
        }
    });
    
    // 2. Then update each chart's labels, legends and stats
    if (window.chartInstances) {
        Object.entries(window.chartInstances).forEach(([chartId, chartInstance]) => {
            if (chartInstance) {
                window.translateChartLabels(chartInstance);
            }
        });
    }
});

function createOrUpdateChart(config, data) {
    // Get the loading element
    const loadingEl = document.getElementById(`loading-${config.id}`);
    
    // Get translated loading text
    let loadingText = 'Laster data...';
    let noDataText = 'Ingen data tilgjengelig';
    
    if (window.i18n && typeof window.i18n.__ === 'function') {
        loadingText = window.i18n.__('loading');
        noDataText = window.i18n.__('noData');
    }
    
    // Reset loading element to its initial state
    if (loadingEl) {
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <div>${loadingText}</div>
        `;
        loadingEl.style.display = 'block';
    }
    
    if (!data || !data.feeds || data.feeds.length === 0) {
        // No data available
        if (loadingEl) {
            loadingEl.innerHTML = `<div>${noDataText}</div>`;
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
                // Use translated no data text
                let noDataText = 'Ingen gyldige dataverdier';
                if (window.i18n && typeof window.i18n.__ === 'function') {
                    noDataText = window.i18n.__('noData');
                }
                loadingEl.innerHTML = `<div>${noDataText}</div>`;
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
            
            // Translate series title if possible
            let translatedTitle = series.title;
            if (window.i18n && typeof window.i18n.__ === 'function') {
                // Map common series titles to translation keys
                const titleKey = series.title === 'Tak' ? 'ceiling' :
                                 series.title === 'Intern' ? 'internal' :
                                 series.title === 'Agurk' ? 'cucumber' :
                                 series.title === 'Agurk 1' ? 'cucumber1' :
                                 series.title === 'Agurk 2' ? 'cucumber2' :
                                 series.title === 'Padron' ? 'padron' :
                                 series.title === 'Gulv' ? 'floor' : null;
                
                if (titleKey) {
                    const translated = window.i18n.__(titleKey);
                    if (translated !== titleKey) {
                        translatedTitle = translated;
                    }
                }
            }
            
            // Create dataset for this series
            const yAxisID = series.axis || 'y';
            
            datasets.push({
                label: translatedTitle,
                data: seriesValues,
                borderColor: series.color,
                backgroundColor: `${series.color}20`,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: false,
                tension: 0.1,
                yAxisID: yAxisID // Explicitly set the y-axis ID
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
                // Use translated no data text
                let noDataText = 'Ingen gyldige dataverdier';
                if (window.i18n && typeof window.i18n.__ === 'function') {
                    noDataText = window.i18n.__('noData');
                }
                loadingEl.innerHTML = `<div>${noDataText}</div>`;
            }
            return;
        }
        
        minValue = Math.min(...filteredValues);
        maxValue = Math.max(...filteredValues);
        
        // Store timestamps for cross-chart syncing
        timestamps = data.feeds.map(feed => feed.created_at);
        
        // Create dataset for single series - use translations if available
        // Get translated chart title
        let chartTitle = config.title;
        
        // Map common chart titles to their translation keys
        const titleMap = {
            'Temperatur': 'temperatureChart',
            'Vindusåpning': 'windowChart',
            'Lys': 'lightChart',
            'Batteri (%)': 'batteryPercentChart',
            'Temperatur Diff': 'tempDiffChart',
            'Plante Temperaturer': 'plantsTempsChart',
            'Utetemperatur': 'outTempChart',
            'Sensor Temperaturer': 'sensorsTempsChart',
            'Luftfuktighet': 'humidityChart',
            'Lufttrykk': 'pressureChart',
            'Vind': 'windChart',
            'Nedbør': 'rainChart',
            'Jordfuktighet': 'soilMoistureChart',
            'Batteri (spenning)': 'batteryVoltageChart',
            'WiFi': 'wifiChart',
            'Tid brukt': 'timeUsedChart'
        };
        
        if (window.i18n && typeof window.i18n.__ === 'function') {
            const translationKey = titleMap[config.title];
            if (translationKey) {
                chartTitle = window.i18n.__(translationKey);
            }
        }
        
        datasets.push({
            label: chartTitle,
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
        
        // Get translated stat labels
        let lowLabel = 'L';
        let avgLabel = 'A';
        let highLabel = 'H';
        let nowLabel = 'N';
        
        if (window.i18n && typeof window.i18n.__ === 'function') {
            const lowTranslation = window.i18n.__('low');
            const avgTranslation = window.i18n.__('avg');
            const highTranslation = window.i18n.__('high');
            const nowTranslation = window.i18n.__('now');
            
            lowLabel = lowTranslation && lowTranslation.length > 0 ? lowTranslation[0].toUpperCase() : 'L';
            avgLabel = avgTranslation && avgTranslation.length > 0 ? avgTranslation[0].toUpperCase() : 'A';
            highLabel = highTranslation && highTranslation.length > 0 ? highTranslation[0].toUpperCase() : 'H';
            nowLabel = nowTranslation && nowTranslation.length > 0 ? nowTranslation[0].toUpperCase() : 'N';
        }
        
        // Always prepare the innerHTML, regardless of visibility state
        // Use both short and full labels - CSS will show appropriate one based on viewport
        statsEl.innerHTML = `
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${lowLabel}:</span>
                    <span class="chart-stat-label-low"></span>
                </span>${formatNumber(adjustedMinValue)}${getUnit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${avgLabel}:</span>
                    <span class="chart-stat-label-avg"></span>
                </span>${formatNumber(avgValue)}${getUnit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${highLabel}:</span>
                    <span class="chart-stat-label-high"></span>
                </span>${formatNumber(maxValue)}${getUnit}
            </div>
            ${!data.is_multi_series ? `
            <div class="chart-stat chart-stat-current">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${nowLabel}:</span>
                    <span class="chart-stat-label-now"></span>
                </span>${currentValue !== null ? formatNumber(currentValue) + getUnit : '—'}
            </div>
            ` : ''}
        `;
        
        // Now set display based on visibility preference
        statsEl.style.display = statsVisible ? 'flex' : 'none';
    }
    
    // Ensure we're using the correct locale for time formatting
    if (window.moment && window.i18n) {
        const lang = window.i18n.getCurrentLanguage();
        const momentLocale = lang === 'no' ? 'nb' : lang;
        window.moment.locale(momentLocale);
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
    
    // Function to get all related chart data (same category and related categories)
    function getRelatedChartData(category, timestamp, config) {
        if (!timestamp) return [];
        
        const relatedData = [];
        const categoriesToInclude = [category]; // Always include the main category
        
        // Add related categories if specified in the config
        if (config && config.relatedCategories && Array.isArray(config.relatedCategories)) {
            categoriesToInclude.push(...config.relatedCategories);
        }
        
        Object.entries(window.chartRawData).forEach(([chartId, rawData]) => {
            // Check if chart's category is one we should include
            if (categoriesToInclude.includes(rawData.category)) {
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
                                color: series.color,
                                category: rawData.category // Store the category for grouping
                            });
                        });
                    } else {
                        // Single series chart
                        relatedData.push({
                            title: rawData.title,
                            value: rawData.values[closestIndex],
                            unit: getUnitForChart(chartId),
                            color: rawData.color,
                            category: rawData.category // Store the category for grouping
                        });
                    }
                }
            }
        });
        
        return relatedData;
    }
    
    // Check if this chart has a minimum value configuration
    const hasMinValue = config.minValue !== undefined;
    
    // We'll use the config title directly in the chart options
    // The DOM title element will be updated when language changes
    
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
        
        // Only show legend for multi-series charts or when explicitly enabled
        plugins: {
            ...(!data.is_multi_series && {
                legend: {
                    display: false // Don't show legend for single-series charts, including stat datasets
                }
            }),
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
            title: {
                display: false, // Don't display the title - we have our own title element
            },
            legend: {
                // Only show legend for multi-series charts
                display: data.is_multi_series === true, // Explicitly check for true to avoid false positives
                position: 'top',
                labels: {
                    boxWidth: 12, // Bit longer line
                    boxHeight: 2, // Very thin line instead of box
                    padding: 6,   // Less padding
                    font: {
                        size: 8,  // Smaller font
                        weight: 500 // Make labels slightly bolder
                    },
                    color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#c0c0c0' : undefined,
                    usePointStyle: false, // Don't use point style (use line style)
                    
                    // Add current values to the labels
                    generateLabels: function(chart) {
                        const datasets = chart.data.datasets;
                        const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                        
                        // For multi-series charts with data
                        if (data.is_multi_series && data.series && data.series.length > 0) {
                            // Update each label with the current value
                            labels.forEach((label, i) => {
                                if (i < data.series.length && datasets[i].data.length > 0) {
                                    // First, ensure label text is translated if needed
                                    if (window.i18n && typeof window.i18n.__ === 'function') {
                                        // Get original text (before any value is added)
                                        const originalText = label.text.split(':')[0].trim();
                                        
                                        // Find translation key for this series label
                                        let titleKey = null;
                                        if (originalText === 'Tak') titleKey = 'ceiling';
                                        else if (originalText === 'Intern') titleKey = 'internal';
                                        else if (originalText === 'Agurk') titleKey = 'cucumber';
                                        else if (originalText === 'Agurk 1') titleKey = 'cucumber1';
                                        else if (originalText === 'Agurk 2') titleKey = 'cucumber2';
                                        else if (originalText === 'Padron') titleKey = 'padron';
                                        else if (originalText === 'Gulv') titleKey = 'floor';
                                        
                                        // Apply translation if found
                                        if (titleKey) {
                                            const translated = window.i18n.__(titleKey);
                                            if (translated !== titleKey) {
                                                label.text = translated;
                                            }
                                        }
                                    }
                                    
                                    // Add current value to label text
                                    const currentValue = datasets[i].data[datasets[i].data.length - 1];
                                    if (currentValue !== undefined && !isNaN(currentValue)) {
                                        // Format value based on magnitude
                                        let formattedValue;
                                        if (Math.abs(currentValue) >= 10) {
                                            formattedValue = Math.round(currentValue);
                                        } else if (Math.abs(currentValue) < 1) {
                                            formattedValue = currentValue.toFixed(2);
                                        } else {
                                            formattedValue = currentValue.toFixed(1);
                                        }
                                        
                                        // Add value to label
                                        label.text += `: ${formattedValue}`;
                                        
                                        // Store the value in the label object for custom rendering if needed
                                        label.value = formattedValue;
                                    }
                                }
                            });
                        }
                        
                        return labels;
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
                        // Explicitly check current locale to make sure it's set correctly
                        if (window.moment && window.i18n) {
                            const lang = window.i18n.getCurrentLanguage();
                            // Set the locale each time to ensure it matches current language
                            const momentLocale = lang === 'no' ? 'nb' : lang;
                            window.moment.locale(momentLocale);
                        }
                        return moment(timestamps[index]).format('LLL');
                    },
                    
                    // Show data from all related charts in this tooltip
                    afterBody: (tooltipItems) => {
                        if (!tooltipItems.length) return [];
                        
                        // Get timestamp for this tooltip
                        const dataIndex = tooltipItems[0].dataIndex;
                        if (dataIndex === undefined || !timestamps[dataIndex]) return [];
                        
                        const timestamp = timestamps[dataIndex];
                        
                        // Find all related data points from same category and related categories
                        const relatedData = getRelatedChartData(config.category, timestamp, config);
                        
                        // Create a map of chart titles we're already showing in this tooltip
                        const visibleTitles = new Set();
                        
                        // For multi-series charts, track all series being shown in the main tooltip
                        tooltipItems.forEach(item => {
                            const dataset = item.dataset;
                            if (dataset && dataset.label) {
                                // For multi-series charts, store both the chart title and the series combo
                                if (data.is_multi_series) {
                                    visibleTitles.add(`${config.title} (${dataset.label.split(':')[0].trim()})`);
                                } else {
                                    visibleTitles.add(config.title);
                                }
                            }
                        });
                        
                        // Filter out values that are already shown in the tooltip
                        const filteredRelatedData = relatedData.filter(item => !visibleTitles.has(item.title));
                        
                        // Don't show anything if there are no other charts to display
                        if (filteredRelatedData.length === 0) return [];
                        
                        // Group data by category for better organization
                        const dataByCategory = {};
                        
                        // Group related data by category
                        filteredRelatedData.forEach(item => {
                            const category = item.category || 'other';
                            if (!dataByCategory[category]) {
                                dataByCategory[category] = [];
                            }
                            dataByCategory[category].push(item);
                        });
                        
                        // Format lines for tooltip with category headers
                        const lines = [];
                        let isFirstCategory = true;
                        
                        // Add each category section
                        Object.entries(dataByCategory).forEach(([category, items]) => {
                            if (items.length === 0) return;
                            
                            // Add spacing between categories
                            if (!isFirstCategory) {
                                lines.push('');
                            }
                            
                            // Get category translation key
                            const headerKey = category === 'temperature' ? 'temperatures' :
                                              category === 'weather' ? 'weather' :
                                              category === 'structure' ? 'structure' :
                                              category === 'light' ? 'light' :
                                              category === 'system' ? 'system' :
                                              category === 'soil' ? 'soil' : 'otherValues';
                            
                            // Always use translations if available (not just as fallback)
                            let headerText = '— Andre verdier —'; // Default fallback
                            
                            if (window.i18n && typeof window.i18n.__ === 'function') {
                                // Get fresh translation for current language
                                const translated = window.i18n.__(headerKey);
                                headerText = `— ${translated} —`;
                            } else {
                                // Fallback headers if i18n is not available
                                if (category === 'temperature') {
                                    headerText = '— Temperaturer —';
                                } else if (category === 'weather') {
                                    headerText = '— Vær —';
                                } else if (category === 'structure') {
                                    headerText = '— Struktur —';
                                } else if (category === 'light') {
                                    headerText = '— Lys —';
                                } else if (category === 'system') {
                                    headerText = '— System —';
                                } else if (category === 'soil') {
                                    headerText = '— Jord —';
                                }
                            }
                            
                            lines.push('', headerText);
                            
                            // Add each data item
                            items.forEach(item => {
                                // Format value based on content
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
                            
                            isFirstCategory = false;
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
    
    // Add statistical annotation datasets for avg (and optionally min/max)
    // Only do this for non-multi-series charts to avoid visual clutter
    if (!data.is_multi_series && datasets.length === 1 && filteredValues.length > 0) {
        // Calculate statistical values
        const min = Math.min(...filteredValues);
        const max = Math.max(...filteredValues);
        const avg = avgValue;
        
        // Add average line dataset (horizontal line) - always show this
        datasets.push({
            label: window.i18n ? window.i18n.__('avg') : 'Average',
            data: Array(chartData.labels.length).fill(avg),
            borderColor: '#888888',
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
            yAxisID: 'y',
            order: 1 // Place behind the main dataset
        });
        
        // Check if we should show min/max indicators based on config
        const showMax = config.indicateMax === true;
        const showMin = config.indicateMin === true;
        
        if (showMax || showMin) {
            // Create datasets for min/max points
            // Find indices where min/max values occur
            const maxIndices = [];
            const minIndices = [];
            
            // Find all occurrences of min and max values
            datasets[0].data.forEach((value, index) => {
                if (showMax && value === max) maxIndices.push(index);
                if (showMin && value === min) minIndices.push(index);
            });
            
            // Add max points dataset if configured
            if (showMax && maxIndices.length > 0) {
                // Limit to at most 3 markers to avoid clutter
                const limitedMaxIndices = maxIndices.length > 3 ? 
                    [maxIndices[0], maxIndices[Math.floor(maxIndices.length/2)], maxIndices[maxIndices.length-1]] : 
                    maxIndices;
                
                const maxData = Array(chartData.labels.length).fill(null);
                limitedMaxIndices.forEach(index => maxData[index] = max);
                
                datasets.push({
                    label: window.i18n ? window.i18n.__('high') : 'Max',
                    data: maxData,
                    backgroundColor: '#ff5252',
                    borderColor: '#ff5252',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointStyle: 'rectRot',
                    fill: false,
                    showLine: false,
                    yAxisID: 'y',
                    order: 0 // Place in front of all other datasets
                });
            }
            
            // Add min points dataset if configured
            if (showMin && minIndices.length > 0) {
                // Limit to at most 3 markers to avoid clutter
                const limitedMinIndices = minIndices.length > 3 ? 
                    [minIndices[0], minIndices[Math.floor(minIndices.length/2)], minIndices[minIndices.length-1]] : 
                    minIndices;
                
                const minData = Array(chartData.labels.length).fill(null);
                limitedMinIndices.forEach(index => minData[index] = min);
                
                datasets.push({
                    label: window.i18n ? window.i18n.__('low') : 'Min',
                    data: minData,
                    backgroundColor: '#4caf50',
                    borderColor: '#4caf50',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointStyle: 'triangle',
                    fill: false,
                    showLine: false,
                    yAxisID: 'y',
                    order: 0 // Place in front of all other datasets
                });
            }
        }
    }
    
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
    
    // Apply translations to all chart elements (labels, legend, stats)
    // This ensures that the chart is properly translated on initial creation
    if (typeof window.translateChartLabels === 'function') {
        window.translateChartLabels(chartInstances[config.id]);
    }
    
    // If this is a multi-series chart, we'll update the legend with current values
    // (This is now handled by the generateLabels function in the legend options)
    // Just update the chart to refresh the legend
    if (data.is_multi_series && chartInstances[config.id]) {
        chartInstances[config.id].update('none');
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
    // We'll skip setupDateRangeHandlers() here since it's now called in index.html
    // after the header is created dynamically
    
    // Get range and results from URL parameters or use defaults
    const range = getURLParameter('range') || '1';
    const results = parseInt(getURLParameter('results')) || 8000;
    
    // Ensure translations are loaded before creating charts
    if (window.i18n && typeof window.i18n.updatePageLanguage === 'function') {
        // Translations already loaded, initialize charts
        loadAllCharts(range, results);
    } else {
        // Wait for translations to be ready
        const checkTranslations = setInterval(() => {
            if (window.i18n && typeof window.i18n.updatePageLanguage === 'function') {
                clearInterval(checkTranslations);
                loadAllCharts(range, results);
            }
        }, 50);
    }
    
    // Add a failsafe for charts disappearing
    setInterval(() => {
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer && chartContainer.children.length === 0) {
            console.log('Charts disappeared, reloading...');
            
            // Get current range and results
            const currentRange = getURLParameter('range') || '1';
            const currentResults = parseInt(getURLParameter('results')) || 8000;
            
            // Reload all charts
            loadAllCharts(currentRange, currentResults);
        }
    }, 30000); // Check every 30 seconds
    
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
/**
 * Chart Components
 * 
 * This file contains reusable components for the DriMon chart system.
 * Each component is a function that creates and returns DOM elements 
 * or specialized chart configurations.
 */

/**
 * Creates a chart container with title, stats section, and canvas area
 * @param {Object} config - Chart configuration object
 * @param {boolean} isMobile - Whether the chart is being rendered in mobile mode
 * @returns {HTMLElement} The chart container div element
 */
function createChartContainer(config, isMobile = false) {
    // Create chart div
    const chartDiv = document.createElement('div');
    chartDiv.className = 'chart';
    
    // Add multi-series class if needed
    if (config.series && Array.isArray(config.series) && config.series.length > 1) {
        chartDiv.classList.add('multi-series');
    }
    
    // Only set grid positions if not mobile (CSS will override these in mobile mode)
    if (!isMobile && config.gridRow && config.gridColumn) {
        chartDiv.style.gridRow = config.gridRow;
        chartDiv.style.gridColumn = config.gridColumn;
    }
    
    // Add data attributes for potential filtering
    chartDiv.setAttribute('data-row', config.row);
    chartDiv.setAttribute('data-category', config.category || '');
    
    // Create title
    const titleDiv = createChartTitle(config.title);
    
    // Create stats container (will be populated with data later)
    const statsDiv = createChartStats(config.id);
    
    // Create canvas container with loading indicator
    const canvasContainer = createChartCanvasContainer(config.id);
    
    // Assemble the DOM structure
    chartDiv.appendChild(titleDiv);
    chartDiv.appendChild(statsDiv);
    chartDiv.appendChild(canvasContainer);
    
    return chartDiv;
}

/**
 * Creates a chart title element
 * @param {string} title - The title text
 * @returns {HTMLElement} The title div element
 */
function createChartTitle(title) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'chart-title';
    
    // Store original title for i18n
    titleDiv.setAttribute('data-original-title', title);
    
    // Try to translate the title if I18n is available
    let displayTitle = title;
    if (window.ChartI18n && typeof window.ChartI18n.translateChartTitle === 'function') {
        displayTitle = window.ChartI18n.translateChartTitle(title);
    } else if (window.I18n && typeof window.I18n.translate === 'function') {
        // Fallback to direct i18n if ChartI18n is not available
        displayTitle = window.I18n.translate(title);
    }
    
    titleDiv.textContent = displayTitle;
    titleDiv.title = displayTitle; // Add tooltip
    
    return titleDiv;
}

/**
 * Creates a chart stats container element
 * @param {string} chartId - The ID of the chart
 * @returns {HTMLElement} The stats div element
 */
function createChartStats(chartId) {
    const statsDiv = document.createElement('div');
    statsDiv.className = 'chart-stats';
    statsDiv.id = `stats-${chartId}`;
    
    // Stats content will be populated later with chart data
    // Initial visibility is controlled by localStorage.getItem('statsVisible')
    
    return statsDiv;
}

/**
 * Creates a chart canvas container with loading indicator
 * @param {string} chartId - The ID of the chart
 * @returns {HTMLElement} The canvas container div element
 */
function createChartCanvasContainer(chartId) {
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'chart-canvas-container';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = chartId;
    
    // Add loading indicator - always visible initially
    const loadingDiv = createLoadingIndicator(chartId);
    
    canvasContainer.appendChild(canvas);
    canvasContainer.appendChild(loadingDiv);
    
    return canvasContainer;
}

/**
 * Creates a loading indicator element
 * @param {string} chartId - The ID of the chart
 * @returns {HTMLElement} The loading indicator div element
 */
function createLoadingIndicator(chartId) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.id = `loading-${chartId}`;
    loadingDiv.style.display = 'block'; // Ensure it's visible
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    const loadingText = document.createElement('div');
    // Use i18n for loading text if available
    loadingText.textContent = window.I18n && typeof window.I18n.translate === 'function' ? 
        window.I18n.translate('loading') : 'Laster data...';
    
    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(loadingText);
    
    return loadingDiv;
}

/**
 * Updates the chart stats display with calculated values
 * @param {string} chartId - The ID of the chart
 * @param {Object} statsData - Object containing min, max, avg, and current values
 * @param {boolean} isMultiSeries - Whether the chart has multiple data series
 * @param {string} unit - The unit of measurement (optional)
 * @param {Function} formatNumber - Function to format numeric values
 * @returns {void}
 */
function updateChartStats(chartId, statsData, isMultiSeries, unit = '', formatNumber) {
    const statsEl = document.getElementById(`stats-${chartId}`);
    if (!statsEl) return;
    
    const { minValue, maxValue, avgValue, currentValue } = statsData;
    const getUnit = unit;
    
    // Format function fallback if not provided
    const formatter = formatNumber || ((val) => val.toFixed(1));
    
    // Get translated labels
    let lowLabel = 'L';
    let avgLabel = 'A';
    let highLabel = 'H';
    let nowLabel = 'N';
    
    if (window.I18n && typeof window.I18n.translate === 'function') {
        const statsLabels = window.ChartI18n && typeof window.ChartI18n.getStatisticsLabels === 'function' ?
            window.ChartI18n.getStatisticsLabels() : {
                min: window.I18n.translate('low'),
                avg: window.I18n.translate('avg'),
                max: window.I18n.translate('high'),
                current: window.I18n.translate('now')
            };
            
        lowLabel = statsLabels.min.charAt(0).toUpperCase();
        avgLabel = statsLabels.avg.charAt(0).toUpperCase();
        highLabel = statsLabels.max.charAt(0).toUpperCase();
        nowLabel = statsLabels.current.charAt(0).toUpperCase();
    }
    
    // Always prepare the innerHTML, regardless of visibility state
    // Use both short and full labels - CSS will show appropriate one based on viewport
    statsEl.innerHTML = `
        <div class="chart-stat">
            <span class="chart-stat-label">
                <span class="chart-stat-label-short">${lowLabel}:</span>
                <span class="chart-stat-label-low"></span>
            </span>${formatter(minValue)}${getUnit}
        </div>
        <div class="chart-stat">
            <span class="chart-stat-label">
                <span class="chart-stat-label-short">${avgLabel}:</span>
                <span class="chart-stat-label-avg"></span>
            </span>${formatter(avgValue)}${getUnit}
        </div>
        <div class="chart-stat">
            <span class="chart-stat-label">
                <span class="chart-stat-label-short">${highLabel}:</span>
                <span class="chart-stat-label-high"></span>
            </span>${formatter(maxValue)}${getUnit}
        </div>
        ${!isMultiSeries ? `
        <div class="chart-stat chart-stat-current">
            <span class="chart-stat-label">
                <span class="chart-stat-label-short">${nowLabel}:</span>
                <span class="chart-stat-label-now"></span>
            </span>${currentValue !== null ? formatter(currentValue) + getUnit : '—'}
        </div>
        ` : ''}
    `;
    
    // Set display based on visibility preference
    const statsVisible = localStorage.getItem('statsVisible') !== 'false';
    statsEl.style.display = statsVisible ? 'flex' : 'none';
}

/**
 * Updates the loading indicator with a message
 * @param {string} chartId - The ID of the chart
 * @param {string} message - The message to display
 * @param {boolean} show - Whether to show or hide the indicator
 * @returns {void}
 */
function updateLoadingIndicator(chartId, message = null, show = true) {
    // Use i18n for default message if available
    const defaultMessage = window.I18n && typeof window.I18n.translate === 'function' ? 
        window.I18n.translate('loading') : 'Laster data...';
    const displayMessage = message || defaultMessage;
    const loadingEl = document.getElementById(`loading-${chartId}`);
    if (!loadingEl) return;
    
    if (show) {
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <div>${displayMessage}</div>
        `;
        loadingEl.style.display = 'block';
    } else {
        loadingEl.style.display = 'none';
    }
}


/**
 * Creates a complete Chart.js configuration object
 * @param {Object} config - Chart configuration 
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @param {Object} chartData - Data for the chart
 * @param {function} syncCallback - Callback for syncing tooltips
 * @returns {Object} Complete Chart.js configuration
 */
function createChartOptions(config, isDarkMode, chartData, syncCallback) {
    const hasMinValue = config.minValue !== undefined;
    const paddedMinValue = chartData.paddedMinValue;
    const paddedMaxValue = chartData.paddedMaxValue;
    const isMobile = window.innerWidth <= 768;
    
    // Base chart options
    return {
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
                    maxTicksLimit: isMobile ? 6 : ((config.columnSpan && config.columnSpan >= 2) ? 6 : 4),
                    font: {
                        size: 9
                    },
                    color: isDarkMode ? '#c0c0c0' : '#666'
                },
                border: {
                    display: false
                }
            },
            y: {
                position: isMobile ? 'left' : 'right', // Position scale on left for mobile, right for desktop
                grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
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
                        size: isMobile ? 8 : 9
                    },
                    maxTicksLimit: isMobile ? 4 : 5,
                    color: isDarkMode ? '#c0c0c0' : '#666',
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
            ...(config.secondYAxis && createSecondaryYAxisOptions(chartData, isDarkMode, isMobile))
        },
        
        plugins: {
            legend: createLegendOptions(chartData, isDarkMode),
            tooltip: createTooltipOptions(config, chartData)
        },
        
        // Custom handler for hover events
        onHover: (event, elements, chart) => {
            if (!elements || !elements.length) return;
            
            const dataIndex = elements[0].index;
            if (syncCallback) syncCallback(chart, dataIndex);
        }
    };
}

/**
 * Creates configuration for secondary Y axis
 * @param {Object} chartData - Chart data object
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @param {boolean} isMobile - Whether mobile mode is active
 * @returns {Object} Secondary Y axis configuration
 */
function createSecondaryYAxisOptions(chartData, isDarkMode, isMobile) {
    return {
        y1: {
            position: 'left', // Put second axis on the opposite side
            grid: {
                display: false, // Don't show grid lines for second axis
                drawOnChartArea: false
            },
            // Calculate y1 range based on second series values (if available)
            suggestedMin: chartData.secondaryAxisMin || 0,
            suggestedMax: chartData.secondaryAxisMax || 100,
            ticks: {
                font: {
                    size: isMobile ? 8 : 9
                },
                maxTicksLimit: isMobile ? 4 : 5,
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
    };
}

/**
 * Creates legend options for Chart.js
 * @param {Object} chartData - Chart data object
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @returns {Object} Legend configuration
 */
function createLegendOptions(chartData, isDarkMode) {
    return {
        // Only show legend for multi-series charts
        display: chartData.isMultiSeries === true,
        position: 'top',
        labels: {
            boxWidth: 12, // Bit longer line
            boxHeight: 2, // Very thin line instead of box
            padding: 6,   // Less padding
            font: {
                size: 8,  // Smaller font
                weight: 500 // Make labels slightly bolder
            },
            color: isDarkMode ? '#c0c0c0' : undefined,
            usePointStyle: false, // Don't use point style (use line style)
            
            // Add current values to the labels
            generateLabels: function(chart) {
                const datasets = chart.data.datasets;
                const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                
                // For multi-series charts with data
                if (chartData.isMultiSeries && chartData.series && chartData.series.length > 0) {
                    // Update each label with the current value
                    labels.forEach((label, i) => {
                        if (i < chartData.series.length && datasets[i].data.length > 0) {
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
    };
}

/**
 * Creates tooltip options for Chart.js
 * @param {Object} config - Chart configuration
 * @param {Object} chartData - Chart data object
 * @returns {Object} Tooltip configuration
 */
function createTooltipOptions(config, chartData) {
    return {
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
                if (!tooltipItems.length || !chartData.timestamps) return '';
                const index = tooltipItems[0].dataIndex;
                return moment(chartData.timestamps[index]).format('LLL');
            },
            
            // Detailed tooltip callback to be implemented in chart_renderer.js
            // This allows for cross-chart data access which this component doesn't have
            afterBody: null // Will be set by chart_renderer.js
        }
    };
}

// Export the components
if (typeof window !== 'undefined') {
    // Browser environment
    window.ChartComponents = {
        createChartContainer,
        createChartTitle,
        createChartStats,
        createChartCanvasContainer,
        createLoadingIndicator,
        updateChartStats,
        updateLoadingIndicator,
        createChartOptions,
        createSecondaryYAxisOptions,
        createLegendOptions,
        createTooltipOptions
    };
}
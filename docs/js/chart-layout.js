/**
 * @file chart-layout.js
 * @description Utility functions for chart layout management and grid positioning
 * @module core/chart-layout
 */

/**
 * @namespace ChartLayout
 * @description Utility functions for chart layout and DOM management
 */
window.ChartLayout = window.ChartLayout || {

    /**
     * Calculate grid positions for each chart based on config
     * @param {Object} rowGroups - Charts grouped by row
     * @returns {void} - Modifies the chart objects directly
     */
    calculateGridPositions: function(rowGroups) {
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
    },
    
    /**
     * Creates a chart title element with proper translations
     * @param {Object} config - Chart configuration
     * @returns {HTMLElement} The title div element
     */
    createChartTitle: function(config) {
        // Get translation key directly from config or use a fallback
        const translationKey = config.titleKey || 
            (config.title ? config.title.toLowerCase().replace(/\s+/g, '') : 'chart');
        
        // Create title div with translation attributes
        const titleDiv = document.createElement('div');
        titleDiv.className = 'chart-title';
        titleDiv.setAttribute('data-i18n', translationKey);
        
        // Apply translation
        const translatedTitle = window.I18n.translate(translationKey);
        titleDiv.textContent = translatedTitle;
        titleDiv.title = translatedTitle;
        
        // Add tooltip translation attribute
        titleDiv.setAttribute('data-i18n-title', translationKey);
        
        return titleDiv;
    },
    
    /**
     * Creates a loading indicator with translated text
     * @returns {HTMLElement} The loading indicator element
     */
    createLoadingIndicator: function(chartId) {
        // Create container
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.id = `loading-${chartId}`;
        loadingDiv.classList.add('show');
        
        // Create spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        // Add translated text
        const loadingText = document.createElement('div');
        loadingText.textContent = window.I18n.translate('loading');
        
        // Assemble elements
        loadingDiv.appendChild(spinner);
        loadingDiv.appendChild(loadingText);
        
        return loadingDiv;
    },
    
    /**
     * Initializes the chart layout and creates DOM elements for charts
     * @param {Array} [configs] - Optional chart configs to use (defaults to window.chartConfigs)
     * @returns {void}
     */
    initializeChartLayout: function(configs = null) {
        const chartContainer = document.getElementById('chartContainer');
        chartContainer.innerHTML = '';
        
        // Use provided configs or fall back to all configs
        const chartsToUse = configs || window.chartConfigs;
        
        // Add appropriate CSS class based on chart count
        if (chartsToUse.length === 6) {
            chartContainer.classList.add('dashboard-mode');
            
            // For 6 charts, skip the complex grid positioning and just use CSS grid
            // Charts will be placed in order: 3 charts per row, 2 rows
        } else {
            chartContainer.classList.remove('dashboard-mode');
            
            // Group charts by row (1-4) for organization for desktop view
            const rowGroups = {};
            chartsToUse.forEach(config => {
                if (!rowGroups[config.row]) {
                    rowGroups[config.row] = [];
                }
                rowGroups[config.row].push(config);
            });
            
            // Calculate grid positions for each chart (for desktop view)
            this.calculateGridPositions(rowGroups);
        }
        
        // Determine if we're in mobile mode (for class distinction)
        const isMobile = window.innerWidth <= 768;
        
        // For mobile sort by rows, then by column position to ensure a logical order
        let orderedConfigs = [...chartsToUse];
        
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
            // Support debug tracking if enabled
            const completionCallback = window.DriMonDebug && window.DriMonDebug.trackChartCreation ? 
                window.DriMonDebug.trackChartCreation(config) : null;
                
            const chartDiv = document.createElement('div');
            chartDiv.className = 'chart';
            chartDiv.setAttribute('data-chart-id', config.id);
            
            // Only enable dragging in regular desktop mode (not dashboard or mobile)
            const isDashboard = chartContainer.classList.contains('dashboard-mode');
            const enableDragging = !isDashboard && !isMobile;
            
            if (enableDragging) {
                chartDiv.draggable = true;
                chartDiv.style.cursor = 'grab';
            }
            
            // Add multi-series class if needed
            if (config.series && Array.isArray(config.series) && config.series.length > 1) {
                chartDiv.classList.add('multi-series');
            }
            
            // Only set grid positions if not mobile and not dashboard mode (CSS will override these)
            if (!isMobile && !chartContainer.classList.contains('dashboard-mode')) {
                chartDiv.style.gridRow = config.gridRow;
                chartDiv.style.gridColumn = config.gridColumn;
            }
            
            // Add data attributes for row and category for potential filtering
            chartDiv.setAttribute('data-row', config.row);
            chartDiv.setAttribute('data-category', config.category || '');
            
            // Create and add title with drag handle
            const titleDiv = this.createChartTitle(config);
            titleDiv.style.position = 'relative';
            
            // Add drag handle (grip icon) only if dragging is enabled
            if (enableDragging) {
                const dragHandle = document.createElement('span');
                dragHandle.className = 'chart-drag-handle';
                dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
                dragHandle.style.cssText = `
                    position: absolute;
                    right: 5px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #888;
                    cursor: grab;
                    font-size: 12px;
                    opacity: 0.7;
                `;
                dragHandle.title = 'Drag to reorder';
                titleDiv.appendChild(dragHandle);
            }
            
            // Add drag event listeners only if dragging is enabled
            if (enableDragging) {
                chartDiv.addEventListener('dragstart', (e) => {
                    chartDiv.style.opacity = '0.6';  // Just slightly faded
                    chartDiv.style.zIndex = '1000';
                    chartDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    e.dataTransfer.setData('text/plain', config.id);
                });
                
                chartDiv.addEventListener('dragend', (e) => {
                    chartDiv.style.opacity = '';
                    chartDiv.style.zIndex = '';
                    chartDiv.style.boxShadow = '';
                });
            }
            
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
            
            // Add loading indicator
            const loadingDiv = this.createLoadingIndicator(config.id);
            
            // Assemble the DOM structure
            canvasContainer.appendChild(canvas);
            canvasContainer.appendChild(loadingDiv);
            
            chartDiv.appendChild(titleDiv);
            chartDiv.appendChild(statsDiv); // Add stats div below the title
            chartDiv.appendChild(canvasContainer);
            
            chartContainer.appendChild(chartDiv);
            
            // Call completion callback for debug tracking if it exists
            if (completionCallback && typeof completionCallback === 'function') {
                completionCallback();
            }
        });
        
        // Add window resize handler (but avoid duplicate listeners)
        window.removeEventListener('resize', window.resizeAllCharts);
        window.addEventListener('resize', window.resizeAllCharts);
        
        // Make the chart container a drop zone only if not dashboard/mobile
        const isDashboard = chartContainer.classList.contains('dashboard-mode');
        const enableDragDropZone = !isDashboard && !isMobile;
        
        if (enableDragDropZone) {
            chartContainer.addEventListener('dragover', (e) => {
                e.preventDefault(); // Allow dropping
                
                // Clear all previous hover effects
                document.querySelectorAll('.chart').forEach(chart => {
                    chart.style.borderTop = '';
                });
                
                // Find the chart we're hovering over
                const hoveredChart = e.target.closest('.chart');
                if (hoveredChart) {
                    // Add visual feedback with theme-friendly color
                    hoveredChart.style.borderTop = '3px solid #ff9500';
                }
            });
            
            chartContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedChartId = e.dataTransfer.getData('text/plain');
                
                // Find drop target and dragged chart
                const dropTarget = e.target.closest('.chart');
                const draggedChart = document.querySelector(`.chart[data-chart-id="${draggedChartId}"]`);
                
                if (draggedChart && dropTarget && dropTarget !== draggedChart) {
                    // Regular mode: 4 columns, 4 rows (dashboard mode disabled, so only regular)
                    chartContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
                    chartContainer.style.gridTemplateRows = 'repeat(4, 1fr)';
                    
                    // Clear all grid positioning
                    document.querySelectorAll('.chart').forEach(chart => {
                        chart.style.gridRow = '';
                        chart.style.gridColumn = '';
                        chart.style.borderTop = ''; // Clean up visual feedback
                    });
                    
                    // Swap the two charts
                    const draggedNext = draggedChart.nextElementSibling;
                    const targetNext = dropTarget.nextElementSibling;
                    
                    if (draggedNext) {
                        chartContainer.insertBefore(dropTarget, draggedNext);
                    } else {
                        chartContainer.appendChild(dropTarget);
                    }
                    
                    if (targetNext) {
                        chartContainer.insertBefore(draggedChart, targetNext);
                    } else {
                        chartContainer.appendChild(draggedChart);
                    }
                    
                    // Save the new order
                    this.saveChartOrder();
                } else if (draggedChart && dropTarget === draggedChart) {
                    // Dropped on itself - do nothing
                    // Just clean up visual feedback
                    document.querySelectorAll('.chart').forEach(chart => {
                        chart.style.borderTop = '';
                    });
                } else if (draggedChart) {
                    // Fallback: move to end if no valid drop target (dropped in empty space)
                    chartContainer.appendChild(draggedChart);
                    this.saveChartOrder();
                }
            });
        }
        
        // Add a class to the container based on viewport
        chartContainer.classList.toggle('mobile-layout', isMobile);
        
        // Restore saved chart order if any
        setTimeout(() => {
            this.restoreChartOrder();
        }, 100);
    },
    
    /**
     * Sorts chart elements by category in mobile view
     * @param {string} category - The category to sort by, or 'row' for row-based sorting
     * @returns {void}
     */
    sortChartsByCategory: function(category) {
        // Only apply sorting on mobile (to avoid issues on desktop grid layout)
        const isMobileView = window.innerWidth <= 768;
        
        if (!isMobileView) {
            return;
        }
        
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) return;
        
        const charts = Array.from(chartContainer.querySelectorAll('.chart'));
        
        // Create a sortable array of chart elements with their metadata
        const chartElements = charts.map(chart => {
            // Get canvas element - if missing, skip this chart
            const canvas = chart.querySelector('canvas');
            if (!canvas) return null;
            
            return {
                element: chart,
                row: parseInt(chart.getAttribute('data-row') || '0'),
                category: chart.getAttribute('data-category') || '',
                id: canvas.id
            };
        }).filter(Boolean); // Remove any null elements
        
        // Get the column position for a chart element
        function getColumnPosition(chartElement) {
            // Try to get from config first (most reliable source)
            const config = window.chartConfigs.find(c => c.id === chartElement.id);
            let column = 0;
            
            if (config && config.gridColumn) {
                column = parseInt(config.gridColumn.split('/')[0]) || 0;
            } else if (chartElement.element.style.gridColumn) {
                column = parseInt(chartElement.element.style.gridColumn.split('/')[0]) || 0;
            }
            
            return column;
        }
        
        // Sort charts based on category
        if (category === 'row') {
            // Sort by row number and then by column position
            chartElements.sort((a, b) => {
                if (a.row !== b.row) {
                    return a.row - b.row;
                }
                
                // Compare column positions
                const aCol = getColumnPosition(a);
                const bCol = getColumnPosition(b);
                
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
    },

    /**
     * Save current chart order to localStorage
     * @returns {void}
     */
    saveChartOrder: function() {
        const chartContainer = document.getElementById('chartContainer');
        const charts = chartContainer.querySelectorAll('.chart');
        const order = Array.from(charts).map(chart => chart.getAttribute('data-chart-id'));
        
        localStorage.setItem('chartOrder', JSON.stringify(order));
    },

    /**
     * Restore chart order from localStorage
     * @returns {void}
     */
    restoreChartOrder: function() {
        const saved = localStorage.getItem('chartOrder');
        if (!saved) return;
        
        const order = JSON.parse(saved);
        const chartContainer = document.getElementById('chartContainer');
        
        // Switch to reorderable mode based on mode
        if (chartContainer.classList.contains('dashboard-mode')) {
            // Dashboard mode: 3 columns, 2 rows
            chartContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
            chartContainer.style.gridTemplateRows = 'repeat(2, 1fr)';
        } else {
            // Regular mode: 4 columns, 4 rows
            chartContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
            chartContainer.style.gridTemplateRows = 'repeat(4, 1fr)';
        }
        
        // Reorder charts according to saved order
        order.forEach(chartId => {
            const chart = document.querySelector(`.chart[data-chart-id="${chartId}"]`);
            if (chart) {
                chart.style.gridRow = '';
                chart.style.gridColumn = '';
                chartContainer.appendChild(chart);
            }
        });
    },

    /**
     * Reset to original chart order
     * @returns {void}
     */
    resetChartOrder: function() {
        localStorage.removeItem('chartOrder');
        // Could also reload charts here if needed
    }
};
// Global timezone setting
const timezone = "Europe/Oslo";

// Initialize moment.js locale based on the current language
document.addEventListener('DOMContentLoaded', () => {
    if (window.moment && window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
        const lang = window.i18n.getCurrentLanguage() || 'no';
        const momentLocale = lang === 'no' ? 'nb' : lang;
        window.moment.locale(momentLocale);
    }
    
    // Initialize mobile layout adjustments
    setupMobileLayout();
});

// Function to handle mobile layout adjustments
function setupMobileLayout() {
    // Check if we're on mobile
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    
    if (isMobile) {
        // Move mobile sort element to header controls
        const mobileSort = document.getElementById('mobileSortContainer');
        const headerControls = document.querySelector('.mobile-header-controls');
        
        if (mobileSort && headerControls) {
            headerControls.appendChild(mobileSort);
            
            // Sync mobile select with main select for value consistency
            const mainSelect = document.getElementById('sortSelect');
            const mobileSelect = document.getElementById('mobileSortSelect');
            
            if (mainSelect && mobileSelect) {
                // Initial sync
                mobileSelect.value = mainSelect.value;
                
                // Keep values in sync when either changes
                mainSelect.addEventListener('change', () => {
                    mobileSelect.value = mainSelect.value;
                });
                
                mobileSelect.addEventListener('change', () => {
                    mainSelect.value = mobileSelect.value;
                    // Trigger change event on main select to keep behavior consistent
                    mainSelect.dispatchEvent(new Event('change'));
                });
            }
        }
    }
    
    // Handle window resize to adjust layout
    window.addEventListener('resize', () => {
        const isMobileNow = window.matchMedia('(max-width: 768px)').matches;
        const mobileSort = document.getElementById('mobileSortContainer');
        const headerControls = document.querySelector('.mobile-header-controls');
        const searchContainer = document.querySelector('.search-container');
        
        if (isMobileNow && mobileSort && headerControls) {
            // Move to mobile position if not already there
            if (mobileSort.parentElement !== headerControls) {
                headerControls.appendChild(mobileSort);
            }
        } else if (!isMobileNow && mobileSort && searchContainer) {
            // Move back to original position if not in mobile view
            if (mobileSort.parentElement !== searchContainer) {
                searchContainer.appendChild(mobileSort);
            }
        }
    });
}

// Reference to fetchChartData function needed for periodic updates
// This will be set by chart_renderer.js

// Function to toggle dark mode
function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Toggle theme attribute
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    
    // Update toggle button icon
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        const icon = darkModeToggle.querySelector('.icon');
        if (icon) {
            icon.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        }
    }
    
    // Save preference in localStorage
    localStorage.setItem('darkMode', isDark ? 'light' : 'dark');
    
    // Update chart colors if they exist
    updateChartColors(!isDark);
}

// Function to update chart colors based on theme
function updateChartColors(isDark) {
    // Only update if charts exist
    if (!window.chartInstances) return;
    
    // Get all chart instances
    Object.values(window.chartInstances).forEach(chart => {
        if (!chart) return;
        
        // Update grid colors
        if (chart.options.scales.y.grid) {
            chart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        }
        
        // Update tick colors
        if (chart.options.scales.y.ticks) {
            chart.options.scales.y.ticks.color = isDark ? '#c0c0c0' : '#666';
        }
        
        if (chart.options.scales.x.ticks) {
            chart.options.scales.x.ticks.color = isDark ? '#c0c0c0' : '#666';
        }
        
        // Update legend colors for better readability in dark mode
        if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
            chart.options.plugins.legend.labels.color = isDark ? '#c0c0c0' : '#666';
            
            // Make legend text slightly bolder in dark mode
            if (chart.options.plugins.legend.labels.font) {
                chart.options.plugins.legend.labels.font.weight = isDark ? 500 : 400;
            }
        }
        
        // Update without animation
        chart.update('none');
    });
}

// Function to toggle stats display
function toggleStats() {
    // Get current visibility state
    const isVisible = localStorage.getItem('statsVisible') !== 'false';
    
    // Toggle the state
    localStorage.setItem('statsVisible', isVisible ? 'false' : 'true');
    
    // Update button appearance
    const statsToggle = document.getElementById('statsToggle');
    if (statsToggle) {
        statsToggle.classList.toggle('active', !isVisible);
    }
    
    // Update all stat elements' visibility - ensure they have content before showing
    document.querySelectorAll('.chart-stats').forEach(el => {
        // First ensure the elements have content if toggling to visible
        if (!isVisible && el.innerHTML.trim() === '') {
            // Create placeholder content if empty - will be replaced when charts update
            // Check if this is a multi-series chart from class name or data attribute
            const isMultiSeries = el.closest('.chart').classList.contains('multi-series');
            
            el.innerHTML = `
                <div class="chart-stat">
                    <span class="chart-stat-label">
                        <span class="chart-stat-label-short">L:</span>
                        <span class="chart-stat-label-low"></span>
                    </span>—
                </div>
                <div class="chart-stat">
                    <span class="chart-stat-label">
                        <span class="chart-stat-label-short">A:</span>
                        <span class="chart-stat-label-avg"></span>
                    </span>—
                </div>
                <div class="chart-stat">
                    <span class="chart-stat-label">
                        <span class="chart-stat-label-short">H:</span>
                        <span class="chart-stat-label-high"></span>
                    </span>—
                </div>
                ${!isMultiSeries ? `
                <div class="chart-stat chart-stat-current">
                    <span class="chart-stat-label">
                        <span class="chart-stat-label-short">N:</span>
                        <span class="chart-stat-label-now"></span>
                    </span>—
                </div>
                ` : ''}
            `;
        }
        
        // Now set display style
        el.style.display = isVisible ? 'none' : 'flex';
        
        // Ensure stats get proper height allocation
        if (!isVisible) {
            // Force a reflow to ensure height is allocated
            setTimeout(() => {
                if (window.chartInstances) {
                    Object.values(window.chartInstances).forEach(chart => {
                        if (chart) chart.resize();
                    });
                }
            }, 10);
        }
    });
}

// Initialize app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved dark mode preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update toggle button icon
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle && savedTheme === 'dark') {
            const icon = darkModeToggle.querySelector('.icon');
            if (icon) {
                icon.innerHTML = '<i class="fas fa-sun"></i>';
            }
        }
    }
    
    // Apply saved stats display preference
    const statsVisible = localStorage.getItem('statsVisible') !== 'false';
    const statsToggle = document.getElementById('statsToggle');
    if (statsToggle) {
        statsToggle.classList.toggle('active', statsVisible);
    }
    
    // Note: The event handlers for darkModeToggle and statsToggle are now set up
    // in the index.html file after the header is created dynamically
    
    // Fetch initial data for header (weather is handled separately in weather.js)
    fetchData();
    
    // Set up periodic data refresh for header (every minute)
    setInterval(() => {
        // Update header data (weather updates on its own schedule)
        fetchData();
        
        // Also refresh charts if showing the latest data
        const currentRange = getURLParameter('range') || 'default';
        if (currentRange === '1' || currentRange === 'today' || currentRange === 'default') {
            const currentResults = parseInt(getURLParameter('results')) || 8000;
            
            // Use a gentle refresh approach that won't destroy the charts
            // but will update them with new data
            window.chartConfigs.forEach(async (config) => {
                try {
                    // Get the effective range - if currentRange is 'default', use the chart's defaultRange or fallback to 1
                    const effectiveRange = currentRange === 'default' 
                        ? (config.defaultRange || 1)
                        : currentRange;
                    
                    const newData = await fetchChartData(config, effectiveRange, currentResults);
                    if (window.chartInstances[config.id] && newData) {
                        // Check if it's a multi-series chart
                        if (newData.is_multi_series && newData.series && newData.series.length > 0) {
                            // Update each series
                            for (let i = 0; i < newData.series.length; i++) {
                                const series = newData.series[i];
                                if (series && series.feeds && series.feeds.length > 0) {
                                    const values = series.feeds.map(feed => parseFloat(feed[`field${series.field}`]));
                                    
                                    // Update dataset if it exists
                                    if (window.chartInstances[config.id].data.datasets[i]) {
                                        window.chartInstances[config.id].data.datasets[i].data = values;
                                    }
                                }
                            }
                            
                            // Update labels from first series
                            if (newData.series[0] && newData.series[0].feeds && newData.series[0].feeds.length > 0) {
                                // Format dates consistently with auto-detected format
                                let timeFormat = 'HH:mm'; // Default format
                                
                                // Try to get the existing format the chart is using
                                if (window.chartTimeFormats && window.chartTimeFormats[config.id]) {
                                    timeFormat = window.chartTimeFormats[config.id];
                                } else if (window.determineSmartTimeFormat) {
                                    // Calculate smart format based on timestamps
                                    const timestamps = newData.series[0].feeds.map(feed => feed.created_at);
                                    timeFormat = window.determineSmartTimeFormat(timestamps);
                                }
                                
                                const labels = newData.series[0].feeds.map(feed => moment(feed.created_at).format(timeFormat));
                                window.chartInstances[config.id].data.labels = labels;
                            }
                            
                            // Update the chart - this will refresh the legend with current values
                            window.chartInstances[config.id].update('none');
                            
                            // Recalculate stats after update
                            if (window.recalculateChartStats) {
                                window.recalculateChartStats(window.chartInstances[config.id]);
                            }
                        } 
                        // Single series chart
                        else if (newData.feeds && newData.feeds.length > 0) {
                            const values = newData.feeds.map(feed => parseFloat(feed[`field${config.field}`]));
                            // Format dates consistently with auto-detected format
                            let timeFormat = 'HH:mm'; // Default format
                            
                            // Try to get the existing format the chart is using
                            if (window.chartTimeFormats && window.chartTimeFormats[config.id]) {
                                timeFormat = window.chartTimeFormats[config.id];
                            } else if (window.determineSmartTimeFormat) {
                                // Calculate smart format based on timestamps
                                const timestamps = newData.feeds.map(feed => feed.created_at);
                                timeFormat = window.determineSmartTimeFormat(timestamps);
                            }
                            
                            const labels = newData.feeds.map(feed => moment(feed.created_at).format(timeFormat));
                            
                            window.chartInstances[config.id].data.labels = labels;
                            window.chartInstances[config.id].data.datasets[0].data = values;
                            window.chartInstances[config.id].update('none'); // Update without animation
                            
                            // Recalculate stats after update
                            if (window.recalculateChartStats) {
                                window.recalculateChartStats(window.chartInstances[config.id]);
                            }
                        }
                    }
                } catch (e) {
                    console.error(`Error updating chart ${config.id}:`, e);
                }
            });
        }
    }, 60000);
    
    // NOTE: The updateMultiSeriesTitle function has been removed as this functionality
    // has been moved to the Chart.js legend with current values
    
    // Add click event to the logo for GitHub link
    const logo = document.getElementById('main-title');
    if (logo) {
        logo.parentElement.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://github.com/fmmr/drimon', '_blank');
        });
    }
    
    // Add window resize handler with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Call resize handler in chart_renderer.js
            if (typeof window.resizeAllCharts === 'function') {
                window.resizeAllCharts();
            }
            
            // Reattach date dropdown handlers after DOM manipulation
            reattachDateDropdownHandlers();
        }, 250);
    });
    
    // Function to position and show dropdown
    function positionAndShowDropdown(button, dropdown) {
        // Get button position
        const buttonRect = button.getBoundingClientRect();
        
        // Position dropdown - account for mobile specific adjustments
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        
        // Set initial position
        dropdown.style.top = (buttonRect.bottom + 5) + 'px';
        dropdown.style.left = buttonRect.left + 'px';
        
        // Adjust for mobile
        if (isMobile) {
            // Ensure dropdown isn't positioned off-screen
            const viewportWidth = window.innerWidth;
            const dropdownWidth = 150; // Approximate width
            
            // If dropdown would go off right edge, align to right
            if (buttonRect.left + dropdownWidth > viewportWidth) {
                dropdown.style.left = (viewportWidth - dropdownWidth - 10) + 'px';
            }
            
            // If the button is in the bottom half of the screen, position dropdown above
            if (buttonRect.top > window.innerHeight / 2) {
                dropdown.style.top = 'auto';
                dropdown.style.bottom = (window.innerHeight - buttonRect.top + 5) + 'px';
            }
        }
        
        // Show the dropdown
        dropdown.classList.toggle('show');
    }
    
    // Function to reattach date dropdown handlers
    function reattachDateDropdownHandlers() {
        const dropdownButtons = document.querySelectorAll('.date-dropdown-button');
        
        dropdownButtons.forEach(button => {
            // Remove any existing listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            const dropdownContent = newButton.nextElementSibling;
            
            if (dropdownContent && dropdownContent.classList.contains('date-dropdown-content')) {
                // Add click handler to toggle dropdown
                newButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Position and show the dropdown
                    positionAndShowDropdown(newButton, dropdownContent);
                    
                    // Close dropdown when clicking outside
                    const closeDropdown = function(event) {
                        if (!dropdownContent.parentNode.contains(event.target)) {
                            dropdownContent.classList.remove('show');
                            document.removeEventListener('click', closeDropdown);
                        }
                    };
                    
                    document.addEventListener('click', closeDropdown);
                });
                
                // For better touch handling on mobile
                if ('ontouchstart' in window) {
                    newButton.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        positionAndShowDropdown(newButton, dropdownContent);
                    });
                }
            }
        });
        
        // Also reattach handlers to all date chips (including dropdown items)
        if (window.attachDateChipHandlers && typeof window.attachDateChipHandlers === 'function') {
            window.attachDateChipHandlers();
        }
    }
    
    // Call once on load to ensure handlers are attached
    setTimeout(reattachDateDropdownHandlers, 500);
});
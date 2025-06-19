/**
 * Date Controller
 * 
 * Handles date-related functionality including dropdown positioning,
 * event handlers for date selection elements, and chart date range selection.
 */

const DateController = {
    // Current state
    _state: {
        currentRange: 'default',
        currentResults: 8000
    },
    
    /**
     * Function to position and show dropdown
     * @param {HTMLElement} button - The button that triggered the dropdown
     * @param {HTMLElement} dropdown - The dropdown element to show
     */
    positionAndShowDropdown: function(button, dropdown) {
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
    },
    
    /**
     * Updates URL parameters and refreshes charts
     * @param {string} range - The selected date range
     * @param {number} results - The number of results to show
     */
    updateChartsWithParams: function(range, results) {
        // Update URL with new parameters
        const url = new URL(window.location.href);
        url.searchParams.set('range', range);
        
        if (results !== 8000) {
            url.searchParams.set('results', results);
        } else {
            url.searchParams.delete('results');
        }
        
        // Preserve dashboard parameter if it exists
        const isDashboard = url.searchParams.get('dashboard');
        if (isDashboard) {
            url.searchParams.set('dashboard', isDashboard);
        }
        
        // Update browser history without reloading
        window.history.replaceState({}, '', url);
        
        // Update internal state
        this._state.currentRange = range;
        this._state.currentResults = results;
        
        // Refresh charts with new parameters (check dashboard mode again)
        const urlDashboardMode = url.searchParams.get('dashboard') === 'true';
        const isPi = (window.screen.width === 800 && window.screen.height === 480) || 
                     (/CrOS.*x86_64/.test(navigator.userAgent) && window.screen.width <= 800);
        const dashboardMode = urlDashboardMode || isPi;
        
        // Destroy existing charts and reload (same as regular view)
        Object.keys(window.chartInstances || {}).forEach(id => {
            if (window.chartInstances[id]) {
                window.chartInstances[id].destroy();
                delete window.chartInstances[id];
            }
        });
        
        // Reload charts without recreating layout
        loadAllCharts(range, results, dashboardMode);
    },
    
    /**
     * Get URL parameter helper
     * @param {string} name - Parameter name
     * @returns {string} Parameter value or empty string
     */
    _getURLParameter: function(name) {
        // Use Utils if available, otherwise use direct implementation
        if (window.Utils && typeof window.Utils.getURLParameter === 'function') {
            return window.Utils.getURLParameter(name);
        }
        
        // Direct implementation as fallback
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || '';
    },
    
    /**
     * Attach handlers to all date chips
     */
    attachDateChipHandlers: function() {
        // Get all date chips, including those in the dropdown
        const allDateChips = document.querySelectorAll('.date-chip');
        const self = this;
        
        // Get current range from URL or use default
        const urlRange = this._getURLParameter('range');
        this._state.currentRange = urlRange || this._state.currentRange;
        
        // First clear any existing active states
        allDateChips.forEach(chip => {
            // First remove active class from all chips
            chip.classList.remove('active');
            
            // Then add active class only to the current range chip
            if (chip.getAttribute('data-range') === this._state.currentRange) {
                chip.classList.add('active');
            }
            
            // Remove any existing click handlers
            const newChip = chip.cloneNode(true);
            chip.parentNode.replaceChild(newChip, chip);
            
            // Add the click handler to the new chip
            newChip.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get all chips again to ensure we have the latest set
                const allChips = document.querySelectorAll('.date-chip');
                
                // Remove active class from all chips
                allChips.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked chip
                newChip.classList.add('active');
                
                // Get selected range
                const range = newChip.getAttribute('data-range');
                
                // Close any open dropdowns
                document.querySelectorAll('.date-dropdown-content').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
                
                // Update URL and refresh charts with the clicked range
                self.updateChartsWithParams(range, self._state.currentResults);
            });
        });
    },
    
    /**
     * Set up results input handling
     */
    setupResultsInput: function() {
        const resultsInput = document.getElementById('resultsInput');
        const updateButton = document.getElementById('updateButton');
        const self = this;
        
        if (resultsInput && updateButton) {
            // Get current results from URL or use default
            const urlResults = parseInt(this._getURLParameter('results')) || 8000;
            this._state.currentResults = urlResults;
            
            // Set input value
            resultsInput.value = this._state.currentResults;
            
            // Process results input and update charts
            function processResultsInput() {
                const newResults = parseInt(resultsInput.value) || 8000;
                self._state.currentResults = newResults;
                
                // Update URL and refresh charts
                self.updateChartsWithParams(self._state.currentRange, newResults);
            }
            
            // Set up button click handler
            updateButton.addEventListener('click', processResultsInput);
            
            // Set up enter key handler
            resultsInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    processResultsInput();
                }
            });
        }
    },
    
    /**
     * Function to reattach date dropdown handlers after DOM changes
     */
    reattachDateDropdownHandlers: function() {
        const dropdownButtons = document.querySelectorAll('.date-dropdown-button');
        const self = this;
        
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
                    self.positionAndShowDropdown(newButton, dropdownContent);
                    
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
                        self.positionAndShowDropdown(newButton, dropdownContent);
                    });
                }
            }
        });
        
        // Attach handlers to all date chips
        this.attachDateChipHandlers();
    },
    
    /**
     * Setup all date-related functionality
     */
    setupDateHandlers: function() {
        // Set up results input handling
        this.setupResultsInput();
        
        // Set up date chip handlers
        this.attachDateChipHandlers();
        
        // Make functions available globally
        window.attachDateChipHandlers = this.attachDateChipHandlers.bind(this);
    },
    
    /**
     * Initialize date controller
     */
    initialize: function() {
        // Get initial state from URL
        const urlRange = this._getURLParameter('range') || 'default';
        const urlResults = parseInt(this._getURLParameter('results')) || 8000;
        
        this._state.currentRange = urlRange;
        this._state.currentResults = urlResults;
        
        // Set up date handlers
        this.setupDateHandlers();
        
        // Attach dropdown handlers
        this.reattachDateDropdownHandlers();
    }
};

// Export the controller
window.DateController = DateController;
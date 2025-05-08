/**
 * Chart Controller Module
 * 
 * This module provides state management and event handling for charts.
 * It works alongside ChartFactory to provide centralized control of charts.
 */

/**
 * ChartController - Central controller for chart state and interactions
 */
const ChartController = {
    // Global chart state
    _globalState: {
        displayMode: 'desktop', // 'desktop' or 'mobile'
        darkMode: false,
        initialized: false,
        currentRange: 1,
        currentResults: 8000,
        activeCategory: null,
        lastSync: null,
        showStats: true,
        lastInteraction: null
    },
    
    // Chart-specific state
    _chartStates: {},
    
    // Event listeners
    _eventListeners: {},
    
    /**
     * Initialize the chart controller
     * @param {Object} [initialState] - Optional initial state
     * @returns {void}
     */
    initialize: function(initialState = {}) {
        // Initialize global state with defaults and provided values
        this._globalState = {
            ...this._globalState,
            ...initialState,
            darkMode: document.documentElement.getAttribute('data-theme') === 'dark',
            displayMode: window.innerWidth <= 768 ? 'mobile' : 'desktop',
            showStats: localStorage.getItem('statsVisible') !== 'false',
            initialized: true
        };
        
        // Initialize chart-specific states
        this._chartStates = {};
        
        // Initialize event listeners
        this._eventListeners = {
            stateChange: [],
            chartInteraction: [],
            themeChange: [],
            displayModeChange: [],
            rangeChange: []
        };
        
        // Set up global event handlers
        this._setupGlobalEventHandlers();
    },
    
    /**
     * Register a new chart with the controller
     * @param {string} chartId - Chart ID
     * @param {Object} config - Chart configuration
     * @returns {void}
     */
    registerChart: function(chartId, config) {
        if (!chartId) return;
        
        this._chartStates[chartId] = {
            id: chartId,
            config: config || {},
            visible: true,
            initialized: true,
            lastUpdated: new Date().getTime(),
            hovered: false,
            loading: false,
            error: null
        };
    },
    
    /**
     * Unregister a chart from the controller
     * @param {string} chartId - Chart ID
     * @returns {void}
     */
    unregisterChart: function(chartId) {
        if (this._chartStates[chartId]) {
            delete this._chartStates[chartId];
        }
    },
    
    /**
     * Get the global state
     * @returns {Object} Global state
     */
    getGlobalState: function() {
        return { ...this._globalState };
    },
    
    /**
     * Get a specific chart's state
     * @param {string} chartId - Chart ID
     * @returns {Object|null} Chart state or null if not found
     */
    getChartState: function(chartId) {
        return this._chartStates[chartId] ? { ...this._chartStates[chartId] } : null;
    },
    
    /**
     * Get all chart states
     * @returns {Object} All chart states
     */
    getAllChartStates: function() {
        const result = {};
        Object.keys(this._chartStates).forEach(chartId => {
            result[chartId] = { ...this._chartStates[chartId] };
        });
        return result;
    },
    
    /**
     * Update global state
     * @param {Object} stateUpdate - State properties to update
     * @param {boolean} [notify=true] - Whether to notify listeners
     * @returns {Object} Updated state
     */
    updateGlobalState: function(stateUpdate, notify = true) {
        const prevState = { ...this._globalState };
        
        // Update state
        this._globalState = {
            ...this._globalState,
            ...stateUpdate,
            lastUpdated: new Date().getTime()
        };
        
        // Notify listeners if requested
        if (notify) {
            this._notifyStateChange('global', prevState, this._globalState);
        }
        
        return { ...this._globalState };
    },
    
    /**
     * Update a chart's state
     * @param {string} chartId - Chart ID
     * @param {Object} stateUpdate - State properties to update
     * @param {boolean} [notify=true] - Whether to notify listeners
     * @returns {Object|null} Updated state or null if chart not found
     */
    updateChartState: function(chartId, stateUpdate, notify = true) {
        if (!this._chartStates[chartId]) {
            return null;
        }
        
        const prevState = { ...this._chartStates[chartId] };
        
        // Update state
        this._chartStates[chartId] = {
            ...this._chartStates[chartId],
            ...stateUpdate,
            lastUpdated: new Date().getTime()
        };
        
        // Notify listeners if requested
        if (notify) {
            this._notifyStateChange(chartId, prevState, this._chartStates[chartId]);
        }
        
        return { ...this._chartStates[chartId] };
    },
    
    /**
     * Add event listener
     * @param {string} eventType - Event type
     * @param {Function} callback - Callback function
     * @returns {Object} Object with remove method
     */
    addEventListener: function(eventType, callback) {
        if (!this._eventListeners[eventType]) {
            this._eventListeners[eventType] = [];
        }
        
        this._eventListeners[eventType].push(callback);
        
        // Return an object with a remove method
        return {
            remove: () => {
                this.removeEventListener(eventType, callback);
            }
        };
    },
    
    /**
     * Remove event listener
     * @param {string} eventType - Event type
     * @param {Function} callback - Callback function
     * @returns {boolean} Whether the listener was found and removed
     */
    removeEventListener: function(eventType, callback) {
        if (!this._eventListeners[eventType]) {
            return false;
        }
        
        const index = this._eventListeners[eventType].indexOf(callback);
        if (index !== -1) {
            this._eventListeners[eventType].splice(index, 1);
            return true;
        }
        
        return false;
    },
    
    /**
     * Set chart visibility
     * @param {string} chartId - Chart ID
     * @param {boolean} visible - Whether the chart should be visible
     * @returns {boolean} Whether the update was successful
     */
    setChartVisibility: function(chartId, visible) {
        return !!this.updateChartState(chartId, { visible });
    },
    
    /**
     * Set visibility for charts by category
     * @param {string} category - Category to match
     * @param {boolean} visible - Whether the charts should be visible
     * @returns {Array} Array of updated chart IDs
     */
    setVisibilityByCategory: function(category) {
        // Update activeCategory in global state
        this.updateGlobalState({ activeCategory: category });
        
        // We don't actually hide charts, just move them in the DOM via the loader
        // This just updates the controller state to track the active category
        return Object.keys(this._chartStates).filter(chartId => {
            const chartState = this._chartStates[chartId];
            return chartState && chartState.config && chartState.config.category === category;
        });
    },
    
    /**
     * Handle chart interaction event
     * @param {string} chartId - Chart ID
     * @param {string} eventType - Interaction type (e.g., 'hover', 'click')
     * @param {Object} eventData - Event data
     * @returns {void}
     */
    handleChartInteraction: function(chartId, eventType, eventData) {
        // Update chart state
        if (this._chartStates[chartId]) {
            const stateUpdate = { lastInteraction: new Date().getTime() };
            
            // Additional state updates based on interaction type
            if (eventType === 'hover') {
                stateUpdate.hovered = true;
            } else if (eventType === 'mouseout') {
                stateUpdate.hovered = false;
            }
            
            this.updateChartState(chartId, stateUpdate);
        }
        
        // Update global state
        this.updateGlobalState({ 
            lastInteraction: new Date().getTime(),
            lastInteractionChart: chartId,
            lastInteractionType: eventType
        }, false); // Don't notify for this update
        
        // Notify chart interaction listeners
        this._notifyListeners('chartInteraction', {
            chartId,
            eventType,
            eventData,
            timestamp: new Date().getTime()
        });
    },
    
    /**
     * Sync multiple charts based on a data point
     * @param {string} sourceChartId - Source chart ID
     * @param {number} dataIndex - Data index to sync to
     * @param {Array} [targetChartIds] - Optional target chart IDs (defaults to all)
     * @returns {void}
     */
    syncCharts: function(sourceChartId, dataIndex, targetChartIds) {
        const targets = targetChartIds || Object.keys(this._chartStates).filter(id => id !== sourceChartId);
        
        // Update global state to track sync
        this.updateGlobalState({
            lastSync: {
                sourceChartId,
                dataIndex,
                timestamp: new Date().getTime(),
                targetChartIds: targets
            }
        });
        
        // Notify chart interaction listeners
        this._notifyListeners('chartInteraction', {
            chartId: sourceChartId,
            eventType: 'sync',
            dataIndex,
            targetChartIds: targets,
            timestamp: new Date().getTime()
        });
    },
    
    /**
     * Toggle stats visibility for all charts
     * @param {boolean} [visible] - Optional visibility state (toggles if not provided)
     * @returns {boolean} New visibility state
     */
    toggleStatsVisibility: function(visible) {
        // If visible is not provided, toggle current state
        const newVisibility = visible !== undefined ? visible : !this._globalState.showStats;
        
        // Update global state
        this.updateGlobalState({ showStats: newVisibility });
        
        // Store preference in localStorage
        localStorage.setItem('statsVisible', newVisibility.toString());
        
        return newVisibility;
    },
    
    /**
     * Update display mode based on window size
     * @returns {string} New display mode
     */
    updateDisplayMode: function() {
        const isMobile = window.innerWidth <= 768;
        const newMode = isMobile ? 'mobile' : 'desktop';
        
        if (this._globalState.displayMode !== newMode) {
            const prevMode = this._globalState.displayMode;
            
            // Update global state
            this.updateGlobalState({ displayMode: newMode });
            
            // Notify specific display mode change listeners
            this._notifyListeners('displayModeChange', {
                prevMode,
                newMode,
                timestamp: new Date().getTime()
            });
        }
        
        return newMode;
    },
    
    /**
     * Update theme mode (light/dark)
     * @param {boolean} isDark - Whether dark mode is active
     * @returns {boolean} Updated dark mode state
     */
    updateTheme: function(isDark) {
        if (this._globalState.darkMode !== isDark) {
            const prevTheme = this._globalState.darkMode ? 'dark' : 'light';
            const newTheme = isDark ? 'dark' : 'light';
            
            // Update global state
            this.updateGlobalState({ darkMode: isDark });
            
            // Notify theme change listeners
            this._notifyListeners('themeChange', {
                prevTheme,
                newTheme,
                timestamp: new Date().getTime()
            });
        }
        
        return isDark;
    },
    
    /**
     * Change the current date range
     * @param {number} range - New range value
     * @param {number} [results] - Optional new results value
     * @returns {Object} Updated range state
     */
    changeRange: function(range, results) {
        const prevRange = this._globalState.currentRange;
        const prevResults = this._globalState.currentResults;
        
        // Update state values
        const stateUpdate = { currentRange: range };
        if (results !== undefined) {
            stateUpdate.currentResults = results;
        }
        
        // Update global state
        this.updateGlobalState(stateUpdate);
        
        // Notify range change listeners
        this._notifyListeners('rangeChange', {
            prevRange,
            newRange: range,
            prevResults,
            newResults: results !== undefined ? results : prevResults,
            timestamp: new Date().getTime()
        });
        
        return {
            range: this._globalState.currentRange,
            results: this._globalState.currentResults
        };
    },
    
    /* PRIVATE METHODS */
    
    /**
     * Set up global event handlers
     * @private
     * @returns {void}
     */
    _setupGlobalEventHandlers: function() {
        // Theme change handler
        const themeObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'data-theme') {
                    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                    this.updateTheme(isDark);
                }
            });
        });
        
        // Observe theme attribute changes
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            // Debounce resize events
            if (this._resizeTimeout) {
                clearTimeout(this._resizeTimeout);
            }
            
            this._resizeTimeout = setTimeout(() => {
                this.updateDisplayMode();
            }, 250); // 250ms debounce
        });
        
        // Language change handler
        document.addEventListener('languageChanged', () => {
            // Update global state to track language change
            this.updateGlobalState({ 
                lastLanguageChange: new Date().getTime(),
                language: window.I18n ? window.I18n.getCurrentLanguage() : 'en'
            });
        });
    },
    
    /**
     * Notify state change listeners
     * @private
     * @param {string} targetId - 'global' or chart ID
     * @param {Object} prevState - Previous state
     * @param {Object} newState - New state
     * @returns {void}
     */
    _notifyStateChange: function(targetId, prevState, newState) {
        this._notifyListeners('stateChange', {
            targetId,
            prevState,
            newState,
            timestamp: new Date().getTime(),
            type: targetId === 'global' ? 'global' : 'chart'
        });
    },
    
    /**
     * Notify event listeners
     * @private
     * @param {string} eventType - Event type
     * @param {Object} eventData - Event data
     * @returns {void}
     */
    _notifyListeners: function(eventType, eventData) {
        if (!this._eventListeners[eventType]) {
            return;
        }
        
        this._eventListeners[eventType].forEach(callback => {
            try {
                callback(eventData);
            } catch (error) {
                console.error(`Error in ${eventType} listener:`, error);
            }
        });
    }
};

// Export for browser context
if (typeof window !== 'undefined') {
    window.ChartController = ChartController;
}
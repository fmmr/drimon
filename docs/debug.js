/**
 * DriMon Debug and Test Utilities
 * 
 * This file contains utilities for debugging and testing the DriMon application.
 * It's activated when the URL contains ?test=true and provides enhanced logging
 * and debugging capabilities.
 */

// Global debug state
window.DriMonDebug = {
    enabled: false,
    started: false,
    logLevel: 'info', // 'info', 'debug', 'verbose'
    startTime: new Date(),
    events: [],
    dataRequests: [],
    renderedComponents: [],
    errors: []
};

/**
 * Initialize debug mode if URL parameter test=true is present
 */
function initDebugMode() {
    // Check if already initialized
    if (window.DriMonDebug.started) return;
    
    // Parse URL parameters to see if test mode is enabled
    const url = new URL(window.location.href);
    const testMode = url.searchParams.get('test');
    const logLevel = url.searchParams.get('logLevel') || 'info';
    
    // Enable debug mode if test=true
    if (testMode === 'true') {
        window.DriMonDebug.enabled = true;
        window.DriMonDebug.started = true;
        window.DriMonDebug.logLevel = ['info', 'debug', 'verbose'].includes(logLevel) ? logLevel : 'info';
        window.DriMonDebug.startTime = new Date();
        
        console.log(`🔍 DriMon Test Mode Activated (Log Level: ${window.DriMonDebug.logLevel})`);
        
        // Set up enhanced logging
        setupEnhancedLogging();
        
        // Add debug UI elements
        addDebugUi();
        
        // Patch fetch API to log network requests
        patchFetch();
    }
}

/**
 * Set up enhanced console logging
 */
function setupEnhancedLogging() {
    // Store original console methods
    const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };
    
    // Override console.log
    console.log = function(...args) {
        const timestamp = new Date();
        const elapsed = timestamp - window.DriMonDebug.startTime;
        
        if (window.DriMonDebug.logLevel === 'info' || 
            window.DriMonDebug.logLevel === 'debug' || 
            window.DriMonDebug.logLevel === 'verbose') {
            originalConsole.log(`[${elapsed}ms] [LOG]`, ...args);
        }
        
        // Add to events log
        window.DriMonDebug.events.push({
            type: 'log',
            timestamp,
            elapsed,
            message: args.join(' ')
        });
    };
    
    // Override console.info
    console.info = function(...args) {
        const timestamp = new Date();
        const elapsed = timestamp - window.DriMonDebug.startTime;
        
        if (window.DriMonDebug.logLevel === 'info' || 
            window.DriMonDebug.logLevel === 'debug' || 
            window.DriMonDebug.logLevel === 'verbose') {
            originalConsole.info(`[${elapsed}ms] [INFO]`, ...args);
        }
        
        // Add to events log
        window.DriMonDebug.events.push({
            type: 'info',
            timestamp,
            elapsed,
            message: args.join(' ')
        });
    };
    
    // Override console.debug
    console.debug = function(...args) {
        const timestamp = new Date();
        const elapsed = timestamp - window.DriMonDebug.startTime;
        
        if (window.DriMonDebug.logLevel === 'debug' || 
            window.DriMonDebug.logLevel === 'verbose') {
            originalConsole.debug(`[${elapsed}ms] [DEBUG]`, ...args);
        }
        
        // Add to events log
        window.DriMonDebug.events.push({
            type: 'debug',
            timestamp,
            elapsed,
            message: args.join(' ')
        });
    };
    
    // Override console.warn
    console.warn = function(...args) {
        const timestamp = new Date();
        const elapsed = timestamp - window.DriMonDebug.startTime;
        
        originalConsole.warn(`[${elapsed}ms] [WARN]`, ...args);
        
        // Add to events log
        window.DriMonDebug.events.push({
            type: 'warn',
            timestamp,
            elapsed,
            message: args.join(' ')
        });
    };
    
    // Override console.error
    console.error = function(...args) {
        const timestamp = new Date();
        const elapsed = timestamp - window.DriMonDebug.startTime;
        
        originalConsole.error(`[${elapsed}ms] [ERROR]`, ...args);
        
        // Add to events log
        window.DriMonDebug.events.push({
            type: 'error',
            timestamp,
            elapsed,
            message: args.join(' ')
        });
        
        // Add to errors log
        window.DriMonDebug.errors.push({
            timestamp,
            elapsed,
            message: args.join(' ')
        });
    };
}

/**
 * Adds debug UI elements to the page
 */
function addDebugUi() {
    // Create debug button
    const debugButton = document.createElement('button');
    debugButton.id = 'debug-toggle';
    debugButton.className = 'debug-button';
    debugButton.innerHTML = '🔍';
    debugButton.title = 'Toggle Debug Panel';
    debugButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #007bff;
        color: white;
        border: none;
        font-size: 20px;
        line-height: 40px;
        text-align: center;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    `;
    
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.className = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 70px;
        right: 20px;
        width: 300px;
        max-height: 400px;
        overflow: auto;
        background-color: rgba(250, 250, 250, 0.95);
        border-radius: 5px;
        padding: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        z-index: 9998;
        display: none;
        font-family: monospace;
        font-size: 12px;
    `;
    
    // Add header to debug panel
    const panelHeader = document.createElement('div');
    panelHeader.innerHTML = '<h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">DriMon Debug Panel</h3>';
    debugPanel.appendChild(panelHeader);
    
    // Add tabs
    const tabContainer = document.createElement('div');
    tabContainer.style.cssText = `
        display: flex;
        margin-bottom: 10px;
        border-bottom: 1px solid #ddd;
    `;
    
    const tabs = [
        { id: 'events-tab', label: 'Events' },
        { id: 'network-tab', label: 'Network' },
        { id: 'components-tab', label: 'Components' },
        { id: 'errors-tab', label: 'Errors' }
    ];
    
    tabs.forEach((tab, index) => {
        const tabEl = document.createElement('div');
        tabEl.id = tab.id;
        tabEl.className = index === 0 ? 'debug-tab active' : 'debug-tab';
        tabEl.textContent = tab.label;
        tabEl.style.cssText = `
            padding: 5px 10px;
            cursor: pointer;
            border-bottom: ${index === 0 ? '2px solid #007bff' : 'none'};
        `;
        tabEl.onclick = () => switchDebugTab(tab.id);
        tabContainer.appendChild(tabEl);
    });
    
    debugPanel.appendChild(tabContainer);
    
    // Add content containers
    const contentContainers = [
        { id: 'events-content', display: 'block' },
        { id: 'network-content', display: 'none' },
        { id: 'components-content', display: 'none' },
        { id: 'errors-content', display: 'none' }
    ];
    
    contentContainers.forEach(container => {
        const containerEl = document.createElement('div');
        containerEl.id = container.id;
        containerEl.className = 'debug-content';
        containerEl.style.cssText = `
            display: ${container.display};
            max-height: 300px;
            overflow: auto;
        `;
        debugPanel.appendChild(containerEl);
    });
    
    // Create log level selector
    const logLevelContainer = document.createElement('div');
    logLevelContainer.style.cssText = `
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    const logLevelLabel = document.createElement('span');
    logLevelLabel.textContent = 'Log Level:';
    
    const logLevelSelect = document.createElement('select');
    logLevelSelect.style.cssText = `
        padding: 2px 5px;
        border-radius: 3px;
        border: 1px solid #ccc;
    `;
    
    ['info', 'debug', 'verbose'].forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        option.selected = window.DriMonDebug.logLevel === level;
        logLevelSelect.appendChild(option);
    });
    
    logLevelSelect.onchange = (e) => {
        window.DriMonDebug.logLevel = e.target.value;
        console.log(`Log level changed to: ${window.DriMonDebug.logLevel}`);
        
        // Update URL without reload
        const url = new URL(window.location.href);
        url.searchParams.set('logLevel', window.DriMonDebug.logLevel);
        window.history.replaceState({}, '', url);
    };
    
    logLevelContainer.appendChild(logLevelLabel);
    logLevelContainer.appendChild(logLevelSelect);
    debugPanel.appendChild(logLevelContainer);
    
    // Append debug UI to body when it's ready
    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(debugButton);
        document.body.appendChild(debugPanel);
        
        // Add click event to debug button
        debugButton.addEventListener('click', () => {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
            refreshDebugPanel();
        });
    });
}

/**
 * Switch between debug panel tabs
 * @param {string} tabId - ID of the tab to switch to
 */
function switchDebugTab(tabId) {
    // Deactivate all tabs
    document.querySelectorAll('.debug-tab').forEach(tab => {
        tab.style.borderBottom = 'none';
        tab.classList.remove('active');
    });
    
    // Activate selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.style.borderBottom = '2px solid #007bff';
        selectedTab.classList.add('active');
    }
    
    // Hide all content
    document.querySelectorAll('.debug-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected content
    const contentId = tabId.replace('-tab', '-content');
    const selectedContent = document.getElementById(contentId);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }
    
    // Refresh content
    refreshDebugPanel();
}

/**
 * Refresh debug panel content
 */
function refreshDebugPanel() {
    const eventsContent = document.getElementById('events-content');
    const networkContent = document.getElementById('network-content');
    const componentsContent = document.getElementById('components-content');
    const errorsContent = document.getElementById('errors-content');
    
    if (!eventsContent || !networkContent || !componentsContent || !errorsContent) return;
    
    // Refresh events
    let eventsHtml = '';
    window.DriMonDebug.events.slice(-20).forEach(event => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        eventsHtml += `<div class="debug-event debug-${event.type}">
            <span class="debug-time">[${time}]</span>
            <span class="debug-type">[${event.type.toUpperCase()}]</span>
            <span class="debug-message">${event.message}</span>
        </div>`;
    });
    eventsContent.innerHTML = eventsHtml || '<p>No events logged yet.</p>';
    
    // Refresh network
    let networkHtml = '';
    window.DriMonDebug.dataRequests.forEach(req => {
        networkHtml += `<div class="debug-request">
            <div><strong>URL:</strong> ${req.url}</div>
            <div><strong>Method:</strong> ${req.method}</div>
            <div><strong>Status:</strong> ${req.status}</div>
            <div><strong>Time:</strong> ${req.time}ms</div>
            <div><button onclick="expandRequestDetails(this, ${req.id})">Show Details</button></div>
            <div class="request-details" id="req-${req.id}" style="display:none;"></div>
        </div>`;
    });
    networkContent.innerHTML = networkHtml || '<p>No network requests logged yet.</p>';
    
    // Refresh components
    let componentsHtml = '';
    window.DriMonDebug.renderedComponents.forEach(component => {
        componentsHtml += `<div class="debug-component">
            <div><strong>Type:</strong> ${component.type}</div>
            <div><strong>ID:</strong> ${component.id || 'N/A'}</div>
            <div><strong>Time:</strong> ${component.renderTime}ms</div>
        </div>`;
    });
    componentsContent.innerHTML = componentsHtml || '<p>No components rendered yet.</p>';
    
    // Refresh errors
    let errorsHtml = '';
    window.DriMonDebug.errors.forEach(error => {
        const time = new Date(error.timestamp).toLocaleTimeString();
        errorsHtml += `<div class="debug-error">
            <div><strong>[${time}]</strong> ${error.message}</div>
        </div>`;
    });
    errorsContent.innerHTML = errorsHtml || '<p>No errors logged yet.</p>';
}

/**
 * Expand request details in the debug panel
 * @param {HTMLElement} button - The button element that was clicked
 * @param {number} requestId - ID of the request to expand
 */
function expandRequestDetails(button, requestId) {
    const detailsEl = document.getElementById(`req-${requestId}`);
    if (!detailsEl) return;
    
    const isVisible = detailsEl.style.display !== 'none';
    
    if (isVisible) {
        detailsEl.style.display = 'none';
        button.textContent = 'Show Details';
    } else {
        // Find the request data
        const req = window.DriMonDebug.dataRequests.find(r => r.id === requestId);
        if (!req) return;
        
        // Format the response data
        let responseFormatted = '';
        try {
            // Try to pretty print the response if it's JSON
            responseFormatted = JSON.stringify(req.response, null, 2);
        } catch (e) {
            responseFormatted = String(req.response);
        }
        
        // Set the content
        detailsEl.innerHTML = `
            <h4>Headers:</h4>
            <pre>${JSON.stringify(req.headers, null, 2)}</pre>
            <h4>Response:</h4>
            <pre>${responseFormatted}</pre>
        `;
        
        detailsEl.style.display = 'block';
        button.textContent = 'Hide Details';
    }
}

/**
 * Patch the fetch API to log network requests
 */
function patchFetch() {
    const originalFetch = window.fetch;
    let requestCounter = 0;
    
    window.fetch = async function(resource, init) {
        const requestId = ++requestCounter;
        const startTime = performance.now();
        const method = init?.method || 'GET';
        
        // Extract URL from string or Request object
        let url = resource;
        if (resource instanceof Request) {
            url = resource.url;
        }
        
        console.debug(`Fetch Request: ${method} ${url}`);
        
        const req = {
            id: requestId,
            url,
            method,
            headers: init?.headers || {},
            startTime,
            status: null,
            time: null,
            response: null
        };
        
        window.DriMonDebug.dataRequests.push(req);
        
        try {
            const response = await originalFetch(resource, init);
            const endTime = performance.now();
            
            // Clone the response to read the body without consuming it
            const clonedResponse = response.clone();
            
            // Update request info
            req.status = response.status;
            req.time = endTime - startTime;
            
            try {
                // Try to parse the response as JSON
                req.response = await clonedResponse.json();
            } catch (e) {
                // If not JSON, get as text
                req.response = await clonedResponse.text();
            }
            
            console.debug(`Fetch Response: ${response.status} ${url} (${req.time.toFixed(2)}ms)`);
            
            return response;
        } catch (error) {
            const endTime = performance.now();
            
            req.status = 'Error';
            req.time = endTime - startTime;
            req.response = error.message;
            
            console.error(`Fetch Error: ${error.message} for ${url}`);
            
            throw error;
        }
    };
}

/**
 * Log component rendering for debugging
 * @param {string} type - Type of component being rendered
 * @param {string} id - ID of the component (if any)
 * @param {number} renderTime - Time taken to render the component (ms)
 */
function logComponentRender(type, id, renderTime) {
    if (!window.DriMonDebug.enabled) return;
    
    window.DriMonDebug.renderedComponents.push({ type, id, renderTime });
    
    if (window.DriMonDebug.logLevel === 'verbose') {
        console.debug(`Component Rendered: ${type}${id ? ` (${id})` : ''} in ${renderTime}ms`);
    }
}

// Patch header_components.js component creation functions
function patchComponentFunctions() {
    // Wait for component libraries to be loaded
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.DriMonDebug.enabled) return;
        
        // Patch header components if they exist
        if (typeof createHeader === 'function') {
            const originalCreateHeader = createHeader;
            window.createHeader = function() {
                console.debug('Creating header component');
                const startTime = performance.now();
                const result = originalCreateHeader();
                const endTime = performance.now();
                logComponentRender('Header', 'header', endTime - startTime);
                return result;
            };
        }
        
        // Patch chart components if they exist
        if (window.ChartComponents) {
            const original = window.ChartComponents.createChartContainer;
            window.ChartComponents.createChartContainer = function(config, isMobile) {
                console.debug(`Creating chart container: ${config.id}`);
                const startTime = performance.now();
                const result = original(config, isMobile);
                const endTime = performance.now();
                logComponentRender('ChartContainer', config.id, endTime - startTime);
                return result;
            };
        }
    });
}

// Initialize debug tools
document.addEventListener('DOMContentLoaded', () => {
    // Export global functions
    window.DriMonDebug.refreshDebugPanel = refreshDebugPanel;
    window.DriMonDebug.expandRequestDetails = expandRequestDetails;
    window.DriMonDebug.logComponentRender = logComponentRender;
    
    // Initialize debug mode
    initDebugMode();
    
    // Patch component functions if debug mode is enabled
    if (window.DriMonDebug.enabled) {
        patchComponentFunctions();
    }
});

// Initialize early to catch early logs
initDebugMode();
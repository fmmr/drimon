/**
 * Header Components
 * 
 * This file contains reusable components for the DriMon header section.
 * Each component is a function that creates and returns DOM elements.
 */

/**
 * Creates the logo container element
 * @param {Object} [config] - Configuration object for logo container
 * @returns {HTMLElement} The logo container element
 */
function createLogoContainer(config = null) {
    // Default configuration
    const options = {
        logoUrl: 'https://github.com/fmmr/drimon',
        logoImage: 'logos/1_100x55.webp',
        logoAlt: 'DriMon',
        logoClassName: 'logo',
        logoId: 'main-title',
        customClasses: '',
        // Override with provided config
        ...(config || {})
    };
    
    const logoContainer = document.createElement('div');
    logoContainer.className = `logo-container ${options.customClasses}`.trim();
    
    // Create logo image (with or without link)
    const logoImg = document.createElement('img');
    logoImg.src = options.logoImage;
    logoImg.className = options.logoClassName;
    logoImg.id = options.logoId;
    logoImg.alt = options.logoAlt;
    
    // Add logo to container (wrap in link if URL provided)
    if (options.logoUrl) {
        const logoLink = document.createElement('a');
        logoLink.href = options.logoUrl;
        logoLink.appendChild(logoImg);
        logoContainer.appendChild(logoLink);
    } else {
        logoContainer.appendChild(logoImg);
    }
    
    // Container for sort and flag elements on mobile
    // Will be moved by CSS on mobile view
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'mobile-header-controls';
    logoContainer.appendChild(controlsContainer);
    
    
    return logoContainer;
}

/**
 * Creates a time chip element for displaying current time
 * @returns {HTMLElement} The time chip element  
 */
function createTimeChip() {
    const timePill = document.createElement('div');
    timePill.className = 'data-chip time-pill';
    timePill.setAttribute('data-has-tooltip', 'true');
    
    // Add clock icon
    const timeIcon = document.createElement('i');
    timeIcon.className = 'fas fa-clock mr-1';
    timePill.appendChild(timeIcon);
    
    // Add time display (will show HH:MM instead of "X minutes ago")
    const timeSpan = document.createElement('span');
    timeSpan.id = 'time-since';
    timeSpan.textContent = '--:--';
    
    timePill.appendChild(timeSpan);
    
    return timePill;
}

/**
 * Creates action buttons container (dark mode, stats toggle)
 * @param {Object} [config] - Configuration object for action buttons
 * @returns {HTMLElement} The action buttons container element
 */
function createActionButtons(config = null) {
    const actionContainer = document.createElement('div');
    actionContainer.className = 'action-buttons';
    
    // Get configuration options with defaults
    const options = {
        darkMode: { enabled: true },
        statsToggle: { enabled: true },
        ...(config || {})
    };
    
    // Add dark mode toggle if enabled
    if (options.darkMode && options.darkMode.enabled) {
        const darkModeToggle = document.createElement('button');
        darkModeToggle.id = 'darkModeToggle';
        
        darkModeToggle.title = window.I18n.translate('darkModeTooltip');
        darkModeToggle.setAttribute('data-i18n-title', 'darkModeTooltip');
        
        const darkModeIcon = document.createElement('span');
        darkModeIcon.className = 'icon';
        darkModeIcon.innerHTML = '<i class="fas fa-moon"></i>';
        
        darkModeToggle.appendChild(darkModeIcon);
        actionContainer.appendChild(darkModeToggle);
    }
    
    // Add stats toggle if enabled
    if (options.statsToggle && options.statsToggle.enabled) {
        const statsToggle = document.createElement('button');
        statsToggle.id = 'statsToggle';
        
        statsToggle.title = window.I18n.translate('statsTooltip');
        statsToggle.setAttribute('data-i18n-title', 'statsTooltip');
        
        const statsIcon = document.createElement('span');
        statsIcon.className = 'icon';
        statsIcon.innerHTML = '<i class="fas fa-chart-line"></i>';
        
        statsToggle.appendChild(statsIcon);
        actionContainer.appendChild(statsToggle);
    }
    
    return actionContainer;
}

/**
 * Creates settings dropdown component (date ranges + actions)
 * @param {Object} [config] - Configuration object for settings dropdown
 * @returns {HTMLElement} The settings dropdown container element
 */
function createSettingsDropdown(config = null) {
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'settings-dropdown';
    
    // Get configuration options with defaults
    const options = {
        showDateRanges: true,
        showDivider: false,
        actions: {
            darkMode: { enabled: false },
            statsToggle: { enabled: false }
        },
        ...(config || {})
    };
    
    // Get secondary date ranges from top-level config
    const secondaryDateRanges = window.headerConfigs ? 
        (window.Utils.isDashboardMode() ? 
            window.headerConfigs.dashboard.secondaryDateRanges : 
            window.headerConfigs.regular.secondaryDateRanges) : [];
    
    // Only create dropdown if we have content to show
    if (!options.showDateRanges && !options.actions.darkMode.enabled && !options.actions.statsToggle.enabled) {
        return dropdownContainer; // Return empty container
    }
    
    // Create dropdown button
    const dropdownButton = document.createElement('button');
    dropdownButton.className = 'settings-dropdown-button';
    
    // Always show settings gear icon
    dropdownButton.innerHTML = '<i class="fas fa-cog"></i>';
    dropdownButton.title = 'Settings';
    
    // Create dropdown content
    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'settings-dropdown-content';
    
    // Add secondary date ranges if enabled
    if (options.showDateRanges && secondaryDateRanges.length > 0) {
        secondaryDateRanges.forEach(chip => {
            const dateChip = createDateChip(chip.range, chip.key, chip.icon, chip.iconDouble, chip.text, chip.textDouble);
            dateChip.className = 'settings-dropdown-item date-chip';
            dropdownContent.appendChild(dateChip);
        });
    }
    
    // Add divider if we have both date ranges and actions
    if (options.showDivider && options.showDateRanges && secondaryDateRanges.length > 0 && 
        (options.actions.darkMode.enabled || options.actions.statsToggle.enabled)) {
        const divider = document.createElement('div');
        divider.className = 'dropdown-divider';
        dropdownContent.appendChild(divider);
    }
    
    // Add action buttons if enabled
    if (options.actions.darkMode.enabled) {
        const darkModeItem = document.createElement('button');
        darkModeItem.className = 'settings-dropdown-item settings-action-item';
        darkModeItem.innerHTML = '<i class="fas fa-moon"></i>';
        darkModeItem.id = 'darkModeToggle';
        dropdownContent.appendChild(darkModeItem);
    }
    
    if (options.actions.statsToggle.enabled) {
        const statsItem = document.createElement('button');
        statsItem.className = 'settings-dropdown-item settings-action-item';
        statsItem.innerHTML = '<i class="fas fa-chart-line"></i>';
        statsItem.id = 'statsToggle';
        dropdownContent.appendChild(statsItem);
    }
    
    // Add dropdown elements to container
    dropdownContainer.appendChild(dropdownButton);
    dropdownContainer.appendChild(dropdownContent);
    
    // Add click handler for dropdown toggle
    dropdownButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Position dropdown relative to button and append to body
        const rect = dropdownButton.getBoundingClientRect();
        dropdownContent.style.position = 'fixed';
        dropdownContent.style.top = (rect.bottom + 4) + 'px';
        
        // In dashboard mode, align to right edge of button
        if (window.Utils && window.Utils.isDashboardMode()) {
            dropdownContent.style.right = (window.innerWidth - rect.right) + 'px';
            dropdownContent.style.left = 'auto';
        } else {
            dropdownContent.style.left = rect.left + 'px';
            dropdownContent.style.right = 'auto';
        }
        
        // Move to body to escape header stacking context
        document.body.appendChild(dropdownContent);
        dropdownContent.classList.add('show');
        
        // Add dashboard class if we're in dashboard mode
        if (window.Utils && window.Utils.isDashboardMode()) {
            dropdownContent.classList.add('dashboard-dropdown');
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function closeDropdown(event) {
            if (!dropdownContainer.contains(event.target) && !dropdownContent.contains(event.target)) {
                dropdownContent.classList.remove('show');
                dropdownContent.classList.remove('dashboard-dropdown');
                // Move back to original container
                dropdownContainer.appendChild(dropdownContent);
                // Reset positioning
                dropdownContent.style.position = 'absolute';
                dropdownContent.style.top = '100%';
                dropdownContent.style.left = '0';
                dropdownContent.style.right = 'auto';
                document.removeEventListener('click', closeDropdown);
            }
        });
    });
    
    return dropdownContainer;
}

/**
 * Creates a data chip element with icon and value
 * @param {string} id - The ID for the span element
 * @param {string} iconClass - The Font Awesome icon class
 * @param {string} title - The title attribute for the chip
 * @param {string} initialText - Initial text to display
 * @returns {HTMLElement} The data chip element
 */
function createDataChip(id, iconClass, title, initialText = 'loading') {
    const dataChip = document.createElement('div');
    dataChip.className = 'data-chip';
    
    // Only add tooltip for specific data chips
    const showTooltipFor = ['temperature', 'light', 'window', 'battery'];
    
    if (showTooltipFor.includes(id)) {
        // Use data-tooltip-content instead of title for our custom tooltip
        const tooltipText = window.I18n.translate(title);
        dataChip.setAttribute('data-tooltip-content', tooltipText);
        dataChip.setAttribute('data-has-tooltip', 'true');
    }
    
    // Add data-i18n attributes for later translation updates
    dataChip.setAttribute('data-i18n-title', title);
    
    if (iconClass) {
        const icon = document.createElement('i');
        icon.className = `${iconClass} mr-1`;
        dataChip.appendChild(icon);
    }
    
    const span = document.createElement('span');
    span.id = id;
    
    const translatedText = window.I18n.translate(initialText);
    
    span.textContent = translatedText;
    
    if (initialText === 'loading') {
        span.setAttribute('data-i18n', 'loading');
    }
    
    dataChip.appendChild(span);
    
    return dataChip;
}

/**
 * Creates the weather data chip, restructured to match the sun-events-chip pattern
 * @returns {HTMLElement} The weather data chip element
 */
function createWeatherPill() {
    // Check for dashboard mode
    function getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || '';
    }
    
    const urlDashboardMode = getURLParameter('dashboard') === 'true';
    const isPi = (window.screen.width === 800 && window.screen.height === 480) || 
                 (/CrOS.*x86_64/.test(navigator.userAgent) && window.screen.width <= 800);
    const isDashboardMode = urlDashboardMode || isPi;
    
    // Use div for mobile, dashboard, or anchor for desktop
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const useDiv = isMobile || isDashboardMode;

    // Create a single data-chip as the main container (like sun-events-chip)
    const chip = document.createElement(useDiv ? 'div' : 'a');
    if (!useDiv) {
        chip.href = 'https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell/1-60206/Norge/Akershus/Asker/R%C3%B8dtangen';
    }
    chip.className = 'data-chip weather-data-chip';
    chip.id = 'met-link';

    // Create weather icon container
    const weatherIcon = document.createElement('div');
    weatherIcon.className = 'weather-icon';
    weatherIcon.id = 'weather-icon-container';

    // Default empty SVG placeholder (will be replaced by weather.js)
    weatherIcon.innerHTML = `<svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" fill="transparent" stroke="#666" stroke-width="0.5" />
    </svg>`;

    // Create temperature display container
    const temperatureDisplay = document.createElement('div');
    temperatureDisplay.className = 'weather-temp-display';

    // Temperature text element
    const metTemp = document.createElement('span');
    metTemp.id = 'met-temp';
    metTemp.textContent = window.I18n.translate('loading');
    metTemp.setAttribute('data-i18n', 'loading');

    // Add elements to temperature display
    temperatureDisplay.appendChild(metTemp);

    // Add icon and temperature to chip
    chip.appendChild(weatherIcon);
    chip.appendChild(temperatureDisplay);

    // Add tooltip data
    const translatedTitle = window.I18n.translate('outTempChart');
    chip.setAttribute('data-tooltip-content', translatedTitle);
    chip.setAttribute('data-has-tooltip', 'true');
    chip.setAttribute('data-i18n-title', 'outTempChart');

    return chip;
}

/**
 * Creates the sun events chip with moon phase SVG
 * @returns {HTMLElement} The sun events chip
 */
function createSunEventChip() {
    const chip = document.createElement('div');
    chip.className = 'data-chip sun-events-chip';
    chip.id = 'sun-events-chip';
    
    // Create moon phase SVG icon container
    const moonPhaseIcon = document.createElement('div');
    moonPhaseIcon.className = 'moon-phase-icon';
    moonPhaseIcon.id = 'moon-phase-icon';
    
    // Default moon SVG (new moon)
    moonPhaseIcon.innerHTML = `<svg viewBox="0 0 20 20" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" fill="#222" stroke="#666" stroke-width="0.5" />
    </svg>`;
    
    // Create time display element
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'sun-event-time';
    
    // Main time element for next event
    const nextEventTime = document.createElement('span');
    nextEventTime.id = 'next-event-time';
    nextEventTime.textContent = '--:--';
    
    // Remaining time element
    const remainingTime = document.createElement('span');
    remainingTime.id = 'remaining-time';
    remainingTime.className = 'remaining-time';
    remainingTime.textContent = '';
    
    // Add elements to time display
    timeDisplay.appendChild(nextEventTime);
    timeDisplay.appendChild(remainingTime);
    
    // Add icon and time to chip
    chip.appendChild(moonPhaseIcon);
    chip.appendChild(timeDisplay);
    
    // Create tooltip content (will be populated by script)
    const tooltipContent = {
        sunrise: '--:--',
        sunset: '--:--',
        dusk: '--:--',
        moonrise: '--:--',
        moonset: '--:--'
    };
    
    // Set data attribute to store tooltip content
    chip.dataset.tooltipContent = JSON.stringify(tooltipContent);
    
    // Mark this element as having a tooltip
    chip.setAttribute('data-has-tooltip', 'true');
    
    // Initial data will be populated by sun-events.js when ready
    
    return chip;
}

/**
 * Creates the data container with all data chips
 * @param {Object} [config] - Configuration object for the data container
 * @returns {HTMLElement} The data container element
 */
function createDataContainer(config = null) {
    const dataContainer = document.createElement('div');
    dataContainer.className = 'data-container';
    dataContainer.id = 'infoSection';
    
    // Config must provide chips, otherwise fail
    if (!config || !config.chips) {
        throw new Error('DataContainer requires chips configuration');
    }
    
    const chips = config.chips;
    
    // Create and add each chip to the container
    chips.forEach(chipConfig => {
        let chip;
        
        // Special handling for custom chip types
        if (chipConfig.type === 'weatherPill') {
            chip = createWeatherPill();
        } else if (chipConfig.type === 'sunEventChip') {
            chip = createSunEventChip();
        } else {
            // Create regular data chip
            chip = createDataChip(
                chipConfig.id,
                chipConfig.icon,
                chipConfig.titleKey,
                chipConfig.initialText || 'loading'
            );
        }
        
        if (chip) {
            dataContainer.appendChild(chip);
        }
    });
    
    return dataContainer;
}

/**
 * Creates a date chip element with Font Awesome icons or text
 * @param {string} range - The date range value
 * @param {string} key - The translation key for the text
 * @param {string} [icon] - Optional Font Awesome icon class
 * @param {Array} [iconDouble] - Optional array of two Font Awesome icon classes
 * @param {string} [text] - Optional text to display
 * @param {Array} [textDouble] - Optional array of two text strings
 * @returns {HTMLElement} The date chip element
 */
function createDateChip(range, key, icon = null, iconDouble = null, text = null, textDouble = null) {
    const chip = document.createElement('a');
    chip.href = '#';
    chip.className = 'date-chip large-icons';
    chip.dataset.range = range;
    
    // Add double text if provided
    if (textDouble && Array.isArray(textDouble) && textDouble.length === 2) {
        const textContainer = document.createElement('span');
        textContainer.className = 'text-double';
        
        textDouble.forEach(textStr => {
            const textElement = document.createElement('span');
            textElement.className = 'number-text';
            textElement.textContent = textStr;
            textContainer.appendChild(textElement);
        });
        
        chip.appendChild(textContainer);
    }
    // Add single text if provided
    else if (text) {
        const textElement = document.createElement('span');
        textElement.className = 'number-text';
        textElement.textContent = text;
        chip.appendChild(textElement);
    }
    // Add double icons if provided
    else if (iconDouble && Array.isArray(iconDouble) && iconDouble.length === 2) {
        const iconContainer = document.createElement('span');
        iconContainer.className = 'icon-double';
        
        iconDouble.forEach(iconClass => {
            const iconElement = document.createElement('i');
            iconElement.className = iconClass;
            iconContainer.appendChild(iconElement);
        });
        
        chip.appendChild(iconContainer);
    }
    // Add single icon if provided
    else if (icon) {
        const iconElement = document.createElement('i');
        iconElement.className = icon;
        chip.appendChild(iconElement);
    }
    
    // Store the translation key for tooltips but don't add visible text
    chip.setAttribute('data-i18n-title', key);
    chip.title = window.I18n.translate(key);
    
    return chip;
}

/**
 * Creates the date ranges container with all date chips
 * @param {Object} [config] - Configuration object for date ranges
 * @returns {HTMLElement} The date ranges container element
 */
function createDateRanges(config = null) {
    const dateRanges = document.createElement('div');
    dateRanges.className = 'date-ranges';
    
    // Get primary date ranges from top-level config
    const primaryRanges = window.headerConfigs ? 
        (window.Utils.isDashboardMode() ? 
            window.headerConfigs.dashboard.primaryDateRanges : 
            window.headerConfigs.regular.primaryDateRanges) : [];
    
    // Add primary date chips directly to the container
    primaryRanges.forEach(chip => {
        const dateChip = createDateChip(chip.range, chip.key, chip.icon, chip.iconDouble, chip.text, chip.textDouble);
        dateRanges.appendChild(dateChip);
    });
    
    return dateRanges;
}

/**
 * Creates the search container with sorting and results options
 * @param {Object} [config] - Configuration object for search container
 * @returns {HTMLElement} The search container element
 */
function createSearchContainer(config = null) {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    
    // Get configuration options with defaults
    const options = {
        // Default options
        resultsPlaceholder: 'results',
        updateButtonKey: 'update',
        includeSortDropdown: true,
        includeResults: true,
        includeDarkMode: false,
        includeStatsToggle: false,
        // Override with provided config
        ...(config || {})
    };

    // Create categories/sort container for desktop and mobile view
    if (options.includeSortDropdown) {
        // Create sort container
        const sortContainer = document.createElement('div');
        sortContainer.className = 'sort-container';
        
        const sortSelect = document.createElement('select');
        sortSelect.id = 'sortSelect';
        
        sortSelect.title = window.I18n.translate('sortBy');
        sortSelect.setAttribute('data-i18n-title', 'sortBy');
        
        // Always include the default sort option (by row)
        const defaultOption = document.createElement('option');
        defaultOption.value = 'row';
        defaultOption.textContent = window.I18n.translate('default');
        defaultOption.setAttribute('data-i18n', 'default');
        sortSelect.appendChild(defaultOption);
        
        // Dynamically generate options based on actually used categories in chart configs
        if (window.chartConfigs && Array.isArray(window.chartConfigs)) {
            // Get unique categories from chart configs
            const categories = [...new Set(window.chartConfigs.map(chartConfig => chartConfig.category))];
            
            // Map of category values to their translation keys
            const categoryTranslationMap = {
                'temperature': 'temperatureSort',
                'plant-temperature': 'temperatureSort', // Map plant-temperature to temperatureSort
                'detail-temperature': 'temperatureSort', // Map detail-temperature to temperatureSort
                'humidity': 'humiditySort',
                'weather': 'weatherSort',
                'system': 'systemSort',
                'soil': 'soilSort',
                'soil-moisture': 'soilSort', // Map soil-moisture to soilSort
                'light': 'lightSort',
                'structure': 'structureSort'
            };
            
            // Sort categories alphabetically by translated name
            categories.sort((a, b) => {
                const keyA = categoryTranslationMap[a] || a;
                const keyB = categoryTranslationMap[b] || b;
                const textA = window.I18n.translate(keyA);
                const textB = window.I18n.translate(keyB);
                return textA.localeCompare(textB);
            });
            
            // Add option for each category
            categories.forEach(category => {
                // Skip categories that don't have a translation mapping
                if (!categoryTranslationMap[category]) return;
                
                const translationKey = categoryTranslationMap[category];
                
                // Only add main categories, not subcategories
                if (category.includes('-') && !['soil-moisture'].includes(category)) return;
                
                const optionEl = document.createElement('option');
                optionEl.value = category;
                optionEl.textContent = window.I18n.translate(translationKey);
                optionEl.setAttribute('data-i18n', translationKey);
                sortSelect.appendChild(optionEl);
            });
        }
        
        sortContainer.appendChild(sortSelect);
        
        // For desktop view, append to searchContainer directly
        // For mobile view, it will be moved to mobile-header-controls via JS
        searchContainer.appendChild(sortContainer);
        
        // Add a hidden duplicate to be used on mobile (will be positioned via CSS)
        const mobileSortContainer = sortContainer.cloneNode(true);
        mobileSortContainer.className = 'sort-container mobile-sort-container';
        mobileSortContainer.id = 'mobileSortContainer';
        
        // Need to re-add event listeners for the cloned dropdown
        const mobileSelect = mobileSortContainer.querySelector('select');
        mobileSelect.id = 'mobileSortSelect';
        
        searchContainer.appendChild(mobileSortContainer);
    }
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'results-container';
    
    // Add results input and update button if configured
    if (options.includeResults) {
        // Create results input
        const resultsInput = document.createElement('input');
        resultsInput.type = 'number';
        resultsInput.id = 'resultsInput';
        
        resultsInput.placeholder = window.I18n.translate(options.resultsPlaceholder);
        resultsInput.setAttribute('data-i18n-placeholder', options.resultsPlaceholder);
        resultsInput.min = '1';
        
        // Create update button
        const updateButton = document.createElement('button');
        updateButton.id = 'updateButton';
        
        updateButton.textContent = window.I18n.translate(options.updateButtonKey);
        updateButton.setAttribute('data-i18n', options.updateButtonKey);
        
        resultsContainer.appendChild(resultsInput);
        resultsContainer.appendChild(updateButton);
    }
    
    // Add any custom elements if provided
    if (options.customElements && Array.isArray(options.customElements)) {
        options.customElements.forEach(el => {
            if (el instanceof HTMLElement) {
                resultsContainer.appendChild(el);
            }
        });
    }
    
    searchContainer.appendChild(resultsContainer);
    
    return searchContainer;
}

/**
 * Component Registry - simple lookup table for component factories
 */
const ComponentRegistry = {
    'logoContainer': createLogoContainer,
    'dataContainer': createDataContainer,
    'thingSpeakLinks': createThingSpeakLinks,
    'dateRanges': createDateRanges,
    'actionButtons': createActionButtons,
    'settingsDropdown': createSettingsDropdown,
    'searchContainer': createSearchContainer
};


/**
 * Header Component Configuration
 * Declarative configuration for the header layout and components
 */
const HeaderConfig = {
    // Component definitions
    components: {
        logo: {
            type: 'logoContainer',
            config: {
                logoUrl: 'https://github.com/fmmr/drimon',
                logoImage: 'logos/1_100x55.webp',
                logoAlt: 'DriMon'
            }
        },
        data: {
            type: 'dataContainer',
            config: {
                chips: [
                    { id: 'temperature', icon: 'fas fa-thermometer-half', titleKey: 'temperature' },
                    { id: 'weather', type: 'weatherPill' },
                    { id: 'sunEvents', type: 'sunEventChip' },
                    { id: 'light', icon: 'fas fa-sun', titleKey: 'light', initialText: '' },
                    { id: 'window', icon: 'fas fa-window-maximize', titleKey: 'window', initialText: '' },
                    { id: 'pressure', icon: 'fas fa-compress-alt', titleKey: 'pressure' },
                    { id: 'battery', icon: 'fas fa-battery-half', titleKey: 'battery' }
                ]
            }
        },
        thingspeak: {
            type: 'thingSpeakLinks',
            config: {}
        },
        dateRanges: {
            type: 'dateRanges',
            config: {
                ranges: AllDateRanges // First 6 will be shown as pills, rest in dropdown
            }
        },
        search: {
            type: 'searchContainer',
            config: {
                resultsPlaceholder: 'results',
                updateButtonKey: 'update',
                includeCategories: true,
                includeResults: true,
                includeDarkMode: true,
                includeStatsToggle: true
            }
        }
    },
    
    // Layout order
    layout: ['logo', 'data', 'thingspeak', 'dateRanges', 'search'],
    
    // Header theme (can be custom CSS classes)
    theme: 'modern-header',
    
    // Event callbacks
    events: {
        onLanguageChange: null,
        onDateRangeChange: null,
        onCategoryChange: null,
        onDarkModeToggle: null,
        onStatsToggle: null
    }
};

// Dashboard-specific header config (simplified for Pi display)
const DashboardHeaderConfig = {
    // Component definitions
    components: {
        logo: {
            type: 'logoContainer',
            config: {
                logoUrl: null, // No link for dashboard
                logoImage: 'logos/1_100x55.webp',
                logoAlt: 'DriMon',
                showTimeIndicator: true,
                timeKey: 'time'
            }
        },
        data: {
            type: 'dataContainer',
            config: {
                chips: [
                    { id: 'temperature', icon: 'fas fa-thermometer-half', titleKey: 'temperature' },
                    { id: 'weather', type: 'weatherPill' },
                    { id: 'sunEvents', type: 'sunEventChip' },
                    { id: 'light', icon: 'fas fa-sun', titleKey: 'light', initialText: '' },
                    { id: 'battery', icon: 'fas fa-battery-half', titleKey: 'battery' },
                    { id: 'pressure', icon: 'fas fa-compress-alt', titleKey: 'pressure' },
                    { id: 'window', icon: 'fas fa-window-maximize', titleKey: 'window', initialText: '' }
                ]
            }
        },
        dateRanges: {
            type: 'dateRanges',
            config: {
                ranges: [], // No primary ranges - all go to dropdown for dashboard
                secondaryRanges: AllDateRanges // All ranges go to dropdown for dashboard
            }
        },
        search: {
            type: 'searchContainer',
            config: {
                resultsPlaceholder: 'results',
                updateButtonKey: 'update',
                includeCategories: false,
                includeResults: false,
                includeDarkMode: false, // Moved to settings dropdown
                includeStatsToggle: false, // Moved to settings dropdown
                includeLanguageSwitcher: false
            }
        }
    },
    
    // Layout order (logo back, no thingspeak links, no language switcher)
    layout: ['logo', 'data', 'dateRanges', 'search'],
    
    // Header theme
    theme: 'modern-header dashboard-header',
    
    // Event callbacks
    events: {
        onLanguageChange: null,
        onDateRangeChange: null,
        onCategoryChange: null,
        onDarkModeToggle: null,
        onStatsToggle: null
    }
};

/**
 * Creates ThingSpeak links container with links styled like date chips
 * @returns {HTMLElement} The ThingSpeak links container
 */
function createThingSpeakLinks() {
    const container = document.createElement('div');
    container.className = 'thingspeak-links';
    
    // Loop through the CHANNELS object from window.THINGSPEAK
    Object.values(window.THINGSPEAK.CHANNELS).forEach(channel => {
        const link = document.createElement('a');
        link.href = `https://thingspeak.mathworks.com/channels/${channel.id}`;
        link.textContent = channel.label;
        link.className = 'thingspeak-chip';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        container.appendChild(link);
    });
    
    return container;
}

/**
 * Creates the complete header element with all components
 * Uses declarative configuration to build the header
 * @param {Object} [config] - Optional custom configuration
 * @returns {HTMLElement} The complete header element
 */
/**
 * Header Controller for dynamic updates
 * Manages a header instance and provides methods for updating components
 */
const HeaderController = {
    /**
     * Current header configuration
     * @private
     */
    _config: null,
    
    /**
     * Current header element
     * @private
     */
    _headerElement: null,
    
    /**
     * Initialize the header controller with a configuration
     * @param {Object} config - Header configuration
     * @returns {Object} The header controller
     */
    initialize: function(config = HeaderConfig) {
        this._config = {...config};
        this._headerElement = null;
        return this;
    },
    
    /**
     * Create and render the header
     * @param {HTMLElement} container - Container element to append the header to
     * @returns {HTMLElement} The created header element
     */
    render: function(container) {
        // Create the header element
        this._headerElement = this._createHeaderElement();
        
        // Append to container if provided
        if (container) {
            container.appendChild(this._headerElement);
        }
        
        return this._headerElement;
    },
    
    /**
     * Update a specific component in the header
     * @param {string} componentKey - Key of the component to update
     * @param {Object} newConfig - New configuration for the component
     * @returns {boolean} Success flag
     */
    updateComponent: function(componentKey, newConfig) {
        // Check if the component exists in the configuration
        if (!this._config.components[componentKey]) {
            return false;
        }
        
        // Update the configuration
        this._config.components[componentKey].config = {
            ...this._config.components[componentKey].config,
            ...newConfig
        };
        
        // If header element exists, update the component
        if (this._headerElement) {
            const componentElement = this._headerElement.querySelector(`[data-component="${componentKey}"]`);
            if (componentElement) {
                // Remove the old component
                componentElement.remove();
                
                // Create the new component
                const createFunction = ComponentRegistry[this._config.components[componentKey].type];
                const newComponent = createFunction ? createFunction(this._config.components[componentKey].config) : null;
                
                if (newComponent) {
                    // Add component key as a data attribute
                    newComponent.setAttribute('data-component', componentKey);
                    
                    // Find the correct position to insert the new component
                    const componentIndex = this._config.layout.indexOf(componentKey);
                    const nextComponent = componentIndex < this._config.layout.length - 1 ? 
                        this._headerElement.querySelector(`[data-component="${this._config.layout[componentIndex + 1]}"]`) : 
                        null;
                    
                    // Insert the new component
                    if (nextComponent) {
                        this._headerElement.insertBefore(newComponent, nextComponent);
                    } else {
                        this._headerElement.appendChild(newComponent);
                    }
                    
                    // Re-attach event handlers
                    this._attachEventHandlers();
                    
                    return true;
                }
            }
        }
        
        return false;
    },
    
    /**
     * Create the header element with all components
     * @private
     * @returns {HTMLElement} The header element
     */
    _createHeaderElement: function() {
        const header = document.createElement('header');
        header.className = `header ${this._config.theme || 'modern-header'}`;
        
        // Create each component according to the layout order
        this._config.layout.forEach(componentKey => {
            const componentConfig = this._config.components[componentKey];
            if (!componentConfig) return;
            
            // Create the component using the registry
            const createFunction = ComponentRegistry[componentConfig.type];
            const component = createFunction ? createFunction(componentConfig.config) : null;
            
            if (component) {
                // Add component key as a data attribute for potential dynamic updates
                component.setAttribute('data-component', componentKey);
                
                // Add to the header
                header.appendChild(component);
            }
        });
        
        // Attach event handlers
        this._attachEventHandlers(header);
        
        return header;
    },
    
    /**
     * Attach event handlers to the header components
     * @private
     * @param {HTMLElement} [header] - Header element to attach handlers to (defaults to _headerElement)
     */
    _attachEventHandlers: function(header = null) {
        // Use provided header or current header element
        const headerEl = header || this._headerElement;
        if (!headerEl) return;
        
        // Attach event handlers if provided
        if (this._config.events) {
            // Attach language change event
            if (this._config.events.onLanguageChange && typeof this._config.events.onLanguageChange === 'function') {
                document.addEventListener('languageChanged', this._config.events.onLanguageChange);
            }
            
            // Find and attach date range change handlers
            if (this._config.events.onDateRangeChange && typeof this._config.events.onDateRangeChange === 'function') {
                const dateChips = headerEl.querySelectorAll('.date-chip');
                dateChips.forEach(chip => {
                    chip.addEventListener('click', (e) => {
                        const range = chip.getAttribute('data-range');
                        if (range) {
                            this._config.events.onDateRangeChange(range, e);
                        }
                    });
                });
            }
            
            // Find and attach category change handler
            if (this._config.events.onCategoryChange && typeof this._config.events.onCategoryChange === 'function') {
                const sortSelect = headerEl.querySelector('#sortSelect');
                if (sortSelect) {
                    sortSelect.addEventListener('change', (e) => {
                        const category = e.target.value;
                        this._config.events.onCategoryChange(category, e);
                    });
                }
            }
            
            // Find and attach dark mode toggle handler
            if (this._config.events.onDarkModeToggle && typeof this._config.events.onDarkModeToggle === 'function') {
                const darkModeToggle = headerEl.querySelector('#darkModeToggle');
                if (darkModeToggle) {
                    darkModeToggle.addEventListener('click', this._config.events.onDarkModeToggle);
                }
            }
            
            // Find and attach stats toggle handler
            if (this._config.events.onStatsToggle && typeof this._config.events.onStatsToggle === 'function') {
                const statsToggle = headerEl.querySelector('#statsToggle');
                if (statsToggle) {
                    statsToggle.addEventListener('click', this._config.events.onStatsToggle);
                }
            }
        }
    }
};

/**
 * Creates the complete header element with all components
 * Uses declarative configuration to build the header
 * @param {Object} [config] - Optional custom configuration
 * @returns {HTMLElement} The complete header element
 */
function createHeader(config = HeaderConfig) {
    // Initialize the header controller
    const controller = HeaderController.initialize(config);
    
    // Create and return the header element
    return controller._createHeaderElement();
}

// Make components available globally
window.HeaderComponents = {
    // Core functions
    createHeader,
    createLogoContainer,
    createDataContainer,
    createDataChip,
    createWeatherPill,
    createDateRanges,
    createDateChip,
    createSearchContainer,
    
    // Component system
    ComponentRegistry,
    HeaderController,
    
    // Configuration
    HeaderConfig
};

// Export createHeader globally for header-controller.js
window.createHeader = createHeader;
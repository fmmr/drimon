/**
 * Header Components
 * 
 * This file contains reusable components for the DriMon header section.
 * Each component is a function that creates and returns DOM elements.
 */

/**
 * Creates the logo container element
 * @param {Object} config - Configuration object for logo container
 * @returns {HTMLElement} The logo container element
 */
function createLogoContainer(config) {
    
    const logoContainer = document.createElement('div');
    logoContainer.className = `logo-container ${config.customClasses}`.trim();
    
    // Create logo image (with or without link)
    const logoImg = document.createElement('img');
    logoImg.src = config.logoImage;
    logoImg.className = config.logoClassName;
    logoImg.id = config.logoId;
    logoImg.alt = config.logoAlt;
    
    // Add logo to container (wrap in link if URL provided)
    if (config.logoUrl) {
        const logoLink = document.createElement('a');
        logoLink.href = config.logoUrl;
        logoLink.appendChild(logoImg);
        logoContainer.appendChild(logoLink);
    } else {
        logoContainer.appendChild(logoImg);
    }
    
    
    
    return logoContainer;
}

// createTimeChip function removed - now handled by ChipHandler


/**
 * Creates settings dropdown component (date ranges + actions)
 * @param {Object} [config] - Configuration object for settings dropdown
 * @returns {HTMLElement} The settings dropdown container element
 */
function createSettingsDropdown(config) {
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'settings-dropdown';
    
    const dateRanges = config.dateRanges;
    const actions = config.actions;
    const actionConfigs = config.actionConfigs;
    const showDivider = config.showDivider;
    const layout = config.layout;
    
    // Only create dropdown if we have content to show
    if (dateRanges.length === 0 && actions.length === 0) {
        return dropdownContainer;
    }
    
    // Create dropdown button
    const iconClass = config.icon;
    const dropdownButton = document.createElement('button');
    dropdownButton.className = 'settings-dropdown-button header-button';
    dropdownButton.innerHTML = `<i class="${iconClass}"></i>`;
    dropdownButton.title = 'Settings';
    
    // Create dropdown content
    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'settings-dropdown-content';
    
    // Add date ranges
    if (dateRanges.length > 0) {
        dateRanges.forEach(chip => {
            const dateChip = createDateChip(chip.range, chip.key, chip.icon, chip.iconDouble, chip.text, chip.textDouble);
            dateChip.className = 'settings-dropdown-item date-chip';
            dropdownContent.appendChild(dateChip);
        });
    }
    
    // Add secondary date ranges (for dashboard mode row break)
    if (config.secondaryDateRanges && config.secondaryDateRanges.length > 0) {
        // Add a break element to force new row in horizontal layout
        if (layout === 'horizontal') {
            const breakElement = document.createElement('div');
            breakElement.className = 'row-break';
            dropdownContent.appendChild(breakElement);
        }
        
        config.secondaryDateRanges.forEach(chip => {
            const dateChip = createDateChip(chip.range, chip.key, chip.icon, chip.iconDouble, chip.text, chip.textDouble);
            dateChip.className = 'settings-dropdown-item date-chip';
            dropdownContent.appendChild(dateChip);
        });
    }
    
    // Add divider if we have both date ranges and actions
    if (showDivider && dateRanges.length > 0 && actions.length > 0) {
        const divider = document.createElement('div');
        divider.className = 'dropdown-divider';
        dropdownContent.appendChild(divider);
    }
    
    // Add action components by reusing existing component functions
    actions.forEach(actionType => {
        const createFunction = ComponentRegistry[actionType];
        if (createFunction) {
            const componentConfig = actionConfigs[actionType] || {};
            const actionComponent = createFunction(componentConfig);
            actionComponent.className = 'settings-dropdown-item settings-action-item';
            dropdownContent.appendChild(actionComponent);
        }
    });
    
    // Add second divider and chart set selector for dashboard mode only
    if (config.showSecondDivider && config.chartSetSelector && window.Utils && window.Utils.isDashboardMode()) {
        const secondDivider = document.createElement('div');
        secondDivider.className = 'dropdown-divider';
        dropdownContent.appendChild(secondDivider);
        
        const chartSetButtons = createChartSetSelector(config.chartSetSelector);
        chartSetButtons.forEach(button => {
            dropdownContent.appendChild(button);
        });
    }
    
    // Add dropdown elements to container
    dropdownContainer.appendChild(dropdownButton);
    dropdownContainer.appendChild(dropdownContent);
    
    // Add click handler for dropdown toggle
    dropdownButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        function closeDropdown() {
            dropdownContent.classList.remove('show', 'positioned', 'horizontal');
            dropdownContainer.appendChild(dropdownContent);
            document.removeEventListener('click', handleOutsideClick);
        }
        
        if (dropdownContent.classList.contains('show')) {
            closeDropdown();
            return;
        }
        
        dropdownContent.classList.add('positioned');
        dropdownContent.classList.add('horizontal');
        
        document.body.appendChild(dropdownContent);
        dropdownContent.classList.add('show');
        
        function handleOutsideClick(event) {
            if (!dropdownContainer.contains(event.target) && !dropdownContent.contains(event.target)) {
                closeDropdown();
            }
        }
        document.addEventListener('click', handleOutsideClick);
        
        dropdownContent.addEventListener('click', (event) => {
            if (event.target.closest('.date-chip') || event.target.closest('.settings-action-item') || event.target.closest('.chart-set-button')) {
                closeDropdown();
            }
        });
    });
    
    return dropdownContainer;
}

function createChartSetSelector(config) {
    const chartSets = config.chartSets;
    const buttons = [];
    
    Object.keys(chartSets).forEach(setId => {
        const chartSet = chartSets[setId];
        
        const button = document.createElement('button');
        button.className = 'settings-dropdown-item chart-set-button';
        button.setAttribute('data-set-id', setId);
        
        const icon = document.createElement('i');
        icon.className = chartSet.icon;
        button.appendChild(icon);
        
        button.addEventListener('click', () => {
            if (window.Utils && window.Utils.setSelectedChartSet) {
                window.Utils.setSelectedChartSet(parseInt(setId));
            }
            
            buttons.forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
        
        if (setId === '1') {
            button.classList.add('active');
        }
        
        buttons.push(button);
    });
    
    return buttons;
}





// createDataChip function removed - now handled by ChipHandler

// createWeatherPill function removed - now handled by ChipHandler

// createSunEventChip function removed - now handled by ChipHandler

/**
 * Creates the data container with all data chips using unified ChipHandler
 * @param {Object} [config] - Configuration object for the data container
 * @returns {HTMLElement} The data container element
 */
function createDataContainer(config = null) {
    const dataContainer = document.createElement('div');
    dataContainer.className = 'data-container';
    dataContainer.id = 'infoSection';
    
    // Determine view mode from config or default to 'desktop'
    const view = config?.view || 'desktop';
    
    // Use ChipHandler to create all chips for this view
    const chips = window.ChipHandler.createChipsForView(view);
    
    // Add each chip to the container
    chips.forEach(({ element }) => {
        dataContainer.appendChild(element);
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
    
    const ranges = config.ranges;
    
    ranges.forEach(chip => {
        const dateChip = createDateChip(chip.range, chip.key, chip.icon, chip.iconDouble, chip.text, chip.textDouble);
        dateRanges.appendChild(dateChip);
    });
    
    return dateRanges;
}

/**
 * Creates results input component with input field and update button
 * @param {Object} config - Configuration object for results input
 * @returns {HTMLElement} The results input element
 */
function createResultsInput(config) {
    const container = document.createElement('div');
    container.className = 'results-container';
    
    // Create results input
    const resultsInput = document.createElement('input');
    resultsInput.type = 'number';
    resultsInput.id = 'resultsInput';
    resultsInput.min = '1';
    
    resultsInput.placeholder = window.I18n.translate(config.placeholderKey);
    resultsInput.setAttribute('data-i18n-placeholder', config.placeholderKey);
    
    // Create update button
    const updateButton = document.createElement('button');
    updateButton.id = 'updateButton';
    updateButton.textContent = window.I18n.translate(config.buttonKey);
    updateButton.setAttribute('data-i18n', config.buttonKey);
    
    container.appendChild(resultsInput);
    container.appendChild(updateButton);
    
    return container;
}

/**
 * Creates dark mode toggle button
 * @param {Object} [config] - Configuration object for dark mode toggle
 * @returns {HTMLElement} The dark mode toggle button element
 */
function createDarkModeToggle(config) {
    const iconClass = config.icon;
    
    const darkModeToggle = document.createElement('button');
    darkModeToggle.id = 'darkModeToggle';
    darkModeToggle.className = 'header-button';
    
    darkModeToggle.title = window.I18n.translate('darkModeTooltip');
    darkModeToggle.setAttribute('data-i18n-title', 'darkModeTooltip');
    
    const darkModeIcon = document.createElement('span');
    darkModeIcon.className = 'icon';
    darkModeIcon.innerHTML = `<i class="${iconClass}"></i>`;
    
    darkModeToggle.appendChild(darkModeIcon);
    
    return darkModeToggle;
}

/**
 * Creates stats toggle button
 * @param {Object} [config] - Configuration object for stats toggle
 * @returns {HTMLElement} The stats toggle button element
 */
function createStatsToggle(config) {
    const iconClass = config.icon;
    
    const statsToggle = document.createElement('button');
    statsToggle.id = 'statsToggle';
    statsToggle.className = 'header-button';
    
    statsToggle.title = window.I18n.translate('statsTooltip');
    statsToggle.setAttribute('data-i18n-title', 'statsTooltip');
    
    const statsIcon = document.createElement('span');
    statsIcon.className = 'icon';
    statsIcon.innerHTML = `<i class="${iconClass}"></i>`;
    
    statsToggle.appendChild(statsIcon);
    
    return statsToggle;
}

/**
 * Creates sort dropdown (mobile-only)
 * @param {Object} [config] - Configuration object for sort dropdown
 * @returns {HTMLElement} The sort dropdown element
 */
function createSortDropdown(config) {
    const categoryMap = config.categoryMap;
    
    const sortContainer = document.createElement('div');
    sortContainer.className = 'sort-container mobile-sort-container';
    
    const sortSelect = document.createElement('select');
    sortSelect.id = 'sortSelect';
    sortSelect.title = window.I18n.translate('sortBy');
    sortSelect.setAttribute('data-i18n-title', 'sortBy');
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = 'row';
    defaultOption.textContent = window.I18n.translate('default');
    defaultOption.setAttribute('data-i18n', 'default');
    sortSelect.appendChild(defaultOption);
    
    // Add dynamic category options from config
    if (window.chartConfigs && Array.isArray(window.chartConfigs)) {
        const categories = [...new Set(window.chartConfigs.map(chartConfig => chartConfig.category))];
        
        categories.sort((a, b) => {
            const keyA = categoryMap[a] || a;
            const keyB = categoryMap[b] || b;
            const textA = window.I18n.translate(keyA);
            const textB = window.I18n.translate(keyB);
            return textA.localeCompare(textB);
        });
        
        categories.forEach(category => {
            if (!categoryMap[category]) return;
            const translationKey = categoryMap[category];
            if (category.includes('-') && !['soil-moisture'].includes(category)) return;
            
            const optionEl = document.createElement('option');
            optionEl.value = category;
            optionEl.textContent = window.I18n.translate(translationKey);
            optionEl.setAttribute('data-i18n', translationKey);
            sortSelect.appendChild(optionEl);
        });
    }
    
    sortContainer.appendChild(sortSelect);
    return sortContainer;
}

/**
 * Creates a language switcher component with flags
 * @returns {HTMLElement} - The language switcher component
 */
function createLanguageSwitcher() {
    const container = document.createElement('div');
    container.className = 'language-switcher';
    
    const languages = [
        { code: 'no', name: 'Norsk', emoji: '🇳🇴' },
        { code: 'en', name: 'English', emoji: '🇬🇧' },
        { code: 'es', name: 'Español', emoji: '🇪🇸' }
    ];
    
    // Safety check for I18n availability
    const currentLang = window.I18n && typeof window.I18n.getCurrentLanguage === 'function' 
        ? window.I18n.getCurrentLanguage() 
        : 'en';
    
    languages.forEach(lang => {
        const button = document.createElement('button');
        button.className = `lang-flag ${lang.code === currentLang ? 'active' : ''}`;
        button.setAttribute('data-lang', lang.code);
        button.setAttribute('data-language-switch', lang.code);
        button.setAttribute('title', lang.name);
        button.setAttribute('aria-label', `Switch to ${lang.name}`);
        
        button.textContent = lang.emoji;
        
        button.addEventListener('click', () => {
            let langChanged = false;
            
            if (window.I18n && typeof window.I18n.setLanguage === 'function') {
                langChanged = window.I18n.setLanguage(lang.code);
            }
            
            if (langChanged) {
                document.querySelectorAll('.lang-flag').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang.code);
                });
                
                setTimeout(() => {
                    if (window.ChartStats && window.ChartStats.updateAllChartStats) {
                        window.ChartStats.updateAllChartStats();
                    }
                }, 200);
                
                setTimeout(() => {
                    if (window.updateChartLegendDOM) {
                        window.updateChartLegendDOM();
                    }
                    
                    if (window.chartInstances) {
                        const instances = Object.values(window.chartInstances).filter(chart => chart);
                        const originalAnimations = instances.map(chart => chart.options.animation);
                        
                        instances.forEach(chart => {
                            if (chart && chart.options) {
                                chart.options.animation = { duration: 0 };
                            }
                        });
                        
                        instances.forEach(chart => {
                            try {
                                chart.update();
                            } catch (e) {
                                // Silently ignore errors
                            }
                        });
                        
                        instances.forEach((chart, index) => {
                            if (chart && chart.options) {
                                chart.options.animation = originalAnimations[index];
                            }
                        });
                    }
                }, 100);
            }
        });
        
        container.appendChild(button);
    });
    
    return container;
}

/**
 * Component Registry - simple lookup table for component factories
 */
const ComponentRegistry = {
    'logoContainer': createLogoContainer,
    'dataContainer': createDataContainer,
    'thingSpeakLinks': createThingSpeakLinks,
    'dateRanges': createDateRanges,
    'settingsDropdown': createSettingsDropdown,
    'resultsInput': createResultsInput,
    'languageSwitcher': createLanguageSwitcher,
    'darkModeToggle': createDarkModeToggle,
    'statsToggle': createStatsToggle,
    'sortDropdown': createSortDropdown
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
        header.className = `header ${this._config.theme}`;
        
        // Create rows for multi-layout system
        const layouts = ['layout', 'layout2', 'layout3', 'layout4'];
        
        layouts.forEach((layoutKey, index) => {
            const layoutArray = this._config[layoutKey];
            if (!layoutArray || layoutArray.length === 0) return;
            
            // Create row container
            const row = document.createElement('div');
            row.className = `header-row header-row-${index + 1}`;
            
            // Create each component in this row
            layoutArray.forEach(componentKey => {
                const componentConfig = this._config.components[componentKey];
                if (!componentConfig) return;
                
                // Create the component using the registry
                const createFunction = ComponentRegistry[componentConfig.type];
                const component = createFunction ? createFunction(componentConfig.config) : null;
                
                if (component) {
                    // Add component key as a data attribute for potential dynamic updates
                    component.setAttribute('data-component', componentKey);
                    
                    // Add to the row
                    row.appendChild(component);
                }
            });
            
            // Add row to header if it has components
            if (row.children.length > 0) {
                header.appendChild(row);
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
function createHeader(config) {
    // Initialize the header controller
    const controller = HeaderController.initialize(config);
    
    // Create and return the header element
    return controller._createHeaderElement();
}

// Make components available globally
window.HeaderComponents = {
    createHeader,
    ComponentRegistry,
    HeaderController
};

// Export createHeader globally for header-controller.js
window.createHeader = createHeader;
/**
 * Header Components
 * 
 * This file contains reusable components for the DriMon header section.
 * Each component is a function that creates and returns DOM elements.
 */

/**
 * Creates the logo container element
 * @returns {HTMLElement} The logo container element
 */
function createLogoContainer() {
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    
    const logoLink = document.createElement('a');
    logoLink.href = 'https://github.com/fmmr/drimon';
    
    const logoImg = document.createElement('img');
    logoImg.src = 'logos/1_100x55.webp';
    logoImg.className = 'logo';
    logoImg.id = 'main-title';
    logoImg.alt = 'DriMon';
    
    const timeIndicator = document.createElement('div');
    timeIndicator.className = 'time-indicator';
    timeIndicator.title = window.i18n && typeof window.i18n.__ === 'function' ? 
        window.i18n.__('time') : 'Sist oppdatert';
    timeIndicator.setAttribute('data-i18n-title', 'time');
    
    const timeSpan = document.createElement('span');
    timeSpan.id = 'time-since';
    
    // Use i18n for loading text if available
    const loadingText = window.i18n && typeof window.i18n.__ === 'function' ? 
        window.i18n.__('loading') : 'Laster...';
    timeSpan.textContent = loadingText;
    timeSpan.setAttribute('data-i18n', 'loading');
    
    timeIndicator.appendChild(timeSpan);
    logoLink.appendChild(logoImg);
    logoContainer.appendChild(logoLink);
    logoContainer.appendChild(timeIndicator);
    
    return logoContainer;
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
    
    // Use i18n if available
    const translatedTitle = window.i18n && typeof window.i18n.__ === 'function' ? 
        window.i18n.__(title) : title;
    dataChip.title = translatedTitle;
    
    // Add data-i18n attributes for later translation updates
    dataChip.setAttribute('data-i18n-title', title);
    
    if (iconClass) {
        const icon = document.createElement('i');
        icon.className = `${iconClass} mr-1`;
        dataChip.appendChild(icon);
    }
    
    const span = document.createElement('span');
    span.id = id;
    
    // Use i18n for loading text if available
    const translatedText = (window.i18n && typeof window.i18n.__ === 'function') ? 
        window.i18n.__(initialText) : 
        (initialText === 'loading' ? 'Laster...' : initialText);
    
    span.textContent = translatedText;
    
    if (initialText === 'loading') {
        span.setAttribute('data-i18n', 'loading');
    }
    
    dataChip.appendChild(span);
    
    return dataChip;
}

/**
 * Creates the weather pill container element
 * @returns {HTMLElement} The weather pill container element
 */
function createWeatherPill() {
    const weatherContainer = document.createElement('div');
    weatherContainer.className = 'weather-pill-container';
    
    const iconContainer = document.createElement('div');
    iconContainer.id = 'weather-icon-container';
    iconContainer.className = 'weather-icon-container';
    
    const metLink = document.createElement('a');
    metLink.href = 'https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell/1-60206/Norge/Akershus/Asker/R%C3%B8dtangen';
    metLink.className = 'data-chip';
    metLink.id = 'met-link';
    
    // Use i18n if available for title
    const translatedTitle = window.i18n && typeof window.i18n.__ === 'function' ? 
        window.i18n.__('outTempChart') : 'Ute Temperatur (yr.no)';
    metLink.title = translatedTitle;
    
    // Add data-i18n attribute for later translation updates
    metLink.setAttribute('data-i18n-title', 'outTempChart');
    
    const metTemp = document.createElement('span');
    metTemp.id = 'met-temp';
    
    // Use i18n for loading text if available
    const loadingText = window.i18n && typeof window.i18n.__ === 'function' ? 
        window.i18n.__('loading') : 'Laster...';
    metTemp.textContent = loadingText;
    
    // Add data-i18n attribute for later translation updates
    metTemp.setAttribute('data-i18n', 'loading');
    
    metLink.appendChild(metTemp);
    weatherContainer.appendChild(iconContainer);
    weatherContainer.appendChild(metLink);
    
    return weatherContainer;
}

/**
 * Creates the data container with all data chips
 * @returns {HTMLElement} The data container element
 */
function createDataContainer() {
    const dataContainer = document.createElement('div');
    dataContainer.className = 'data-container';
    dataContainer.id = 'infoSection';
    
    // Temperature chip with translation key
    const tempChip = createDataChip('temperature', 'fas fa-thermometer-half', 'temperature');
    
    // Weather pill
    const weatherPill = createWeatherPill();
    
    // Light chip with translation key
    const lightChip = createDataChip('light', 'fas fa-sun', 'light', '');
    
    // Battery percentage chip with translation key
    const batteryChip = createDataChip('battery', 'fas fa-battery-half', 'battery');
    
    // Battery voltage chip with translation key
    const batteryVoltChip = createDataChip('batteryVolt', 'fas fa-bolt', 'batteryVoltage');
    
    // Pressure chip with translation key
    const pressureChip = createDataChip('pressure', 'fas fa-compress-alt', 'pressure');
    
    // Window chip with translation key
    const windowChip = createDataChip('window', 'fas fa-window-maximize', 'window', '');
    
    // Add all chips to the container
    dataContainer.appendChild(tempChip);
    dataContainer.appendChild(weatherPill);
    dataContainer.appendChild(lightChip);
    dataContainer.appendChild(batteryChip);
    dataContainer.appendChild(batteryVoltChip);
    dataContainer.appendChild(pressureChip);
    dataContainer.appendChild(windowChip);
    
    return dataContainer;
}

/**
 * Creates a date chip element
 * @param {string} range - The date range value
 * @param {string} key - The translation key for the text
 * @param {string} defaultText - The default text to display if no translation available
 * @returns {HTMLElement} The date chip element
 */
function createDateChip(range, key, defaultText) {
    const chip = document.createElement('a');
    chip.href = '#';
    chip.className = 'date-chip';
    chip.dataset.range = range;
    
    // Use i18n for text if available
    chip.textContent = window.i18n && typeof window.i18n.__ === 'function' ? 
        window.i18n.__(key) : defaultText;
    
    // Add data-i18n attribute for later translation updates
    chip.setAttribute('data-i18n', key);
    
    return chip;
}

/**
 * Creates the date ranges container with all date chips
 * @returns {HTMLElement} The date ranges container element
 */
function createDateRanges() {
    const dateRanges = document.createElement('div');
    dateRanges.className = 'date-ranges';
    
    // Create all date chips with translation keys and default text
    const dateChips = [
        { range: 'today', key: 'today', defaultText: 'i dag' },
        { range: '1', key: 'twoDay', defaultText: '2d' },
        { range: '2', key: 'threeDay', defaultText: '3d' },
        { range: '6', key: 'sevenDay', defaultText: '7d' },
        { range: '13', key: 'fourteenDay', defaultText: '14d' },
        { range: 'yesterday', key: 'yesterday', defaultText: 'i går' },
        { range: 'this-week', key: 'week', defaultText: 'uke' },
        { range: 'last-week', key: 'lastWeek', defaultText: 'uke-1' },
        { range: 'start', key: 'start', defaultText: 'start' }
    ];
    
    // Add all chips to the container
    dateChips.forEach(chip => {
        dateRanges.appendChild(createDateChip(chip.range, chip.key, chip.defaultText));
    });
    
    return dateRanges;
}

/**
 * Creates the search container with sorting and results options
 * @returns {HTMLElement} The search container element
 */
function createSearchContainer() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    
    // Create sort container
    const sortContainer = document.createElement('div');
    sortContainer.className = 'sort-container';
    
    const sortSelect = document.createElement('select');
    sortSelect.id = 'sortSelect';
    
    // Use i18n for title if available
    sortSelect.title = window.i18n && typeof window.i18n.__ === 'function' ? 
        window.i18n.__('sortBy') : 'Sorter etter kategori';
    sortSelect.setAttribute('data-i18n-title', 'sortBy');
    
    const sortOptions = [
        { value: 'row', key: 'default' },
        { value: 'temperature', key: 'temperatureSort' },
        { value: 'humidity', key: 'humiditySort' },
        { value: 'weather', key: 'weatherSort' },
        { value: 'system', key: 'systemSort' },
        { value: 'soil', key: 'soilSort' },
        { value: 'light', key: 'lightSort' },
        { value: 'structure', key: 'structureSort' }
    ];
    
    sortOptions.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        
        // Use i18n for option text if available
        optionEl.textContent = window.i18n && typeof window.i18n.__ === 'function' ? 
            window.i18n.__(option.key) : option.key;
        
        // Add data-i18n attribute for later translation updates
        optionEl.setAttribute('data-i18n', option.key);
        
        sortSelect.appendChild(optionEl);
    });
    
    sortContainer.appendChild(sortSelect);
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'results-container';
    
    const resultsInput = document.createElement('input');
    resultsInput.type = 'number';
    resultsInput.id = 'resultsInput';
    
    // Use i18n for placeholder if available
    resultsInput.placeholder = window.i18n && typeof window.i18n.__ === 'function' ? 
        window.i18n.__('results') : 'Resultater';
    resultsInput.setAttribute('data-i18n-placeholder', 'results');
    resultsInput.min = '1';
    
    const updateButton = document.createElement('button');
    updateButton.id = 'updateButton';
    
    // Use i18n for button text if available
    updateButton.textContent = window.i18n && typeof window.i18n.__ === 'function' ? 
        window.i18n.__('update') : 'Oppdater';
    updateButton.setAttribute('data-i18n', 'update');
    
    const darkModeToggle = document.createElement('button');
    darkModeToggle.id = 'darkModeToggle';
    
    // Use i18n for tooltip if available
    darkModeToggle.title = window.i18n && typeof window.i18n.__ === 'function' ? 
        window.i18n.__('darkModeTooltip') : 'Bytt mellom mørk og lys modus';
    darkModeToggle.setAttribute('data-i18n-title', 'darkModeTooltip');
    
    const darkModeIcon = document.createElement('span');
    darkModeIcon.className = 'icon';
    darkModeIcon.innerHTML = '<i class="fas fa-moon"></i>';
    
    const statsToggle = document.createElement('button');
    statsToggle.id = 'statsToggle';
    
    // Use i18n for tooltip if available
    statsToggle.title = window.i18n && typeof window.i18n.__ === 'function' ? 
        window.i18n.__('statsTooltip') : 'Vis/skjul statistikker';
    statsToggle.setAttribute('data-i18n-title', 'statsTooltip');
    
    const statsIcon = document.createElement('span');
    statsIcon.className = 'icon';
    statsIcon.innerHTML = '<i class="fas fa-chart-line"></i>';
    
    darkModeToggle.appendChild(darkModeIcon);
    statsToggle.appendChild(statsIcon);
    
    resultsContainer.appendChild(resultsInput);
    resultsContainer.appendChild(updateButton);
    resultsContainer.appendChild(darkModeToggle);
    resultsContainer.appendChild(statsToggle);
    
    searchContainer.appendChild(sortContainer);
    searchContainer.appendChild(resultsContainer);
    
    return searchContainer;
}

/**
 * Creates the complete header element with all components
 * @returns {HTMLElement} The complete header element
 */
function createHeader() {
    const header = document.createElement('header');
    header.className = 'header modern-header';
    
    header.appendChild(createLogoContainer());
    header.appendChild(createDataContainer());
    header.appendChild(createDateRanges());
    header.appendChild(createSearchContainer());
    
    return header;
}
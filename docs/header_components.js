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
    
    const timeSpan = document.createElement('span');
    timeSpan.id = 'time-since';
    timeSpan.textContent = 'Laster...';
    
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
function createDataChip(id, iconClass, title, initialText = 'Laster...') {
    const dataChip = document.createElement('div');
    dataChip.className = 'data-chip';
    dataChip.title = title;
    
    if (iconClass) {
        const icon = document.createElement('i');
        icon.className = `${iconClass} mr-1`;
        dataChip.appendChild(icon);
    }
    
    const span = document.createElement('span');
    span.id = id;
    span.textContent = initialText;
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
    metLink.title = 'Ute Temperatur (yr.no)';
    
    const metTemp = document.createElement('span');
    metTemp.id = 'met-temp';
    metTemp.textContent = 'Laster...';
    
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
    
    // Temperature chip
    const tempChip = createDataChip('temperature', 'fas fa-thermometer-half', 'Drivhus Temperatur');
    
    // Weather pill
    const weatherPill = createWeatherPill();
    
    // Light chip
    const lightChip = createDataChip('light', 'fas fa-sun', 'Lysnivå', '');
    
    // Battery percentage chip
    const batteryChip = createDataChip('battery', 'fas fa-battery-half', 'Batteri Prosent');
    
    // Battery voltage chip
    const batteryVoltChip = createDataChip('batteryVolt', 'fas fa-bolt', 'Batteri Spenning');
    
    // Pressure chip
    const pressureChip = createDataChip('pressure', 'fas fa-compress-alt', 'Lufttrykk');
    
    // Window chip
    const windowChip = createDataChip('window', 'fas fa-window-maximize', 'Vindusåpning', '');
    
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
 * @param {string} text - The text to display
 * @returns {HTMLElement} The date chip element
 */
function createDateChip(range, text) {
    const chip = document.createElement('a');
    chip.href = '#';
    chip.className = 'date-chip';
    chip.dataset.range = range;
    chip.textContent = text;
    
    return chip;
}

/**
 * Creates the date ranges container with all date chips
 * @returns {HTMLElement} The date ranges container element
 */
function createDateRanges() {
    const dateRanges = document.createElement('div');
    dateRanges.className = 'date-ranges';
    
    // Create all date chips
    const dateChips = [
        { range: 'today', text: 'i dag' },
        { range: '1', text: '2d' },
        { range: '2', text: '3d' },
        { range: '6', text: '7d' },
        { range: '13', text: '14d' },
        { range: 'yesterday', text: 'i går' },
        { range: 'this-week', text: 'uke' },
        { range: 'last-week', text: 'uke-1' },
        { range: 'start', text: 'start' }
    ];
    
    // Add all chips to the container
    dateChips.forEach(chip => {
        dateRanges.appendChild(createDateChip(chip.range, chip.text));
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
    sortSelect.title = 'Sorter etter kategori';
    
    const sortOptions = [
        { value: 'row', text: 'Standard' },
        { value: 'temperature', text: 'Temperatur' },
        { value: 'humidity', text: 'Fuktighet' },
        { value: 'weather', text: 'Vær' },
        { value: 'system', text: 'System' },
        { value: 'soil', text: 'Jord' },
        { value: 'light', text: 'Lys' },
        { value: 'structure', text: 'Struktur' }
    ];
    
    sortOptions.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.text;
        sortSelect.appendChild(optionEl);
    });
    
    sortContainer.appendChild(sortSelect);
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'results-container';
    
    const resultsInput = document.createElement('input');
    resultsInput.type = 'number';
    resultsInput.id = 'resultsInput';
    resultsInput.placeholder = 'Resultater';
    resultsInput.min = '1';
    
    const updateButton = document.createElement('button');
    updateButton.id = 'updateButton';
    updateButton.textContent = 'Oppdater';
    
    const darkModeToggle = document.createElement('button');
    darkModeToggle.id = 'darkModeToggle';
    darkModeToggle.title = 'Bytt mellom mørk og lys modus';
    
    const darkModeIcon = document.createElement('span');
    darkModeIcon.className = 'icon';
    darkModeIcon.innerHTML = '<i class="fas fa-moon"></i>';
    
    const statsToggle = document.createElement('button');
    statsToggle.id = 'statsToggle';
    statsToggle.title = 'Vis/skjul statistikker';
    
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
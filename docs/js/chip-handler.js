window.getStatusFromThreshold = function(value, thresholdConfig, type = 'statuses') {
    let ranges;
    if (type === 'statuses') {
        ranges = thresholdConfig.statusRanges;
    } else if (type === 'icons') {
        ranges = thresholdConfig.iconRanges;
    } else if (type === 'texts') {
        ranges = thresholdConfig.textRanges;
    } else {
        throw new Error(`Invalid type: ${type}. Must be 'statuses', 'icons', or 'texts'`);
    }
    
    const results = thresholdConfig[type];
    
    if (!ranges) {
        throw new Error(`Invalid threshold config: missing ${type}Ranges property`);
    }
    
    if (!results) {
        throw new Error(`Invalid threshold config: missing ${type} property`);
    }
    
    if (results.length !== ranges.length + 1) {
        throw new Error(`Invalid threshold config: ${results.length} ${type} but ${ranges.length} ranges. Must be n+1.`);
    }
    
    for (let i = 0; i < ranges.length; i++) {
        if (value < ranges[i]) {
            return results[i];
        }
    }
    
    return results[results.length - 1];
};

window.ChipHandler = (function() {
    let chipElements = {};
    let latestChipData = {};
    function createChip(chipKey, config) {
        let chip;
        let valueSpan;
        let iconElement = null;
        if (chipKey === 'weather') {
            chip = createWeatherChip(config);
            valueSpan = chip.querySelector('#met-temp');
            iconElement = chip.querySelector('.weather-icon');
        } else if (chipKey === 'sunEvents') {
            chip = createSunEventsChip(config);
            valueSpan = chip.querySelector('#next-event-time');
            iconElement = chip.querySelector('#moon-phase-icon');
        } else {
            chip = document.createElement('div');
            chip.className = config.containerClass;
            
            if (config.hasIcon) {
                const icon = document.createElement('i');
                icon.className = 'fas fa-question mr-1';
                chip.appendChild(icon);
                iconElement = icon;
            }
            
            valueSpan = document.createElement('span');
            valueSpan.id = config.elementId;
            valueSpan.textContent = window.I18n.translate('loading');
            valueSpan.setAttribute('data-i18n', 'loading');
            chip.appendChild(valueSpan);
        }
        
        if (config.hasTooltip && config.tooltipKey) {
            const tooltipText = window.I18n.translate(config.tooltipKey);
            chip.setAttribute('data-tooltip-content', tooltipText);
            chip.setAttribute('data-has-tooltip', 'true');
            chip.setAttribute('data-i18n-title', config.tooltipKey);
        }
        
        chipElements[chipKey] = {
            container: chip,
            valueElement: valueSpan,
            iconElement: iconElement
        };
        
        return chip;
    }
    
    function createWeatherChip(config) {
        const chip = document.createElement('div');
        chip.className = config.containerClass;
        chip.id = 'met-link';

        const weatherIcon = document.createElement('div');
        weatherIcon.className = 'weather-icon';
        weatherIcon.id = 'weather-icon-container';
        weatherIcon.innerHTML = `<svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="9" fill="transparent" stroke="#666" stroke-width="0.5" />
        </svg>`;

        const temperatureDisplay = document.createElement('div');
        temperatureDisplay.className = 'weather-temp-display';

        const metTemp = document.createElement('span');
        metTemp.id = config.elementId;
        metTemp.textContent = window.I18n.translate('loading');
        metTemp.setAttribute('data-i18n', 'loading');

        temperatureDisplay.appendChild(metTemp);
        chip.appendChild(weatherIcon);
        chip.appendChild(temperatureDisplay);

        return chip;
    }
    
    function createSunEventsChip(config) {
        const chip = document.createElement('div');
        chip.className = config.containerClass;
        chip.id = config.elementId;
        
        const moonPhaseIcon = document.createElement('div');
        moonPhaseIcon.className = 'moon-phase-icon';
        moonPhaseIcon.id = 'moon-phase-icon';
        moonPhaseIcon.innerHTML = `<svg viewBox="0 0 20 20" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="9" fill="#222" stroke="#666" stroke-width="0.5" />
        </svg>`;
        
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'sun-event-time';
        
        const nextEventTime = document.createElement('span');
        nextEventTime.id = 'next-event-time';
        nextEventTime.textContent = '--:--';
        
        const remainingTime = document.createElement('span');
        remainingTime.id = 'remaining-time';
        remainingTime.className = 'remaining-time';
        remainingTime.textContent = '';
        
        timeDisplay.appendChild(nextEventTime);
        timeDisplay.appendChild(remainingTime);
        chip.appendChild(moonPhaseIcon);
        chip.appendChild(timeDisplay);
        
        chip.setAttribute('data-has-tooltip', 'true');
        
        return chip;
    }
    
    function updateChip(chipKey, config, data) {
        const elements = chipElements[chipKey];
        if (!elements) return;
        
        if (config.customUpdate && config.updateFunction) {
            try {
                if (typeof window[config.updateFunction] === 'function') {
                    window[config.updateFunction]();
                } else {
                    const funcPath = config.updateFunction.split('.');
                    let func = window;
                    for (const part of funcPath) {
                        func = func[part];
                    }
                    if (typeof func === 'function') {
                        func();
                    }
                }
            } catch (error) {
                console.warn(`Failed to call custom update function for ${chipKey}:`, error);
            }
            return;
        }
        
        let value;
        if (chipKey === 'weather') {
            if (!window.latestWeatherData || !window.latestWeatherData.properties) return;
            const details = window.latestWeatherData.properties.timeseries[0].data.instant.details;
            value = Math.round(details.air_temperature * 10) / 10;
        } else {
            value = data[config.dataKey];
            if (value === null || value === undefined) return;
        }
        
        latestChipData[chipKey] = value;
        
        if (chipKey === 'timeChip') {
            const createdDate = new Date(latestChipData.createdAt || data.createdAt);
            elements.valueElement.textContent = createdDate.toLocaleTimeString('no-NO', {
                hour: '2-digit',
                minute: '2-digit'
            });
            elements.valueElement.setAttribute('data-timestamp', createdDate.toISOString());
        } else if (config.hasText) {
            const textValue = window.getStatusFromThreshold(value, config.thresholds, 'texts');
            elements.valueElement.innerHTML = window.I18n.translate(textValue);
        } else if (chipKey === 'waterLevel') {
            // Show next tide time instead of water level
            elements.valueElement.innerHTML = latestChipData.nextTideTime || '--:--';
        } else {
            elements.valueElement.innerHTML = `${value} ${config.unit}`;
        }
        
        if (config.hasStatus) {
            const statusClass = window.getStatusFromThreshold(value, config.thresholds, 'statuses');
            elements.container.className = `${config.containerClass} ${statusClass}`;
        } else {
            elements.container.className = config.containerClass;
        }
        
        if (config.hasIcon && elements.iconElement) {
            let iconName;
            if (config.fixedIcon) {
                iconName = config.fixedIcon;
            } else if (chipKey === 'waterLevel') {
                // Use trend-based water icons
                const trend = latestChipData.waterLevelTrend;
                let iconSrc;
                if (trend === 'RISING') {
                    iconSrc = 'img/water-rising.svg';
                } else if (trend === 'FALLING') {
                    iconSrc = 'img/water-falling.svg';
                } else {
                    iconSrc = 'img/water-stable.svg';
                }
                
                // Replace the FontAwesome icon with SVG image
                elements.iconElement.className = 'mr-1';
                elements.iconElement.innerHTML = `<img src="${iconSrc}" width="16" height="16" alt="Water level trend" />`;
                return;
            } else if (chipKey === 'pressure') {
                // Use pressure-specific icons based on value thresholds
                const statusClass = window.getStatusFromThreshold(value, config.thresholds, 'statuses');
                let iconSrc;
                if (statusClass === 'high-pressure') {
                    iconSrc = 'img/pressure-high.svg';
                } else if (statusClass === 'low-pressure') {
                    iconSrc = 'img/pressure-low.svg';
                } else {
                    iconSrc = 'img/pressure-stable.svg';
                }
                
                // Replace the FontAwesome icon with SVG image
                elements.iconElement.className = 'mr-1';
                elements.iconElement.innerHTML = `<img src="${iconSrc}" width="16" height="16" alt="Air pressure" />`;
                return;
            } else {
                iconName = window.getStatusFromThreshold(value, config.thresholds, 'icons');
            }
            elements.iconElement.className = `fas fa-${iconName} mr-1`;
        }
        
        if (config.hasTooltip) {
            if (config.customTooltip) {
                updateCustomTooltip(chipKey, config, value);
            } else {
                const tooltipText = window.I18n.translate(config.tooltipKey);
                elements.container.setAttribute('data-tooltip-content', tooltipText);
            }
        }
    }
    
    function updateCustomTooltip(chipKey, config, value) {
        const elements = chipElements[chipKey];
        if (!elements) return;
        
        let tooltipData = {};
        
        switch (chipKey) {
            case 'battery':
                tooltipData = {
                    [window.I18n.translate('battery')]: `${value}%`,
                    [window.I18n.translate('batteryVoltage')]: `${latestChipData.batteryVolt || window.latestData?.batteryVolt || 0}V`
                };
                break;
                
            case 'window':
                const windowText = window.getStatusFromThreshold(value, config.thresholds, 'texts');
                const displayWindowState = window.I18n.translate(windowText);
                tooltipData = {
                    [window.I18n.translate('window')]: `${value}mm`,
                    [window.I18n.translate('status')]: displayWindowState
                };
                break;
                
            case 'light':
                const lightText = window.getStatusFromThreshold(value, config.thresholds, 'texts');
                const displayLightState = window.I18n.translate(lightText);
                tooltipData = {
                    [window.I18n.translate('ceiling')]: `${value} lux`,
                    [window.I18n.translate('light')]: displayLightState
                };
                break;
                
            case 'timeChip':
                const timeTooltipData = {};
                
                const drimonLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.DRIMON_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.DRIMON_CHANNEL.id})`;
                const tempLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.TEMP_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.TEMP_CHANNEL.id})`;
                const techLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.TECH_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.TECH_CHANNEL.id})`;
                const extLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.EXT_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.EXT_CHANNEL.id})`;

                if (window.latestData1) {
                    timeTooltipData[drimonLabel] = window.latestData1.lastUpdated;
                }
                if (window.latestData2) {
                    timeTooltipData[tempLabel] = window.latestData2.lastUpdated;
                }
                if (window.latestData3) {
                    timeTooltipData[techLabel] = window.latestData3.lastUpdated;
                }
                if (window.latestData4) {
                    timeTooltipData[extLabel] = window.latestData4.lastUpdated;
                }
                
                timeTooltipData[window.I18n.translate('localTime')] = window.moment().format('L LTS');
                
                if (window.latestWeatherData && window.latestWeatherData.properties) {
                    const weatherData = window.latestWeatherData.properties;
                    
                    if (weatherData.timeseries && weatherData.timeseries.length > 0) {
                        timeTooltipData[window.I18n.translate('forecastTime')] = window.moment(weatherData.timeseries[0].time).format('L LTS');
                    }
                    
                    if (weatherData.meta?.updated_at) {
                        timeTooltipData[window.I18n.translate('nowcastUpdated')] = window.moment(weatherData.meta.updated_at).format('L LTS');
                    }
                }
                
                if (window.latestForecastData && window.latestForecastData._lastUpdated) {
                    timeTooltipData[window.I18n.translate('forecastUpdated')] = window.moment(window.latestForecastData._lastUpdated).format('L LTS');
                }

                const updateTimeData = {
                    [window.I18n.translate('time')]: latestChipData.timeSince || window.latestData?.timeSince
                };
                
                tooltipData = { ...updateTimeData, ...timeTooltipData };
                break;
                
            case 'waterLevel':
                const observedLevel = latestChipData.waterLevelObserved || 0;
                const predictedLevel = latestChipData.waterLevelPredicted || 0;
                const weatherEffect = latestChipData.weatherEffect || 0;
                const forecastLevel = latestChipData.waterLevelForecast || 0;
                const cdLevel = value + 55.0;
                
                const nextHighTides = latestChipData.nextHighTides || [];
                const nextLowTides = latestChipData.nextLowTides || [];
                const trendConstant = latestChipData.waterLevelTrend;
                const trend = trendConstant === 'RISING' ? window.I18n.translate('waterLevelRising') :
                              trendConstant === 'FALLING' ? window.I18n.translate('waterLevelFalling') :
                              window.I18n.translate('waterLevelStable');
                const lastUpdated = latestChipData.waterLevelUpdated || '--:--';
                const waterLevelName = latestChipData.waterLevelName;
                
                
                tooltipData = {};
                
                // Add water level name at the top if it exists
                if (waterLevelName) {
                    tooltipData[waterLevelName] = undefined;
                }
                
                Object.assign(tooltipData, {
                    [`${window.I18n.translate('waterLevel')}:`]: `${value} cm (kart: ${cdLevel.toFixed(0)})`,
                    [`${window.I18n.translate('waterLevelTrend')}:`]: trend,
                    [window.I18n.translate('waterLevelNextHighTide')]: undefined
                });
                
                // Add high tide entries
                if (nextHighTides.length > 0) {
                    nextHighTides.slice(0, 3).forEach(tide => {
                        tooltipData[`  ${tide.time}`] = `${tide.level} cm`;
                    });
                } else {
                    tooltipData[`  ${window.I18n.translate('noData')}`] = undefined;
                }
                
                tooltipData[window.I18n.translate('waterLevelNextLowTide')] = undefined;
                
                // Add low tide entries  
                if (nextLowTides.length > 0) {
                    nextLowTides.slice(0, 3).forEach(tide => {
                        tooltipData[`  ${tide.time}`] = `${tide.level} cm`;
                    });
                } else {
                    tooltipData[`  ${window.I18n.translate('noData')}`] = undefined;
                }
                
                // Add detailed data section
                Object.assign(tooltipData, {
                    [window.I18n.translate('waterLevelDetailedData')]: undefined,
                    [`${window.I18n.translate('waterLevelPredicted')}:`]: `${predictedLevel.toFixed(1)} cm`,
                    [`${window.I18n.translate('waterLevelObserved')}:`]: `${observedLevel.toFixed(1)} cm`,
                    [`${window.I18n.translate('waterLevelWeatherEffect')}:`]: `${weatherEffect >= 0 ? '+' : ''}${weatherEffect.toFixed(1)} cm`,
                    [`${window.I18n.translate('waterLevelForecast')}:`]: `${forecastLevel.toFixed(1)} cm`,
                    [`${window.I18n.translate('waterLevelLastUpdated')}:`]: lastUpdated
                });
                break;
                
            default:
                tooltipData = {
                    [window.I18n.translate(config.tooltipKey)]: `${value} ${config.unit}`
                };
        }
        
        const tooltipText = window.Utils.formatTabularTooltip(tooltipData, { useHTML: true, skipEmptyValues: false });
        
        elements.container.setAttribute('data-tooltip-content', tooltipText);
    }
    
    function createChipsForView(view) {
        const chips = window.getChipsForView(view);
        const createdChips = [];
        
        chips.forEach(({ key, config }) => {
            const chipElement = createChip(key, config);
            createdChips.push({
                key,
                element: chipElement,
                config
            });
        });
        
        return createdChips;
    }
    
    function updateAllChips(data) {
        if (data) {
            Object.assign(latestChipData, data);
        }
        
        window.getAllChipKeys().forEach(chipKey => {
            try {
                const config = window.getChipConfig(chipKey);
                updateChip(chipKey, config, latestChipData);
            } catch (error) {
                console.warn(`Failed to update chip ${chipKey}:`, error);
            }
        });
    }
    
    function updateChipsForLanguageChange() {
        window.getAllChipKeys().forEach(chipKey => {
            try {
                const config = window.getChipConfig(chipKey);
                const elements = chipElements[chipKey];
                
                if (!elements) return;
                
                if (config.hasTooltip && config.tooltipKey) {
                    const tooltipText = window.I18n.translate(config.tooltipKey);
                    elements.container.setAttribute('data-tooltip-content', tooltipText);
                }
                
                if (latestChipData[config.dataKey] !== undefined) {
                    updateChip(chipKey, config, latestChipData);
                }
            } catch (error) {
                console.warn(`Failed to update chip ${chipKey} for language change:`, error);
            }
        });
    }
    
    function getChipElements(chipKey) {
        return chipElements[chipKey] || null;
    }
    
    function initialize() {
        document.addEventListener('languageChanged', updateChipsForLanguageChange);
    }
    
    return {
        createChip,
        createChipsForView,
        
        updateChip,
        updateAllChips,
        updateChipsForLanguageChange,
        
        getChipElements,
        initialize,
        
        get latestData() { return { ...latestChipData }; }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    window.ChipHandler.initialize();
});
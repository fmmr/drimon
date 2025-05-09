/**
 * Sun Events Module
 * 
 * Simple utilities for calculating and displaying astronomical events
 * using the SunCalc library.
 */

// Store astronomical data globally
window.SunEvents = (function() {
    // Coordinates for Rødtangen, Norway
    const LOCATION = {
        lat: 59.532221,
        lng: 10.418494
    };
    
    // Moon phase names
    const MOON_PHASES = {
        'NEW': { key: 'newMoon', range: [0, 0.02, 0.98, 1] },
        'WAXING_CRESCENT': { key: 'waxingCrescent', range: [0.02, 0.25] },
        'FIRST_QUARTER': { key: 'firstQuarter', range: [0.25, 0.27] },
        'WAXING_GIBBOUS': { key: 'waxingGibbous', range: [0.27, 0.48] },
        'FULL': { key: 'fullMoon', range: [0.48, 0.52] },
        'WANING_GIBBOUS': { key: 'waningGibbous', range: [0.52, 0.75] },
        'LAST_QUARTER': { key: 'lastQuarter', range: [0.75, 0.77] },
        'WANING_CRESCENT': { key: 'waningCrescent', range: [0.77, 0.98] }
    };
    
    // Cache for astronomical data - cleared at midnight
    let cachedData = null;
    let cacheDate = null;
    
    /**
     * Get astronomical data for the current day
     * @returns {Object} Object with sunrise, sunset, moonrise, moonset, etc.
     */
    function getAstronomicalData() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Check if we need to refresh cache (new day or no cache)
        if (!cachedData || !cacheDate || cacheDate.getTime() !== today.getTime()) {
            // Calculate sun times
            const sunTimes = SunCalc.getTimes(now, LOCATION.lat, LOCATION.lng);
            
            // Calculate moon times and illumination
            const moonTimes = SunCalc.getMoonTimes(now, LOCATION.lat, LOCATION.lng);
            const moonIllumination = SunCalc.getMoonIllumination(now);
            
            // Generate moon phase svg
            const moonPhaseSvg = generateMoonPhaseSvg(moonIllumination);
            
            // Calculate day and night length
            const dayLengthMs = sunTimes.sunset.getTime() - sunTimes.sunrise.getTime();
            const dayLengthMinutes = Math.round(dayLengthMs / 60000);
            const dayLengthHours = Math.floor(dayLengthMinutes / 60);
            const dayLengthRemainingMinutes = dayLengthMinutes % 60;
            
            const nightLengthMs = (24 * 60 * 60 * 1000) - dayLengthMs;
            const nightLengthMinutes = Math.round(nightLengthMs / 60000);
            const nightLengthHours = Math.floor(nightLengthMinutes / 60);
            const nightLengthRemainingMinutes = nightLengthMinutes % 60;
            
            // Will be formatted correctly when displayed, store the raw values
            const dayLengthFormatted = {
                hours: dayLengthHours,
                minutes: dayLengthRemainingMinutes
            };
            
            const nightLengthFormatted = {
                hours: nightLengthHours,
                minutes: nightLengthRemainingMinutes
            };
            
            // Create data structure
            cachedData = {
                sun: {
                    sunrise: sunTimes.sunrise,
                    sunset: sunTimes.sunset,
                    dawn: sunTimes.dawn,
                    dusk: sunTimes.dusk,
                    dayLength: dayLengthFormatted,
                    nightLength: nightLengthFormatted
                },
                moon: {
                    rise: moonTimes.rise,
                    set: moonTimes.set,
                    illumination: moonIllumination.fraction,
                    phase: moonIllumination.phase,
                    phaseSvg: moonPhaseSvg
                }
            };
            
            // Update cache date
            cacheDate = today;
        }
        
        return cachedData;
    }
    
    /**
     * Get the next event (sunrise or sunset)
     * @returns {Object} Next event information
     */
    function getNextEvent() {
        const now = new Date();
        const data = getAstronomicalData();
        
        // Prepare return structure
        const result = {
            type: null,        // 'sunrise' or 'sunset'
            time: null,        // Date object of the event
            timeFormatted: '', // Formatted time (HH:MM)
            remaining: '',     // Remaining time as text
            remainingMin: 0    // Remaining minutes
        };
        
        // Determine if sunrise or sunset is next
        if (data.sun.sunrise > now) {
            result.type = 'sunrise';
            result.time = data.sun.sunrise;
        } else if (data.sun.sunset > now) {
            result.type = 'sunset';
            result.time = data.sun.sunset;
        } else {
            // Both sunrise and sunset have passed, get tomorrow's sunrise
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowTimes = SunCalc.getTimes(tomorrow, LOCATION.lat, LOCATION.lng);
            
            // Also update the cached data to include tomorrow's times
            // This ensures the tooltip matches the displayed next event
            if (cachedData) {
                // Store tomorrow's sunrise in the tooltip data
                cachedData.nextDaySunrise = tomorrowTimes.sunrise;
            }
            
            result.type = 'sunrise';
            result.time = tomorrowTimes.sunrise;
        }
        
        // Format time
        result.timeFormatted = formatTime(result.time);
        
        // Calculate remaining time
        const diffMs = result.time - now;
        const diffMin = Math.round(diffMs / 60000);
        const diffHours = diffMin / 60;
        
        result.remainingMin = diffMin;
        
        // Format remaining time (in hours with one decimal + appropriate language symbol)
        const hoursFormatted = diffHours.toFixed(1);
        
        // Get the language-specific hour symbol ("t" for Norwegian, "h" for English and Spanish)
        const hourSymbol = window.I18n.translate('hourSymbol');
        
        result.remaining = `${hoursFormatted}${hourSymbol}`;
        
        return result;
    }
    
    /**
     * Format a date object as HH:MM
     * @param {Date} date - Date to format
     * @returns {string} Formatted time
     */
    function formatTime(date) {
        if (!date) return '--:--';
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${hours}:${minutes}`;
    }
    
    /**
     * Generate SVG for moon phase visualization using pre-defined moon phase icons
     * @param {Object} illumination - Moon illumination data from SunCalc
     * @returns {string} SVG string
     */
    function generateMoonPhaseSvg(illumination) {
        const phase = illumination.phase; // 0 to 1 (0=new, 0.5=full, 1=new)
        
        // SVG parameters
        const size = 20;
        
        // Use a predefined set of moon phase SVGs that are known to work well
        // We'll use 8 distinct moon phases
        
        // For simplicity, determine which of 8 standard moon phases to show
        let phaseIndex = Math.round(phase * 8) % 8;
        if (phaseIndex === 8) phaseIndex = 0; // Handle edge case
        
        // Phase names for reference:
        // 0: New Moon
        // 1: Waxing Crescent
        // 2: First Quarter
        // 3: Waxing Gibbous
        // 4: Full Moon
        // 5: Waning Gibbous
        // 6: Last Quarter
        // 7: Waning Crescent
        
        // Simple, reliable moon phase SVGs
        const moonPhases = [
            // 0: New Moon - dark circle
            `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="#333333" stroke="#666666" stroke-width="0.5" />
            </svg>`,
            
            // 1: Waxing Crescent - right side lit a bit
            `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="#333333" stroke="#666666" stroke-width="0.5" />
                <path d="M ${size/2} ${2} A ${size/2-2} ${size/2-2} 0 0 1 ${size/2} ${size-2} A ${(size/2-2)*0.8} ${size/2-2} 0 0 0 ${size/2} ${2} Z" fill="#F8F8F8" />
            </svg>`,
            
            // 2: First Quarter - right half lit
            `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="#333333" stroke="#666666" stroke-width="0.5" />
                <path d="M ${size/2} ${2} A ${size/2-2} ${size/2-2} 0 0 1 ${size/2} ${size-2} A ${0} ${size/2-2} 0 0 0 ${size/2} ${2} Z" fill="#F8F8F8" />
            </svg>`,
            
            // 3: Waxing Gibbous - right side more than half lit
            `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="#F8F8F8" stroke="#666666" stroke-width="0.5" />
                <path d="M ${size/2} ${2} A ${size/2-2} ${size/2-2} 0 0 0 ${size/2} ${size-2} A ${(size/2-2)*0.8} ${size/2-2} 0 0 1 ${size/2} ${2} Z" fill="#333333" />
            </svg>`,
            
            // 4: Full Moon - fully lit
            `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="#F8F8F8" stroke="#666666" stroke-width="0.5" />
            </svg>`,
            
            // 5: Waning Gibbous - left side more than half lit
            `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="#F8F8F8" stroke="#666666" stroke-width="0.5" />
                <path d="M ${size/2} ${2} A ${size/2-2} ${size/2-2} 0 0 1 ${size/2} ${size-2} A ${(size/2-2)*0.8} ${size/2-2} 0 0 0 ${size/2} ${2} Z" fill="#333333" />
            </svg>`,
            
            // 6: Last Quarter - left half lit
            `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="#333333" stroke="#666666" stroke-width="0.5" />
                <path d="M ${size/2} ${2} A ${size/2-2} ${size/2-2} 0 0 0 ${size/2} ${size-2} A ${0} ${size/2-2} 0 0 1 ${size/2} ${2} Z" fill="#F8F8F8" />
            </svg>`,
            
            // 7: Waning Crescent - left side lit a bit
            `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="#333333" stroke="#666666" stroke-width="0.5" />
                <path d="M ${size/2} ${2} A ${size/2-2} ${size/2-2} 0 0 0 ${size/2} ${size-2} A ${(size/2-2)*0.8} ${size/2-2} 0 0 1 ${size/2} ${2} Z" fill="#F8F8F8" />
            </svg>`
        ];
        
        return moonPhases[phaseIndex];
    }
    
    /**
     * Get descriptive text for moon phase
     * @param {Object} illumination - Moon illumination data from SunCalc
     * @returns {Object} Phase key for translation and phase value (0-1)
     */
    function getMoonPhaseText(illumination) {
        const phase = illumination.phase;
        
        // Find matching phase range
        for (const [phaseName, phaseData] of Object.entries(MOON_PHASES)) {
            const range = phaseData.range;
            
            if (range.length === 2) {
                // Simple range check
                if (phase >= range[0] && phase < range[1]) {
                    return { key: phaseData.key, value: phase };
                }
            } else if (range.length === 4) {
                // Special case for NEW_MOON which wraps around
                if ((phase >= range[0] && phase < range[1]) || 
                    (phase >= range[2] && phase <= range[3])) {
                    return { key: phaseData.key, value: phase };
                }
            }
        }
        
        // Default to waxing crescent if no match found
        return { key: 'waxingCrescent', value: phase };
    }
    
    /**
     * Update the sun events chip with current data
     */
    function updateSunEventsChip() {
        const chip = document.getElementById('sun-events-chip');
        if (!chip) return;
        
        // Get astronomical data and next event
        const data = getAstronomicalData();
        const nextEvent = getNextEvent();
        
        // Get moon phase text
        const moonPhase = getMoonPhaseText(data.moon);
        const moonPhaseName = window.I18n.translate(moonPhase.key);
        
        // Update moon phase icon
        const moonPhaseIcon = document.getElementById('moon-phase-icon');
        if (moonPhaseIcon) {
            moonPhaseIcon.innerHTML = data.moon.phaseSvg;
        }
        
        // Update next event time
        const nextEventTime = document.getElementById('next-event-time');
        if (nextEventTime) {
            nextEventTime.textContent = nextEvent.timeFormatted;
        }
        
        // Update remaining time
        const remainingTime = document.getElementById('remaining-time');
        if (remainingTime) {
            remainingTime.textContent = `(${nextEvent.remaining})`;
        }
        
        // Create tooltip content
        const tooltipContent = {
            // If next event is tomorrow's sunrise, use that instead of today's
            sunrise: nextEvent.type === 'sunrise' && data.nextDaySunrise ? 
                     formatTime(nextEvent.time) : formatTime(data.sun.sunrise),
            sunset: formatTime(data.sun.sunset),
            dusk: formatTime(data.sun.dusk),
            moonrise: formatTime(data.moon.rise),
            moonset: formatTime(data.moon.set),
            moonPhase: moonPhaseName,
            dayLength: data.sun.dayLength,
            nightLength: data.sun.nightLength
        };
        
        // Format tooltip text - without the heading
        let tooltipText = "";
        
        // Simple sunrise label
        tooltipText += `${window.I18n.translate('sunrise')}: ${tooltipContent.sunrise}\n`;
        tooltipText += `${window.I18n.translate('sunset')}: ${tooltipContent.sunset}\n`;
        tooltipText += `${window.I18n.translate('dusk')}: ${tooltipContent.dusk}\n`;
        // Format lengths with correct language symbol
        const hourSymbol = window.I18n.translate('hourSymbol');
        const dayLengthFormatted = `${data.sun.dayLength.hours}${hourSymbol} ${data.sun.dayLength.minutes}m`;
        const nightLengthFormatted = `${data.sun.nightLength.hours}${hourSymbol} ${data.sun.nightLength.minutes}m`;
        
        tooltipText += `${window.I18n.translate('dayLength')}: ${dayLengthFormatted}\n`;
        tooltipText += `${window.I18n.translate('nightLength')}: ${nightLengthFormatted}\n`;
        
        if (tooltipContent.moonrise && tooltipContent.moonset) {
            tooltipText += `${window.I18n.translate('moonrise')}: ${tooltipContent.moonrise}\n`;
            tooltipText += `${window.I18n.translate('moonset')}: ${tooltipContent.moonset}\n`;
        }
        
        // Add moon phase
        tooltipText += `${window.I18n.translate('moonPhase')}: ${moonPhaseName}`;
        
        // Store data for potential use by other components and our custom tooltip
        chip.dataset.tooltipContent = JSON.stringify(tooltipContent);
        chip.dataset.nextEvent = JSON.stringify(nextEvent);
    }
    
    // Initialize and set up the update cycle
    (function() {
        // Set up proper DOM event for lifecycle handling
        document.addEventListener('DOMContentLoaded', function() {
            // Initial update when DOM is ready
            updateSunEventsChip();
            
            // Schedule regular updates to keep time remaining accurate
            setInterval(updateSunEventsChip, 60000); // Every minute
        });
        
        // Listen for header initialization event
        document.addEventListener('header:initialized', function() {
            updateSunEventsChip();
        });
        
        // Update when language changes
        document.addEventListener('languageChanged', function() {
            updateSunEventsChip();
        });
    })();
    
    // Public API
    return {
        getAstronomicalData,
        getNextEvent,
        updateSunEventsChip,
        formatTime
    };
})();
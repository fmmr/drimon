// THRESHOLDS and getStatusFromThreshold moved to chip-config.js and chip-handler.js
// getElements function removed - ChipHandler manages chip elements directly

// Add an event listener for language changes
document.addEventListener('languageChanged', () => {
    // Update moment.js locale for proper date formatting
    if (window.moment && window.I18n) {
        const lang = window.I18n.getCurrentLanguage();
        const momentLocale = lang === 'no' ? 'nb' : lang;
        window.moment.locale(momentLocale);
    }
    
    // Update data chips with new language using unified ChipHandler
    window.ChipHandler.updateChipsForLanguageChange();
    
    // Update weather display if available
    if (typeof updateWeatherDisplay === 'function') {
        updateWeatherDisplay();
    }
    
    // Update any timestamp-based elements
    document.querySelectorAll('[data-timestamp]').forEach(el => {
        const timestamp = el.getAttribute('data-timestamp');
        if (timestamp && window.moment) {
            el.textContent = window.moment(timestamp).fromNow();
        }
    });
});

// Weather functions are now in weather.js

// Store the latest data values for re-use when language changes
// Expose globally so other components can access it
window.latestData = {
    // Initial values
    temperature: null,
    battery: null,
    batteryVolt: null,
    windowOpening: null,
    pressure: null,
    light: null,
    timeSince: null,
    lastUpdated: null,
    createdAt: null
};

// Local reference for the module
let latestData = window.latestData;

async function fetchData() {
    try {
        // ChipHandler manages chip elements - no need to check here
        
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const responses = await Promise.all([
            fetch(`https://api.thingspeak.com/channels/${window.THINGSPEAK.DRIMON_CHANNEL}/feeds/last.json?timezone=${timezone}&status=true`),
            fetch(`https://api.thingspeak.com/channels/${window.THINGSPEAK.TEMP_CHANNEL}/status/last.json?timezone=${timezone}`),
            fetch(`https://api.thingspeak.com/channels/${window.THINGSPEAK.TECH_CHANNEL}/status/last.json?timezone=${timezone}`),
            fetch(`https://api.thingspeak.com/channels/${window.THINGSPEAK.EXT_CHANNEL}/status/last.json?timezone=${timezone}`),
        ]);

        const [data1, data2, data3, data4] = await Promise.all(responses.map(response => response.json()));
        const statuses = [status(data1), status(data2), status(data3), status(data4)];
        const lastStatus = statuses.sort((a, b) => moment(b.date).diff(moment(a.date)))[0];

        latestData.temperature = Math.round(data1.field1 * 10) / 10;
        latestData.battery = Math.round(data1.field6 * 10) / 10;
        latestData.batteryVolt = Math.round(data1.field5 * 100) / 100;
        latestData.windowOpening = Math.round(data1.field4);
        latestData.pressure = Math.round(data1.field7);
        latestData.light = Math.round(data1.field8);
        
        latestData.createdAt = moment(lastStatus.date);
        latestData.lastUpdated = latestData.createdAt.format('L LTS');
        latestData.timeSince = latestData.createdAt.fromNow();
        
        // Store information from all channels for the expanded tooltip
        window.latestData = latestData;

        window.latestData1 = {
            createdAt: moment(data1.created_at),
            lastUpdated: moment(data1.created_at).format('L LTS')
        };

        // Create latestData2 for details channel (plants monitoring)
        window.latestData2 = {
            createdAt: moment(data2.created_at),
            lastUpdated: moment(data2.created_at).format('L LTS')
        };


        // Create latestData3 for tech channel (system monitoring)
        window.latestData3 = {
            createdAt: moment(data3.created_at),
            lastUpdated: moment(data3.created_at).format('L LTS')
        };

        // Create latestData34 for ext channel (system monitoring)
        window.latestData4 = {
            createdAt: moment(data4.created_at),
            lastUpdated: moment(data4.created_at).format('L LTS')
        };

        // Call the unified ChipHandler to update all chips
        window.ChipHandler.updateAllChips(latestData);
    } catch (error) {
        console.error('Error fetching data:', error);
        // No chip-specific error handling - let ChipHandler manage all chip state
    }
}

function status(data) {
    return {
        "date": data.created_at,
        "status": data.status
    };
}


// updateUIWithLatestData function removed - now handled by unified ChipHandler
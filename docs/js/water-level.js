/**
 * Water Level Management
 * 
 * Handles fetching and processing of tide/water level data from Kartverket APIs
 */

window.WaterLevel = (function() {
    const API_BASE = 'https://vannstand.kartverket.no/tideapi.php';
    const LAT = window.LOCATION.LAT;
    const LON = window.LOCATION.LON;
    
    // Water level thresholds (from locationlevels API)
    const WATER_LEVELS = {
        HAT: 29.2,     // Høyeste astronomiske tidevann
        MHW: 12.5,     // Middel høyvann
        MHWN: 9.6,     // Middel nipp høyvann
        MSL: 0.0,      // Middelvann
        CD: -55.0      // Chart datum offset
    };
    
    let latestWaterData = null;
    let dataCache = {
        timestamp: null,
        data: null
    };
    
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    function isCacheValid() {
        return dataCache.timestamp && 
               dataCache.data && 
               (Date.now() - dataCache.timestamp) < CACHE_DURATION;
    }
    
    function buildApiUrl(fromTime, toTime) {
        const params = new URLSearchParams({
            lat: LAT,
            lon: LON,
            fromtime: fromTime,
            totime: toTime,
            datatype: 'all',
            refcode: 'msl',
            place: '',
            file: '',
            lang: 'nb',
            interval: '10',
            dst: '0',
            tzone: '0',
            tide_request: 'locationdata'
        });
        
        return `${API_BASE}?${params.toString()}`;
    }
    
    function parseWaterLevelXML(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const observationData = xmlDoc.querySelector('data[type="observation"]');
        const predictionData = xmlDoc.querySelector('data[type="prediction"]');
        const forecastData = xmlDoc.querySelector('data[type="forecast"]');
        
        const observations = Array.from(observationData.querySelectorAll('waterlevel')).map(wl => ({
            value: parseFloat(wl.getAttribute('value')),
            time: new Date(wl.getAttribute('time')),
            flag: wl.getAttribute('flag')
        }));
        
        const predictions = Array.from(predictionData.querySelectorAll('waterlevel')).map(wl => ({
            value: parseFloat(wl.getAttribute('value')),
            time: new Date(wl.getAttribute('time')),
            flag: wl.getAttribute('flag')
        }));
        
        const forecasts = forecastData ? Array.from(forecastData.querySelectorAll('waterlevel')).map(wl => ({
            value: parseFloat(wl.getAttribute('value')),
            time: new Date(wl.getAttribute('time')),
            flag: wl.getAttribute('flag')
        })) : [];
        
        return { observations, predictions, forecasts };
    }
    
    function findTideExtremes(data, hours = 48) {
        const now = new Date();
        const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
        
        // Sort data by time and filter for future data
        const futureData = data
            .filter(point => point.time > now && point.time < endTime)
            .sort((a, b) => a.time - b.time);
        
        
        const extremes = [];
        
        // Simple approach: check each point against 3 neighbors on each side
        for (let i = 3; i < futureData.length - 3; i++) {
            const curr = futureData[i];
            
            // Check if this is a local maximum (high tide)
            const isHigh = futureData.slice(i-3, i+4).every((p, idx) => 
                idx === 3 || p.value <= curr.value
            );
            
            // Check if this is a local minimum (low tide)
            const isLow = futureData.slice(i-3, i+4).every((p, idx) => 
                idx === 3 || p.value >= curr.value
            );
            
            if (isHigh || isLow) {
                // Make sure we don't have duplicates too close together
                const lastExtreme = extremes[extremes.length - 1];
                const timeDiff = lastExtreme ? 
                    (curr.time.getTime() - lastExtreme.time.getTime()) / (1000 * 60 * 60) : 24;
                
                // Only add if it's at least 3 hours from the last extreme
                if (timeDiff >= 3) {
                    extremes.push({
                        type: isHigh ? 'high' : 'low',
                        value: curr.value,
                        time: curr.time
                    });
                    
                }
            }
        }
        
        return extremes;
    }
    
    function refineExtremeTimings(extremes) {
        const refined = [];
        const tolerance = 0.5; // cm
        
        for (let i = 0; i < extremes.length; i++) {
            const current = extremes[i];
            
            // Look for consecutive extremes of same type with similar values
            const sameTypeGroup = [current];
            let j = i + 1;
            
            while (j < extremes.length && 
                   extremes[j].type === current.type && 
                   Math.abs(extremes[j].value - current.value) <= tolerance) {
                sameTypeGroup.push(extremes[j]);
                j++;
            }
            
            if (sameTypeGroup.length > 1) {
                // Multiple similar extremes - take middle time
                const firstTime = sameTypeGroup[0].time.getTime();
                const lastTime = sameTypeGroup[sameTypeGroup.length - 1].time.getTime();
                const middleTime = new Date((firstTime + lastTime) / 2);
                
                refined.push({
                    type: current.type,
                    value: current.value,
                    time: middleTime
                });
                
                i = j - 1; // Skip the grouped extremes
            } else {
                refined.push(current);
            }
        }
        
        return refined;
    }
    
    function formatTideTime(date) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
        const tideDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const timeStr = date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
        
        if (tideDate.getTime() === today.getTime()) {
            return `${timeStr} i dag`;
        } else if (tideDate.getTime() === tomorrow.getTime()) {
            return `${timeStr} i morgen`;
        } else if (tideDate.getTime() === dayAfterTomorrow.getTime()) {
            return `${timeStr} i overmorgen`;
        } else {
            // For dates further out, show day of week
            const dayName = date.toLocaleDateString('nb-NO', { weekday: 'short' });
            return `${timeStr} ${dayName}`;
        }
    }
    
    function getWaterLevelName(waterLevel) {
        const levels = [
            { value: 216.9, key: 'waterLevelUpperEstimate' },
            { value: 176.8, key: 'waterLevel1000Year' },
            { value: 162.0, key: 'waterLevel200Year' },
            { value: 155.2, key: 'waterLevel100Year' },
            { value: 148.0, key: 'waterLevel50Year' },
            { value: 137.9, key: 'waterLevel20Year' },
            { value: 129.5, key: 'waterLevel10Year' },
            { value: 120.3, key: 'waterLevel5Year' },
            { value: 99.7, key: 'waterLevelAnnual' },
            { value: 29.2, key: 'waterLevelHighestAstronomical' },
            { value: 15.4, key: 'waterLevelMeanHighWaterSprings' },
            { value: 12.5, key: 'waterLevelMeanHighWater' },
            { value: 9.6, key: 'waterLevelMeanHighWaterNeaps' },
            { value: 0.0, key: 'waterLevelMeanSeaLevel' },
            { value: -9.6, key: 'waterLevelMeanLowWaterNeaps' },
            { value: -12.5, key: 'waterLevelMeanLowWater' },
            { value: -15.4, key: 'waterLevelMeanLowWaterSprings' },
            { value: -37.7, key: 'waterLevelLowestAstronomical' },
            { value: -57.7, key: 'waterLevelChartDatum' },
            { value: -71.4, key: 'waterLevelAnnualLow' },
            { value: -85.0, key: 'waterLevel5YearLow' },
            { value: -97.4, key: 'waterLevel20YearLow' }
        ];
        
        let closestLevel = levels[0];
        let minDifference = Math.abs(waterLevel - levels[0].value);
        
        for (const level of levels) {
            const difference = Math.abs(waterLevel - level.value);
            if (difference < minDifference) {
                minDifference = difference;
                closestLevel = level;
            }
        }
        
        return window.I18n.translate(closestLevel.key);
    }
    
    // Water level trend constants
    const TREND = {
        RISING: 'RISING',
        FALLING: 'FALLING', 
        STABLE: 'STABLE'
    };
    
    function calculateTrend(observations, extremes) {
        if (observations.length < 2) return TREND.STABLE;
        
        const now = new Date();
        const nextExtreme = extremes.find(e => e.time > now);
        
        if (nextExtreme) {
            return nextExtreme.type === 'high' ? TREND.RISING : TREND.FALLING;
        }
        
        const latest = observations[observations.length - 1];
        const thirtyMinutesAgo = observations.find(obs => 
            (latest.time.getTime() - obs.time.getTime()) >= 30 * 60 * 1000
        );
        
        if (thirtyMinutesAgo) {
            const diff = latest.value - thirtyMinutesAgo.value;
            if (diff > 1.0) return TREND.RISING;
            if (diff < -1.0) return TREND.FALLING;
        }
        
        return TREND.STABLE;
    }
    
    async function fetchWaterLevelData() {
        if (isCacheValid()) {
            return dataCache.data;
        }
        
        return await fetchFromXmlApi();
    }
    
    
    async function fetchFromXmlApi() {
        const now = new Date();
        const fromTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
        const toTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);  // 72 hours ahead for 3 full tide cycles
        
        const fromTimeStr = fromTime.toISOString().slice(0, 19);
        const toTimeStr = toTime.toISOString().slice(0, 19);
        
        const url = buildApiUrl(fromTimeStr, toTimeStr);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const xmlText = await response.text();
        const { observations, predictions, forecasts } = parseWaterLevelXML(xmlText);
        
        // Get latest values
        const latestObservation = observations[observations.length - 1];
        const latestPrediction = predictions.find(p => 
            Math.abs(p.time.getTime() - latestObservation.time.getTime()) < 600000 // Within 10 minutes
        ) || predictions[predictions.length - 1];
        
        // Find tide extremes using predictions (correct astronomical timing)
        const rawExtremes = findTideExtremes([...observations, ...predictions]);
        const refinedExtremes = refineExtremeTimings(rawExtremes);
        
        // Find actual extremes in forecast data around predicted times
        const extremesWithForecastValues = refinedExtremes.map(extreme => {
            // Find the forecast point closest to predicted time
            let closestIndex = -1;
            let minTimeDiff = Infinity;
            
            forecasts.forEach((f, index) => {
                const timeDiff = Math.abs(f.time.getTime() - extreme.time.getTime());
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    closestIndex = index;
                }
            });
            
            if (closestIndex === -1) {
                // Fallback to original if no forecast data found
                return extreme;
            }
            
            // Get 10 values before and after (21 total)
            const windowStart = Math.max(0, closestIndex - 10);
            const windowEnd = Math.min(forecasts.length - 1, closestIndex + 10);
            const window = forecasts.slice(windowStart, windowEnd + 1);
            
            // Find max or min in this window based on tide type
            let actualExtreme;
            if (extreme.type === 'high') {
                // Find maximum value in window
                actualExtreme = window.reduce((max, point) => 
                    point.value > max.value ? point : max
                );
            } else {
                // Find minimum value in window  
                actualExtreme = window.reduce((min, point) => 
                    point.value < min.value ? point : min
                );
            }
            
            // If multiple points have same extreme value, average their times
            const sameValuePoints = window.filter(p => p.value === actualExtreme.value);
            if (sameValuePoints.length > 1) {
                const avgTime = sameValuePoints.reduce((sum, p) => sum + p.time.getTime(), 0) / sameValuePoints.length;
                actualExtreme = {
                    ...actualExtreme,
                    time: new Date(avgTime)
                };
            }
            
            return {
                type: extreme.type,
                time: actualExtreme.time,
                value: actualExtreme.value
            };
        });
        const highTides = extremesWithForecastValues.filter(e => e.type === 'high').slice(0, 3);
        const lowTides = extremesWithForecastValues.filter(e => e.type === 'low').slice(0, 3);
        
        // Calculate trend
        const trend = calculateTrend(observations, extremesWithForecastValues);
        
        // Get corresponding forecast value
        const latestForecast = forecasts.find(f => 
            Math.abs(f.time.getTime() - latestObservation.time.getTime()) < 600000 // Within 10 minutes
        );
        
        // Weather effect
        const weatherEffect = latestObservation.value - latestPrediction.value;
        
        // Format times
        const nextHighTides = highTides.map(tide => ({
            time: formatTideTime(tide.time),
            level: tide.value.toFixed(1)
        }));
        
        const nextLowTides = lowTides.map(tide => ({
            time: formatTideTime(tide.time),
            level: tide.value.toFixed(1)
        }));
        
        const lastUpdated = latestObservation.time.toTimeString().slice(0, 5) + ' i dag';
        
        // Get next tide time for chip display
        const nextTide = extremesWithForecastValues.find(e => e.time > now);
        const nextTideTime = nextTide ? nextTide.time.toTimeString().slice(0, 5) : '--:--';
        
        const waterData = {
            waterLevel: latestObservation.value,
            waterLevelObserved: latestObservation.value,
            waterLevelPredicted: latestPrediction.value,
            waterLevelForecast: latestForecast.value,
            waterLevelTrend: trend,
            waterLevelUpdated: lastUpdated,
            waterLevelName: getWaterLevelName(latestObservation.value),
            nextTideTime: nextTideTime,
            nextHighTides,
            nextLowTides,
            weatherEffect
        };
        
        dataCache = {
            timestamp: Date.now(),
            data: waterData
        };
        
        latestWaterData = waterData;
        return waterData;
    }
    
    function updateWaterLevelChip() {
        if (window.ChipHandler && latestWaterData) {
            window.ChipHandler.updateAllChips(latestWaterData);
        }
    }
    
    async function initialize() {
        try {
            latestWaterData = await fetchWaterLevelData();
            updateWaterLevelChip();
            
            setInterval(async () => {
                latestWaterData = await fetchWaterLevelData();
                updateWaterLevelChip();
            }, 5 * 60 * 1000);
            
        } catch (error) {
            console.error('Failed to initialize water level module:', error);
        }
    }
    
    return {
        fetchWaterLevelData,
        updateWaterLevelChip,
        initialize,
        
        get latestData() { return latestWaterData; },
        get WATER_LEVELS() { return WATER_LEVELS; }
    };
})();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.WaterLevel.initialize();
});
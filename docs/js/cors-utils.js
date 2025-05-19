/**
 * CORS utilities for API calls
 */

// List of working CORS proxies
const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url='
];

const USER_AGENT = 'DriMon/1.0 (https://drimon.rodland.no; contact@drimon.rodland.no)';
	
/**
 * Fetch data from MET API with browser-specific handling
 * @param {string} url - The API URL to fetch
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} The parsed JSON response and source
 */
async function fetchWithCORS(url, options = {}) {
    // Check if we're on Safari which needs special handling
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // For all browsers, including Chrome, go directly to proxies as direct calls are failing
    // This is a change from the previous behavior where Chrome tried direct first
    return await fetchWithProxy(url);
}

/**
 * Try fetching through CORS proxies
 * @param {string} url - The API URL to fetch
 * @returns {Promise<Object>} The parsed JSON response and source
 */
async function fetchWithProxy(url) {
    // Try each proxy in sequence
    let lastError;
    
    // Make sure we use a clean URL without cache busting parameters
    // Some proxies have issues with too many query parameters
    const cleanUrl = url.split('_cb=')[0].replace(/&$/, '');
    
    for (const proxy of CORS_PROXIES) {
        try {
            const proxyUrl = `${proxy}${encodeURIComponent(cleanUrl)}`;
            
            // Use fetch with minimal headers to avoid CORS issues
            const response = await fetch(proxyUrl, {
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (!response.ok) throw new Error(`Proxy status: ${response.status}`);
            
            return {
                data: await response.json(),
                source: `proxy (${proxy.split('/')[2]})`
            };
        } catch (proxyError) {
            console.log(`[CORS] Proxy ${proxy} failed:`, proxyError.message);
            lastError = proxyError;
            continue;
        }
    }
    
    // Try a third proxy as a last resort
    try {
        // YQL is a reliable fallback
        const yqlProxy = `https://query.yahooapis.com/v1/public/yql?q=${encodeURIComponent(`select * from json where url="${cleanUrl}"`)}&format=json`;
        
        const response = await fetch(yqlProxy);
        if (!response.ok) throw new Error(`YQL proxy status: ${response.status}`);
        
        const yqlData = await response.json();
        
        // YQL wraps the data differently
        if (yqlData && yqlData.query && yqlData.query.results) {
            return {
                data: yqlData.query.results,
                source: 'proxy (yahooapis)'
            };
        }
        
        throw new Error('YQL proxy returned invalid data structure');
    } catch (yqlError) {
        console.log('[CORS] YQL proxy failed:', yqlError.message);
        
        // If YQL fails too, try one more option - JSONP
        try {
            const jsonpProxy = `https://jsonp.afeld.me/?url=${encodeURIComponent(cleanUrl)}`;
            
            const response = await fetch(jsonpProxy);
            if (!response.ok) throw new Error(`JSONP proxy status: ${response.status}`);
            
            return {
                data: await response.json(),
                source: 'proxy (jsonp)'
            };
        } catch (jsonpError) {
            console.log('[CORS] JSONP proxy failed:', jsonpError.message);
            
            // If we get here, all proxies failed
            throw lastError || jsonpError || new Error('All proxies failed');
        }
    }
}

// Export the utility function
window.CORSUtils = {
    fetchWithCORS
};
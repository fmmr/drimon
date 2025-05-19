/**
 * CORS utilities for API calls
 */

// List of working CORS proxies
const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url='
];

/**
 * Fetch data from MET API with browser-specific handling
 * @param {string} url - The API URL to fetch
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} The parsed JSON response and source
 */
async function fetchWithCORS(url, options = {}) {
    // Add cache busting parameter to prevent browser cache
    const urlWithCacheBust = `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
    
    // Check if we're on Safari which needs special handling
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // For Safari, go directly to proxies to avoid CORS issues
    if (isSafari) {
        return await fetchWithProxy(url);
    }
    
    // For other browsers, try direct API call first
    try {
        const response = await fetch(urlWithCacheBust, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'DriMon/1.0 (https://drimon.rodland.no; contact@drimon.rodland.no)'
            },
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (!response.ok) throw new Error(`API status: ${response.status}`);
        
        return {
            data: await response.json(),
            source: 'direct'
        };
    } catch (error) {
        // Fall back to proxy approach if direct call fails
        return await fetchWithProxy(url);
    }
}

/**
 * Try fetching through CORS proxies
 * @param {string} url - The API URL to fetch
 * @returns {Promise<Object>} The parsed JSON response and source
 */
async function fetchWithProxy(url) {
    // Try each proxy in sequence
    let lastError;
    
    for (const proxy of CORS_PROXIES) {
        try {
            const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
            
            const response = await fetch(proxyUrl, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error(`Proxy status: ${response.status}`);
            
            return {
                data: await response.json(),
                source: `proxy (${proxy.split('/')[2]})`
            };
        } catch (proxyError) {
            lastError = proxyError;
            continue;
        }
    }
    
    // If we get here, all proxies failed
    throw lastError || new Error('All proxies failed');
}

// Export the utility function
window.CORSUtils = {
    fetchWithCORS
};
/**
 * CORS utilities for API calls
 */

const USER_AGENT = 'DriMon/1.0 (https://drimon.rodland.no; contact@drimon.rodland.no)';

/**
 * Fetch data from MET API directly - no fallbacks, no proxies
 * @param {string} url - The API URL to fetch
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} The parsed JSON response and source
 */
async function fetchWithCORS(url, options = {}) {
    // Add cache busting parameter to prevent browser cache
    const urlWithCacheBust = `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
    
    // Make a direct request to the API
    const response = await fetch(urlWithCacheBust, {
        headers: {
            'Accept': 'application/json',
            'User-Agent': USER_AGENT
        },
        mode: 'cors',
        credentials: 'omit'
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    return {
        data: data,
        source: 'direct'
    };
}

// Export the utility function
window.CORSUtils = {
    fetchWithCORS
};
/**
 * CORS utilities for API calls
 */

const USER_AGENT = 'DriMon/1.1 (https://drimon.rodland.no; contact@rodland.no)';

/**
 * Fetch data from MET API with browser-specific handling
 * @param {string} url - The API URL to fetch
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} The parsed JSON response and source
 */
async function fetchWithCORS(url, options = {}) {
    // Check if we're on Safari which needs special handling
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // For Safari, go directly to proxy to avoid CORS issues
    if (isSafari) {
        return await fetchWithProxy(url);
    }
    
    // For Chrome and other browsers, make direct request to the API
    const response = await fetch(url, {
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

/**
 * Proxy fetch for Safari browser
 * @param {string} url - The API URL to fetch
 * @returns {Promise<Object>} The parsed JSON response and source
 */
async function fetchWithProxy(url) {
    // Use a reliable proxy service
    const proxyUrl = 'https://corsproxy.io/?';
    
    const response = await fetch(proxyUrl + encodeURIComponent(url), {
        headers: {
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        // If first proxy fails, try backup proxy
        const backupProxyUrl = 'https://api.allorigins.win/raw?url=';
        const backupResponse = await fetch(backupProxyUrl + encodeURIComponent(url), {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!backupResponse.ok) {
            throw new Error(`All proxies failed`);
        }
        
        return {
            data: await backupResponse.json(),
            source: 'proxy (backup)'
        };
    }
    
    return {
        data: await response.json(),
        source: 'proxy'
    };
}

// Export the utility function
window.CORSUtils = {
    fetchWithCORS
};

/**
 * Pull-to-refresh functionality for the DriMon application
 * 
 * Provides a user-friendly way to refresh the page, especially
 * useful for mobile devices and when used as a PWA (added to home screen).
 */

(function() {
    // Create and inject the pull indicator element and styles
    function createPullIndicator() {
        // Create style element
        const style = document.createElement('style');
        style.textContent = `
            .pull-indicator {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: rgba(240, 240, 240, 0.8);
                color: #333;
                font-size: 14px;
                transform: translateY(-60px);
                transition: transform 0.2s ease;
                z-index: 1000;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            html[data-theme="dark"] .pull-indicator {
                background-color: rgba(33, 33, 33, 0.8);
                color: #ddd;
            }
            .pull-indicator .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid transparent;
                border-top-color: #007bff;
                border-radius: 50%;
                margin-right: 10px;
                display: none;
            }
            .pull-indicator.refreshing .spinner {
                display: inline-block;
                animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        // Create indicator element
        const indicator = document.createElement('div');
        indicator.className = 'pull-indicator';
        indicator.id = 'pullIndicator';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        
        const text = document.createElement('span');
        text.id = 'pullText';
        text.textContent = 'Pull down to refresh';
        
        indicator.appendChild(spinner);
        indicator.appendChild(text);
        document.body.appendChild(indicator);
        
        return {
            indicator,
            text
        };
    }
    
    // Initialize pull-to-refresh functionality
    function initPullToRefresh() {
        // Create the indicator UI if it doesn't exist
        const elements = createPullIndicator();
        const pullIndicator = elements.indicator;
        const pullText = elements.text;
        
        const pullThreshold = 100;
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        let isRefreshing = false;
        
        // Get localized text if available
        const pullToRefreshText = window.I18n ? window.I18n.translate('pullToRefresh') || 'Pull down to refresh' : 'Pull down to refresh';
        const releaseToRefreshText = window.I18n ? window.I18n.translate('releaseToRefresh') || 'Release to refresh' : 'Release to refresh';
        const refreshingText = window.I18n ? window.I18n.translate('refreshing') || 'Refreshing...' : 'Refreshing...';
        
        pullText.textContent = pullToRefreshText;
        
        document.addEventListener('touchstart', e => {
            // Only enable pull to refresh at the top of the page
            if (window.scrollY <= 5) {
                startY = e.touches[0].clientY;
                currentY = startY;
                isPulling = true;
            }
        });
        
        document.addEventListener('touchmove', e => {
            if (!isPulling) return;
            
            currentY = e.touches[0].clientY;
            let pullDistance = currentY - startY;
            
            // Only activate when pulling down
            if (pullDistance > 0) {
                // Calculate how far the indicator should be pulled down (with resistance)
                const pullPercentage = Math.min(pullDistance / pullThreshold, 1);
                const pullOffset = Math.min(pullDistance * 0.5, 50);
                
                // Update indicator position
                pullIndicator.style.transform = `translateY(${pullOffset - 60}px)`;
                
                // Update text based on threshold
                if (pullDistance >= pullThreshold) {
                    pullText.textContent = releaseToRefreshText;
                } else {
                    pullText.textContent = pullToRefreshText;
                }
            }
        });
        
        document.addEventListener('touchend', e => {
            if (!isPulling) return;
            
            const pullDistance = currentY - startY;
            
            // Reset pulling state
            isPulling = false;
            
            // If we've pulled down at least the threshold and we're at the top of the page
            if (pullDistance > pullThreshold && window.scrollY <= 5 && !isRefreshing) {
                // Show refreshing state
                isRefreshing = true;
                pullIndicator.classList.add('refreshing');
                pullText.textContent = refreshingText;
                
                // Hold the indicator visible while "refreshing"
                pullIndicator.style.transform = 'translateY(0)';
                
                // Reload the page after a short delay to show the animation
                setTimeout(() => {
                    location.reload();
                }, 600);
            } else {
                // Reset the indicator position
                pullIndicator.style.transform = 'translateY(-60px)';
            }
        });
    }
    
    // Initialize pull-to-refresh when document is ready
    document.addEventListener('DOMContentLoaded', initPullToRefresh);
})();
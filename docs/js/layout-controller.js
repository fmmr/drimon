/**
 * Layout Controller
 * 
 * Handles responsive layout functionality and mobile-specific UI adjustments.
 */

const LayoutController = {
    /**
     * Function to handle mobile layout adjustments
     */
    setupMobileLayout: function() {
        // Check if we're on mobile
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        
        if (isMobile) {
            // Move mobile sort element to header controls
            const mobileSort = document.getElementById('mobileSortContainer');
            const headerControls = document.querySelector('.mobile-header-controls');
            
            if (mobileSort && headerControls) {
                headerControls.appendChild(mobileSort);
                
                // Sync mobile select with main select for value consistency
                const mainSelect = document.getElementById('sortSelect');
                const mobileSelect = document.getElementById('mobileSortSelect');
                
                if (mainSelect && mobileSelect) {
                    // Initial sync
                    mobileSelect.value = mainSelect.value;
                    
                    // Keep values in sync when either changes
                    mainSelect.addEventListener('change', () => {
                        mobileSelect.value = mainSelect.value;
                    });
                    
                    mobileSelect.addEventListener('change', () => {
                        mainSelect.value = mobileSelect.value;
                        // Trigger change event on main select to keep behavior consistent
                        mainSelect.dispatchEvent(new Event('change'));
                    });
                }
            }
        }
        
        // Handle window resize to adjust layout
        window.addEventListener('resize', () => {
            const isMobileNow = window.matchMedia('(max-width: 768px)').matches;
            const mobileSort = document.getElementById('mobileSortContainer');
            const headerControls = document.querySelector('.mobile-header-controls');
            const searchContainer = document.querySelector('.search-container');
            
            if (isMobileNow && mobileSort && headerControls) {
                // Move to mobile position if not already there
                if (mobileSort.parentElement !== headerControls) {
                    headerControls.appendChild(mobileSort);
                }
            } else if (!isMobileNow && mobileSort && searchContainer) {
                // Move back to original position if not in mobile view
                if (mobileSort.parentElement !== searchContainer) {
                    searchContainer.appendChild(mobileSort);
                }
            }
        });
    }
};

// Export controller
window.LayoutController = LayoutController;

const LayoutController = {
    setupMobileLayout: function() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        
        if (isMobile) {
            const mobileSort = document.getElementById('mobileSortContainer');
            const headerControls = document.querySelector('.mobile-header-controls');
            
            if (mobileSort && headerControls) {
                headerControls.appendChild(mobileSort);
                
            }
        }
        
        window.addEventListener('resize', () => {
            const isMobileNow = window.matchMedia('(max-width: 768px)').matches;
            const mobileSort = document.getElementById('mobileSortContainer');
            const headerControls = document.querySelector('.mobile-header-controls');
            const searchContainer = document.querySelector('.search-container');
            
            if (isMobileNow && mobileSort && headerControls) {
                if (mobileSort.parentElement !== headerControls) {
                    headerControls.appendChild(mobileSort);
                }
            } else if (!isMobileNow && mobileSort && searchContainer) {
                if (mobileSort.parentElement !== searchContainer) {
                    searchContainer.appendChild(mobileSort);
                }
            }
        });
    }
};

window.LayoutController = LayoutController;
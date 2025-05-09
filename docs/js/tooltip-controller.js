/**
 * Tooltip Controller
 * 
 * Handles custom tooltips that work on both desktop and mobile devices.
 */

const TooltipController = (function() {
    // Store the tooltip element
    let tooltipElement = null;
    
    // Tracks active tooltip state
    let isActive = false;
    
    // Timer for closing tooltip on mobile
    let hideTimer = null;
    
    // Create the tooltip element
    function createTooltipElement() {
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        document.body.appendChild(tooltip);
        return tooltip;
    }
    
    // Initialize tooltips
    function initialize() {
        // Create tooltip element if it doesn't exist
        if (!tooltipElement) {
            tooltipElement = createTooltipElement();
        }

        // Find all elements with custom tooltips or marked for tooltips
        const elements = document.querySelectorAll('[data-tooltip-content], [data-has-tooltip="true"]');

        // Attach event listeners
        elements.forEach(el => {
            // Mark element as having a tooltip
            el.setAttribute('data-has-tooltip', 'true');

            // Remove existing event listeners to prevent duplicates
            el.removeEventListener('mouseenter', handleMouseEnter);
            el.removeEventListener('mouseleave', handleMouseLeave);
            el.removeEventListener('touchstart', handleTouch);

            // Handle mouse events (desktop)
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);

            // Handle touch events (mobile)
            el.addEventListener('touchstart', handleTouch, { passive: false });

            // Remove standard title attribute to prevent native tooltip
            if (el.title) {
                el.setAttribute('data-original-title', el.title);
                el.removeAttribute('title');
            }
        });

        // Close tooltip when clicking or touching elsewhere
        document.removeEventListener('touchstart', handleDocumentTouch);
        document.removeEventListener('click', handleDocumentClick);
        document.addEventListener('touchstart', handleDocumentTouch, { passive: true });
        document.addEventListener('click', handleDocumentClick);
    }
    
    // Handle mouse enter - show tooltip
    function handleMouseEnter(event) {
        const tooltipContent = getTooltipContent(event.currentTarget);
        if (!tooltipContent) return;
        
        // Position and show tooltip
        showTooltip(tooltipContent, event.currentTarget);
        
        // Track active state
        isActive = true;
    }
    
    // Handle mouse leave - hide tooltip
    function handleMouseLeave() {
        hideTooltip();
    }
    
    // Handle touch - toggle tooltip
    function handleTouch(event) {
        // Do NOT prevent default behavior for horizontal scrolling containers
        const isInsideScrollableContainer = event.target.closest('.data-container') !== null;

        // Only prevent default for non-scrollable elements to maintain normal touch behavior
        if (!isInsideScrollableContainer) {
            event.preventDefault();
        }

        // Make sure we have the actual element with the tooltip attribute
        // This handles cases where the user taps on a child element
        let targetElement = event.target;

        // Walk up the DOM tree until we find an element with data-tooltip-content
        // or until we reach the document body
        while (targetElement && !targetElement.hasAttribute('data-tooltip-content')) {
            // If we found the parent with data-has-tooltip attribute, that's good enough
            if (targetElement.hasAttribute('data-has-tooltip')) {
                break;
            }
            targetElement = targetElement.parentElement;
        }

        // If we didn't find an element with tooltip data, use currentTarget as fallback
        if (!targetElement || (!targetElement.hasAttribute('data-tooltip-content') &&
                              !targetElement.hasAttribute('data-has-tooltip'))) {
            targetElement = event.currentTarget;
        }

        const tooltipContent = getTooltipContent(targetElement);
        if (!tooltipContent) return;

        // If tooltip is already showing for this element, hide it
        if (isActive && tooltipElement.dataset.activeTarget === targetElement.id) {
            hideTooltip();
            return;
        }

        // Position and show tooltip
        showTooltip(tooltipContent, targetElement);

        // Track active state
        isActive = true;

        // Auto-hide after 5 seconds on mobile
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            hideTooltip();
        }, 5000);
    }
    
    // Handle document touch - hide tooltip if touching outside
    function handleDocumentTouch(event) {
        // Don't interfere with scrolling in scrollable containers
        const isScrollAction = event.target.closest('.data-container') !== null;
        if (isScrollAction) {
            return; // Let scroll actions proceed without interference
        }

        // If tooltip is active and touch is outside the current target and tooltip
        if (isActive && tooltipElement) {
            // Check if we clicked inside a tooltip element or a tooltip-enabled element
            let targetElement = event.target;
            let isTooltipRelated = false;

            // Check if the touch is on the tooltip itself
            if (targetElement === tooltipElement) {
                isTooltipRelated = true;
            }

            // Check if we tapped on or within an element with tooltip data
            while (targetElement && !isTooltipRelated) {
                if (targetElement.hasAttribute('data-tooltip-content') ||
                    targetElement.hasAttribute('data-has-tooltip')) {
                    isTooltipRelated = true;
                }
                targetElement = targetElement.parentElement;
            }

            // Hide tooltip if we clicked outside of any tooltip elements
            if (!isTooltipRelated) {
                hideTooltip();
            }
        }
    }
    
    // Handle document click - hide tooltip if clicking outside
    function handleDocumentClick(event) {
        // If tooltip is active and click is outside the current target and tooltip
        if (isActive && tooltipElement) {
            // Check if we clicked inside a tooltip element or a tooltip-enabled element
            let targetElement = event.target;
            let isTooltipRelated = false;
            
            // Check if the click is on the tooltip itself
            if (targetElement === tooltipElement) {
                isTooltipRelated = true;
            }
            
            // Check if we clicked on or within an element with tooltip data
            while (targetElement && !isTooltipRelated) {
                if (targetElement.hasAttribute('data-tooltip-content') || 
                    targetElement.hasAttribute('data-has-tooltip')) {
                    isTooltipRelated = true;
                }
                targetElement = targetElement.parentElement;
            }
            
            // Hide tooltip if we clicked outside of any tooltip elements
            if (!isTooltipRelated) {
                hideTooltip();
            }
        }
    }
    
    // Get tooltip content from element
    function getTooltipContent(element) {
        // First try data-tooltip-content
        if (element.dataset.tooltipContent) {
            // Try parsing as JSON
            try {
                const contentObj = JSON.parse(element.dataset.tooltipContent);
                return formatTooltipContent(contentObj);
            } catch (e) {
                // If not valid JSON, use the string directly
                return element.dataset.tooltipContent;
            }
        }
        
        // Fall back to data-original-title
        return element.dataset.originalTitle || '';
    }
    
    // Format tooltip content
    function formatTooltipContent(contentObj) {
        // For sun events chip
        if (contentObj.sunrise || contentObj.sunset) {
            let text = "";
            
            // Check each field and add if present
            if (contentObj.sunrise) {
                text += `${window.I18n.translate('sunrise')}: ${contentObj.sunrise}\n`;
            }
            
            if (contentObj.sunset) {
                text += `${window.I18n.translate('sunset')}: ${contentObj.sunset}\n`;
            }
            
            if (contentObj.dusk) {
                text += `${window.I18n.translate('dusk')}: ${contentObj.dusk}\n`;
            }
            
            // Format day length
            if (contentObj.dayLength) {
                const hourSymbol = window.I18n.translate('hourSymbol');
                const dayLengthFormatted = `${contentObj.dayLength.hours}${hourSymbol} ${contentObj.dayLength.minutes}m`;
                text += `${window.I18n.translate('dayLength')}: ${dayLengthFormatted}\n`;
            }
            
            // Format night length
            if (contentObj.nightLength) {
                const hourSymbol = window.I18n.translate('hourSymbol');
                const nightLengthFormatted = `${contentObj.nightLength.hours}${hourSymbol} ${contentObj.nightLength.minutes}m`;
                text += `${window.I18n.translate('nightLength')}: ${nightLengthFormatted}\n`;
            }
            
            if (contentObj.moonrise) {
                text += `${window.I18n.translate('moonrise')}: ${contentObj.moonrise}\n`;
            }
            
            if (contentObj.moonset) {
                text += `${window.I18n.translate('moonset')}: ${contentObj.moonset}\n`;
            }
            
            if (contentObj.moonPhase) {
                text += `${window.I18n.translate('moonPhase')}: ${contentObj.moonPhase}`;
            }
            
            return text;
        }
        
        // For other types of content, just return a string representation
        return JSON.stringify(contentObj, null, 2);
    }
    
    // Show tooltip at the right position
    function showTooltip(content, targetElement) {
        if (!tooltipElement) return;
        
        // Set content
        tooltipElement.textContent = content;
        
        // Get position
        const targetRect = targetElement.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // First set the tooltip to be centered below the target
            tooltipElement.style.left = Math.max(10, Math.min(
                window.innerWidth - tooltipElement.offsetWidth - 10,
                targetRect.left + (targetRect.width / 2) - (tooltipElement.offsetWidth / 2)
            )) + 'px';
            
            // Position below with enough distance to prevent accidental closing
            tooltipElement.style.top = (targetRect.bottom + 15) + 'px';
            
            // If too close to bottom of screen, position above target instead
            if (targetRect.bottom + 15 + tooltipElement.offsetHeight > window.innerHeight - 10) {
                tooltipElement.style.top = (targetRect.top - tooltipElement.offsetHeight - 15) + 'px';
            }
            
            // Check if tooltip would go off-screen to the top and adjust if needed
            if (parseInt(tooltipElement.style.top) < 10) {
                tooltipElement.style.top = '10px';
            }
        } else {
            // Regular desktop position - to the right of target
            tooltipElement.style.left = (targetRect.right + 10) + 'px';
            tooltipElement.style.top = (targetRect.top - 5) + 'px';
            
            // Check if tooltip would go off-screen to the right
            if (targetRect.right + 10 + tooltipElement.offsetWidth > window.innerWidth - 10) {
                // Position to the left of target instead
                tooltipElement.style.left = (targetRect.left - tooltipElement.offsetWidth - 10) + 'px';
            }
            
            // Check if tooltip would go off-screen at the bottom
            if (targetRect.top + tooltipElement.offsetHeight > window.innerHeight - 10) {
                tooltipElement.style.top = (window.innerHeight - tooltipElement.offsetHeight - 10) + 'px';
            }
        }
        
        // Store active target
        tooltipElement.dataset.activeTarget = targetElement.id;
        
        // Show tooltip
        tooltipElement.classList.add('visible');
    }
    
    // Hide tooltip
    function hideTooltip() {
        if (!tooltipElement) return;
        
        tooltipElement.classList.remove('visible');
        isActive = false;
        
        // Clear timer
        clearTimeout(hideTimer);
    }
    
    // Listen for translation changes
    function updateTranslations() {
        // Update all active tooltips
        if (isActive && tooltipElement) {
            const activeTarget = document.getElementById(tooltipElement.dataset.activeTarget);
            if (activeTarget) {
                const tooltipContent = getTooltipContent(activeTarget);
                tooltipElement.textContent = tooltipContent;
            }
        }
    }
    
    // Public API
    return {
        initialize,
        hideTooltip,
        updateTranslations
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        TooltipController.initialize();
    }, 500); // Small delay to ensure header is fully loaded
});

// Reinitialize after header is initialized
document.addEventListener('header:initialized', function() {
    setTimeout(() => {
        TooltipController.initialize();
    }, 500); // Small delay to ensure header is fully loaded
});

// Update translations when language changes
document.addEventListener('languageChanged', function() {
    TooltipController.updateTranslations();
});

// Make controller available globally
window.TooltipController = TooltipController;
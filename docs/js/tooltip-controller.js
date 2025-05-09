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
        
        // Find all elements with custom tooltips
        const elements = document.querySelectorAll('[data-tooltip-content]');
        
        // Attach event listeners
        elements.forEach(el => {
            // Mark element as having a tooltip
            el.setAttribute('data-has-tooltip', 'true');
            
            // Handle mouse events (desktop)
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
            
            // Handle touch events (mobile)
            el.addEventListener('touchstart', handleTouch);
            
            // Remove standard title attribute to prevent native tooltip
            if (el.title) {
                el.setAttribute('data-original-title', el.title);
                el.removeAttribute('title');
            }
        });
        
        // Close tooltip when clicking or touching elsewhere
        document.addEventListener('touchstart', handleDocumentTouch);
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
        // Prevent default behavior to avoid navigation
        event.preventDefault();
        
        const tooltipContent = getTooltipContent(event.currentTarget);
        if (!tooltipContent) return;
        
        // If tooltip is already showing for this element, hide it
        if (isActive && tooltipElement.dataset.activeTarget === event.currentTarget.id) {
            hideTooltip();
            return;
        }
        
        // Position and show tooltip
        showTooltip(tooltipContent, event.currentTarget);
        
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
        // If tooltip is active and touch is outside the current target and tooltip
        if (isActive && 
            tooltipElement && 
            !event.target.hasAttribute('data-tooltip-content') &&
            event.target !== tooltipElement) {
            hideTooltip();
        }
    }
    
    // Handle document click - hide tooltip if clicking outside
    function handleDocumentClick(event) {
        // If tooltip is active and click is outside the current target and tooltip
        if (isActive && 
            tooltipElement && 
            !event.target.hasAttribute('data-tooltip-content') &&
            event.target !== tooltipElement) {
            hideTooltip();
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
            // Center horizontally, place below on mobile
            tooltipElement.style.left = Math.max(10, Math.min(
                window.innerWidth - tooltipElement.offsetWidth - 10,
                targetRect.left - (tooltipElement.offsetWidth / 2) + (targetRect.width / 2)
            )) + 'px';
            
            tooltipElement.style.top = (targetRect.bottom + 10) + 'px';
            
            // If too close to bottom of screen, position above target instead
            if (targetRect.bottom + 10 + tooltipElement.offsetHeight > window.innerHeight - 10) {
                tooltipElement.style.top = (targetRect.top - tooltipElement.offsetHeight - 10) + 'px';
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
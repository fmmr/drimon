// Format for date strings
const format = 'YYYY-MM-DD HH:mm:ss';

/**
 * Get date range based on selection code
 * Consolidated function that handles all range options
 *
 * @param {string|number} range - Range code or number of days
 * @returns {Object} Object with startDate and endDate
 */
function getDateRange(range) {
    const now = moment();
    let startDate = '';
    let endDate = '';

    // Check if range is a numeric string (number of days)
    if (range && range.toString().match(/^\d+$/)) {
        // If range is a number, subtract that many days
        const days = parseInt(range);
        startDate = now.clone().subtract(days, 'days').format(format);
        endDate = now.format(format);
    } else {
        switch (range) {
            case 'today':
                // Just today, from midnight to now
                startDate = now.clone().startOf('day').format(format);
                endDate = now.format(format);
                break;

            case 'yesterday':
                // Just yesterday, full day
                startDate = now.clone().subtract(1, 'days').startOf('day').format(format);
                endDate = now.clone().subtract(1, 'days').endOf('day').format(format);
                break;

            case 'this-week':
                // This week, from Monday midnight to now
                startDate = now.clone().startOf('isoWeek').format(format);
                endDate = now.format(format);
                break;

            case 'last-week':
                // Last week, full week Monday-Sunday
                startDate = now.clone().subtract(1, 'weeks').startOf('isoWeek').format(format);
                endDate = now.clone().subtract(1, 'weeks').endOf('isoWeek').format(format);
                break;

            case 'this-month':
                // This month, from first day to now
                startDate = now.clone().startOf('month').format(format);
                endDate = now.format(format);
                break;

            case 'last-month':
                // Last month, full month
                startDate = now.clone().subtract(1, 'months').startOf('month').format(format);
                endDate = now.clone().subtract(1, 'months').endOf('month').format(format);
                break;

            case 'start':
                // From the beginning of data collection to now
                startDate = moment('2024-07-15').format(format);
                endDate = now.format(format);
                break;

            default:
                // Default to last 24 hours
                startDate = now.clone().subtract(1, 'days').format(format);
                endDate = now.format(format);
        }
    }

    return { startDate, endDate };
}

// Note: Using Utils.getURLParameter for URL parameter access now

// Export the date-utils module
if (typeof window !== 'undefined') {
    window.DateUtils = {
        getDateRange,
        format
    };
}
// Format for date strings
const format = 'YYYY-MM-DD HH:mm:ss';

// Get date range based on selection
function getDateRange(range) {
    const now = moment();
    let startDate = '';
    let endDate = '';
    
    if (range.match(/^\d+$/)) {
        // If range is a number, subtract that many days
        const days = parseInt(range);
        startDate = moment().subtract(days, 'days').startOf('day').format(format);
    } else {
        switch (range) {
            case 'start':
                startDate = moment('2024-07-15').format(format);
                break;
            case 'today':
                startDate = moment().startOf('day').format(format);
                break;
            case 'yesterday':
                startDate = moment().subtract(1, 'days').startOf('day').format(format);
                endDate = moment().subtract(1, 'days').endOf('day').format(format);
                break;
            case 'this-week':
                startDate = moment().startOf('isoWeek').format(format);
                break;
            case 'last-week':
                startDate = moment().subtract(1, 'weeks').startOf('isoWeek').format(format);
                endDate = moment().subtract(1, 'weeks').endOf('isoWeek').format(format);
                break;
            default:
                startDate = moment().subtract(1, 'days').format(format);
        }
    }
    
    return { startDate, endDate };
}

// Note: Using Utils.getURLParameter for URL parameter access now
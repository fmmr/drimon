// Chart rendering functions using D3.js
const timezone = encodeURIComponent("Europe/Paris");
const updateInterval = 60000; // 1 minute update interval
const chartUpdateInterval = 15000; // 15 seconds chart update interval

// Function to create the chart container element
function createChartContainer(config) {
    const container = document.createElement('div');
    container.id = config.id + '-container';
    container.classList.add('chart-container');
    container.style.gridArea = config.area;
    
    // Add loading indicator
    const loader = document.createElement('div');
    loader.classList.add('loader');
    loader.textContent = 'Laster...';
    loader.id = config.id + '-loader';
    container.appendChild(loader);
    
    return container;
}

// Function to create a fixed tooltip container for the page
function createGlobalTooltip() {
    // Create tooltip if it doesn't exist
    if (!document.getElementById('global-chart-tooltip')) {
        const tooltip = document.createElement('div');
        tooltip.id = 'global-chart-tooltip';
        tooltip.className = 'chart-tooltip';
        tooltip.style.opacity = 0;
        tooltip.style.position = 'fixed'; // Fixed position so it can float above charts
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = 1000;
        document.body.appendChild(tooltip);
    }
    return d3.select('#global-chart-tooltip');
}

// Function to intelligently position tooltip based on mouse position
function positionTooltip(event, data) {
    const tooltip = d3.select('#global-chart-tooltip');
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get mouse position
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Estimate tooltip dimensions (or get actual if available)
    const tooltipWidth = tooltip.node().offsetWidth || 180;
    const tooltipHeight = tooltip.node().offsetHeight || 80;
    
    // Default positions
    let tooltipX, tooltipY;
    
    // Horizontal positioning: if mouse is in the right half of the viewport, 
    // show tooltip to the left of the cursor, otherwise to the right
    if (mouseX > viewportWidth / 2) {
        tooltipX = mouseX - tooltipWidth - 10; // Show to the left of cursor
    } else {
        tooltipX = mouseX + 10; // Show to the right of cursor
    }
    
    // Vertical positioning: if mouse is in the bottom half of the viewport, 
    // show tooltip above cursor, otherwise below
    if (mouseY > viewportHeight / 2) {
        tooltipY = mouseY - tooltipHeight - 10; // Show above cursor
    } else {
        tooltipY = mouseY + 10; // Show below cursor
    }
    
    // Final bounds check to ensure tooltip is fully visible
    tooltipX = Math.max(10, Math.min(viewportWidth - tooltipWidth - 10, tooltipX));
    tooltipY = Math.max(10, Math.min(viewportHeight - tooltipHeight - 10, tooltipY));
    
    return { x: tooltipX, y: tooltipY };
}

// Function to draw a chart using D3.js
async function drawChart(config, startDate, endDate, results = 8000) {
    const selector = `#${config.id}-container`;
    const container = document.querySelector(selector);
    
    // Ensure global tooltip exists
    const tooltip = createGlobalTooltip();
    
    // Set fixed dimensions initially, which will be made responsive
    const width = 400;
    const height = 200;
    const margin = {top: 25, right: 20, bottom: 35, left: 40};
    
    // Clear any existing chart
    d3.select(selector).selectAll('svg').remove();
    
    // Create the SVG
    const svg = d3.select(selector)
        .append("svg")
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('height', '100%');
    
    // Main chart group with margins
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Calculate actual drawing dimensions
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 15)
        .attr("class", "chart-title")
        .text(config.title);
    
    // Clip path to prevent drawing outside chart area
    svg.append("defs").append("clipPath")
        .attr("id", `clip-${config.id}`)
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", chartWidth)
        .attr("height", chartHeight);
    
    // Build the API URL
    let url = `https://api.thingspeak.com/channels/${config.channel}/fields/${config.field}.json?`;
    url += `timezone=${timezone}&round=2&results=${results}`;
    
    // Add time parameters if provided
    if (startDate) {
        // Use max of config.startDate and startDate if config has a startDate
        if (config.startDate) {
            const configStart = moment(config.startDate);
            const requestStart = moment(startDate);
            startDate = moment.max(configStart, requestStart).format('YYYY-MM-DD HH:mm:ss');
        }
        url += `&start=${encodeURIComponent(startDate)}`;
    } else if (config.startDate) {
        url += `&start=${encodeURIComponent(config.startDate)}`;
    }
    
    if (endDate) {
        url += `&end=${encodeURIComponent(endDate)}`;
    }
    
    try {
        // Fetch the data
        const response = await d3.json(url);
        const fieldName = `field${config.field}`;
        
        // Process data
        let data = response.feeds
            .filter(d => {
                const value = parseFloat(d[fieldName]);
                return !isNaN(value) && isFinite(value);
            })
            .map(d => ({
                date: Date.parse(d.created_at),
                value: parseFloat(d[fieldName])
            }));
        
        if (data.length === 0) {
            // No data, show a message
            container.querySelector('.loader').textContent = 'Ingen data';
            return;
        }
        
        // Hide loader
        container.querySelector('.loader').style.display = 'none';
        
        // Determine if data is dense (many points in a small time window)
        const timeSpan = d3.max(data, d => d.date) - d3.min(data, d => d.date);
        const avgPointsPerPixel = data.length / chartWidth;
        const isDenseData = avgPointsPerPixel > 0.5;
        
        // Set up scales
        const x = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, chartWidth]);
        
        const dataExtent = d3.extent(data, d => d.value);
        const ypadding = (dataExtent[1] - dataExtent[0]) * 0.05;
        
        const y = d3.scaleLinear()
            .domain([dataExtent[0] - ypadding, dataExtent[1] + ypadding])
            .range([chartHeight, 0]);
        
        // Add x-axis
        const timeRange = d3.max(data, d => d.date) - d3.min(data, d => d.date);
        svg.append("g")
            .attr("transform", `translate(${margin.left},${height - margin.bottom})`)
            .attr("class", "x-axis")
            .call(d3.axisBottom(x)
                .ticks(4)
                .tickFormat(d => customTickFormat(d, timeRange))
                .tickSizeOuter(0))
            .selectAll("text")
            .attr("class", "chart-x-axis-label");
        
        // Add horizontal grid lines
        const yTicks = y.ticks(5);
        yTicks.forEach(tickValue => {
            g.append("line")
                .attr("class", "tick-line")
                .attr("y1", y(tickValue))
                .attr("x1", 0)
                .attr("y2", y(tickValue))
                .attr("x2", chartWidth)
                .attr("stroke", "#e0e0e0")
                .attr("stroke-width", 1);
        });
        
        // Add y-axis
        svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .attr("class", "y-axis")
            .call(d3.axisLeft(y)
                .ticks(5)
                .tickSizeOuter(0))
            .selectAll("text")
            .attr("class", "chart-y-axis-label");
        
        // Draw the line with increased stroke width
        g.append("path")
            .datum(data)
            .attr("class", "chart-line")
            .attr("id", `line-${config.id}`)
            .style("stroke", config.color)
            .style("stroke-width", isDenseData ? 2.5 : 2) // Thicker line for dense data
            .attr("d", d3.line()
                .x(d => x(d.date))
                .y(d => y(d.value)))
            .attr("clip-path", `url(#clip-${config.id})`);
        
        // Add data points - only if not too dense
        if (!isDenseData) {
            g.selectAll(".chart-circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.date))
                .attr("cy", d => y(d.value))
                .attr("r", 3)
                .attr("class", "chart-circle")
                .attr("fill", config.color)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1)
                .attr("clip-path", `url(#clip-${config.id})`);
        }
        
        // Add interaction layer for mouse events
        // This covers the whole chart area to capture all mouse events
        g.append("rect")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mousemove", function(event) {
                // Find closest data point to mouse position
                const mouseX = d3.pointer(event)[0];
                const x0 = x.invert(mouseX);
                
                // Find the closest point in time
                const bisect = d3.bisector(d => d.date).left;
                const i = bisect(data, x0, 1);
                
                // Handle edge cases
                if (i <= 0 || i >= data.length) {
                    let d = (i <= 0) ? data[0] : data[data.length - 1];
                    showTooltip(d, event);
                    return;
                }
                
                // Find the two closest points
                const d0 = data[i - 1];
                const d1 = data[i];
                
                // Select the closer one
                let d = d0;
                if (x0 - d0.date > d1.date - x0) {
                    d = d1;
                }
                
                showTooltip(d, event);
            })
            .on("mouseout", function() {
                // Hide tooltip
                tooltip.transition()
                    .duration(300)
                    .style("opacity", 0);
                
                // Remove hover circle
                g.selectAll(".hover-circle").remove();
            });
            
        // Helper function to show tooltip
        function showTooltip(d, event) {
            // Display tooltip
            tooltip.transition()
                .duration(100)
                .style("opacity", 0.9);
            
            const originalDate = new Date(d.date);
            tooltip.html(
                `${response.channel[fieldName]}: <b>${d.value}</b><br>` +
                `${originalDate.toDateString()}<br>` +
                `${originalDate.toTimeString().replace(/\([^)]*\)/, '')}`
            );
            
            // Position tooltip based on mouse location in viewport
            const pos = positionTooltip(event, d);
            tooltip.style("left", pos.x + "px")
                   .style("top", pos.y + "px");
            
            // Add hover circle at data point
            g.selectAll(".hover-circle").remove();
            g.append("circle")
                .attr("class", "hover-circle")
                .attr("cx", x(d.date))
                .attr("cy", y(d.value))
                .attr("r", 5)
                .attr("fill", config.color)
                .attr("stroke", "#fff")
                .attr("stroke-width", 2);
        }
        
        // Add copyright
        svg.append("text")
            .attr("x", width - margin.right)
            .attr("y", height - 5)
            .attr("class", "chart-copyright")
            .text("drimon")
            .on("click", () => {
                window.location.href = "https://drimon.rodland.no/";
            });
        
        // Set up live data updates for this chart
        if (!endDate) {
            setupLiveUpdates(config, data, x, y, response.channel[fieldName], isDenseData);
        }
        
    } catch (error) {
        console.error(`Error loading chart ${config.id}:`, error);
        container.querySelector('.loader').textContent = 'Feil ved lasting av data';
    }
}

// Function to update a chart with new data
function setupLiveUpdates(config, data, x, y, fieldTitle, isDenseData) {
    const selector = `#${config.id}-container`;
    const lastDataUrl = `https://api.thingspeak.com/channels/${config.channel}/feeds/last.json?timezone=${timezone}`;
    const tooltip = d3.select('#global-chart-tooltip');
    
    // Store the last date to avoid duplicates
    let lastDate = data.length > 0 ? data[data.length - 1].date : null;
    
    const updateInterval = setInterval(async () => {
        try {
            const response = await d3.json(lastDataUrl);
            if (!response) return;
            
            const fieldName = `field${config.field}`;
            const newValue = parseFloat(response[fieldName]);
            const newDate = Date.parse(response.created_at);
            
            // Only update if we have a valid value and it's newer than what we have
            if (!isNaN(newValue) && isFinite(newValue) && (newDate !== lastDate)) {
                const newPoint = {
                    date: newDate,
                    value: newValue
                };
                
                // Add the new point
                data.push(newPoint);
                lastDate = newDate;
                
                // Remove oldest point if we have too many
                const maxPoints = 8000;
                if (data.length > maxPoints) {
                    data.shift();
                }
                
                // Update scales
                x.domain(d3.extent(data, d => d.date));
                
                const dataExtent = d3.extent(data, d => d.value);
                const ypadding = (dataExtent[1] - dataExtent[0]) * 0.05;
                y.domain([dataExtent[0] - ypadding, dataExtent[1] + ypadding]);
                
                // Update axes
                const svg = d3.select(selector).select("svg");
                const timeRange = d3.max(data, d => d.date) - d3.min(data, d => d.date);
                
                svg.select(".x-axis")
                    .call(d3.axisBottom(x)
                        .ticks(4)
                        .tickFormat(d => customTickFormat(d, timeRange))
                        .tickSizeOuter(0));
                
                svg.select(".y-axis")
                    .call(d3.axisLeft(y)
                        .ticks(5)
                        .tickSizeOuter(0));
                
                // Update grid lines
                const chartContainer = svg.select("g");
                chartContainer.selectAll(".tick-line").remove();
                
                const yTicks = y.ticks(5);
                const chartWidth = parseInt(svg.attr("width")) - 60;
                
                yTicks.forEach(tickValue => {
                    chartContainer.append("line")
                        .attr("class", "tick-line")
                        .attr("y1", y(tickValue))
                        .attr("x1", 0)
                        .attr("y2", y(tickValue))
                        .attr("x2", chartWidth)
                        .attr("stroke", "#e0e0e0")
                        .attr("stroke-width", 1);
                });
                
                // Update line with increased stroke width
                svg.select(`#line-${config.id}`)
                    .datum(data)
                    .style("stroke-width", isDenseData ? 2.5 : 2)
                    .attr("d", d3.line()
                        .x(d => x(d.date))
                        .y(d => y(d.value)));
                
                // Update circles only if not dense data
                if (!isDenseData) {
                    const circles = chartContainer.selectAll(".chart-circle")
                        .data(data);
                    
                    // Remove old circles
                    circles.exit().remove();
                    
                    // Update existing circles
                    circles.attr("cx", d => x(d.date))
                        .attr("cy", d => y(d.value));
                    
                    // Add new circles
                    circles.enter()
                        .append("circle")
                        .attr("cx", d => x(d.date))
                        .attr("cy", d => y(d.value))
                        .attr("r", 3)
                        .attr("class", "chart-circle")
                        .attr("fill", config.color)
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 1)
                        .attr("clip-path", `url(#clip-${config.id})`);
                }
            }
            
        } catch (error) {
            console.error(`Error updating chart ${config.id}:`, error);
        }
    }, chartUpdateInterval);
}

// Custom tick format function for x-axis dates
function customTickFormat(date, timeRange) {
    const formatSecond = d3.timeFormat("%H:%M:%S");
    const formatMinute = d3.timeFormat("%H:%M");
    const formatDate = d3.timeFormat("%d %b");
    
    // If it's midnight, show the date
    if (date.getHours() === 0 && date.getMinutes() === 0) {
        return formatDate(date);
    } 
    // If less than 5 minutes range, show seconds
    else if (timeRange <= 5 * 60 * 1000) {
        return formatSecond(date);
    } 
    // If less than 15 days range, show hours & minutes
    else if (timeRange <= 15 * 24 * 60 * 60 * 1000) {
        return formatMinute(date);
    } 
    // Otherwise just show date
    else {
        return formatDate(date);
    }
}
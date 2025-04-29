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

// Function to draw a chart using D3.js
async function drawChart(config, startDate, endDate, results = 8000) {
    const selector = `#${config.id}-container`;
    const container = document.querySelector(selector);
    
    // Set fixed dimensions initially, which will be made responsive
    const width = 400;
    const height = 200;
    const margin = {top: 25, right: 20, bottom: 35, left: 40};
    
    // Clear any existing chart
    d3.select(selector).selectAll('svg').remove();
    d3.select(selector).selectAll('.chart-tooltip').remove();
    
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
    
    // Add interactive tooltip
    const tooltip = d3.select(selector)
        .append("div")
        .attr("class", "chart-tooltip")
        .style("opacity", 0);
    
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
        
        // Draw the line
        g.append("path")
            .datum(data)
            .attr("class", "chart-line")
            .attr("id", `line-${config.id}`)
            .style("stroke", config.color)
            .attr("d", d3.line()
                .x(d => x(d.date))
                .y(d => y(d.value)))
            .attr("clip-path", `url(#clip-${config.id})`);
        
        // Add data points
        g.selectAll(".chart-circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.value))
            .attr("r", 3)
            .attr("class", "chart-circle")
            .attr("fill", config.color)
            .attr("clip-path", `url(#clip-${config.id})`)
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(100)
                    .style("opacity", 0.9);
                
                const originalDate = new Date(d.date);
                tooltip.html(
                    `${response.channel[fieldName]}: <b>${d.value}</b><br>` +
                    `${originalDate.toDateString()}<br>` +
                    `${originalDate.toTimeString().replace(/\([^)]*\)/, '')}`
                )
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
                
                d3.select(this)
                    .attr("r", 5)
                    .attr("stroke", "white");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                
                d3.select(this)
                    .attr("r", 3)
                    .attr("stroke", null);
            });
        
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
            setupLiveUpdates(config, data, x, y, response.channel[fieldName]);
        }
        
    } catch (error) {
        console.error(`Error loading chart ${config.id}:`, error);
        container.querySelector('.loader').textContent = 'Feil ved lasting av data';
    }
}

// Function to update a chart with new data
function setupLiveUpdates(config, data, x, y, fieldTitle) {
    const selector = `#${config.id}-container`;
    const lastDataUrl = `https://api.thingspeak.com/channels/${config.channel}/feeds/last.json?timezone=${timezone}`;
    
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
                
                // Update line
                svg.select(`#line-${config.id}`)
                    .datum(data)
                    .attr("d", d3.line()
                        .x(d => x(d.date))
                        .y(d => y(d.value)));
                
                // Update circles
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
                    .attr("clip-path", `url(#clip-${config.id})`)
                    .on("mouseover", function(event, d) {
                        const tooltip = d3.select(selector).select(".chart-tooltip");
                        tooltip.transition()
                            .duration(100)
                            .style("opacity", 0.9);
                        
                        const originalDate = new Date(d.date);
                        tooltip.html(
                            `${fieldTitle}: <b>${d.value}</b><br>` +
                            `${originalDate.toDateString()}<br>` +
                            `${originalDate.toTimeString().replace(/\([^)]*\)/, '')}`
                        )
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                        
                        d3.select(this)
                            .attr("r", 5)
                            .attr("stroke", "white");
                    })
                    .on("mouseout", function() {
                        const tooltip = d3.select(selector).select(".chart-tooltip");
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                        
                        d3.select(this)
                            .attr("r", 3)
                            .attr("stroke", null);
                    });
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
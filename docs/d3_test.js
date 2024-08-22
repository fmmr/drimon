
async function drawChart(selector) {
	const title_height = 16;
	const reverse_axis_left = 15;
	const columnWidthRatio = 0.9;
	const barWidthRatio = 0.85;
	const splineTension = 0.8;
	const minBarColumnWidth = 1;
	const maxBarColumnWidth = 10;
	const tickValueThreshold = 1e24;
	let last_date;

	var svg = d3.select(selector).append("svg").attr('width', 400).attr('height', 200);
    var margin = {top: 20, right: 20, bottom: 35, left: 40};
    var width = +svg.attr("width") - margin.left - margin.right;
    var height = +svg.attr("height") - margin.top - margin.bottom;
    var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	// add rectangle for chart
//	var svg = d3.select("#chart-container").append("svg")
//		.attr("width", width + margin.left + margin.right)
//		.attr("height", height + margin.top + margin.bottom + title_height)
//		.append("g")
//		.attr("transform", `translate(${margin.left},${margin.top + title_height})`);

	// the url to fetch data
	const dataUrl = 'https://api.thingspeak.com/channels/2568299/field/1.json?&amp;offset=0&amp;timezone=Europe/Paris&amp;start=2024-08-18 00:00:00&amp;results=8000&amp;round=2';
	try {
		const response = await d3.json(dataUrl);
		if (response == '-1') {
			$(selector).append('This channel is not public.  To embed charts, the channel must be public or a read key must be specified.');
		}
		const responsedata = response.feeds;
		let data = responsedata
			.filter(d => {
				const value = parseFloat(d.field1);
				return !isNaN(value) && isFinite(value);
			})
			.map(d => ({
				date: Date.parse(d.created_at),
				value: parseFloat(d.field1)
			}));

		svg.append('text')
			.attr('x', width / 2)
			.attr('y', -title_height / 4)
			.attr("class", "chart-title")
			.text(decodeURIComponent('Temperatur'));
		// title

		let x;
		let y;

		function getTimeRange(data) {
			const startTime = d3.min(data, d => d.date);
			const endTime = d3.max(data, d => d.date);
			return endTime - startTime;
		}

		function customTickFormat(date, timeRange) {
			// This function determines the tick format based on 
			// the overall time distribution of the data.
			// if the total time range is within 5 minutes, using %H:%M:%S like 10:11:20
			// if the time range is within 15 days, using %H:%M like 11:25
			// Otherwise it only contains date information.
			// And for the mid night time tick, it will only show the date information as well

			const formatSecond = d3.timeFormat("%H:%M:%S");
			const formatMinute = d3.timeFormat("%H:%M");
			const formatDate = d3.timeFormat("%d %b");

			if (date.getHours() === 0 && date.getMinutes() === 0) {
				return formatDate(date);
			} else if (timeRange <= 5 * 60 * 1000) {
				return formatSecond(date); // less than 5 minutes, using %H:%M:%S
			} else if (timeRange <= 15 * 24 * 60 * 60 * 1000) {
				return formatMinute(date); // less than 15 days, using %H:%M
			} else {
				return formatDate(date);
			}
		}

		function setAxis(data) {
			const timeRange = getTimeRange(data);
			x = d3.scaleTime()
				.domain(d3.extent(data, d => d.date))
				.range([0, width]);

			svg.append("g")
				.attr("transform", `translate(0,${height})`)
				.attr("class", "x-axis")
				.call(d3.axisBottom(x).ticks(4).tickFormat(d => customTickFormat(d, timeRange)).tickSizeOuter(0))
				.call(g => g.selectAll(".domain, .tick").classed("chart-x-axis-label", true))
				.lower()
				.append("text")
				.attr("y", margin.bottom * 2 / 3)
				.attr("x", width / 2)
				.attr("class", "chart-xaxis")
				.text(decodeURIComponent(''));
			// x axis

			const dataExtent = d3.extent(data, d => d.value);
			const yminValue = dataExtent[0] - 0.05 * (dataExtent[1] - dataExtent[0]);
			const ymaxValue = dataExtent[1] + 0.05 * (dataExtent[1] - dataExtent[0]);

			y = d3.scaleLinear()
				.domain([yminValue, ymaxValue])
				.range([height, 0]);
			let yTicks = y.ticks(5, "s");
			yTicks.forEach(function(tickValue) {
				svg.append("line")
					.attr("class", "tick-line")
					.attr("y1", y(tickValue))
					.attr("x1", 0)
					.attr("y2", y(tickValue))
					.attr("x2", width)
					.attr("stroke", "#e0e0e0")
					.attr("stroke-width", 1)
					.lower();
			});


			function customValueTickFormatY(d) {
				// When the tick label's number is greater than 1e24, 
				// only the highest two significant digits are retained, 
				// followed by an "E" at the end. In other cases, the default tick format of d3.js is used.
				// for example:
				// 3e+125 -> 3.0E

				if (d >= tickValueThreshold) {
					const dStr = d.toExponential();
					const [base, exponent] = dStr.split('e');
					const significantDigits = base.replace(/[^0-9]/g, '').slice(0, 3).padEnd(3, '0');
					const roundedValue = Math.round(parseInt(significantDigits) / 10);
					const result = roundedValue.toString().padEnd(2, '0');

					return `${result[0]}.${result[1]}E`;
				} else {
					return y.tickFormat()(d);
				}
			}

			svg.append("g")
				.attr("class", "y-axis")
				.call(d3.axisLeft(y)
					.ticks(5, "s")
					.tickFormat(d => customValueTickFormatY(d))
					.tickSizeOuter(0))
				.call(g => g.selectAll(".domain, .tick line").remove())
				.call(g => g.selectAll(".domain, .tick").classed("chart-y-axis-label", true))
				.lower()
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", -45)
				.attr("x", -height / 2)
				.attr("class", "chart-yaxis")
				.text(response.channel.field1);
			// y axis
		}

		function removeAxis() {
			svg.select(".x-axis").remove();
			svg.select(".y-axis").remove();
			svg.selectAll(".tick-line").remove();
		}

		// add interactive tooltip
		const tooltip = d3.select(selector)
			.append("div")
			.style("opacity", 0)
			.attr("class", "tooltip chart-tooltip");


		function mouseover(type) {
			return function(event, d) {
				// console.log(event);
				tooltip.transition()
					.duration(100)
					.style("opacity", 0.8);

				let originalDate = new Date(d.date);
				tooltip.html(
						`${response.channel.field1}: <b>${d.value}</b><br>` +
						`${originalDate.toDateString()}<br>` +
						`${originalDate.toTimeString().replace(/\(.*\)/, "")}`
					)
					.style("left",event.clientX + "px")
					.style("top", event.clientY + "px")
					.style("opacity", 0.8)
					.style("visibility", "visible")
					.style("position", "absolute");
				if (type == "column" || type == "bar") {
					const brightColor = d3.color('#d62020').brighter();
					d3.select(this).attr("fill", brightColor);
				} else {
					d3.select(this).attr("stroke", 'white');
				}
				d3.select(this).attr("r", "5");
			}
		}

		function mouseleave(d) {
			tooltip
				.transition()
				.duration(700)
				.style("opacity", 0)
			tooltip
				.transition()
				.delay(700)
				.style("visibility", "hidden");
			d3.select(this).attr("stroke", null);
			d3.select(this).attr("r", "3.5");
			d3.select(this).attr("fill", '#d62020');
		}

		svg.append("defs").append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("x", -width)
			.attr("y", 0)
			.attr("width", width * 3)
			.attr("height", height);

		svg.append("defs").append("clipPath")
			.attr("id", "clipReverse")
			.append("rect")
			.attr("x", 0)
			.attr("y", -height)
			.attr("width", width)
			.attr("height", height * 3);

		setAxis(data);
		svg.append("path")
			.datum(data)
			.attr("class", "chart-line")
			.attr("id", "visualization_chart")
			.style("stroke", '#d62020')
			.attr("d", d3.line()
				.x(d => x(d.date))
				.y(d => y(d.value))
			).attr("clip-path", "url(#clip)");
		svg.append('g')
			.selectAll("dot")
			.data(data)
			.enter()
			.append("circle")
			.attr("cx", function(d) {
				return x(d.date);
			})
			.attr("cy", function(d) {
				return y(d.value);
			})
			.attr("r", 3.5)
			.attr("class", "chart-circle")
			.attr("fill", '#d62020')
			.on("mouseover", mouseover("line"))
			.on("mouseleave", mouseleave)
			.attr("clip-path", "url(#clip)");


//		let calculatePosX = function(x) {
//			return x > 200 ? x - 200 : x + 20;
//		}
//
//		let calculatePosY = function(y) {
//			return y > height - 30 ? height - 30 : y;
//		}

		// copyright
		svg.append("text")
			.attr("x", width)
			.attr("y", height + margin.bottom * 5 / 6)
			.attr("class", "chart-copyright")
			.text("drimon")
			.on("click", () => {
				window.top.location.href = "https://drimon.rodland.no/";
			});

		$('#loader-gif').remove();

		let url = 'https://api.thingspeak.com/channels/2568299/feed/last.json?&amp;offset=0&amp;location=true&amp;timezone=Europe/Paris&amp;start=2024-08-18 00:00:00&amp;results=8000&amp;round=2';

		setInterval(() => {
			d3.json(url).then(
				function(updatedata) {
					if (updatedata && updatedata.field1) {
						if (data.length > 0) {
							last_date = data[data.length - 1].date;
						}
						const newpoint = {
							date: Date.parse(updatedata.created_at),
							value: parseFloat(updatedata.field1)
						};
						let shift = false; //default for shift
						let results = 8000;
						if (results && data.length + 1 >= results) {
							shift = true;
						}
						if (!isNaN(newpoint.value) && (newpoint.date != last_date)) {
							if (shift) {
								data.shift();
							}
							data.push(newpoint);
						} else {
							data[data.length - 1] = newpoint;
						}

						removeAxis();
						setAxis(data);
						svg.select("#visualization_chart")
							.datum(data)
							.style("stroke", '#d62020')
							.attr("d", d3.line()
								.x(d => x(d.date))
								.y(d => y(d.value))
							).attr("clip-path", "url(#clip)");

						svg.selectAll("circle")
							.data(data)
							.join(
								enter => enter.append("circle")
								.attr("cx", d => x(d.date))
								.attr("cy", d => y(d.value))
								.attr("r", 3.5)
								.attr("fill", '#d62020')
								.attr("class", "chart-circle")
								.on("mouseover", mouseover("line"))
								.on("mouseleave", mouseleave)
								.attr("clip-path", "url(#clip)"),
								update => update
								.attr("cx", d => x(d.date))
								.attr("cy", d => y(d.value))
								.attr("fill", '#d62020')
								.on("mouseover", mouseover("line"))
								.on("mouseleave", mouseleave)
								.attr("clip-path", "url(#clip)"),
								exit => exit.remove()
							);
					}

				}
			);
		}, 15000);


	} catch (error) {
		console.log("got an error!")
		console.log(error)
	}
}

drawChart("#chart1");
drawChart("#chart2");

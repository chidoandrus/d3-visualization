// Set dimensions for the bubble chart
const margin = { top: 20, right: 20, bottom: 50, left: 50 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create an SVG element to hold the bubble chart
const svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create scales
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);
const r = d3.scaleSqrt().range([2, 20]);

// Create axes
const xAxis = d3.axisBottom(x);
const yAxis = d3.axisLeft(y);

// Create zoom and pan
const zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

svg.call(zoom);

function zoomed(event) {
    const { transform } = event;
    const newX = transform.rescaleX(x);
    const newY = transform.rescaleY(y);
    svg.selectAll(".bubble")
        .attr("cx", d => newX(d.Date))
        .attr("cy", d => newY(d.Depth));
    svg.select(".x-axis").call(d3.axisBottom(newX));
    svg.select(".y-axis").call(d3.axisLeft(newY));
}

// Create tooltip
const tooltip = d3.select("#tooltip");

// Load the earthquake data
d3.csv("Mag6PlusEarthquakes_1900-2013.csv").then(function(data) {
    // Parse the data
    data.forEach(d => {
        d.Date = new Date(d.Date);
        d.Depth = +d.Depth;
        d.Magnitude = +d.Magnitude;
    });

    // Set domains for the scales
    x.domain(d3.extent(data, d => d.Date));
    y.domain([0, d3.max(data, d => d.Depth)]);
    r.domain([0, d3.max(data, d => d.Magnitude)]);

    // Add axes
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
      .append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", 40)
        .style("text-anchor", "middle")
        .text("Date");

    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
      .append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .text("Depth (km)");

    // Add legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 150}, 30)`);

    legend.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Magnitude Legend:");

    const legendData = [6, 7, 8, 9, 10];
    legend.selectAll("circle")
        .data(legendData)
        .enter().append("circle")
        .attr("cx", 0)
        .attr("cy", (d, i) => 20 + i * 20)
        .attr("r", d => r(d))
        .style("fill", "steelblue");

    legend.selectAll("text.legend-text")
        .data(legendData)
        .enter().append("text")
        .attr("class", "legend-text")
        .attr("x", 20)
        .attr("y", (d, i) => 25 + i * 20)
        .text(d => d);

    // Function to update the chart based on filters
    function updateChart(filteredData) {
        // Remove existing bubbles
        svg.selectAll(".bubble").remove();

        // Add bubbles
        svg.selectAll(".bubble")
            .data(filteredData)
            .enter().append("circle")
            .attr("class", "bubble")
            .attr("cx", d => x(d.Date))
            .attr("cy", d => y(d.Depth))
            .attr("r", d => r(d.Magnitude))
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .html(`Magnitude: ${d.Magnitude}<br>Date: ${d.Date.toISOString().split('T')[0]}<br>Depth: ${d.Depth} km`);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            });

        // Data summary
        const summary = d3.select("#summary");
        summary.html(`
            <p>Total Earthquakes: ${filteredData.length}</p>
            <p>Average Magnitude: ${(d3.mean(filteredData, d => d.Magnitude)).toFixed(2)}</p>
            <p>Average Depth: ${(d3.mean(filteredData, d => d.Depth)).toFixed(2)} km</p>
        `);
    }

    // Initial chart update
    updateChart(data);

    // Add event listeners for search and filter
    d3.select("#search").on("input", function() {
        const searchDate = new Date(this.value);
        const filteredData = data.filter(d => d.Date.toISOString().split('T')[0] === searchDate.toISOString().split('T')[0]);
        updateChart(filteredData);
    });

    d3.select("#magnitude-filter").on("input", function() {
        const minMagnitude = +this.value;
        d3.select("#magnitude-value").text(minMagnitude);
        const filteredData = data.filter(d => d.Magnitude >= minMagnitude);
        updateChart(filteredData);
    });

    d3.select("#depth-filter").on("input", function() {
        const maxDepth = +this.value;
        d3.select("#depth-value").text(maxDepth);
        const filteredData = data.filter(d => d.Depth <= maxDepth);
        updateChart(filteredData);
    });

    // Add annotations
    const significantEarthquakes = data.filter(d => d.Magnitude >= 9);
    svg.selectAll(".annotation")
        .data(significantEarthquakes)
        .enter().append("text")
        .attr("class", "annotation")
        .attr("x", d => x(d.Date))
        .attr("y", d => y(d.Depth) - 10)
        .text(d => `M${d.Magnitude}`);
});

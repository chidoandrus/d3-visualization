// Function to update the chart
function updateChart(data) {
    try {
        const minMagnitude = +document.getElementById('magnitude-filter').value;
        const maxMagnitude = 10;
        const maxDepth = +document.getElementById('depth-filter').value;

        const filteredData = data.filter(d => d.Magnitude >= minMagnitude && d.Magnitude <= maxMagnitude && d.Depth <= maxDepth);

        const meanMagnitude = d3.mean(filteredData, d => d.Magnitude);
        const summary = d3.select("#summary");
        if (!meanMagnitude) {
            summary.text("No data available for the selected filters.");
            return;
        }

        summary.text(`Average Magnitude: ${meanMagnitude.toFixed(2)}`);

        const chart = d3.select("#chart");
        const circles = chart.selectAll("circle").data(filteredData);

        circles.enter()
            .append("circle")
            .merge(circles)
            .attr("cx", d => xScale(d.Date))
            .attr("cy", d => yScale(d.Magnitude))
            .attr("r", d => {
                const radius = radiusScale(d.Magnitude);
                return isNaN(radius) ? 0 : radius;
            })
            .attr("class", "bubble");

        circles.exit().remove();
    } catch (error) {
        console.error("Error updating chart:", error);
    }
}

// Initializing the chart
d3.csv("Mag6PlusEarthquakes_1900-2013.csv").then(data => {
    data.forEach(d => {
        d.Date = new Date(d.Date);
        d.Magnitude = +d.Magnitude;
        d.Depth = +d.Depth;
    });
    updateChart(data);
}).catch(error => {
    console.error("Error loading data:", error);
});

// Function to initialize the chart
function initializeChart() {
    const svg = d3.select("#chart").append("svg")
        .attr("width", 960)
        .attr("height", 500);

    xScale = d3.scaleTime().range([0, 960]);
    yScale = d3.scaleLinear().range([500, 0]);
    radiusScale = d3.scaleSqrt().range([0, 20]);

    svg.append("g")
        .attr("transform", "translate(0, 500)")
        .attr("class", "x-axis");

    svg.append("g")
        .attr("class", "y-axis");
}

// Set up event listeners for filters
document.getElementById('magnitude-filter').addEventListener('input', function() {
    document.getElementById('magnitude-value').innerText = this.value;
    updateChart(currentData);
});

document.getElementById('depth-filter').addEventListener('input', function() {
    document.getElementById('depth-value').innerText = this.value;
    updateChart(currentData);
});

// Initialize the chart
initializeChart();

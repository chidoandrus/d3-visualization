let xScale, yScale, radiusScale, currentData;

function updateChart(data) {
    const minMagnitude = +document.getElementById('magnitude-filter').value;
    const maxMagnitude = 10;
    const maxDepth = +document.getElementById('depth-filter').value;

    const filteredData = data.filter(d => {
        const isValidMagnitude = d.mag >= minMagnitude && d.mag <= maxMagnitude;
        const isValidDepth = d.depth <= maxDepth;
        return isValidMagnitude && isValidDepth;
    });

    console.log("Filtered Data Length:", filteredData.length); // Debugging
    console.log("Filtered Data Sample:", filteredData.slice(0, 5)); // Debugging

    if (filteredData.length === 0) {
        console.log("No data matches the filter criteria."); // Debugging
        d3.select("#summary").text("No data available for the selected filters.");
        return;
    }

    const meanMagnitude = d3.mean(filteredData, d => d.mag);
    d3.select("#summary").text(`Average Magnitude: ${meanMagnitude.toFixed(2)}`);

    const svg = d3.select("#chart").select("svg");
    const circles = svg.selectAll("circle").data(filteredData, d => d.id);

    circles.enter()
        .append("circle")
        .attr("cx", d => xScale(d.Date))
        .attr("cy", d => yScale(d.mag))
        .attr("r", d => radiusScale(d.mag))
        .attr("class", "bubble");

    circles.attr("cx", d => xScale(d.Date))
        .attr("cy", d => yScale(d.mag))
        .attr("r", d => radiusScale(d.mag));

    circles.exit().remove();
}

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

    d3.csv("Mag6PlusEarthquakes_1900-2013.csv").then(data => {
        data.forEach(d => {
            d.Date = new Date(d.Date);
            d.mag = +d.mag;
            d.depth = +d.depth;
        });

        currentData = data;
        console.log("Loaded Data Length:", data.length); // Debugging
        console.log("Loaded Data Sample:", data.slice(0, 5)); // Debugging

        if (data.length === 0) {
            console.log("No data loaded from the CSV file."); // Debugging
            return;
        }

        const extentX = d3.extent(data, d => d.Date);
        const extentY = d3.extent(data, d => d.mag);

        console.log("Extent X:", extentX); // Debugging
        console.log("Extent Y:", extentY); // Debugging

        xScale.domain(extentX);
        yScale.domain(extentY);
        radiusScale.domain(extentY);

        svg.select(".x-axis")
            .call(d3.axisBottom(xScale));

        svg.select(".y-axis")
            .call(d3.axisLeft(yScale));

        updateChart(data);
    }).catch(error => {
        console.error("Error loading data:", error);
    });
}

document.getElementById('magnitude-filter').addEventListener('input', function() {
    document.getElementById('magnitude-value').innerText = this.value;
    updateChart(currentData);
});

document.getElementById('depth-filter').addEventListener('input', function() {
    document.getElementById('depth-value').innerText = this.value;
    updateChart(currentData);
});

initializeChart();

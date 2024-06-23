let width = 960;
let height = 500;
let projection, path, colorScale, hexbin, currentData;

function updateChart(data) {
    const minMagnitude = +document.getElementById('magnitude-filter').value;
    const maxMagnitude = 10;
    const maxDepth = +document.getElementById('depth-filter').value;

    const filteredData = data.filter(d => {
        const isValidMagnitude = d.mag >= minMagnitude && d.mag <= maxMagnitude;
        const isValidDepth = d.depth <= maxDepth;
        return isValidMagnitude && isValidDepth;
    });

    if (filteredData.length === 0) {
        d3.select("#summary").text("No data available for the selected filters.");
        return;
    }

    const meanMagnitude = d3.mean(filteredData, d => d.mag);
    d3.select("#summary").text(`Average Magnitude: ${meanMagnitude.toFixed(2)}`);

    const svg = d3.select("#chart svg").select("g");
    const hexData = hexbin(filteredData.map(d => [projection([d.longitude, d.latitude])[0], projection([d.longitude, d.latitude])[1], d.mag, d]));

    const hexagons = svg.selectAll(".hexagon").data(hexData);

    hexagons.enter()
        .append("path")
        .attr("class", "hexagon")
        .attr("d", hexbin.hexagon())
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .style("fill", d => colorScale(d3.mean(d, p => p[2])))
        .style("opacity", 0.6)
        .merge(hexagons)
        .transition()
        .duration(750)
        .attr("d", hexbin.hexagon())
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .style("fill", d => colorScale(d3.mean(d, p => p[2])))
        .style("opacity", 0.6);

    hexagons.exit().remove();

    svg.selectAll(".hexagon")
        .on("mouseover", function(event, d) {
            const tooltip = d3.select("#tooltip");
            const earthquakeData = d[0][3];
            tooltip.style("display", "block")
                .html(`
                    <strong>Id:</strong> ${earthquakeData.id}<br>
                    <strong>Location:</strong> ${earthquakeData.place}<br>
                    <strong>Type:</strong> ${earthquakeData.type}<br>
                    <strong>Updated:</strong> ${earthquakeData.updated}<br>
                    <strong>Latitude:</strong> ${earthquakeData.latitude}<br>
                    <strong>Longitude:</strong> ${earthquakeData.longitude}<br>
                    <strong>Magnitude:</strong> ${earthquakeData.mag}
                `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select("#tooltip").style("display", "none");
        });
}

function initializeChart() {
    const svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .call(d3.zoom().on("zoom", function (event) {
            svg.attr("transform", event.transform);
        }))
        .append("g");

    function updateProjection() {
        projection = d3.geoMercator().scale(150).translate([width / 2, height / 1.5]);
        path = d3.geoPath().projection(projection);
    }

    updateProjection();

    colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 10]);
    hexbin = d3.hexbin().radius(5).extent([[0, 0], [width, height]]);

    svg.append("g").attr("class", "countries");

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(worldData => {
        svg.selectAll(".country")
            .data(worldData.features)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", path)
            .style("fill", "#e0e0e0")
            .style("stroke", "#333");

        d3.csv("Mag6PlusEarthquakes_1900-2013.csv").then(data => {
            data.forEach(d => {
                d.Date = new Date(d.Date);
                d.mag = +d.mag;
                d.depth = +d.depth;
                d.latitude = +d.latitude;
                d.longitude = +d.l

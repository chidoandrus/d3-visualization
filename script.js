const width = 960;
const height = 500;
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

    const svg = d3.select("#chart").select("svg g");
    const hexData = hexbin(filteredData.map(d => [projection([d.longitude, d.latitude])[0], projection([d.longitude, d.latitude])[1], d.mag]));

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

    // Tooltip functionality
    svg.selectAll(".hexagon")
        .on("mouseover", function(event, d) {
            const tooltip = d3.select("#tooltip");
            tooltip.style("display", "block")
                .html(`Average Magnitude: ${d3.mean(d, p => p[2]).toFixed(2)}<br>Count: ${d.length}`)
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
        .call(d3.zoom().on("zoom", function (event) { // Enable zooming and panning
            svg.attr("transform", event.transform)
        }))
        .append("g");

    projection = d3.geoMercator().scale(150).translate([width / 2, height / 1.5]);
    path = d3.geoPath().projection(projection);
    colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 10]);
    hexbin = d3.hexbin().radius(5).extent([[0, 0], [width, height]]); // Adjusted hexbin radius to 5

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
                d.longitude = +d.longitude;
                d.id = `${d.Date.getTime()}-${d.latitude}-${d.longitude}`;
            });

            currentData = data;
            console.log("Loaded Data Length:", data.length);
            console.log("Loaded Data Sample:", data.slice(0, 5));

            updateChart(data);
        }).catch(error => {
            console.error("Error loading data:", error);
        });
    }).catch(error => {
        console.error("Error loading world map data:", error);
    });
}

function zoomToLocation(lat, lon) {
    console.log(`Zoom to location: Latitude: ${lat}, Longitude: ${lon}`);
    const [x, y] = projection([lon, lat]);
    console.log(`Projected coordinates: x: ${x}, y: ${y}`);

    const svg = d3.select("#chart").select("svg");
    svg.transition().duration(750).call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(width / 2 - x, height / 2 - y).scale(4)
    );
}

function addAnnotation(lat, lon, text) {
    console.log(`Add annotation at: Latitude: ${lat}, Longitude: ${lon}, Text: ${text}`);
    const [x, y] = projection([lon, lat]);
    console.log(`Projected coordinates for annotation: x: ${x}, y: ${y}`);
    d3.select("svg").append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("class", "annotation")
        .text(text)
        .style("fill", "red")
        .style("font-size", "12px")
        .style("font-weight", "bold");
}

document.getElementById('magnitude-filter').addEventListener('input', function() {
    document.getElementById('magnitude-value').innerText = this.value;
    updateChart(currentData);
});

document.getElementById('depth-filter').addEventListener('input', function() {
    document.getElementById('depth-value').innerText = this.value;
    updateChart(currentData);
});

document.getElementById('search-btn').addEventListener('click', function() {
    const lat = +document.getElementById('latitude').value;
    const lon = +document.getElementById('longitude').value;
    zoomToLocation(lat, lon);
});

document.getElementById('annotate-btn').addEventListener('click', function() {
    const lat = +document.getElementById('latitude').value;
    const lon = +document.getElementById('longitude').value;
    const text = document.getElementById('annotation-text').value;
    addAnnotation(lat, lon, text);
});

initializeChart();

const width = 960;
const height = 500;
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const projection = d3.geoMercator().scale(150).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

const g = svg.append("g");

d3.json("https://d3js.org/world-50m.v1.json").then(world => {
  g.append("path")
    .datum(topojson.feature(world, world.objects.countries))
    .attr("d", path)
    .attr("class", "country");

  d3.csv("Mag6PlusEarthquakes_1900-2013.csv").then(data => {
    data.forEach(d => {
      d.latitude = +d.latitude;
      d.longitude = +d.longitude;
      d.magnitude = +d.magnitude;
    });

    const hexbin = d3.hexbin()
      .radius(10)
      .extent([[0, 0], [width, height]]);

    const hexbinData = hexbin(data.map(d => projection([d.longitude, d.latitude])));

    const color = d3.scaleSequential(d3.extent(data, d => d.magnitude), d3.interpolateYlGnBu);

    g.append("g")
      .attr("class", "hexagon")
      .selectAll("path")
      .data(hexbinData)
      .enter()
      .append("path")
      .attr("d", hexbin.hexagon())
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("fill", d => color(d3.mean(d, d => d.magnitude)))
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip");

    function handleMouseOver(event, d) {
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`Average Magnitude: ${d3.mean(d, d => d.magnitude).toFixed(2)}<br>Count: ${d.length}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
    }

    function handleMouseOut(event, d) {
      tooltip.transition().duration(500).style("opacity", 0);
    }

    d3.select("#magFilter").on("input", updateChart);
    d3.select("#depthFilter").on("input", updateChart);

    function updateChart() {
      const magFilter = +d3.select("#magFilter").property("value");
      const depthFilter = +d3.select("#depthFilter").property("value");

      const filteredData = hexbin(data.filter(d => d.magnitude >= magFilter && d.depth <= depthFilter)
        .map(d => projection([d.longitude, d.latitude])));

      g.selectAll(".hexagon path")
        .data(filteredData)
        .join("path")
        .attr("d", hexbin.hexagon())
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("fill", d => color(d3.mean(d, d => d.magnitude)))
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);
    }

    d3.select("#zoomBtn").on("click", () => {
      const latitude = +d3.select("#latitude").property("value");
      const longitude = +d3.select("#longitude").property("value");
      const annotation = d3.select("#annotation").property("value");

      if (latitude && longitude) {
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(4)
            .translate(-projection([longitude, latitude])[0], -projection([latitude, longitude])[1]));

        g.append("text")
          .attr("x", projection([longitude, latitude])[0])
          .attr("y", projection([latitude, longitude])[1])
          .attr("dy", ".35em")
          .attr("fill", "red")
          .text(annotation);
      }
    });

    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
  });
});

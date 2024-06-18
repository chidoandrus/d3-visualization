// Load and parse the data
d3.csv('API_CM.MKT.TRAD.GD.ZS_DS2_en_csv_v2_146230.csv').then(function(data) {
    console.log("Raw data:", data); // Add this line to log the raw data
    
    // Process the data
    const parseYear = d3.timeParse("%Y");
    const countries = data.filter(d => d['Country Name'] && d['Country Code']).map(d => {
        return {
            country: d['Country Name'],
            values: Object.keys(d).filter(key => !isNaN(parseYear(key))).map(key => {
                return { year: parseYear(key), value: +d[key] };
            }).filter(d => !isNaN(d.value))
        };
    });

    console.log("Processed countries:", countries); // Add this line to log the processed data

    // Populate the country select options
    const countrySelect = d3.select("#country-select");
    countries.forEach(c => {
        countrySelect.append("option")
            .attr("value", c.country)
            .text(c.country);
    });

    // Set up the SVG and dimensions
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    x.domain([parseYear("1960"), parseYear("2023")]);
    y.domain([0, d3.max(countries, c => d3.max(c.values, d => d.value))]);

    // Set up axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
    svg.append("g")
        .call(d3.axisLeft(y));

    // Define the line
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value));

    // Add tooltips
    const tooltip = d3.select("#tooltip");

    function update(selectedCountries) {
        // Filter data based on selected countries
        const filteredData = countries.filter(c => selectedCountries.includes(c.country));

        console.log("Filtered data:", filteredData); // Add this line to log the filtered data

        // Remove existing lines
        svg.selectAll(".line").remove();
        svg.selectAll(".dot").remove();

        // Add the lines
        svg.selectAll(".line")
          .data(filteredData)
          .enter().append("path")
            .attr("class", "line")
            .attr("d", d => line(d.values))
            .style("stroke", d => d3.schemeCategory10[filteredData.indexOf(d) % 10]);

        // Add the dots
        svg.selectAll(".dot")
          .data(filteredData.flatMap(c => c.values.map(v => ({ country: c.country, ...v }))))
          .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.value))
            .attr("r", 5)
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                       .html(`Country: ${d.country}<br>Year: ${d3.timeFormat("%Y")(d.year)}<br>Value: ${d.value}`);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY - 10) + "px")
                       .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            });
    }

    // Initial update with all countries
    update(countries.map(c => c.country));

    // Update chart based on selected countries
    countrySelect.on("change", function() {
        const selectedCountries = Array.from(this.selectedOptions).map(option => option.value);
        update(selectedCountries);
    });
});

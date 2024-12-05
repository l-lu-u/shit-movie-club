// Set dimensions and margins
const width = 1200;
const height = 800;
const margin = { top: 20, right: 20, bottom: 20, left: 70 };

// Append SVG
const svg = d3.select("#bubble-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Load JSON data
d3.json("./data/movies.json").then(function (data) {
    // Process data
    const processedData = data.data.map((d) => ({
        id: d.id,
        title: d.title,
        director: d.director ? d.director.split(",").map((s) => s.trim()) : [],
        yearProduction: +d.year_production,
        screeningDate: d.when ? d3.timeParse("%m/%Y")(d.when) : null,
        genres: d.genres ? d.genres.split(",").map((s) => s.trim()) : [],
        languages: d.languages ? d.languages.split(",").map((s) => s.trim()) : [],
        duration: +d.duration || 0,
        link: d.link,
    }));

    // Sort data by screeningDate, then by id
    processedData.sort((a, b) => {
        if (a.screeningDate < b.screeningDate) return -1;
        if (a.screeningDate > b.screeningDate) return 1;
        return a.id.localeCompare(b.id);
    });

    // Scales
    const xScale = d3.scaleTime()
        .domain([new Date(2023, 0, 1), new Date(2024, 11, 31)]) // Jan 2023 to Dec 2024
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([
            Math.floor(d3.min(processedData, (d) => d.yearProduction) / 5) * 5,
            Math.ceil(d3.max(processedData, (d) => d.yearProduction) / 5) * 5,
        ])
        .range([height - margin.bottom, margin.top]);

    // Axis generators
    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(1)) // Tick every month
        .tickFormat(d3.timeFormat("%m/%Y"));

        const yAxis = d3.axisLeft(yScale)
        .tickValues(
            d3.range(
                Math.floor(d3.min(processedData, (d) => d.yearProduction) / 5) * 5,
                Math.ceil(d3.max(processedData, (d) => d.yearProduction) / 5) * 5 + 1,
                5
            )
        )
        .tickFormat(d3.format("d"));

    // Draw axes
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxis);

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis);

    // Add Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left / 2)
        .attr("x", -(height / 2))
        .style("text-anchor", "middle")
        .text("Production Year");

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "10px")
        .style("border-radius", "5px");

    // Add bubbles
    const offset = 5; // Offset bubbles by this amount when they overlap
    const bubblePositions = {};

    svg.selectAll("circle")
        .data(processedData)
        .enter()
        .append("circle")
        .attr("cx", (d) => {
            const baseX = xScale(d.screeningDate);
            if (!bubblePositions[d.screeningDate]) bubblePositions[d.screeningDate] = baseX;
            else bubblePositions[d.screeningDate] += offset;
            return bubblePositions[d.screeningDate];
        })
        .attr("cy", (d) => yScale(d.yearProduction))
        .attr("r", (d) => Math.sqrt(d.duration) * 1.5) // Scaled radius
        .style("fill", "darkkhaki")
        .style("opacity", 0.7)
        .on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible")
                .html(
                    `<strong>${d.title}</strong><br>` +
                    `Director: ${d.director.join(", ")}<br>` +
                    `Year: ${d.yearProduction}<br>` +
                    `Duration: ${d.duration} min<br>` +
                    `Genres: ${d.genres.join(", ")}<br>` +
                    `<a href="${d.link}" target="_blank">More Info</a>`
                )
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
            d3.select(this).style("stroke", "black").style("opacity", 1);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
            d3.select(this).style("stroke", "none").style("opacity", 0.7);
        });
});

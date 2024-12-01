const width = 1000;
const height = 800;
const margin = { top: 20, right: 20, bottom: 50, left: 50 };

const svg = d3.select("#bubble-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

d3.json("./data/data.json").then(function(data) {

    const processedData = data.data.map(d => ({
        id: d.id,
        title: d.title,
        year: +d.year,
        duration: +d.duration || 0,
        genres: d.genres,
        languages: d.languages,
        link: d.link,
        screeningDate: d.when ? d.when.split('/').reverse().join('-') : null
    }));

    console.log(processedData);

    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(processedData, d => d.duration)])
        .range([5, 40]);

    const minYear = d3.min(processedData, d => d.year);
    const maxYear = d3.max(processedData, d => d.year);

    const yearTicks = d3.range(minYear - (minYear % 10), maxYear + 1, 10);

    const yScale = d3.scaleLinear()
        .domain([minYear, maxYear])  
        .range([height - margin.bottom, margin.top]);  

    const parseDate = d3.timeParse("%Y-%m"); 
    const xScale = d3.scaleTime()
        .domain(d3.extent(processedData.filter(d => d.screeningDate), d => parseDate(d.screeningDate)))
        .range([margin.left, width - margin.right]);

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeMonth.every(3)));  


    const yAxis = svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).tickValues(yearTicks));  


    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left / 4)
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

    svg.selectAll("circle")
        .data(processedData)
        .enter()
        .append("circle")
        .attr("cx", d => {
            const parsedDate = parseDate(d.screeningDate);
            return parsedDate ? xScale(parsedDate) : 0;  
        })
        .attr("cy", d => yScale(d.year)) 
        .attr("r", d => sizeScale(d.duration))
        .style("fill", "khaki")
        .style("opacity", 0.7)
        .on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible")
                .html(`<strong>${d.title}</strong><br>Year: ${d.year}<br>Duration: ${d.duration} min<br>Genres: ${d.genres}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
            d3.select(this).style("stroke", "black").style("opacity", 1);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
            d3.select(this).style("stroke", "none").style("opacity", 0.7);
        });
});

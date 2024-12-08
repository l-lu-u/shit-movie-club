// Set dimensions and margins
const width = 750;
const height = 600;
const margin = { top: 30, right: 20, bottom: 20, left: 70 };

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

    const languages = Array.from(new Set(processedData.flatMap(d => d.languages))); // Unique languages
    const genres = Array.from(new Set(processedData.flatMap(d => d.genres))); // Unique genres

    // Calculate occurrences of languages and genres
    const languageOccurrences = languages.map(language => ({
        name: language,
        count: processedData.filter(d => d.languages.includes(language)).length,
    }));
    const genreOccurrences = genres.map(genre => ({
        name: genre,
        count: processedData.filter(d => d.genres.includes(genre)).length,
    }));

    // Sort by occurrence
    languageOccurrences.sort((a, b) => b.count - a.count);
    genreOccurrences.sort((a, b) => b.count - a.count);

    // Total occurrences for percentage calculation
    const totalLanguages = d3.sum(languageOccurrences, d => d.count);
    const totalGenres = d3.sum(genreOccurrences, d => d.count);

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

    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(3))
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
        .attr("y", margin.top / 2)
        .attr("x", margin.left / 2)
        .style("text-anchor", "left")
        .style("font-size", "1rem")
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

   // Append button groups for filtering
    const buttonContainer = d3.select("#section-bubble")
    .append("div")
    .attr("class", "button-container");

    let activeFilters = { language: [], genre: [] }; // Track active filters

    // Function to create buttons with accordion
    function createAccordion(container, title, data, filterType) {
    const group = container.append("div").attr("class", `${filterType}-group`);

    // Accordion title
    const header = group.append("h4")
        .text(title)
        .style("cursor", "pointer")
        .on("click", function () {
            const isExpanded = d3.select(this).classed("expanded");
            d3.select(this).classed("expanded", !isExpanded);
            d3.select(`.${filterType}-buttons`).style("display", isExpanded ? "none" : "block");
        });

    // Buttons container
    const buttonsContainer = group.append("div")
        .attr("class", `${filterType}-buttons`)
        .style("display", "none"); // Initially collapsed;

    // Create buttons with highlight bars
    const buttons = buttonsContainer.selectAll("div")
        .data(data)
        .enter()
        .append("div")
        .attr("class", "button-group");

    // Highlight bar
    buttons.append("div")
        .attr("class", "bar-total");

    buttons.append("div")
        .attr("class", "bar-highlight")
        .style("width", d => `${(d.count / (filterType === "language" ? totalLanguages : totalGenres)) * 100}%`);

    // Button
    buttons.append("button")
        .text(d => `${d.name} (${d.count})`)
        .style("position", "relative")
        .style("z-index", 1)
        .style("margin", "0 5px")
        .style("padding", "5px 10px")
        .style("border", "none")
        .style("background-color", "transparent")
        .style("cursor", "pointer")
        .on("click", function (event, d) {
            const isActive = d3.select(this).classed("active");
            d3.select(this).classed("active", !isActive);

            // Update active filters
            if (!isActive) activeFilters[filterType].push(d.name);
            else activeFilters[filterType] = activeFilters[filterType].filter(name => name !== d.name);

            // Apply filters
            applyFilters();
        });
    }

    // Apply all active filters
    function applyFilters() {
    svg.selectAll("circle")
        .transition()
        .duration(300)
        .style("opacity", d => {
            const matchesLanguage = activeFilters.language.length === 0 || activeFilters.language.some(lang => d.languages.includes(lang));
            const matchesGenre = activeFilters.genre.length === 0 || activeFilters.genre.some(gen => d.genres.includes(gen));
            return matchesLanguage && matchesGenre ? 0.7 : 0.1;
        });
    }

    // Create language accordion
    createAccordion(buttonContainer, "by Language", languageOccurrences, "language");

    // Create genre accordion
    createAccordion(buttonContainer, "by Genre", genreOccurrences, "genre");

    // Reset Button
    buttonContainer.append("button")
    .text("Reset Filters")
    .style("margin-top", "10px")
    .style("padding", "10px")
    .style("background-color", "lightgray")
    .on("click", () => {
        activeFilters = { language: [], genre: [] }; // Reset active filters
        d3.selectAll(".language-buttons button, .genre-buttons button").classed("active", false);
        svg.selectAll("circle")
            .transition()
            .duration(300)
            .style("opacity", 0.7); // Reset opacity for all bubbles
    });

});



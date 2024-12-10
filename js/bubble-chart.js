// Set dimensions and margins
const width = Math.min(700,window.innerWidth);
const height = Math.min(700,window.innerWidth);
const margin = { top: 40, right: 20, bottom: 30, left: 70 };
const totalMovies = 23;

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
        original: d.original,
        director: d.director ? d.director.split(",").map((s) => s.trim()) : [],
        yearProduction: +d.year_production,
        screeningDate: d.when ? d3.timeParse("%m/%Y")(d.when) : null,
        genres: d.genres ? d.genres.split(",").map((s) => s.trim()) : [],
        languages: d.languages ? d.languages.split(",").map((s) => s.trim()) : [],
        duration: +d.duration || 0,
        link: d.link,
        image: d.image,
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

    languageOccurrences.sort((a, b) => b.count - a.count);
    genreOccurrences.sort((a, b) => b.count - a.count);

    const totalLanguages = d3.sum(languageOccurrences, d => d.count);
    const totalGenres = d3.sum(genreOccurrences, d => d.count);

    processedData.sort((a, b) => {
        if (a.screeningDate < b.screeningDate) return -1;
        if (a.screeningDate > b.screeningDate) return 1;
        return a.id.localeCompare(b.id);
    });

    const xScale = d3.scaleTime()
        .domain([new Date(2023, 1, 1), new Date(2024, 12, 31)]) // Jan 2023 to Dec 2024
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([
            Math.floor(d3.min(processedData, (d) => d.yearProduction) / 5) * 5,
            Math.ceil(d3.max(processedData, (d) => d.yearProduction) / 5) * 5,
        ])
        .range([height - margin.bottom, margin.top]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(4))
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

    const xGrid = d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(2)) 
        .tickSize(-(height - margin.top - margin.bottom))
        .tickFormat(""); 
    
    svg.append("g")
        .attr("class", "grid-line x-grid")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xGrid)
        .selectAll("line")
        .style("stroke", "darkkhaki") 
        .style("stroke-dasharray", "2,2") 
    
    // Y-Axis Grid Lines
    const yGrid = d3.axisLeft(yScale)
        .tickValues(
            d3.range(
                Math.floor(d3.min(processedData, d => d.yearProduction) / 5) * 5,
                Math.ceil(d3.max(processedData, d => d.yearProduction) / 5) * 5 + 1,
                5
            )
        )
        .tickSize(-(width - margin.left - margin.right)) // Extend grid lines
        .tickFormat(""); // Remove tick labels
    
    svg.append("g")
        .attr("class", "grid-line y-grid")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yGrid)
        .selectAll("line")
        .style("stroke", "darkkhaki") 
        .style("stroke-dasharray", "2,2"); 

    // Draw axes
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxis);

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis);

    svg.selectAll(".tick text")
        .style("font-family", "Comic Neue, serif")
        .style("font-size", "14px")
        .style("font-weight", "500"); 

    // Add axis label
    svg.append("text")
        .attr("y", margin.top/2)
        .attr("x", 0)
        .style("text-anchor", "left")
        .style("font-size", "1.4rem")
        .style("stroke", "#86825f")
        .text("Produced in ↓");

    svg.append("text")
        .attr("y", height-margin.bottom*0.3)
        .attr("x", 0)
        .style("text-anchor", "left")
        .style("font-size", "1.4rem")
        .style("stroke", "#86825f")
        .text("Watched in →");

    svg.selectAll(".domain").remove();

    // Tooltip & Details
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");
    const detailContainer = d3.select("#little-tv");
    const detailedTitle = d3.select("#movie-title");
    const detailedImage = d3.select("#movie-img");
    const detailedContent = d3.select("#movie-details");

    const offset = 5;
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
        .attr("r", (d) => Math.sqrt(d.duration) * 2)
        .style("fill", "darkkhaki")
        .style("opacity", 0.7)
        .on("mouseover", function (event, d) {
            if (d.isFiltered) return;
            tooltip.style("display", "block")
                .html(`<strong>${d.title}</strong> (${d.yearProduction})`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
            detailedTitle.html('<strong>' + d.title + '</strong> (' + d.yearProduction + ')' + '<i> ' + d.original + '</i>');
            detailedContent.html(`<strong>Director:</strong> ${d.director.join(", ")} <br/>
             <strong>Length:</strong> ${d.duration} minutes<br/>
             <strong>Genres:</strong> ${d.genres.join(", ")}`); 
            if (d.image) {
                detailedImage.attr("src", './images/'+ d.image +'.jpg');
            } else {
                detailedImage.attr("src", 'watch-it-on-demo.day');
                detailedImage.attr("alt", 'watch-it-on-demo-day');
            }
            d3.select(this).style("stroke", "#86825f").style("opacity", 1);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function (d) {
            tooltip.style("display", "none");
            detailedImage.attr("src", "./images/dung-beetle.gif");
            detailedTitle.html("");
            detailedContent.html("");
            if (!d.isFiltered) {
                d3.select(this).style("stroke", "none").style("opacity", 0.7);
            }
        })
        .on("click", function (event, d) {
            if (d.isFiltered) return;
            detailedTitle.html('<strong>' + d.title + '</strong> (' + d.yearProduction + ')' + '<i> ' + d.original + '</i>');
            if (d.image) {
                detailedImage.attr("src", './images/'+ d.image +'.jpg');
            } else {
                detailedImage.attr("src", './images/dung-beetle.gif');
                detailedContent.html.add("Watch it on Demo Day.");
            }
            detailedContent.html(`<strong>Director:</strong> ${d.director.join(", ")} <br/>
             <strong>Length:</strong> ${d.duration} minutes<br/>
             <strong>Genres:</strong> ${d.genres.join(", ")}`); 
            if (d.image) {
                detailedImage.attr("src", './images/'+ d.image +'.jpg');
            } else {
                detailedImage.attr("src", 'watch-it-on-demo.day');
                detailedImage.attr("alt", 'watch-it-on-demo-day');
            }
        });

     svg.selectAll("circle")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 0.7);

   // Append button groups for filtering
   d3.select("#chart-sort")
    .append("button")
    .attr("class","button-reset")
    .text("Reset Filters")
    .style("margin-top", "10px")
    .style("padding", "10px")
    .on("click", () => {
        activeFilters = { language: [], genre: [] }; 
        d3.selectAll(".language-buttons button, .genre-buttons button").classed("active", false);
        svg.selectAll("circle")
            .transition()
            .duration(300)
            .style("opacity",d => {
                const isVisible = true;
                d.isFiltered = !isVisible; 
                return isVisible ? 0.7 : 0.1;
            })
            .style("pointer-events", "all"); 
    });
    
    const buttonContainer = d3.select("#chart-sort")
    .append("div")
    .attr("class", "button-container");

    let activeFilters = { language: [], genre: [] }; // Track active filters
    function createAccordion(container, title, data, filterType) {
        const group = container.append("div").attr("class", `${filterType}-group`);
        const header = group.append("h3")
            .text(title)
            .style("cursor", "pointer")
            .attr("class","expanded")
            .on("click", function () {
                const isExpanded = d3.select(this).classed("expanded");
                d3.select(this).classed("expanded", !isExpanded);
                d3.select(`.${filterType}-buttons`).style("display", isExpanded ? "none" : "block");
            });

        const buttonsContainer = group.append("div")
            .attr("class", `${filterType}-buttons`)
            .style("display", "block");

        const buttons = buttonsContainer.selectAll("div")
            .data(data)
            .enter()
            .append("div")
            .attr("class", "button-group");

        buttons.append("div")
            .attr("class", "bar-total");

        buttons.append("div")
            .attr("class", "bar-highlight")
            .style("width", d => `${(d.count / totalMovies) * 100}%`);

        buttons.append("button")
            .text(d => `${d.name} (${d.count})`)
            .on("click", function (event, d) {
                const isActive = d3.select(this).classed("active");
                d3.select(this).classed("active", !isActive);

                if (!isActive) activeFilters[filterType].push(d.name);
                else activeFilters[filterType] = activeFilters[filterType].filter(name => name !== d.name);

                applyFilters();
            });
    }

    function applyFilters() {
        svg.selectAll("circle")
            .transition()
            .duration(300)
            .style("opacity", d => {
                const matchesLanguage = activeFilters.language.length === 0 || activeFilters.language.some(lang => d.languages.includes(lang));
                const matchesGenre = activeFilters.genre.length === 0 || activeFilters.genre.some(gen => d.genres.includes(gen));
                const isVisible = matchesLanguage && matchesGenre;
                d.isFiltered = !isVisible; 
                return isVisible ? 0.7 : 0.1;
            })
            .style("pointer-events", d => (d.isFiltered ? "none" : "all"));
    }

    createAccordion(buttonContainer, "Language", languageOccurrences, "language");
    createAccordion(buttonContainer, "Genre", genreOccurrences, "genre");

    svg.selectAll("circle")
        .transition()
        .duration(500)
        .attr("r", d => Math.sqrt(d.duration) *1.5)
        .style("opacity", d => {
            const matchesLanguage = !activeFilters.language.length || activeFilters.language.every(lang => d.languages.includes(lang));
            const matchesGenre = !activeFilters.genre.length || activeFilters.genre.every(genre => d.genres.includes(genre));
            return matchesLanguage && matchesGenre ? 0.7 : 0.1;
        });

});



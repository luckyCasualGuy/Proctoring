function get_data_graph(data){
    document.getElementById("d3-container").innerHTML = ""
    var gr_data = []
    for (var key in data){
        console.log(key)
        let t_dic = {}
        t_dic["name"] = key
        t_dic["score"] = data[key]
        
        gr_data.push(t_dic)
    }
    console.log(gr_data)

    const width = 900;
    const height = 450;
    const margin = { top: 50, bottom: 50, left: 50, right: 50 };

    const svg = d3.select('#d3-container')
        .append('svg')
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .attr("viewBox", [0, 0, width, height]);

    const x = d3.scaleBand()
        .domain(d3.range(gr_data.length))
        .range([margin.left, width - margin.right])
        .padding(0.1)

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height - margin.bottom, margin.top])

    svg
        .append("g")
        .attr("fill", 'royalblue')
        .selectAll("rect")
        // .data(gr_data.sort((a, b) => d3.descending(a.score, b.score)))
        .data(gr_data)
        .join("rect")
            .attr("x", (d, i) => x(i))
            .attr("y", d => y(d.score))
            .attr('title', (d) => d.score)
            .attr("class", "rect")
            .attr("height", d => y(0) - y(d.score))
            .attr("width", x.bandwidth());

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)" );
        

    function yAxis(g) {
        g.attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(y).ticks(null, gr_data.format))
            .attr("font-size", '20px')
    }

    function xAxis(g) {
        g.attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(i => gr_data[i].name))
            .attr("font-size", '20px')
    }

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);
    svg.node();
}


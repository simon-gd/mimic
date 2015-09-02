// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return d.income; }
function y(d) { return d.lifeExpectancy; }
function radius(d) { return d.population; }
function color(d) { return d.region; }
function key(d) { return d.name; }

var startYear = 1820;
function smallMultiplesPlotRun(condition_name) {
// Chart dimensions.
var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
    width = 700 - margin.right,
    height = 640 - margin.top - margin.bottom,
    padding = 10, nx = 5, ny = 4, size = 140;
// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.log().domain([300, 1e5]).range([padding / 2, size - padding / 2]),
    yScale = d3.scale.linear().domain([10, 85]).range([size - padding / 2, padding / 2]),
    radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
    colorScale = d3.scale.category10();

// The x & y axes.
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
    yAxis = d3.svg.axis().scale(yScale).orient("left");
var axis = d3.svg.axis()
      .ticks(5)
      .tickSize(size * nx);
// Create the SVG container and set the origin.
var svg = d3.select("#chart_sm").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "gRoot");

// Add the x-axis.
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")");
    //.call(xAxis);

// Add the y-axis.
svg.append("g")
    .attr("class", "y axis");
    //.call(yAxis);

// Add an x-axis label.
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("income per capita, inflation-adjusted (dollars)");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -25)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("life expectancy (years)");



// Add the year label; the value is set on transition.
/*
var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", 24)
    .attr("x", width)
    .text(1800);

// Add the country label; the value is set on transition.
var countrylabel = svg.append("text")
    .attr("class", "country label")
    .attr("text-anchor", "start")
    .attr("y", 24)
    .attr("x", 20)
    .text(" ");
*/
var first_time = true;

var line = d3.svg.line()
       .interpolate("basis")
       .x(function(d) { return d.x; })
       .y(function(d) { return d.y; });

// Load the data.
d3.json("static/data/nations.json", function(nations) {
  var maxCountries=20;
  nations = nations.filter(function(c, i){ return (i < maxCountries); });

  var bisect = d3.bisector(function(d) { return d[0]; });
  // A bisector since many nation's data is sparsely-defined.
  var years = [];
  for(var yy = startYear; yy<2009; yy++) {
      years.push(yy);
      //var cobj = interpolateData(yy);
      //mydata[] = {
      //  [xScale(x(d)), yScale(y(d))];
      //  }
      //});
  }
  var transpose = nations.map(function(c) {
            return {
              name: c.name,
              values: years.map(function(d) {
                //console.log("interpolateValues", x(c));
                return {x: xScale(interpolateValues(x(c), d)), y: yScale(interpolateValues(y(c), d))};
              })
            };
  });

  var bisect = d3.bisector(function(d) { return d[0]; });


 
  // X-axis.
  /*
  svg.selectAll("g.x.axis")
      .data(transpose)
    .enter().append("svg:g")
      .attr("class", "x axis")
      .attr("transform", function(d, i) { return "translate(" + i * size + ",0)"; });
      //.each(function(d) { d3.select(this).call(axis.scale(x[d]).orient("bottom")); });

  // Y-axis.
  svg.selectAll("g.y.axis")
      .data(transpose)
    .enter().append("svg:g")
      .attr("class", "y axis")
      .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; });
      //.each(function(d) { d3.select(this).call(axis.scale(y[d]).orient("right")); });
  */
  // Cell and plot.
  var gridData = stack(transpose, nx, ny);
  console.log(gridData)
  var cell = svg.selectAll("g.cell")
      .data(gridData)
    .enter().append("svg:g")
      .attr("class", "cell")
      .attr("transform", function(d) { return "translate(" + d.i * size + "," + d.j * size + ")"; })
      .each(plot);

  function plot(p) {
    var cell = d3.select(this);

    // Plot frame.
    cell.append("svg:rect")
        .attr("class", "frame")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding);

    // Plot dots.
     cell.append("g")
          .attr("class", "country")
          .append("path")
          .attr("class", "countryline")
          .attr("d", function(d) { return line(d.c.values); })
          .style("fill", function(d) { return "none"; })
          .style("stroke", function(d) { return "grey"; });

    var countrylabel = cell.append("text")
    .style("font", '500 16px "Helvetica Neue"')
    .attr("text-anchor", "middle")
    .attr("y", 20)
    .attr("x", size/2)
    .text(function(d){ return d.c.name; });
      
    //cell.selectAll("circle")
    //    .data(flowers)
    //  .enter().append("svg:circle")
    //    .attr("class", function(d) { return d.species; })
    //    .attr("cx", function(d) { return x[p.x](d[p.x]); })
    //    .attr("cy", function(d) { return y[p.y](d[p.y]); })
    //    .attr("r", 3);
  }
  function stack(a, nx, ny) {
    var c = [], n = nx, m = ny, i, j;
    var count = 0;
    for (i = 0; i < n; ++i) {
      for (j = 0; j < m; ++j) {
        c.push({c: a[count], i: i, j: j});
        count++;
      }
    }
    return c;
  }
  // Updates the display to show the specified year.
  function displayYear(year) {
    //dot.data(interpolateData(year), key).call(position).sort(order);
    label.text(Math.round(year));
  }

  // Interpolates the dataset for the given (fractional) year.
  function interpolateData(year) {
    return nations.map(function(d) {
      return {
        name: d.name,
        region: d.region,
        income: interpolateValues(d.income, year),
        population: interpolateValues(d.population, year),
        lifeExpectancy: interpolateValues(d.lifeExpectancy, year)
      };
    });
  }

  // Finds (and possibly interpolates) the value for the specified year.
function interpolateValues(values, year) {
    var i = bisect.left(values, year, 0, values.length - 1),
        a = values[i];
    if (i > 0) {
      var b = values[i - 1],
          t = (year - a[0]) / (b[0] - a[0]);
      return a[1] * (1 - t) + b[1] * t;
    }
    return a[1];
}
  
init();

function update(v, duration) {

    displayYear(dragit.time.current);

}

function init() {

    var end_effect = function() {
      countrylabel.text("");
      //dot.style("opacity", 1);
    };

    //dragit.evt.register("dragend", end_effect);
}


}); //on data load



} // end of function
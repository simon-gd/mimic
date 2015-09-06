var intFormat = d3.format(",d");

function smallMultiplesPlotRun(condition_name, task, selectionCallback) {

var startYear = task.years[0];
var endYear = task.years[1];

function x(d) { return d[task.indicators[0]]; }
function y(d) { return d[task.indicators[1]]; }
function radius(d) { return d.population; }
function color(d) { return d.region; }
function key(d) { return d.name; }

var xValformat = function(d){ return "<strong>"+task.indicatorLabels[0]+"</strong>: "+intFormat(d3.round(d,0))+ " "+ task.indicatorUnits[0]; };
var yValformat = function(d){ return "<strong>"+task.indicatorLabels[1]+"</strong>: "+ intFormat(d3.round(d,0))+ " "+ task.indicatorUnits[1]; };

var selectionColor = "green";
var hoverColor = "steelblue";
var regularColor = "black";

// Chart dimensions.
var margin = {top: 35, right: 19.5, bottom: 19.5, left: 39.5},
    width = 700 - margin.right,
    height = 660 - margin.top - margin.bottom,
    padding = 0, nx = 4, ny = 4, size = 145;
// Various scales. These domains make assumptions of data, naturally.

var tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function(d) { return d.x + "<br>" + d.y; });

var xScale = task.indicatorDomains[0].range([padding / 2, size - padding / 2]),
    yScale = task.indicatorDomains[1].range([size - padding / 2, padding / 2]),
    radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
    colorScale = d3.scale.category10();
var myGrad = d3.scale.linear().domain([0.0, 1.0]).range([.2, .8]);
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
    .attr("x", width - 100)
    .attr("y", height - 6)
    .text(task.indicatorLabels[0]+" ("+task.indicatorUnits[0]+")");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -25)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text(task.indicatorLabels[1]+" ("+task.indicatorUnits[1]+")");


svg.call(tip);

// Add the year label; the value is set on transition.

var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", -15)
    .attr("x", width)
    .text("");
/*/
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
var mainurl = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
d3.json(mainurl+"/static/data/nations.json", function(nations) {

  nations = task.countries.map(function(i){ return nations[i] });

  var bisect = d3.bisector(function(d) { return d[0]; });
  // A bisector since many nation's data is sparsely-defined.
  var years = [];
  for(var yy = startYear; yy<endYear; yy++) {
      years.push(yy);
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


  var selectedCountry = "";
  var selectedCountryNode;
  var selectedYear;
  var selectedCircleNode;
  var gridData = stack(transpose, nx, ny);
  console.log(gridData)
  var cell = svg.selectAll("g.cell")
      .data(gridData)
    .enter().append("g")
      .attr("class", "cell")
      .attr("transform", function(d) { return "translate(" + d.i * size + "," + d.j * size + ")"; })
      .each(plot);
  function hoverInItem(self,mycell,d,i){
    d3.select(self).style("stroke", hoverColor);
    mycell.selectAll("text").style("fill", hoverColor);
    mycell.selectAll("circle").style("fill", hoverColor);
    if(selectedCountryNode){
      d3.select(selectedCountryNode).style("stroke", selectionColor);
      d3.select(selectedCountryNode.parentNode).selectAll("text").style("fill", selectionColor);
      d3.select(selectedCountryNode.parentNode).selectAll("circle").style("fill", selectionColor);
    }
  }
  function hoverOutItem(self,mycell,d,i){
    d3.selectAll(".smrect").style("stroke", regularColor);
    mycell.selectAll("text").style("fill", regularColor);
    mycell.selectAll("circle").style("fill", regularColor);
    if(selectedCountryNode){
      d3.select(selectedCountryNode).style("stroke", selectionColor);
      d3.select(selectedCountryNode.parentNode).selectAll("text").style("fill", selectionColor);
      d3.select(selectedCountryNode.parentNode).selectAll("circle").style("fill", selectionColor);
    }
  }
  function selectItem(self, mycell, name){
    //deselect circles
    selectedYear = "";
    label.text(selectedYear);
    d3.selectAll(".yearCircle").attr("stroke", "none");

    selectedCountryNode = self;
    console.log(d3.select(self).data()[0].c.name);
    selectedCountry = d3.select(self).data()[0].c.name;
    selectionCallback(selectedCountry);

    d3.selectAll(".smrect").style("stroke", regularColor);
    d3.selectAll(".countrylabel").style("fill", regularColor);
    d3.selectAll(".yearCircle").style("fill", regularColor);

    d3.select(self).style("stroke", selectionColor);
    mycell.selectAll("text").style("fill", selectionColor);
    mycell.selectAll("circle").style("fill", selectionColor);
  }
  function plot(p) {
    var cell = d3.select(this);

    // Plot frame.
    var borderRect = cell.append("rect")
        .attr("class", "smrect")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding)
        .style("stroke", regularColor)
       .on("mouseenter", function(d, i) {
          hoverInItem(this, cell, d, i);
       })
       .on("mouseleave", function(d, i) {
          hoverOutItem(this, cell, d, i);          
       })
       .on("click", function(d, i) {
          selectItem(this, cell, d, i);
       })
    // Plot dots.
    var countryG = cell.append("g")
          .attr("class", "country");
     
    countryG.selectAll(".circle")
    .data(function (d) { return d.c.values })
    .enter().append("circle")
     .attr("class", "yearCircle")
     .attr("r", 3)
     .attr("fill", regularColor)//function (d, i){ return "hsl(225, 0%, "+ (100-((i / years.length)*80)).toString() +"%)";})
     .attr("stroke", "none")
     .attr("fill-opacity", function(d, i){ return (i===(years.length-1)) ? 1.0 : myGrad(i / years.length); })
     .attr("cx", function (d) {return d.x;})
     .attr("cy", function (d) {return d.y;})
     .on("mouseenter", function(d,i){
        label.text(startYear+i);
        label.style("fill", hoverColor);
        tip.show(
             {x: xValformat(xScale.invert(d.x)), 
              y: yValformat(yScale.invert(d.y))},i);
        d3.select(this).attr("stroke", regularColor).moveToFront();
        d3.select(this).attr("stroke-width", 3);
        hoverInItem(borderRect.node(), cell, d, i);
        //console.log("mouseenter circle");
      })
     .on("mouseleave", function(d,i){
        tip.hide();
        label.text(selectedYear);
        label.style("fill", selectionColor);
        hoverOutItem(borderRect.node(), cell, d, i);
        d3.selectAll(".yearCircle").attr("stroke", "none");
        if(selectedCircleNode){
          d3.select(selectedCircleNode).attr("stroke", regularColor).moveToFront();
        }
        //console.log("mouseleave circle");
      })
     .on("click", function(d,i){
        selectItem(borderRect.node(), cell, name);
        selectedCircleNode = this;
        selectedYear = startYear+i;
        label.text(selectedYear);
        label.style("fill", selectionColor);
        d3.select(selectedCircleNode).attr("stroke", regularColor).moveToFront();
        //console.log("click circle");
      })

    /*
          .append("path")
          .attr("class", "countryline")
          .attr("d", function(d) { return line(d.c.values); })
          .style("fill", function(d) { return "none"; })
          .style("stroke", function(d) { return "grey"; });
          */

    var countrylabel = cell.append("text")
    .attr("class", "countrylabel")
    .style("font", '500 16px "Helvetica Neue"')
    .attr("text-anchor", "middle")
    .attr("y", 20)
    .attr("x", size/2)
    .attr("pointer-events", "none")
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
    for (j = 0; j < m; ++j) {
      for (i = 0; i < n; ++i) {
        if(count < a.length){
          c.push({c: a[count], i: i, j: j});
          count++;
        }
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
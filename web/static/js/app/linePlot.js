// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return d.income; }
function y(d) { return d.lifeExpectancy; }
function radius(d) { return d.population; }
function color(d) { return d.region; }
function key(d) { return d.name; }

function linePlotRun(condition_name) {
// Chart dimensions.
var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
    width = 700 - margin.right,
    height = 500 - margin.top - margin.bottom;

// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.log().domain([300, 1e5]).range([0, width]),
    yScale = d3.scale.linear().domain([10, 85]).range([height, 0]),
    radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
    colorScale = d3.scale.category10();

// The x & y axes.
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
    yAxis = d3.svg.axis().scale(yScale).orient("left");

// Create the SVG container and set the origin.
var svg = d3.select("#chart_traces").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "gRoot");

// Add the x-axis.
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// Add the y-axis.
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

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
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("life expectancy (years)");

// Add the year label; the value is set on transition.
var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", 24)
    .attr("x", width)
    .text("");

// Add the country label; the value is set on transition.
var countrylabel = svg.append("text")
    .attr("class", "country label")
    .attr("text-anchor", "start")
    .attr("y", 24)
    .attr("x", 20)
    .text(" ");

var first_time = true;

var line = d3.svg.line()
       .interpolate("linear")
       .x(function(d) { return d.x; })
       .y(function(d) { return d.y; });

// Load the data.
d3.json("static/data/nations.json", function(nations) {
  var maxCountries=20;
  nations = nations.filter(function(c, i){ return (i < maxCountries); });

  var bisect = d3.bisector(function(d) { return d[0]; });
  // A bisector since many nation's data is sparsely-defined.
  var years = [];
  for(var yy = 1800; yy<2009; yy++) {
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
                return {name: c.name, x: xScale(interpolateValues(x(c), d)), y: yScale(interpolateValues(y(c), d))};
              })
            };
  });

  var bisect = d3.bisector(function(d) { return d[0]; });
  var country = svg.selectAll(".country")
      .data(transpose);
  var countryEnter = country.enter().append("g")
      .attr("class", "country")
      .attr("id", function(d) { return d.name; });
   countryEnter.append("path")
      .attr("class", "countryline")
      .attr("d", function(d) { return line(d.values); })
      .style("fill", function(d) { return "none"; })
      .style("stroke", function(d) { return "grey"; })
    .on("mouseenter", function(d, i) {
          console.log("mouseenter", d, i);
          countrylabel.text(d.name);
          countryEnter.style("stroke", "red")
          d3.select(this).style("stroke", "red")
      })
      .on("mouseleave", function(d, i) {

        countrylabel.text("");
        countryEnter.style("stroke", "grey");
        d3.select(this).style("stroke", "grey");
  
        //dragit.trajectory.remove(d, i);
        
      });
  countryEnter.append("g").selectAll(".circle")
    .data(function (d) { return d.values })
    .enter().append("circle")
     .attr("r", 4)
     .attr("fill", function (d, i){ return "hsl(225, 0%, "+ (100-((i / years.length)*80)).toString() +"%)";})
     .attr("stroke", "none")
     .attr("fill-opacity", function(d, i){ return ((i / years.length)*0.8); })
     .attr("cx", function (d) {
          //console.log("circle", d);
          return d.x;
      })
     .attr("cy", function (d) {
          return d.y;
      })
     .on("mouseenter", function(d, i) {
          countrylabel.text(d.name);
          label.text(1800+i);
          d3.select(this).style("stroke", "red");
          d3.select(this.parentNode.parentNode).moveToFront();
          d3.select(this.parentNode.parentNode).select("path").style("stroke", "red").moveToFront();
          //console.log( this.parentNode.parentNode); //d3.select(this).node());
      })
      .on("mouseleave", function(d, i) {
        countrylabel.text("");
        label.text("");
        d3.select(this).style("stroke", "none");
        d3.select(this.parentNode.parentNode).select("path").style("stroke", "grey").moveToBack();
        
      });

  
  // Add a dot per nation. Initialize the data at 1800, and set the colors.
  /*
  var dot = svg.append("g")
      .attr("class", "dots")
    .selectAll(".dot")
      .data(interpolateData(1800))
    .enter().append("circle")
      .attr("class", "dot")
      .style("fill", function(d) { return "grey";}) //return colorScale(color(d)); })
      .call(position)
      .on("mousedow", function(d, i) {

      })
      .on("mouseup", function(d, i) {
        dot.classed("selected", false);
        dot.style("opacity", .6);
        d3.select(this).classed("selected", !d3.select(this).classed("selected"));
        d3.select(this).style("opacity", 1);
       
        //dragit.trajectory.display(d, i, "selected");

        //TODO: test if has been dragged
        // Look at the state machine history and find a drag event in it?

      })
      .on("mouseenter", function(d, i) {
        
        clear_demo();
        if(dragit.statemachine.current_state == "idle") {
          //dragit.trajectory.display(d, i)
          //dragit.utils.animateTrajectory(dragit.trajectory.display(d, i), dragit.time.current, 1000)
          countrylabel.text(d.name);
          dot.style("opacity", .4)
          d3.select(this).style("opacity", 1)
          d3.selectAll(".selected").style("opacity", 1)
        }
      })
      .on("mouseleave", function(d, i) {
        
        if(dragit.statemachine.current_state == "idle") {
          countrylabel.text("");
          dot.style("opacity", 1);
        }
  
        //dragit.trajectory.remove(d, i);
        
      });
      //.call(dragit.object.activate)

  // Add a title.
  dot.append("title")
      .text(function(d) { return d.name; });
  */
  // Start a transition that interpolates the data based on year.
  svg.transition()
      .duration(3000)
      .ease("linear");

  // Positions the dots based on data.
  //function position(dot) {
  //  dot.attr("cx", function(d) { return xScale(x(d)); })
  //     .attr("cy", function(d) { return yScale(y(d)); })
  //     .attr("r", function(d) { return 8; });//radiusScale(radius(d)); });
  //}

  // Defines a sort order so that the smallest dots are drawn on top.
  //function order(a, b) {
  //  return radius(b) - radius(a);
 // }

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
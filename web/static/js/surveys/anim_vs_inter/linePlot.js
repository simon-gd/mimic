// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return d.income; }
function y(d) { return d.lifeExpectancy; }
function radius(d) { return d.population; }
function color(d) { return d.region; }
function key(d) { return d.name; }
var startYear = 1975;
function linePlotRun(condition_name) {
// Chart dimensions.
var margin = {top: 19.5, right: 19.5, bottom: 39.5, left: 39.5},
    width = 700 - margin.right,
    height = 500 - margin.top - margin.bottom;

// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.linear().domain([100, 25000]).range([0, width]),
    yScale = d3.scale.linear().domain([10, 85]).range([height, 0]),
    radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
    colorScale = d3.scale.category10();
var myGrad = d3.scale.linear().domain([0.0, 1.0]).range([.2, .8])
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
    .attr("y", height + 36)
    .text("income per capita, inflation-adjusted (dollars)");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -40)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("life expectancy (years)");

/*
var gradient = svg.append("defs")
  .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "100%");
gradient.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", "#ccc")
    .attr("stop-opacity", 1);

gradient.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", "#ccc")
    .attr("stop-opacity", 0);
*/
/*
var gradient = svg.append("defs")
  .append("radialGradient")
    .attr("id", "gradient")
    .attr("fx", "0%")
    .attr("fy", "0%")
    .attr("c2", "100%")
    .attr("c2", "100%")
    .attr("r", "100%");
gradient.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", "#ccc")
    .attr("stop-opacity", 1);

gradient.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", "#ccc")
    .attr("stop-opacity", 0);
// Add the year label; the value is set on transition.
*/
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
var normalize = function(vec){
  var l = Math.sqrt((vec[0] * vec[0]) + (vec[1] * vec[1]));
  // normalize vector
  return [vec[0]/l, vec[1]/l];
}
var triangle = function(d){
  var vec0 = [d[1].x-d[0].x, d[1].y-d[0].y];
  var vec = normalize(vec0);

  var perp1 = [vec[1], (-1*vec[0])];
  var perp2 = [(-1*vec[1]), vec[0]];
  //console.log("trig", vec, perp1);
  var offset = 3;
  return "M"+d[0].x+","+d[0].y+
         " L"+(d[1].x+perp1[0]*offset)+","+(d[1].y+perp1[1]*offset)+
         " L"+(d[1].x+perp2[0]*offset)+","+(d[1].y+perp2[1]*offset)+
         " L"+d[0].x+","+d[0].y;
}
// Load the data.
var mainurl = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
d3.json(mainurl+"/static/data/nations.json", function(nations) {
  var maxCountries=20;
  nations = nations.filter(function(c, i){ return (i < maxCountries); });

  var bisect = d3.bisector(function(d) { return d[0]; });
  // A bisector since many nation's data is sparsely-defined.
  var years = [];
  for(var yy = startYear; yy<=2000; yy++) {
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
      .style("opacity", 0.3)
      .attr("id", function(d) { return d.name; });
  
  // One long path
  /*
  countryEnter.append("path")
      .attr("class", "countryline")
      .attr("d", function(d) { return line(d.values); })
      .style("fill", function(d) { return "none"; })
      .style("stroke", function(d) { return "url(#gradient)"; })
    .on("mouseenter", function(d, i) {
          //console.log("mouseenter", d, i);
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
  */
  //var colorinterp = d3.interpolateLab("#FFF", "#CCC");

/*
  countryEnter.append("g").selectAll(".linesegs")
    .data(function (d) { return d.values.map(function(v, i, a){ return ((i+1) < a.length) ? [v, a[i+1]] : [v,{x:v.x+1, y:v.y+1}];  }); })
    .enter().append("g").attr("class", "linesegs")
    .selectAll("path")
    .data( function(d) { return quad(sample(line(d), 2));} )
    .enter().append("path")
    .style("fill", function(d) { return "steelblue";})//colorinterp(d.t); })
    .style("stroke", function(d) { return "steelblue"; })
    .style("opacity", function(d) { return d.t+.2; })
    .attr("d", function(d) { return lineJoin(d[0], d[1], d[2], d[3], 2); });
*/

    countryEnter.append("g").selectAll(".linesegs")
    .data(function (d) { return d.values.map(function(v, i, a){ return ((i+1) < a.length) ? [v, a[i+1]] : [v,{x:v.x+1, y:v.y+1}];  }); })
    .enter().append("path")
    .attr("class", "countryline")
      .attr("d", function(d) { return triangle(d); })
      .style("fill", function(d) { return "steelblue"; })
      .attr("fill-opacity", function(d, i){ return (i===(years.length-1)) ? 1.0 : myGrad(i / years.length); })
      .style("stroke", function(d, i) { return "none"; }); //return "hsl(225, 0%, "+ (i*100).toString() +"%)";})
      //console.log(d, i); return (i*100);});

  countryEnter.append("g").selectAll(".circle")
    .data(function (d) { return d.values })
    .enter().append("circle")
     .attr("r", 5)
     .attr("fill", "steelblue")//function (d, i){ return "hsl(225, 0%, "+ (100-((i / years.length)*80)).toString() +"%)";})
     .attr("stroke", "none")
     .attr("fill-opacity", function(d, i){ return (i===(years.length-1)) ? 1.0 : myGrad(i / years.length); })
     .attr("cx", function (d) {
          //console.log("circle", d);
          return d.x;
      })
     .attr("cy", function (d) {
          return d.y;
      })
     .on("mouseenter", function(d, i) {
          countrylabel.text(d.name);
          label.text(startYear+i);
          d3.select(this).style("stroke", "red");
          d3.select(this.parentNode.parentNode).moveToFront();
          d3.selectAll(".country").style("opacity", 0.3);

          d3.select(this.parentNode.parentNode).style("opacity", 1.0).moveToFront();
          //console.log( this.parentNode.parentNode); //d3.select(this).node());
      })
      .on("mouseleave", function(d, i) {
        countrylabel.text("");
        label.text("");
        d3.select(this).style("stroke", "none");
        d3.selectAll(".country").style("opacity", 0.3);
        //d3.select(this.parentNode.parentNode).select("path").style("stroke", "grey").moveToBack();
        
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


function sample(d, precision) {
  var path = document.createElementNS(d3.ns.prefix.svg, "path");
  path.setAttribute("d", d);
  var n = path.getTotalLength(), t = [0], i = 0, dt = precision;
  while ((i += dt) < n) t.push(i);
  t.push(n);
  return t.map(function(t) {
    var p = path.getPointAtLength(t), a = [p.x, p.y];
    a.t = t / n;
    return a;
  });
}
// Compute quads of adjacent points [p0, p1, p2, p3].
function quad(points) {
  return d3.range(points.length - 1).map(function(i) {
    var a = [points[i - 1], points[i], points[i + 1], points[i + 2]];
    a.t = (points[i].t + points[i + 1].t) / 2;
    return a;
  });
}
// Compute stroke outline for segment p12.
function lineJoin(p0, p1, p2, p3, width) {
  var u12 = perp(p1, p2),
      r = width / 2,
      a = [p1[0] + u12[0] * r, p1[1] + u12[1] * r],
      b = [p2[0] + u12[0] * r, p2[1] + u12[1] * r],
      c = [p2[0] - u12[0] * r, p2[1] - u12[1] * r],
      d = [p1[0] - u12[0] * r, p1[1] - u12[1] * r];
  if (p0) { // clip ad and dc using average of u01 and u12
    var u01 = perp(p0, p1), e = [p1[0] + u01[0] + u12[0], p1[1] + u01[1] + u12[1]];
    a = lineIntersect(p1, e, a, b);
    d = lineIntersect(p1, e, d, c);
  }
  if (p3) { // clip ab and dc using average of u12 and u23
    var u23 = perp(p2, p3), e = [p2[0] + u23[0] + u12[0], p2[1] + u23[1] + u12[1]];
    b = lineIntersect(p2, e, a, b);
    c = lineIntersect(p2, e, d, c);
  }
  return "M" + a + "L" + b + " " + c + " " + d + "Z";
}
// Compute intersection of two infinite lines ab and cd.
function lineIntersect(a, b, c, d) {
  var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
      y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
      ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
  return [x1 + ua * x21, y1 + ua * y21];
}
// Compute unit vector perpendicular to p01.
function perp(p0, p1) {
  var u01x = p0[1] - p1[1], u01y = p1[0] - p0[0],
      u01d = Math.sqrt(u01x * u01x + u01y * u01y);
  return [u01x / u01d, u01y / u01d];
}


}); //on data load



} // end of function
// Various accessors that specify the four dimensions of data to visualize.
var intFormat = d3.format(",d");

function linePlotRun(condition_name, task, selectionCallback) {

var startYear = task.years[0];
var endYear = task.years[1];

function x(d) { return d[task.indicators[0]]; }
function y(d) { return d[task.indicators[1]]; }
function radius(d) { return d.population; }
function color(d) { return d.region; }
function key(d) { return d.name; }

var xValformat = function(d){ return "<strong>"+task.indicatorLabels[0]+"</strong>: "+intFormat(d3.round(d,0))+ " "+ task.indicatorUnits[0]; };
var yValformat = function(d){ return "<strong>"+task.indicatorLabels[1]+"</strong>: "+ intFormat(d3.round(d,0))+ " "+ task.indicatorUnits[1]; };


// Chart dimensions.
var margin = {top: 19.5, right: 19.5, bottom: 39.5, left: 39.5},
    width = 700 - margin.right,
    height = 500 - margin.top - margin.bottom;

// Various scales. These domains make assumptions of data, naturally.
var xScale = task.indicatorDomains[0].range([0, width]),
    yScale = task.indicatorDomains[1].range([height, 0]),
    radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
    colorScale = d3.scale.category10();
var myGrad = d3.scale.linear().domain([0.0, 1.0]).range([.2, .8]);



// The x & y axes.
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
    yAxis = d3.svg.axis().scale(yScale).orient("left");

var tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function(d) { return d.x + "<br>" + d.y; });

var selectionColor = "green";
var hoverColor = "steelblue";
var regularColor = "black";

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
    .text(task.indicatorLabels[0]+" ("+task.indicatorUnits[0]+")");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -40)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text(task.indicatorLabels[1]+" ("+task.indicatorUnits[1]+")");

svg.call(tip);

var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", 24)
    .attr("x", width)
    .text("");

// Add the country label; the value is set on transition.
var countrylabel = svg.append("text")
    .attr("class", "countryLabel label")
    .attr("text-anchor", "start")
    .attr("y", 24)
    .attr("x", 20)
    .text(" ");


var tooltip = svg.append("g") 
    .style("display", "none");

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
var triangle = function(d, offset){
  var vec0 = [d[1].x-d[0].x, d[1].y-d[0].y];
  var vec = normalize(vec0);

  var perp1 = [vec[1], (-1*vec[0])];
  var perp2 = [(-1*vec[1]), vec[0]];
  //console.log("trig", vec, perp1);
  return "M"+d[0].x+","+d[0].y+
         " L"+(d[1].x+perp1[0]*offset)+","+(d[1].y+perp1[1]*offset)+
         " L"+(d[1].x+perp2[0]*offset)+","+(d[1].y+perp2[1]*offset)+
         " L"+d[0].x+","+d[0].y;
}
// Load the data.
var mainurl = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
d3.json(mainurl+"/static/data/nations.json", function(nations) {

  nations = task.countries.map(function(i){ return nations[i] });

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
  var selectedDot;
  var selectedCountry = "";
  var selectedNode;
  var selectedYear;
  var selectedYearNode;
  var bisect = d3.bisector(function(d) { return d[0]; });
  var country = svg.selectAll(".country")
      .data(transpose);
  
  // place the value at the intersection
  
  tooltip.append("text")
        .attr("class", "y1")
        .style("fill", hoverColor)
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("stroke", "white")
        .style("stroke-width", "1.5px")
        //.style("fill", hoverColor)
        //.style("opacity", 0.8)
        .attr("dx", 8)
        .attr("dy", "-.3em");
  //tooltip.append("text")
  //      .attr("class", "y2")
  //      .attr("dx", 8)
  //      .attr("dy", "-.3em");

    // place the date at the intersection
  tooltip.append("text")
        .attr("class", "y2 shadow")
        .style("fill", hoverColor)
        .style("font-size", "16px")
        .style("font-weight", "bold")
        //.style("stroke-width", "3.5px")
        //.style("opacity", 0.8)
        .attr("dx", 8)
        .attr("dy", "1em");
  //tooltip.append("text")
  //      .attr("class", "y4")
  //      .attr("dx", 8)
  //      .attr("dy", "1em");

  var countryEnter = country.enter().append("g")
      .attr("class", "country")
      .style("opacity", 0.6)
      .attr("id", function(d) { return d.name; });
  

    countryEnter.append("g").selectAll(".linesegs")
    .data(function (d) { return d.values.map(function(v, i, a){ return ((i+1) < a.length) ? [v, a[i+1]] : [v,{x:v.x+1, y:v.y+1}];  }); })
    .enter().append("path")
    .attr("class", "countryline")
      .attr("d", function(d) { return triangle(d, 2); })
      .style("fill", function(d) { return regularColor; })
      .attr("opacity", function(d, i){ return (i===(years.length-1)) ? 1.0 : myGrad(i / years.length); })
      .style("stroke", function(d, i) { return "none"; }); //url(#gradient_"+i+")" //return "hsl(225, 0%, "+ (i*100).toString() +"%)";})
      //console.log(d, i); return (i*100);});
  
  

  var countryG = countryEnter.append("g");
  
  countryG.selectAll(".circle")
    .data(function (d) { return d.values })
    .enter().append("circle")
     .attr("class", "yearCircle")
     .attr("r", 6)
     .attr("fill", regularColor)//function (d, i){ return "hsl(225, 0%, "+ (100-((i / years.length)*80)).toString() +"%)";})
     .attr("stroke", "none")
     .attr("fill-opacity", function(d, i){ return (i===(years.length-1)) ? 1.0 : myGrad(i / years.length); })
     .attr("cx", function (d) {return d.x;})
     .attr("cy", function (d) {return d.y;})
     .on("click", function(d, i) {
        // reset old selection
        d3.select(selectedNode).selectAll("circle").attr("fill", regularColor);
        d3.select(selectedNode).selectAll("path").attr("fill", regularColor);


        selectedCountry = d.name;
        selectionCallback(selectedCountry);
        countrylabel.style("fill", selectionColor);
        countrylabel.text(selectedCountry);
        
        selectedYear = startYear+i;
        label.text(selectedYear);
        label.style("fill", selectionColor);

        d3.selectAll(".country").style("opacity", 0.3);
        selectedNode = this.parentNode.parentNode;
        selectedYearNode = this;
        d3.select(selectedNode).style("opacity", 1.0).moveToFront();
        d3.select(selectedNode).selectAll("circle").attr("fill", selectionColor);
        d3.select(selectedNode).selectAll("path").style("fill", selectionColor);

        d3.selectAll(".yearCircle").attr("stroke", "none"); 
        d3.select(this).attr("stroke", regularColor).moveToFront();
      })
     .on("mouseenter", function(d, i) {
          tip.show(
             {x: xValformat(xScale.invert(d.x)), 
              y: yValformat(yScale.invert(d.y))},i);
          //tooltip.style("display", null);
          countrylabel.text(d.name);
          if(d.name === selectedCountry){
            countrylabel.style("fill", selectionColor);
          }else{
            countrylabel.style("fill", hoverColor);  
          }          
          
          label.text(startYear+i);
          if((startYear+i) === selectedYear){
            label.style("fill", selectionColor);
          }else{
            label.style("fill", hoverColor);  
          }      

          d3.selectAll(".country").style("opacity", 0.6);

          //console.log(this.parentNode.parentNode);
          d3.select(this.parentNode.parentNode).style("opacity", 1.0).moveToFront();
          d3.select(this.parentNode.parentNode).selectAll("circle").attr("fill", hoverColor);
          d3.select(this.parentNode.parentNode).selectAll("path").style("fill", hoverColor);
          
          if(selectedNode){
            d3.selectAll(".country").style("opacity", 0.3);
            d3.select(selectedNode).style("opacity", 1.0);
          }

          d3.select(this).attr("stroke", regularColor).moveToFront();
          d3.select(this).attr("stroke-width", 2);

          //console.log( this.parentNode.parentNode); //d3.select(this).node());
      })
      .on("mouseleave", function(d, i) {
        tip.hide(d, i);
        //tooltip.style("display", "none");
        countrylabel.text(selectedCountry);
        countrylabel.style("fill", selectionColor);
        
        label.text(selectedYear);
        label.style("fill", selectionColor);

        d3.selectAll(".yearCircle").attr("stroke", "none"); 
        
        d3.selectAll(".country").selectAll("circle").attr("fill", regularColor);
        d3.selectAll(".country").selectAll("path").style("fill", regularColor);

        if(selectedNode){
          d3.selectAll(".country").style("opacity", 0.3);
          d3.select(selectedNode).style("opacity", 1.0);
          d3.select(selectedNode).selectAll("circle").attr("fill", selectionColor);
          d3.select(selectedNode).selectAll("path").style("fill", selectionColor);
        }else{
          d3.selectAll(".country").style("opacity", 0.6);
        }
        if(selectedYearNode){
          d3.select(selectedYearNode).attr("stroke", regularColor);
        }

        //d3.select(this.parentNode.parentNode).select("path").style("stroke", "grey").moveToBack();
        
      });


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
      //countrylabel.text("");
      //dot.style("opacity", 1);
    };

    //dragit.evt.register("dragend", end_effect);
}


}); //on data load



} // end of function
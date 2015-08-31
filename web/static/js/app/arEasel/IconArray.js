// The MIT License (MIT)
//
// Copyright (c) 2014 Autodesk, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// http://opensource.org/licenses/MIT

// namespace:
this.arEasel = this.arEasel||{};

(function() {

// define a new TextChoice class that extends Text, and handles drawing a hit area
// and implementing a hover color.



var IconArrayDiagram = function(data, width, height,interactionLevel){
	this.initialize(data, width, height, interactionLevel);
}
IconArrayDiagram.prototype = new createjs.Container(); // extend Container.

// save off initialize method from Text so we can call it from our own:
IconArrayDiagram.prototype.Container_initialize = IconArrayDiagram.prototype.initialize;

IconArrayDiagram.prototype.getColor = function(name)
{
	var color = colorbrewer.Set3[12];
	var col;
	if(name.indexOf("A'") !== -1){
		 col = d3.rgb(color[6]);
	}else if(name.indexOf("A") !== -1){
		 col = d3.rgb(color[3]);
	}else if(name.indexOf("B'") !== -1){
		 col = d3.rgb(color[4]);
	}else if(name.indexOf("B") !== -1){
		 col = d3.rgb(color[5]);
	}else{
		col = d3.rgb(color[2]);
	}
	return col
}

IconArrayDiagram.prototype.getColorBW = function(name)
{
	var color = colorbrewer.Greys[9];
	var col;
	if(name.indexOf("A'") !== -1){
		 col = d3.rgb(color[2]);
	}else if(name.indexOf("A") !== -1){
		 col = d3.rgb(color[4]);
	}else if(name.indexOf("B'") !== -1){
		 col = d3.rgb(color[5]);
	}else if(name.indexOf("B") !== -1){
		 col = d3.rgb(color[6]);
	}else{
		col = d3.rgb(color[7]);
	}
	return col
}

IconArrayDiagram.prototype.isStrokeEnabled = function(name)
{
	if(name.indexOf("B'") !== -1){
		 return false;
	}else if(name.indexOf("B") !== -1){
		return true;
	}
	return false;
}

IconArrayDiagram.prototype.createLegend = function(nodes)
{
	var legend = {};
	for(var i=0; i < nodes.length; i++){
		//console.log(nodes[i].name);
		if(!legend[nodes[i].name])
		{
			legend[nodes[i].name] = {name: nodes[i].name, detail: nodes[i].detail, size: nodes[i].size, color: this.getColor(nodes[i].name), border: this.isStrokeEnabled(nodes[i].name)};
		}
	}
	return legend;
}

// overwrite Text's initialize method with our own:
IconArrayDiagram.prototype.initialize = function(data, width, height, interactionLevel) {
	this.Container_initialize(); 
	this.data = data;
	this.width = (width) ? Number(width)-30 : 600;
	this.height = (height) ? Number(height)-50 : 600;
	this.interactionLevel = interactionLevel || 2;
	
	
	var iconDiagram = new createjs.Container();
	//var treemap = d3.layout.treemap()
    //.size([this.width, this.height])
    //.sticky(true)
    //.value(function(d) { return d.size; });
	var iconArray = d3.iconArray();

	this.nodes = iconArray(data);
	this.legend = this.createLegend(this.nodes);
	console.log(this.legend);
	
	var ratio = 0.625;
	var columns = Math.sqrt(data.size / ratio);
	
	var icon_size = this.width / columns;
	icon_size = Math.max(3, icon_size);
	icon_size = Math.min(22, icon_size);
	
	for(var i=0; i < this.nodes.length; i++){
		var node = this.nodes[i];
		//if(node.depth == 0){
			// Root nodes
		//	for(var i=0; i < node.size; i++){
				var shape = new createjs.Shape();
				//shape.x = node.x;
				//shape.y = node.y;
				shape.color = this.getColor(node.name);
				shape.width = icon_size; //node.dx;
				shape.height = icon_size; //node.dy;
				shape.isStrokeEnabled = this.isStrokeEnabled(node.name);
				//console.log(node.name);
				var stroke_color = "#000";// colorbrewer.Set3[12][5];
				if(shape.isStrokeEnabled){
					shape.graphics.beginStroke(stroke_color).setStrokeStyle (2);
				}else{
					//shape.graphics.beginStroke(stroke_color[4]).setStrokeStyle (0);
				}
				shape.graphics.beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 1.0)).drawCircle(0, 0, shape.width/2);
				iconDiagram.addChild(shape);
			//}
		//}
	}
	
	
	arEasel.gridLayout2(iconDiagram, {vSpace: 3, hSpace: 3, columns: columns, hLayout: false});
	
	this.addChild(iconDiagram);
	
	var legendContainer = new createjs.Container();
	
	for (var key in this.legend) {
		var l = this.legend[key];
		if(l.detail){
			var shape = new createjs.Shape();
			shape.color = this.getColor(key);
			
			shape.width = 14; //node.dx;
			shape.height = 14; //node.dy;
			shape.isStrokeEnabled = this.isStrokeEnabled(key);
			//console.log(node.name);
			var stroke_color = "#000";//colorbrewer.Set3[12][5];
			
			if(shape.isStrokeEnabled){
				shape.graphics.beginStroke(stroke_color).setStrokeStyle (2);
			}else{
				//shape.graphics.beginStroke(stroke_color[4]).setStrokeStyle (2);
			}
			shape.graphics.beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 1.0)).drawCircle(shape.width/2+1, shape.width/2+1, shape.width/2);
			legendContainer.addChild(shape);
			var text = new createjs.Text(l.detail + ' (' +l.size+ " Women"+')', "bold 14px Arial", "#000");
			legendContainer.addChild(text);
		}
	}
	arEasel.gridLayout2(legendContainer, {vSpace: 3, hSpace: 3, rows: 4, columns: 2, hLayout: true});
	
	this.addChild(legendContainer);
	
	arEasel.gridLayout(this, {vSpace: 10, hSpace: 10, hLayout: false});
}





arEasel.IconArrayDiagram = IconArrayDiagram;
}());
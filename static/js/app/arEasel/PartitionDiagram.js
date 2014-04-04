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


if(!createjs.Container.prototype.findChildByName){
	createjs.Container.prototype.findChildByName = function(name, type){
		var items = [];
		for(var i=0; i < this.children.length; i++){
			if(this.children[i].name && this.children[i].name.indexOf(name) !== -1){
				if(!type || this.children[i] instanceof type){
					items.push(this.children[i]);
				}
			}
		}
		return items;
	}
}


var PartitionDiagram = function(data){
	this.initialize(data);
}
PartitionDiagram.prototype = new createjs.Container(); // extend Container.

// save off initialize method from Text so we can call it from our own:
PartitionDiagram.prototype.Container_initialize = PartitionDiagram.prototype.initialize;

// overwrite Text's initialize method with our own:
PartitionDiagram.prototype.initialize = function(data) {
	this.Container_initialize(); 
	this.data = data;
	this.width = 500;
	this.height = 500;
	this.radius = Math.min(this.width, this.height) / 2;
	//for(var i=0; i < data.children.length; i++){
	//	var text = new createjs.Text(data.children[i].name, "16px Arial", "#000");
	//	this.addChild(text);
	//}
	
	var partition = d3.layout.partition().value(function value(d) { return d.value; });
	//var tree = d3.layout.tree().size([this.width, this.height])
	//.separation(function(a, b) { return (a.parent == b.parent ? 1 : 1); });
    //.size([560, diameter / 2 - 120])
    //.separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });
	
	this.nodes = partition.nodes(data);
	console.log(this.nodes);
	
	this.links = partition.links(this.nodes);
	this.tooltip = new createjs.Text();

	//for(var i=0; i < this.links.length; i++){
	//	 var link = this.links[i];
	//	 var graphics = new createjs.Graphics().beginStroke("#000").moveTo(link.source.x, link.source.y).lineTo(link.target.x, link.target.y);
	//	 var shape = new createjs.Shape(graphics);
	//	 this.addChild(shape);
	//}
	
	var color = colorbrewer.Pastel1[8];
	var x = d3.scale.linear().range([0, 2 * Math.PI]);
    var y = d3.scale.pow().exponent(1.3).domain([0, 1]).range([0, this.radius]);
	
	for(var i=0; i < this.nodes.length; i++){
		
		var padding = 3;
		
		var shape = new createjs.Shape();
		shape.x = this.width/2.0; //text.x;
		shape.y = this.height/2.0; //text.y;
		shape.width = this.nodes[i].dx;
		shape.height = this.nodes[i].dy;
		var col;
		if(this.nodes[i].name.indexOf("P(A'") !== -1){
			 col = d3.rgb(color[1]);
		}else if(this.nodes[i].name.indexOf("P(A") !== -1){
			 col = d3.rgb(color[2]);
		}else if(this.nodes[i].name.indexOf("P(B'") !== -1){
			 col = d3.rgb(color[3]);
		}else if(this.nodes[i].name.indexOf("P(B") !== -1){
			 col = d3.rgb(color[4]);
		}else{
			col = d3.rgb(color[5]);
		}
		shape.color = col;
		shape.startAng = x(this.nodes[i].x);
		shape.endAng = x(this.nodes[i].x+this.nodes[i].dx);
		shape.innerR = y(this.nodes[i].y);
		shape.outerR = y(this.nodes[i].y + shape.height);
		shape.value = (this.nodes[i].value).toString();
		shape.depth = this.nodes[i].depth;
	
		
		if(shape.depth > 0){shape.graphics.beginStroke("#000")}
		shape.graphics.beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 1.0));
		shape.graphics.arc(0,0, shape.outerR, shape.startAng , shape.endAng, false);
		shape.graphics.arc(0,0, shape.innerR, shape.endAng , shape.startAng, true);
		
			
		shape.addEventListener("mouseover", this);
		shape.addEventListener("mouseout", this);
		//shape.addEventListener("mousemove", this);
		
		shape.name = "shape_"+this.nodes[i].name;
		this.addChild(shape);
		
		var text = new createjs.Text(shape.value, "14px Arial", "#000");

		text.name = "text_"+this.nodes[i].name;
		var angle = (shape.startAng+shape.endAng)/2;
		text.x = shape.x + ((shape.innerR+shape.outerR)/2)*Math.cos(angle);
		text.y = shape.y + ((shape.innerR+shape.outerR)/2)*Math.sin(angle);
		text.rotation = 0; //angle * 180 / Math.PI +90; //(angle / Math.PI)*180;
		
		//
		
		this.addChild(text);
	}
	this.addChild(this.tooltip);
	this.tooltip.visible = false;
	//arEasel.gridLayout(this, {vSpace: 50, hSpace: 20});
}

PartitionDiagram.prototype.addHoverEventListener = function(linkName, listener)
{	
	//linkNames = linkName.split(",");
	//console.log("PartitionDiagram.prototype.addHoverEventListener",linkNames);
	//for(var i=0; i < linkNames.length; i++){
	//	var shape = this.getChildByName("shape_"+linkNames[i]);
	//	shape.addEventListener("mouseover", listener);
	//	shape.addEventListener("mouseout", listener);
	//}
	
	var shape = this.getChildByName("shape_"+linkName);
	if(shape){
		shape.addEventListener("mouseover", listener);
		shape.addEventListener("mouseout", listener);
	}
}


PartitionDiagram.prototype.setHovered =  function(linkName, state)
{
	//var text = this.getChildByName("text_"+linkName);
	
	
	//for(var i=0; i < linkNames.length; i++){
		var shape = this.getChildByName("shape_"+linkName);
		this.setHoveredShape(shape, state);
	//}
	
	//var shapes = this.findChildByName(linkName, createjs.Shape);
	//for(var i=0; i < shapes.length; i++){
	//	this.setHoveredShape(shapes[i], state);
	//}
}

PartitionDiagram.prototype.setHoveredShape =  function(shape, state)
{
	//var text = this.getChildByName("text_"+linkName);
	if(shape){
		if(state){
			//text.color = "#FFF";
			//shape.graphics.beginStroke(arEasel.style.green2).beginFill(arEasel.style.green2).drawRoundRect(0, 0, shape.width, shape.height, 3);
			if(shape.depth > 0){shape.graphics.beginStroke("#000")}
			shape.graphics.beginFill(arEasel.style.green2);
			shape.graphics.arc(0,0, shape.outerR, shape.startAng , shape.endAng, false);
			shape.graphics.arc(0,0, shape.innerR, shape.endAng , shape.startAng, true);
		}else{
			if(shape.depth > 0){shape.graphics.beginStroke("#000")}
			shape.graphics.beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 1.0));
			shape.graphics.arc(0,0, shape.outerR, shape.startAng , shape.endAng, false);
			shape.graphics.arc(0,0, shape.innerR, shape.endAng , shape.startAng, true);
			//text.color = "#000";
			//shape.graphics.beginStroke("#000").beginFill("#FFF").drawRoundRect(0, 0, shape.width, shape.height, 3);
		}
	}
}


PartitionDiagram.prototype.handleEvent = function(e) {
	if (e.target instanceof createjs.Shape){
		if (e.type == "mouseover"){
			this.tooltip.visible = true;
			this.getStage().canvas.title = e.target.value;
			this.setHoveredShape(e.target, true);
		//	this.hover = true;
		}else if(e.type == "mouseout"){
			this.tooltip.visible = false;
			this.getStage().canvas.title = "";
			this.setHoveredShape(e.target, false);
		//	this.hover = false;
		}
	}
}


arEasel.PartitionDiagram = PartitionDiagram;
}());
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

var StatisticsLegend = function(diagram){
	this.initialize(diagram);
}
StatisticsLegend.prototype = new createjs.Container(); // extend Container.

StatisticsLegend.prototype.Container_initialize = StatisticsLegend.prototype.initialize;
// overwrite Text's initialize method with our own:
StatisticsLegend.prototype.initialize = function(diagram) {
	this.percentFormat = function(d) { return d3.format(",.1%")(d);};
	
	this.Container_initialize(); 
	this.diagram = diagram;
	
	var title = new createjs.Text("Statistics", "bold 15px Arial", "#000");
	this.addChild(title);

	this.eqs = new createjs.Container();
	this.eqOne = new createjs.Container();
	this.eqTwo = new createjs.Container();
	this.eqTwo.x = 200;
	this.eqTree = new createjs.Container();
	this.initConditionalProbabilty(this.eqOne);
	this.initConditionalProbabilty(this.eqTwo);
	this.initProbabilty(this.eqTree);
	
	this.eqs.addChild(this.eqOne);
	this.eqs.addChild(this.eqTwo);
	this.eqs.addChild(this.eqTree);
	this.eqOne.visible = false;
	this.eqTwo.visible = false;
	this.eqTree.visible = false;
	this.addChild(this.eqs);
	
	arEasel.gridLayout(this, {vSpace: 0, hSpace: 0});
	
	if (this.diagram.addGeneralHoverEventListener){
		this.diagram.addGeneralHoverEventListener(this.diagramHandle(this));
	}
	
}
StatisticsLegend.prototype.createBox = function(x, y, fill_color, stroke_color)
{
	var shape = new createjs.Shape();
	shape.x = x;
	shape.y = y;
	shape.width = 10; 
	shape.height = 10; 
	shape.fill_color = fill_color ||  createjs.Graphics.getRGB("#000000", 1.0); 
	shape.stroke_color = stroke_color || createjs.Graphics.getRGB("#000000", 1.0); 
	shape.graphics.clear().beginStroke(shape.stroke_color).beginFill(shape.fill_color).drawRect(0, 0, shape.width, shape.height);
	shape.addEventListener("mouseover", this);
	shape.addEventListener("mouseout", this);
	shape.tooltip = "";
	return shape;
}

StatisticsLegend.prototype.updateBox = function(shape, tooltip, fill_color, stroke_color)
{
	shape.fill_color = fill_color ||  createjs.Graphics.getRGB("#000000", 1.0); 
	shape.tooltip = tooltip;
	shape.stroke_color = stroke_color || createjs.Graphics.getRGB("#000000", 1.0); 
	shape.graphics.clear().beginStroke(shape.stroke_color).beginFill(shape.fill_color).drawRect(0, 0, shape.width, shape.height);
	return shape;
}


StatisticsLegend.prototype.initConditionalProbabilty = function(equation)
{
	var start = new createjs.Text("P(    |    )", "bold 14px Arial", "#000");
	start.tooltip = "P(A|B): Probability A is true given B is true."
	start.y = 5;
	start.addEventListener("mouseover", this);
	start.addEventListener("mouseout", this);
	var box01 = this.createBox(15,9);
	var box02 = this.createBox(37,9);
	var equals0 = new createjs.Text("=", "10px Arial", "#000");
	equals0.x = 60;
	equals0.y = 8;
	
	var box1 = this.createBox(72,0);
	var box2 = this.createBox(72,20);
	var line = new createjs.Shape();
	line.graphics.clear().beginStroke("#000").moveTo(70, 15).lineTo(84,15);
	var equals = new createjs.Text("=", "10px Arial", "#000");
	equals.x = 87;
	equals.y = 8;
	var line2 = new createjs.Shape();
	line2.graphics.clear().beginStroke("#000").moveTo(100, 15).lineTo(134,15);
	
	var val1 = new createjs.Text("100", "10px Arial", "#000");
	val1.x = 102;
	val1.y = 0;
	var val2 = new createjs.Text("200", "10px Arial", "#000");
	val2.x = 102;
	val2.y = 20;
	
	var equals2 = new createjs.Text("=", "10px Arial", "#000");
	equals2.x = 140;
	equals2.y = 8;
	
	var result = new createjs.Text((this.percentFormat(1)).toString(), "10px Arial", "#000");
	result.x = 150;
	result.y = 8;
	
	equation.addChild(start);
	equation.box01 = box01;
	equation.addChild(box01);
	equation.box02 = box02;
	equation.addChild(box02);
	equation.addChild(equals0);
	
	equation.addChild(box1);
	equation.box1 = box1;
	equation.addChild(box2);
	equation.box2 = box2;
	equation.addChild(line);
	equation.addChild(line2);
	equation.addChild(equals);
	equation.addChild(val1);
	equation.val1 = val1;
	equation.addChild(val2);
	equation.val2 = val2;
	equation.addChild(equals2);
	equation.result = result;
	equation.addChild(result);
}

StatisticsLegend.prototype.initProbabilty = function(equation)
{
	var start = new createjs.Text("P(    )", "bold 14px Arial", "#000");
	start.y = 5;
	start.tooltip = "P(A): Probability A is true."
	var box01 = this.createBox(16,9);
	var equals0 = new createjs.Text("=", "10px Arial", "#000");
	equals0.x = 45;
	equals0.y = 8;
	start.addEventListener("mouseover", this);
	start.addEventListener("mouseout", this);
	
	var box1 = this.createBox(57,0);
	var box2 = this.createBox(57,20);
	var line = new createjs.Shape();
	line.graphics.clear().beginStroke("#000").moveTo(55, 15).lineTo(69,15);
	var equals = new createjs.Text("=", "10px Arial", "#000");
	equals.x = 72;
	equals.y = 8;
	var line2 = new createjs.Shape();
	line2.graphics.clear().beginStroke("#000").moveTo(80, 15).lineTo(116,15);
	
	var val1 = new createjs.Text("100", "10px Arial", "#000");
	val1.x = 87;
	val1.y = 0;
	var val2 = new createjs.Text("200", "10px Arial", "#000");
	val2.x = 87;
	val2.y = 20;
	
	var equals2 = new createjs.Text("=", "10px Arial", "#000");
	equals2.x = 125;
	equals2.y = 8;
	
	var result = new createjs.Text((this.percentFormat(1)).toString(), "10px Arial", "#000");
	result.x = 135;
	result.y = 8;
	
	equation.addChild(start);
	equation.box01 = box01;
	equation.addChild(box01);
	equation.addChild(equals0);
	
	equation.addChild(box1);
	equation.box1 = box1;
	equation.addChild(box2);
	equation.box2 = box2;
	equation.addChild(line);
	equation.addChild(line2);
	equation.addChild(equals);
	equation.addChild(val1);
	equation.val1 = val1;
	equation.addChild(val2);
	equation.val2 = val2;
	equation.addChild(equals2);
	equation.result = result;
	equation.addChild(result);
}

StatisticsLegend.prototype.setConditionalProbabilty = function(col, col2, col3, val, val2, val3, detail2, detail3)
{
	this.updateBox(this.eqOne.box1, detail2+" AND "+detail3, col, arEasel.style.red);
	this.updateBox(this.eqOne.box2, detail3, col3);
	this.updateBox(this.eqOne.box01, detail2, col2);
	this.updateBox(this.eqOne.box02, detail3, col3);
	this.eqOne.val1.text = val;
	this.eqOne.val2.text = val3;
	this.eqOne.result.text = (this.percentFormat(val/val3)).toString();
	
	
	this.updateBox(this.eqTwo.box1, detail2+" AND "+detail3, col, arEasel.style.red);
	this.updateBox(this.eqTwo.box2, detail2, col2);
	this.updateBox(this.eqTwo.box01, detail3, col3);
	this.updateBox(this.eqTwo.box02, detail2, col2);
	this.eqTwo.val1.text = val;
	this.eqTwo.val2.text = val2;
	this.eqTwo.result.text = (this.percentFormat(val/val2)).toString();
	
	
}

StatisticsLegend.prototype.setProbabilty = function(col, col2, val, val2, detail, detail2)
{
	this.updateBox(this.eqTree.box1, detail, col, arEasel.style.red);
	this.updateBox(this.eqTree.box2, detail2, col2);
	this.updateBox(this.eqTree.box01, detail, col, arEasel.style.red);
	this.eqTree.val1.text = val;
	this.eqTree.val2.text = val2;
	this.eqTree.result.text = (this.percentFormat(val/val2)).toString();
}

StatisticsLegend.prototype.handleEvent = function(e) {
	if (e.type == "mouseover"){
		this.getStage().tooltip.setText(e.target.tooltip);
	}else if(e.type == "mouseout"){
		//this.getStage().canvas.title = "";
		this.getStage().tooltip.setText("");
	}
}

StatisticsLegend.prototype.diagramHandle =  function(){
	var obj = this;
	var handleEvent = function(e) {
	//console.info("StatisticsLegend.prototype.handleEvent",e);
		if (e.type == "click"){
			if(e.target){
				var t = e.target
				if(t.type == "link"){
					var linkData = t.data;
					var col = createjs.Graphics.getRGB(linkData.color.r,linkData.color.g, linkData.color.b, linkData.alpha);
					var val = linkData.value;
					
					var col2 = createjs.Graphics.getRGB(linkData.source.color.r,linkData.source.color.g, linkData.source.color.b, linkData.source.alpha); 
					var val2 = linkData.source.value;
					var detail2 = linkData.source.detail;
					var col3 = createjs.Graphics.getRGB(linkData.target.color.r,linkData.target.color.g, linkData.target.color.b, linkData.target.alpha); 
					var val3 = linkData.target.value;
					var detail3 = linkData.target.detail;
					//console.info("StatisticsLegend.prototype.handleEvent",col, col2, col3, val, val2, val3, detail2, detail3);
					obj.setConditionalProbabilty(col, col2, col3, val, val2, val3, detail2, detail3);
					obj.eqOne.visible = true;
					obj.eqTwo.visible = true;
					obj.eqTree.visible = false;
				}else if(t.type == "node"){
					var nodeData = t.data;
					var col = createjs.Graphics.getRGB(nodeData.color.r,nodeData.color.g, nodeData.color.b, nodeData.alpha);
					var val = nodeData.value;
					var detail = nodeData.detail;
					
					var parent = nodeData;
					while(parent.targetLinks.length > 0){
						parent = parent.targetLinks[0].source;
					}
					
					var col2 = createjs.Graphics.getRGB(parent.color.r,parent.color.g, parent.color.b, parent.alpha);
					var val2 = parent.value;
					var detail2 = parent.detail;
					obj.setProbabilty(col, col2, val, val2, detail, detail2);
					obj.eqOne.visible = false;
					obj.eqTwo.visible = false;
					obj.eqTree.visible = true;
				}
			}
			//this.hover = true;
		}
	}
	return {handleEvent: handleEvent};
}

arEasel.StatisticsLegend = StatisticsLegend;
}());
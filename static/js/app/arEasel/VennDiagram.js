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

function Command(f, params, path) {
	this.f = f;
	this.params = params;
	this.path = path==null ? true : path;
}

Command.prototype.exec = function(scope) { this.f.apply(scope, this.params); }

if(!createjs.Graphics.prototype.setLineDash){
	createjs.Graphics.prototype.setLineDash = function(dashArray){
		if(this._ctx){
			if(this._ctx.setLineDash) {
				this._activeInstructions.push(new Command(this._ctx.setLineDash, [dashArray]));
			
				//createjs.Graphics._ctx.setLineDash(dashArray);
			}else if('mozDash' in this._ctx) {
				//this._activeInstructions.push(new Command(this._ctx.mozDash, [dashArray]));
				//this._strokeStyleInstructions.push(new Command(this._setProp, ["mozDash", dashArray], false));
				
				//this._ctx.mozDash = dashArray;
			}else if('webkitLineDash' in this._ctx) {
				//this._strokeStyleInstructions.push(new Command(this._ctx, ["webkitLineDash", dashArray], false));
				//this._activeInstructions.push(new Command(this._ctx.webkitLineDash, [dashArray]));
				//this._ctx.webkitLineDash = dashArray;
			}
		}
		return this;
	}
}

var VennDiagram = function(data, width, height, interactionLevel, patterns){
	this.initialize(data, width, height, interactionLevel, patterns);
}
VennDiagram.prototype = new createjs.Container(); // extend Container.

// save off initialize method from Text so we can call it from our own:
VennDiagram.prototype.Container_initialize = VennDiagram.prototype.initialize;

VennDiagram.prototype.getColor = function(name)
{
	var color = colorbrewer.Set3[12];
	var col;
	if(name.indexOf("TOTAL") !== -1){
		 col = d3.rgb(color[2]);
	}else if(name.indexOf("A'B'") !== -1){
		col = d3.rgb(color[2]);
	}else if(name.indexOf("A'B") !== -1){
		col = d3.rgb(color[5]);
	}else if(name.indexOf("AB'") !== -1){
		col = d3.rgb(color[3]);
	}else if(name.indexOf("AB") !== -1){
		col = d3.rgb("#FB996A"); //d3.rgb("#F5AE82");	
	}else if(name.indexOf("A'") !== -1){
		 col = d3.rgb(color[2]);
	}else if(name.indexOf("A") !== -1){
		 col = d3.rgb(color[3]);
	}else if(name.indexOf("B'") !== -1){
		 col = d3.rgb(color[2]);
	}else if(name.indexOf("B") !== -1){
		 col = d3.rgb(color[5]);
	}else{
		col = d3.rgb(color[2]);
	}
	return col
}

VennDiagram.prototype.getColorBW = function(name)
{
	var color = colorbrewer.Greys[9]; //Set3[12];
	var col;
	if(name.indexOf("TOTAL") !== -1){
		 col = d3.rgb(color[2]);
	}else if(name.indexOf("A'") !== -1){
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

VennDiagram.prototype.createLegend = function(nodes)
{
	var legend = {};
	for(var i=0; i < nodes.length; i++){
		if(!legend[nodes[i].name])
		{
			legend[nodes[i].name] = {name: nodes[i].name, detail: nodes[i].detail, color: this.getColor(nodes[i].name)};
		}
	}
	return legend;
}
VennDiagram.prototype.drawDiagram = function(vennDiagram)
{
	var diagramContainter = new createjs.Container();
	for(var i=0; i < vennDiagram.length; i++){
		var d = this.drawDiagramArea(vennDiagram[i], true, false, i);
		diagramContainter.addChild(d);
	}
	return diagramContainter;
}

VennDiagram.prototype.drawDiagramArea = function(area, stroke, fill, i)
{
	var graphics = new createjs.Graphics();
	var col = this.getColor(area.name);//area.name);//d3.rgb(color[i]);
	if(stroke){
		graphics.beginStroke("#000");
	}
	if(fill){
		var transp = 1;//(area.name == "AB") ? 1.0 : 0.8;	
		graphics.beginFill(createjs.Graphics.getRGB(col.r,col.g, col.b, transp));
		//graphics.beginBitmapFill(patterns[i], "repeat", this.scale_matrix)
	}
	for(var k=0; k < area.path.length; k++){
		if(area.path[k].arc){
			graphics.arc(area.path[k].arc[0], area.path[k].arc[1],area.path[k].arc[2],area.path[k].arc[3],area.path[k].arc[4], area.path[k].arc[5]);
		}else if(area.path[k].moveTo){
			graphics.moveTo(area.path[k].moveTo[0], area.path[k].moveTo[1]);
		}
	}
	if(stroke){
		graphics.endStroke();
	}
	if(fill){
		graphics.endFill();
	}
	var shape = new createjs.Shape(graphics);
	return shape;
}

VennDiagram.prototype.extractConnectingPoint = function(area, totalR){
	var pt =[0,0];
	
	if(area.name == "TOTAL" || area.name == "A" || area.name == "B"){
		pt[0] = area.path[0].arc[0];
		pt[1] = area.path[0].arc[1] - area.path[0].arc[2];
	}else if(area.name == "AB'"){
		pt[0] = area.path[0].arc[0] - (area.path[0].arc[2]) + (area.size*2);
		pt[1] = area.path[0].arc[1];
	}else if(area.name == "AB"){
		pt[0] = area.path[0].arc[0];
		pt[1] = area.path[0].arc[1];
	}else if(area.name == "A'B"){
		pt[0] = area.path[1].arc[0];
		pt[1] = area.path[1].arc[1];
	
	}else{
		pt[0] = area.path[0].arc[0];
		pt[1] = area.path[0].arc[1];
	}
	
	return pt;
}



// overwrite Text's initialize method with our own:
VennDiagram.prototype.initialize = function(data, width, height, interactionLevel, patterns) {
	this.Container_initialize(); 
	this.data = data;
	this.width = parseInt(width)-200 || 600;
	this.height = parseInt(height)-250 || 200;
	this.interactionLevel = interactionLevel || 2;
	this.patterns = patterns;
	this.scale_matrix = new createjs.Matrix2D();
	this.scale_matrix.scale(0.5, 0.5);
	var color = colorbrewer.Set3[12]; //d3.scale.category10();
	var vennResults = (d3.layout.venn().size([this.width-50, this.height-50]).normalize(false))(this.data);
	var vennResultsObj = {};
	var vennResultsNorm = (d3.layout.venn().size([30, 30]).normalize(true))(this.data);
	
	var vennDiagramContainter = new createjs.Container();
	vennDiagramContainter.width = this.width;
	vennDiagramContainter.height = this.height-40;
	this.legend = this.createLegend(vennResultsNorm);
	
	for(var i=0; i < vennResults.length; i++){
		vennResultsObj[vennResults[i].name] = vennResults[i];
		if(vennResults[i].name == "TOTAL" || vennResults[i].name == "A" || vennResults[i].name == "B" || vennResults[i].name == "AB"){ 
			var graphics = new createjs.Graphics();
			
			var transp = (vennResults[i].name == "AB") ? 1.0 : 1.0;	
			var area = vennResults[i];
			var col = this.getColor(area.name);//d3.rgb(color[i]);
			graphics.beginStroke("#000");
			
			graphics.beginFill(createjs.Graphics.getRGB(col.r,col.g, col.b, transp));
			//graphics.beginBitmapFill(patterns[i], "repeat", this.scale_matrix)
			for(var k=0; k < area.path.length; k++){
				if(area.path[k].arc){
					graphics.arc(area.path[k].arc[0], area.path[k].arc[1],area.path[k].arc[2],area.path[k].arc[3],area.path[k].arc[4], area.path[k].arc[5]);
				}else if(area.path[k].moveTo){
					graphics.moveTo(area.path[k].moveTo[0], area.path[k].moveTo[1]);
				}
			}
			graphics.endStroke()
			graphics.endFill();
			
			var shape = new createjs.Shape(graphics);
			vennDiagramContainter.addChild(shape);
			// Add text
			/*
			if(area.name == "TOTAL" || area.name == "A" || area.name == "B"){
				//add label
				var textColor = col.darker(0.5);
				var label = new createjs.Text(area.detail + " ("+ area.size+")", "bold 14px Arial", createjs.Graphics.getRGB(textColor.r,textColor.g, textColor.b, transp));
				label.x = area.path[0].arc[0] - (label.getMeasuredWidth()/2.0);
				label.y = area.path[0].arc[1] + area.path[0].arc[2];
			
				
				vennDiagramContainter.addChild(label);
			}
			*/
		}
		
	}

	this.addChild(vennDiagramContainter);
	
	var legendContainer = new createjs.Container();
	var legendLines = {};
	for (var i=0; i < vennResultsNorm.length; i++) {
		var n = vennResultsNorm[i].name;
		if(true){ //n == "A" || n == "A'" || n == "A'B"|| n == "A'B'" || n == "AB" || n == "AB'" || n == "TOTAL"){ //|| || n == "B" || ){ //
			var l = this.legend[n];
			
			var iconContainer = new createjs.Container();
			legendLines[n] = iconContainer;
			iconContainer.addChild(this.drawDiagramArea(vennResultsNorm[i], false, true, i));
			iconContainer.addChild(this.drawDiagram(vennResultsNorm));
			legendContainer.addChild(iconContainer);
			var col = this.getColor(n);
			var textColor = col.darker(0.5);
			//createjs.Graphics.getRGB(textColor.r,textColor.g, textColor.b, transp)
			var text = new createjs.Text(l.detail + " (" + vennResults[i].size  + " " + vennResults[i].units +")", "bold 14px Arial", "black");
			
			legendContainer.addChild(text);
			
		}
	}
	arEasel.gridLayout2(legendContainer, {vSpace: 25, hSpace: 35, columns: 2, hLayout: true});
	
	this.addChild(legendContainer);
	
	arEasel.gridLayout(this, {vSpace: 0, hSpace: 0, hLayout: false});
	
	/*
	// add connectors from diagram to legend
	for (var i in legendLines) {
		var line = legendLines[i];
		var graphics = new createjs.Graphics();
		graphics.beginStroke("#000");
		var connectingPoint = this.extractConnectingPoint(vennResultsObj[i], vennResultsObj["TOTAL"].path[0].arc[2]);
		var startPt = [connectingPoint[0]+vennDiagramContainter.x,connectingPoint[1]+vennDiagramContainter.y];
		var endPt = [line.x+legendContainer.x, line.y+legendContainer.y+15];
		
		var lenX = Math.abs(endPt[0] - startPt[0])/2; 
		var lenY = Math.abs(endPt[1] - startPt[1])/2; 
		graphics.moveTo(startPt[0],startPt[1]).bezierCurveTo(startPt[0]+lenX,startPt[1]-lenY,  endPt[0]-lenX, endPt[1], endPt[0], endPt[1] );
		graphics.setLineDash.call(graphics, [5,5]);
		graphics.endStroke()
		var shape = new createjs.Shape(graphics);
		this.addChild(shape);
	}
	*/
}

VennDiagram.prototype.addHoverEventListener = function(linkName, listener)
{
	var shape = this.getChildByName("shape_"+linkName);
	if(shape){
		shape.addEventListener("mouseover", listener);
		shape.addEventListener("mouseout", listener);
	}
}


VennDiagram.prototype.setHovered =  function(linkName, state)
{
	//var text = this.getChildByName("text_"+linkName);
	var shape = this.getChildByName("shape_"+linkName);
	setHoveredShape(shape, state);
}

VennDiagram.prototype.setHoveredShape =  function(shape, state)
{
	//var text = this.getChildByName("text_"+linkName);
	if(shape){
		if(state){
			//text.color = "#FFF";
			shape.graphics.beginStroke(arEasel.style.green2).beginFill(arEasel.style.green2).drawRoundRect(0, 0, shape.width, shape.height, 3);
		}else{
			//text.color = "#000";
			shape.graphics.beginStroke("#000").beginFill("#FFF").drawRoundRect(0, 0, shape.width, shape.height, 3);
		}
	}
}


VennDiagram.prototype.handleEvent = function(e) {
	if (e.target instanceof createjs.Shape){
		if (e.type == "mouseover"){
			this.setHoveredShape(e.target, true);
		//	this.hover = true;
		}else if(e.type == "mouseout"){
			this.setHoveredShape(e.target, false);
		//	this.hover = false;
		}
	}
}


arEasel.VennDiagram = VennDiagram;
}());
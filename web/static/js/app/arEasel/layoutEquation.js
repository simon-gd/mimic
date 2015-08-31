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

var layoutEquation = function(diagram){
	this.initialize(diagram);
}
layoutEquation.prototype = new createjs.Container(); // extend Container.

layoutEquation.prototype.Container_initialize = layoutEquation.prototype.initialize;
// overwrite Text's initialize method with our own:
layoutEquation.prototype.initialize = function(diagram) {

	if (diagram.addGeneralHoverEventListener){
		diagram.addGeneralHoverEventListener(this.diagramHandle(this));
	}	
	this.percentFormat = function(d) { return d3.format(",.1%")(d);};
	this.Container_initialize(); 
	
	this.eqs = new createjs.Container();
	this.eqOne = new createjs.Container();
	this.eqTwo = new createjs.Container();
	this.eqTree = new createjs.Container();
	this.initConditionalProbabilty(this.eqOne, "conditionalProbability_1", "division_1", "division2_1");
	this.initConditionalProbabilty(this.eqTwo, "conditionalProbability_2", "division_2", "division2_2");
	//this.initProbabilty(this.eqTree);
	
	this.eqs.addChild(this.eqOne);
	this.eqs.addChild(this.eqTwo);
	this.eqs.addChild(this.eqTree);
	this.eqOne.visible = true;
	this.eqTwo.visible = true;
	this.eqTree.visible = true;
	
	arEasel.gridLayout(this.eqs, {vSpace: 10, hSpace: 0});
	
	this.addChild(this.eqs);
	
	arEasel.gridLayout(this, {vSpace: 0, hSpace: 0});
}

layoutEquation.prototype.initConditionalProbabilty = function(eqn, cc)
{
	var data = [
	{type: "conditional probability", name:"conditionalProbability1", a: "aaaaaaaaaaaa", b: "bbbbbbbbbb"},
	{type: "text",value: " = "},
	{type: "division", name:"division1", a: "aaaaa", b: "bbbbb"},
	{type: "text", value: " = "},
	{type: "division", name:"division2", a: 0, b: 0},
	{type: "text", value: " = "},
	{type: "text", name:"result1", value: "12"}
	];
	for (var i=0; i < data.length; i++){
		var d = data[i];
		if (d.type == "text"){
			var v = new createjs.Text(d.value, "bold 12px Arial", "#000");
			if(d.name){
				v.name = d.name;
			}
			eqn.addChild(v);
		}else if(d.type == "conditional probability"){
			var cp = new createjs.Container();
			var v1 = new createjs.Text("Propability", "bold 12px Arial", "#000");
			cp.addChild(v1);
			var v2 = new createjs.Text(d.a, "11px Arial", "#000");
			cp.a = v2;
			cp.addChild(v2);
			var v3 = new createjs.Text(" Given that ", "bold 12px Arial", "#000");
			cp.addChild(v3);
			var v4 = new createjs.Text(d.b, "11px Arial", "#000");
			cp.b = v4;
			cp.addChild(v4);
			//var v = new createjs.Text("Propability "+d.a+" Given that "+d.b, "bold 12px Arial", "#000");
			arEasel.gridLayout(cp, {hLayout: true, vSpace: 0, hSpace: 0});
			arEasel.vAlign(cp, "center");
			if(d.name){
				cp.name = d.name;
			}
			//eqn[d.name]=cp;
			eqn.addChild(cp);
		}else if(d.type == "division"){
			var div = new createjs.Container();
			
			var v1 = new createjs.Text((d.a).toString(), "11px Arial", "#000");
			
			var line = new createjs.Shape();
			
			var v2 = new createjs.Text((d.b).toString(), "11px Arial", "#000");
			div.a = v1;
			div.b = v2;
			div.addChild(v1);
			div.addChild(line);
			div.addChild(v2);
			
			if(d.name){
				div.name = d.name;
			}
			arEasel.gridLayout(div, {hLayout: false, vSpace: 0, hSpace: 0});
			var bounds = arEasel.getBounds(div);
			line.graphics.clear().beginStroke("#000").moveTo(0, 0).lineTo(bounds.width,0);
			
			eqn.addChild(div);
		}
	}
	arEasel.gridLayout(eqn, {hLayout: true, vSpace: 0, hSpace: 10});
	arEasel.vAlign(eqn, "center");
}

layoutEquation.prototype.setConditionalProbabilty = function(col, col2, col3, val, val2, val3, detail2, detail3)
{
/*
	this.eqOne.box1, detail2+" AND "+detail3, col, arEasel.style.red);
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
	*/
	
}


layoutEquation.prototype.diagramHandle =  function(){
	var obj = this; //take advantage of closure!
	var handleEvent = function(e) {
		if (e.type == "click"){
			if(e.target){
				var t = e.target
				if(t.type == "link"){
					/*
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
					*/
				}else if(t.type == "node"){
					/*
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
					*/
				}
			}
			//this.hover = true;
		}
	}
	return {handleEvent: handleEvent};
}


arEasel.layoutEquation = layoutEquation;
}());
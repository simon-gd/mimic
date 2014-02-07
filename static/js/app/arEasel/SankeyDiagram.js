// namespace:
this.arEasel = this.arEasel||{};


//Example Data:
/*
{name: "Sankey Diagram", type: "static", graph: {nodes: [{name: "",detail:"Women over 40", units: "Women"},
														 {name: "A", detail:"Have Breast Cancer", units: "Women"},
														 {name: "A'", detail: "Does Not Have Breast Cancer", units: "Women"},
														 {name: "B", detail: "Got Positive Mammography", units: "Women"},
														 {name: "B'", detail: "Got Negative Mammography", units: "Women"}], 
                                          links: [{source: 0,target: 1, value: 10, p: .01, units:"Women"},
												  {source: 0,target: 2, value: 990, p: .99, units:"Women"},
												  {source: 1,target: 3, value: 8, p:.8, units:"Women"},
												  {source: 1,target: 4, value: 2, p:.2, units:"Women"},
												  {source: 2,target: 3, value: 95, p: .096, units:"Women"},
												  {source: 2,target: 4, value: 895, p: .904, units:"Women"}]}}
*/
(function() {

var SankeyDiagram = function(data, width, height, interactionLevel, valueDisplay){
	this.initialize(data, width, height, interactionLevel, valueDisplay);
}
SankeyDiagram.prototype = new createjs.Container(); // extend Container.

// save off initialize method from Text so we can call it from our own:
SankeyDiagram.prototype.Container_initialize = SankeyDiagram.prototype.initialize;

// overwrite Text's initialize method with our own:
SankeyDiagram.prototype.initialize = function(data, width, height, interactionLevel, valueDisplay) {
	this.Container_initialize(); 
	this.valueDisplay = function(d){
		return ""; //d.value + " " + d.units; //(d.source) ? d.value + " " + d.units : "";
	};
	this.labelColor = function(d, relative){ 
		return "#000";
		if(relative) { 
			if(d.source)
				return d.source.color;
			else
				return d.color;
		}else{
			return this.rootColor;
		}
	
	};
	this.interactionLevel = interactionLevel || 3; // static interactive animated
	this.evenDelta = 0;
	this.data = data;
	this.width = (width) ? Number(width)-10 : 600;
	this.height = (height) ? Number(height)-60 : 600;
	this.radius = Math.min(this.width, this.height) / 2;
	//for(var i=0; i < data.children.length; i++){
	//	var text = new createjs.Text(data.children[i].name, "16px Arial", "#000");
	//	this.addChild(text);
	//}
	this.tmpvalue = 1;
	this.nodes = data.nodes;
	this.links = data.links;
	
	this.rootColor = this.getColor("Root");
	
	this.selection = null;
	
	if(this.interactionLevel > 2){
		this.PlayButton = new arEasel.PushButton("Play", arEasel.style.PlayPushButtonStyle);
		this.PlayButton.x = 0;
		this.PlayButton.y = 0;
		this.PlayButton.playing = false;
		this.PlayButton.addEventListener("click", this.handlePlayClick() );
		this.addChild(this.PlayButton);
	}
	  
	this.sankey = d3.sankey()
		.nodeWidth(10)
		.nodePadding(30)
		.nodes(this.nodes)
		.links(this.links)
		.size([this.width, this.height])
		.layout(32);
	for(var i=0; i < this.links.length; i++){
		this.links[i].targetValue = this.links[i].value;
		this.links[i].ActualValue = (this.interactionLevel > 2) ? 0 : this.links[i].value;
		//this.links[i].value = 0;
	}
	for(var i=0; i < this.nodes.length; i++){
		this.nodes[i].targetValue = this.nodes[i].value;
		this.nodes[i].ActualValue = (this.interactionLevel > 2) ? 0 : this.nodes[i].value;
		//this.nodes[i].value = 0;
	}
	this.sankeyContainer = new createjs.Container();
	this.sankeyContainer.y = 30;
	this.recreateSankey();
	this.addChild(this.sankeyContainer);
}



SankeyDiagram.prototype.getColor = function(name)
{
	var color = colorbrewer.Set3[12];
	var col;
	if(name.indexOf("Root") !== -1){
		col = d3.rgb(color[2]);
	}else if(name.indexOf("A'") !== -1){
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

SankeyDiagram.prototype.handlePlayClick = function()
{
	var obj = this;
	var callback = function(e){
		if(e.target.playing == true){
			//pause
			e.target.updateText("Play");
			e.target.playing = false;
			
			if(obj.ballTween){
				obj.ballTween.setPaused(true);
			}
			
		}else{
			e.target.updateText("Pause");
			e.target.playing = true;
			if(obj.ballTween){
				obj.ballTween.setPaused(false);
			}
			
					//.wait(100)
					//.to({guide:{path:[800,300, 100,300, 100,100], end:0.75, orient:true}}, 3750);
		}
	}
	return callback;
	
}


SankeyDiagram.prototype.pickRandomItem = function(list){
	var i = Math.floor(Math.random() * list.length);
	var chance = Math.random();
	if (chance <= list[i].p){
		return list[i];
	}else{
		return this.pickRandomItem(list);
	}
}

SankeyDiagram.prototype.animateLink = function(obj, ball, ballTween, node){
		var pathFunction = obj.sankey.path();
		
		//node.ActualValue += 1;
		//obj.updateSankey();
		while(node.sourceLinks.length > 0){
			// Pick which link to take
			var link = obj.pickRandomItem(node.sourceLinks);
			
			(function(node, link){
				
				var pa = pathFunction(link);
				var path = [pa.M[0], pa.M[1], pa.C[0], pa.C[1], pa.C[2], pa.C[3], pa.C[4], pa.C[5]];
				//paths.push([path.M[0], path.M[1], path.C[0], path.C[1], path.C[2], path.C[3], path.C[4], path.C[5]]);
				
				
				ballTween.to({x:path[0], y:path[1]}, 400).call(function(){
							obj.doNotificationAnimation(path[0]-(obj.sankey.nodeWidth()/2), path[1]);
							if(node.targetLinks.length == 0){
								node.ActualValue += 1;
								obj.updateSankey();
							}
						}).to({cubicguide:{path:path, orient:true}}, 1000)
						  .call(function(){
							(function(link){
								link.ActualValue += 1;
								link.target.ActualValue += 1;
								obj.updateSankey();
								if(link.target.sourceLinks.length == 0){
									obj.sankeyContainer.removeChild(ball); 
								}
								
							})(link);
					  });
			})(node, link);
			node = link.target;
			
		}
}
	


SankeyDiagram.prototype.handleTick = function()
{
	
	var obj = this;
	var callback = function(e){
		var pathFunction = obj.sankey.path();
		//console.log(obj, e);
		if(obj.PlayButton && obj.PlayButton.playing){
		    if(obj.evenDelta > 1000){

				var paths = [];
				var ball = new createjs.Shape();
				obj.sankeyContainer.addChild(ball);
				ball.graphics.setStrokeStyle(1).beginStroke('#000').beginFill("#FF0000").drawCircle(0,0,5).endStroke().endFill();
				var ballTween = createjs.Tween.get(ball);
				
				var node = obj.nodes[0];
				obj.animateLink(obj, ball, ballTween, node);

				
				obj.evenDelta = 0;
			}else{
				obj.evenDelta  += e.delta
			}
		}
	}
    return callback;
	
}

SankeyDiagram.prototype.doNotificationAnimation = function(x,y)
{
	var b = new createjs.Shape();
	b.x = x;
	b.y = y;
	var ballTween = createjs.Tween.get(b);
	
	var g = b.graphics;
	g.beginFill("#FF0000").drawCircle(0,0,5);
	g.endStroke();
	g.endFill();
	g.setStrokeStyle(1, 'round', 'round');
	g.beginStroke(('#000000'));
	g.endStroke();
	this.sankeyContainer.addChild(b); 
	
	var obj = this;
	return ballTween.to({alpha: 0, scaleX: 3, scaleY: 3, visible:false},400).call(function(){obj.removeChild(b); });
}

SankeyDiagram.prototype.checkTextCollision = function(point)
{
	var threshold = 10
	for(var i=0; i < this.sankeyContainer.children.length; i++){
		var child = this.sankeyContainer.children[i];
		if (child instanceof createjs.TextBezier){
			var dist = Math.sqrt((child.startPt.x - point.x)*(child.startPt.x - point.x)+(child.startPt.y - point.y)*(child.startPt.y - point.y));
			if(dist < threshold){
				return true;
			}
		}
	}
	return false;
}

SankeyDiagram.prototype.updateSankey = function()
{
	var pathFunction = this.sankey.path();
	this.sankey.layout(32);
	for(var i=0; i < this.sankeyContainer.children.length; i++){
		var shape = this.sankeyContainer.children[i];
		if(shape.type == "node"){
			shape.x = shape.data.x;
			shape.y = shape.data.y;
			shape.width = this.sankey.nodeWidth(); //text.getMeasuredWidth()+(padding*2);
			shape.height = shape.data.dy; //text.getMeasuredHeight()+(padding*2);
			shape.graphics.beginStroke("#000").beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 1.0)).drawRect(0, 0, shape.width, shape.height);
			shape.detail = shape.data.detail + "\n"  +  shape.data.ActualValue + " " + shape.data.units;
			shape.value = shape.data.value;
			shape.units = shape.data.units;
		}else if(shape.type == "link"){
			shape.detail = shape.data.source.detail + " AND " + shape.data.target.detail + "\n" + this.valueDisplay(shape.data);
			
		}else if(shape.type == "text"){
			shape.text = shape.data.detail + "\n"  +  shape.data.ActualValue + " " + shape.data.units
			shape.x = shape.data.x-5;
			shape.y = shape.data.y + (shape.data.dy/2.0) - (shape.getMeasuredHeight()/2.0);
		}
		
	}
	
}

SankeyDiagram.prototype.recreateSankey = function()
{
	var pathFunction = this.sankey.path();
	
	this.sankey.layout(32);
	this.sankeyContainer.removeAllChildren();
	
	for(var i=0; i < this.nodes.length; i++){
		//var text = new createjs.Text(this.nodes[i].detail, "10px Arial", "#000");
		//text.x = this.nodes[i].x-5;
		//text.y = this.nodes[i].y + (this.nodes[i].dy/2.0) - (text.getMeasuredHeight()/2.0);
		//text.textAlign  = "end";
		//text.name = "text_"+this.nodes[i].name;
		//text.type = "text";
		
		var shape = new createjs.Shape();
		shape.x = this.nodes[i].x;
		shape.y = this.nodes[i].y;
		shape.width = this.sankey.nodeWidth(); //text.getMeasuredWidth()+(padding*2);
		shape.height = this.nodes[i].dy; //text.getMeasuredHeight()+(padding*2);
		shape.color = this.getColor(this.nodes[i].name);
		this.nodes[i].color = shape.color; //lets make sure we add color to the data
		this.nodes[i].alpha = 1.0;
		shape.graphics.beginStroke("#000").beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 1.0)).drawRect(0, 0, shape.width, shape.height);
		if(this.interactionLevel > 1){
			shape.addEventListener("mouseover", this);
			shape.addEventListener("mouseout", this);
			shape.addEventListener("click", this);
		}
		shape.detail = this.valueDisplay(this.nodes[i]) + "\n" + this.nodes[i].detail;
		shape.value = this.nodes[i].value;
		shape.units = this.nodes[i].units;
		shape.type = "node";
		shape.name = "shape_"+this.nodes[i].name;
		shape.data = this.nodes[i];
		//shape.shadow = new createjs.Shadow("#000", 0, 0, 10);
		this.sankeyContainer.addChild(shape);
		this.addChild(text);
	}
	for(var i=0; i < this.links.length; i++){
		 var link = this.links[i];
		 var path = pathFunction(link);
		 //var graphics = new createjs.Graphics().setStrokeStyle(1).beginStroke("#000").moveTo(link.source.x, link.source.y).lineTo(link.target.x, link.target.y);
		 var col = this.getColor(link.target.name)
		 var shapeLink = new createjs.Shape();
		 var w = Math.max(1, link.dy/2.0);
		 
		 var sourceColor = link.source.color;
		 var targetColor = link.target.color;
		 shapeLink.graphics.beginLinearGradientFill([createjs.Graphics.getRGB(sourceColor.r,sourceColor.g, sourceColor.b, 0.7),
										  createjs.Graphics.getRGB(targetColor.r,targetColor.g, targetColor.b, 0.7)], 
										  [0, 1], path["M"][0], 0, path["C"][4], 0)
				//.beginFill(createjs.Graphics.getRGB(col.r,col.g, col.b, 0.5))
				.moveTo(path["M"][0], path["M"][1]-w).bezierCurveTo (path["C"][0],path["C"][1]-w,path["C"][2],path["C"][3]-w,path["C"][4],path["C"][5]-w)
				.lineTo(path["C"][4],path["C"][5]+w).bezierCurveTo (path["C"][2],path["C"][3]+w,path["C"][0],path["C"][1]+w,path["M"][0], path["M"][1]+w);
		 
		if(this.interactionLevel > 1){
			 shapeLink.addEventListener("mouseover", this);
			 shapeLink.addEventListener("mouseout", this);
			 shapeLink.addEventListener("click", this);
		}
		 
		 shapeLink.detail = link.source.detail + " AND " + link.target.detail + "\n" + this.valueDisplay(link);
		 shapeLink.thinkness = link.dy;
		 shapeLink.color = col;
		 
		 link.color = shapeLink.color; //lets make sure we add color to the data
		 link.alpha = 0.5;
		 
		 shapeLink.type = "link";
		 shapeLink.path = path;
		 shapeLink.value = link.value;
		 shapeLink.data = link;
		 //shapeLink.name = "link_"+i;
		 this.sankeyContainer.addChild(shapeLink);
	}
	
	for(var i=0; i < this.nodes.length; i++){
		var col = this.labelColor(this.nodes[i], false);
		var text = new createjs.Text(this.nodes[i].detail, "bold 14px Arial", "#000");
		text.x = this.nodes[i].x - 5;
		text.y = this.nodes[i].y + (this.nodes[i].dy/2.0) + (text.getMeasuredHeight());
		text.textAlign  = "end";
		text.name = "text_"+this.nodes[i].name;
		text.type = "text";
		text.textBaseline = "bottom";
		var size = 14; //Math.max(16, Math.sqrt(this.nodes[i].ActualValue/1.5));
		text.data = this.nodes[i];
		//text.shadow = new createjs.Shadow(createjs.Graphics.getRGB(col.r,col.g, col.b, 1.0), 0, 0, 3);
		//this.sankeyContainer.addChild(text);
		
		var text2 = new createjs.Text(this.valueDisplay(this.nodes[i]), "bold 14px Arial", createjs.Graphics.getRGB(col.r,col.g, col.b, 1.0)); //createjs.Graphics.getRGB(col.r,col.g, col.b, 1.0));
		text2.x = this.nodes[i].x - 5;
		text2.y = this.nodes[i].y + (this.nodes[i].dy/2.0) + (text2.getMeasuredHeight()/3.0);
		text2.textAlign  = "end";
		//text2.shadow = new createjs.Shadow("#000000", 0, 0, 3);
		text2.name = "text2_"+this.nodes[i].name;
		text2.type = "text";
		text2.textBaseline = "bottom";
		text2.data = this.nodes[i];
		//this.sankeyContainer.addChild(text2);
	}
	
	for(var i=0; i < this.links.length; i++){
		var link = this.links[i];
		var path = pathFunction(link);
		var w = link.dy/2.0;
		var sPt = new createjs.Point(path['M'][0], path['M'][1]);
		var c1 = new createjs.Point(path['C'][0], path['C'][1]);
		var c2 = new createjs.Point(path['C'][2], path['C'][3]);
		var c3 = new createjs.Point(path['C'][4], path['C'][5]);
		var col = this.labelColor(link, true); //link.source.color;
		var xOffest = "  ";
		var halfXDist = (path['C'][4]-path['M'][0])*0.07;
		
		var size = 14; //Math.max(16, Math.sqrt(link.ActualValue/1.5));
		
		
		if(this.checkTextCollision(sPt)){
			//console.error("there is a collision: "+this.valueDisplay(link));
			for (var j=0; j < halfXDist; j++){
				xOffest += " ";
			}
		}
		
		//createjs.Graphics.getRGB(col.r,col.g, col.b, 1.0)
		var text = new createjs.TextBezier(xOffest+this.valueDisplay(link), "bold 14px Arial", createjs.Graphics.getRGB(col.r,col.g, col.b, 1.0) ,sPt, c1, c2, c3); //"\n"  +  link.ActualValue + " " + link.units link.source.detail + " AND " + link.target.detail
		text.x = 0; //path["M"][0]; 
		text.y = text.getMeasuredHeight()/3.0; //path["M"][1]-w;
		text.textAlign  = "start";
		text.textBaseline = "center";
		text.name = "text_"+this.links[i].name;
		text.type = "text";
		//text.shadow = new createjs.Shadow("#000000", 0, 0, 3);
		text.letterSpacing = 9;
		text.data = this.links[i];	
		//this.sankeyContainer.addChild(text);
		
		if(this.valueDisplay(link, true) != this.valueDisplay(link, false)){
			
			var col2 = this.labelColor(link, false); //link.source.color;
			var text2 = new createjs.TextBezier(" ("+this.valueDisplay(link, true)+")", "bold "+size+"px Arial", createjs.Graphics.getRGB(col2.r,col2.g, col2.b, 1.0) ,sPt, c1, c2, c3); 
			text2.startT = text.getMeasuredWidth()/text.bezier.length;
			text2.textAlign  = "start";
			text2.textBaseline = "center";
			text2.name = "text2_"+this.links[i].name;
			text2.type = "text";
			//text.shadow = new createjs.Shadow("#000000", 0, 0, 3);
			text2.letterSpacing = 9;
			text2.data = this.links[i];
			//this.sankeyContainer.addChild(text2);
		}
		

	}
}

SankeyDiagram.prototype.cloneObj = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}
SankeyDiagram.prototype.cloneArray = function(obj) {
    var arr1 = new Array();
    for (var property in obj) {
        arr1[property] = typeof(obj[property]) == 'object' ? this.cloneObj(obj[property]) : obj[property]
    }
    return arr1;
}


SankeyDiagram.prototype.addGeneralHoverEventListener = function(listener)
{
	if(this.interactionLevel > 1){
		for(var i=0; i < this.sankeyContainer.children.length; i++)
		{
			var child = this.sankeyContainer.children[i];
			if (child.type == "link" || child.type == "node"){
				//child.addEventListener("mouseover", listener);
				//child.addEventListener("mouseout", listener);
				child.addEventListener("click", listener);
			}
		}
	}
}

SankeyDiagram.prototype.addHoverEventListener = function(linkName, listener)
{
	if(this.interactionLevel > 1){
		var shape = this.sankeyContainer.getChildByName("shape_"+linkName);
		if(shape){
				shape.addEventListener("mouseover", listener);
				shape.addEventListener("mouseout", listener);
				shape.addEventListener("click", listener);
			}
	}
}


SankeyDiagram.prototype.setHovered =  function(linkName, hoverState)
{
	//var text = this.getChildByName("text_"+linkName);
	var shape = this.sankeyContainer.getChildByName("shape_"+linkName);
	this.setHoveredShape(shape, hoverState);
	//this.setHoveredShape(text, hoverState);
}

SankeyDiagram.prototype.setSelection = function(newSelectedItem)
{
	if(this.selection){
		this.selection.selected = false;
		this.updateShape(this.selection, false);
	}
	this.selection = newSelectedItem;
	this.selection.selected = true;
	this.updateShape(this.selection, false);
	
} 
SankeyDiagram.prototype.updateShape = function(shape, hoverState)
{
	if(shape && shape.type && shape.type == "node"){
		if(hoverState || shape.selected){
			shape.graphics.clear().setStrokeStyle(shape.selected ? 2 : 1).beginStroke(arEasel.style.red).beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 1.0)).drawRect(0, 0, shape.width, shape.height);
		}else{
			shape.graphics.clear().setStrokeStyle(1).beginStroke("#000").beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 1.0)).drawRect(0, 0, shape.width, shape.height);
		}
	}else if(shape && shape.type == "link"){
		if(hoverState || shape.selected){
			var sourceColor = shape.data.source.color;
			var targetColor = shape.data.target.color;
			var w = (shape.thinkness/2)+1;
			shape.graphics.clear().setStrokeStyle(shape.selected ? 2 : 1).beginStroke(arEasel.style.red)
			    //.beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 0.5))
				.beginLinearGradientFill([createjs.Graphics.getRGB(sourceColor.r,sourceColor.g, sourceColor.b, 0.5),
										  createjs.Graphics.getRGB(targetColor.r,targetColor.g, targetColor.b, 0.5)], 
										  [0, 1], shape.path["M"][0], 0, shape.path["C"][4], 0)
				.moveTo(shape.path["M"][0], shape.path["M"][1]-w).bezierCurveTo (shape.path["C"][0],shape.path["C"][1]-w,shape.path["C"][2],shape.path["C"][3]-w,shape.path["C"][4],shape.path["C"][5]-w)
				.lineTo(shape.path["C"][4],shape.path["C"][5]+w).bezierCurveTo (shape.path["C"][2],shape.path["C"][3]+w,shape.path["C"][0],shape.path["C"][1]+w,shape.path["M"][0], shape.path["M"][1]+w)
				.lineTo(shape.path["M"][0], shape.path["M"][1]-w);
		}else{
			//shape.graphics.clear().setStrokeStyle(shape.thinkness)
			//								  .beginStroke(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 0.5))
			//								  .moveTo(shape.path["M"][0], shape.path["M"][1]).bezierCurveTo (shape.path["C"][0],shape.path["C"][1],shape.path["C"][2],shape.path["C"][3],shape.path["C"][4],shape.path["C"][5]);
			var w = shape.thinkness/2;
			var sourceColor = shape.data.source.color;
			var targetColor = shape.data.target.color;
			shape.graphics.clear()//.beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 0.5))
				.beginLinearGradientFill([createjs.Graphics.getRGB(sourceColor.r,sourceColor.g, sourceColor.b, 0.5),
										  createjs.Graphics.getRGB(targetColor.r,targetColor.g, targetColor.b, 0.5)], 
										  [0, 1], shape.path["M"][0], 0, shape.path["C"][4], 0)
				.moveTo(shape.path["M"][0], shape.path["M"][1]-w).bezierCurveTo (shape.path["C"][0],shape.path["C"][1]-w,shape.path["C"][2],shape.path["C"][3]-w,shape.path["C"][4],shape.path["C"][5]-w)
				.lineTo(shape.path["C"][4],shape.path["C"][5]+w).bezierCurveTo (shape.path["C"][2],shape.path["C"][3]+w,shape.path["C"][0],shape.path["C"][1]+w,shape.path["M"][0], shape.path["M"][1]+w)
				.lineTo(shape.path["M"][0], shape.path["M"][1]-w);
		}
	}else if(shape && shape.type == "text"){
		if(hoverState || shape.selected){
			shape.font = "bold 14px Arial";
			shape.color = arEasel.style.red;
		}else{
			shape.font = "bold 14px Arial";
			shape.color = "#000";
		}
	}
}

SankeyDiagram.prototype.setHoveredShape =  function(shape, hoverState)
{
	this.updateShape(shape, hoverState);
}


SankeyDiagram.prototype.handleEvent = function(e) {
	if (e.target instanceof createjs.Shape){
		if (e.type == "mouseover"){
			//this.tooltip.visible = true;
			//this.getStage().canvas.title = e.target.detail;
			this.getStage().tooltip.setText("Tip: Click to Select\n\n"+e.target.detail);
			
			if(e.target.type == "link"){
				this.setHoveredShape(e.target, true);
			}else{
				var name = (e.target.name.split("_"))[1];
				this.setHovered(name, true);
			}
			//
		//	this.hover = true;
		}else if(e.type == "mouseout"){
			//this.tooltip.visible = false;
			this.getStage().tooltip.setText("");
			
			if(e.target.type == "link"){
				this.setHoveredShape(e.target, false);
			}else{
				var name = (e.target.name.split("_"))[1];
				this.setHovered(name, false);
			}
		//	this.hover = false;
		}else if (e.type == "click"){
			this.setSelection(e.target);
			
			//if(e.target.type == "link"){
			//	this.setHoveredShape(e.target, true);
			//}else{
			//	this.setSelection(e.target);
			//	var name = (e.target.name.split("_"))[1];
			//	this.setHovered(name, true);
			//}
		}
	}
}


arEasel.SankeyDiagram = SankeyDiagram;
}());
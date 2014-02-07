// namespace:
this.arEasel = this.arEasel||{};

(function() {

// define a new TextChoice class that extends Text, and handles drawing a hit area
// and implementing a hover color.



var TreeDiagram = function(data, width, height,interactionLevel){
	this.initialize(data, width, height, interactionLevel);
}
TreeDiagram.prototype = new createjs.Container(); // extend Container.

// save off initialize method from Text so we can call it from our own:
TreeDiagram.prototype.Container_initialize = TreeDiagram.prototype.initialize;

TreeDiagram.prototype.getColor = function(name)
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

TreeDiagram.prototype.getStrokeColor = function(node)
{
	var color = colorbrewer.Set3[12];
	var col;
	
	if(node.parent && node.parent.name.indexOf("B'") !== -1){
		 col = color[4];
	}else if(node.parent && node.parent.name.indexOf("B") !== -1){
		 col = color[5];
	}else{
		col = "#000";
	}
	return col
}

// overwrite Text's initialize method with our own:
TreeDiagram.prototype.initialize = function(data, width, height, interactionLevel) {
	this.Container_initialize(); 
	this.data = data;
	this.width = (width) ? Number(width)-10 : 600;
	this.height = (height) ? Number(height)-50 : 600;
	this.interactionLevel = interactionLevel || 2;
	//for(var i=0; i < data.children.length; i++){
	//	var text = new createjs.Text(data.children[i].name, "16px Arial", "#000");
	//	this.addChild(text);
	//}
	
	var tree = d3.layout.tree().size([this.width, this.height])
	.separation(function(a, b) { return (a.parent == b.parent ? 1 : 1) / a.depth; });
    //.size([560, diameter / 2 - 120])
    //.separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });
	
	this.nodes = tree.nodes(data);
	this.links = tree.links(this.nodes);
	
	
	console.log(this.nodes);
	for(var i=0; i < this.nodes.length; i++){
		var textFull = this.nodes[i].detail;
		if (this.nodes[i].parent && (this.nodes[i].parent.name == "B" || this.nodes[i].parent.name == "B'")){
			textFull += " &\n"+ this.nodes[i].parent.detail;
		}
		var text = new createjs.Text(this.nodes[i].size + " " + this.nodes[i].units, "bold 14px Arial", "#000");
		text.x = this.nodes[i].x - (text.getMeasuredWidth()/2.0);
		text.y = this.nodes[i].y;
		
		var text2 = new createjs.Text(textFull, "bold 14px Arial", "#000");
		text2.x = this.nodes[i].x - (text.getMeasuredWidth()/2.0);
		text2.y = this.nodes[i].y + text.getMeasuredHeight();
		
		var padding = 5;
		
		var shape = new createjs.Shape();
		shape.x = text.x-padding;
		shape.y = text.y-padding;
		shape.color = this.getColor(this.nodes[i].name);
		shape.width = Math.max(text.getMeasuredWidth(),text2.getMeasuredWidth())+(padding*2);
		shape.height = text.getMeasuredHeight() + text2.getMeasuredHeight() +(padding*2);
		
		strokeColor = this.getStrokeColor(this.nodes[i]);
		shape.graphics.beginStroke(strokeColor).setStrokeStyle(3).beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 1.0)).drawRoundRect(0, 0, shape.width, shape.height, 3);
		
		if(this.interactionLevel > 1){
			shape.addEventListener("mouseover", this);
			shape.addEventListener("mouseout", this);
		}
		
		shape.name = "shape_"+this.nodes[i].name;
		text.name = "text_"+this.nodes[i].name;
		this.addChild(shape);
		this.addChild(text);
		this.addChild(text2);
	}
	//for(var i=0; i < this.links.length; i++){
	//	 var link = this.links[i];
	//	 var graphics = new createjs.Graphics().beginStroke("#000").moveTo(link.source.x, link.source.y).lineTo(link.target.x, link.target.y);
	//	 var shape = new createjs.Shape(graphics);
	//	 this.addChild(shape);
	//}
	//arEasel.gridLayout(this, {vSpace: 50, hSpace: 20});
}

TreeDiagram.prototype.addHoverEventListener = function(linkName, listener)
{
	var shape = this.getChildByName("shape_"+linkName);
	if(shape){
		shape.addEventListener("mouseover", listener);
		shape.addEventListener("mouseout", listener);
	}
}


TreeDiagram.prototype.setHovered =  function(linkName, state)
{
	//var text = this.findChildByName("text_"+linkName);
	var shape = this.getChildByName("shape_"+linkName);
	this.setHoveredShape(shape, state);
}

TreeDiagram.prototype.setHoveredShape =  function(shape, state)
{
	//var text = this.getChildByName("text_"+linkName);
	if(shape){
		if(state){
			//text.color = "#FFF";
			shape.graphics.beginStroke(arEasel.style.green2).beginFill(arEasel.style.green2).drawRoundRect(0, 0, shape.width, shape.height, 3);
		}else{
			//text.color = "#000";
			shape.graphics.beginStroke("#000").beginFill(createjs.Graphics.getRGB(shape.color.r,shape.color.g, shape.color.b, 1.0)).drawRoundRect(0, 0, shape.width, shape.height, 3);
		}
	}
}


TreeDiagram.prototype.handleEvent = function(e) {
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


arEasel.TreeDiagram = TreeDiagram;
}());
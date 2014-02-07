// namespace:
this.arEasel = this.arEasel||{};

(function() {

// define a new TextChoice class that extends Text, and handles drawing a hit area
// and implementing a hover color.

var Tooltip = function(){
	this.initialize();
}
Tooltip.prototype = new createjs.Container(); // extend Container.

Tooltip.prototype.Container_initialize = Tooltip.prototype.initialize;

Tooltip.prototype.initialize = function(diagram) {
	this.Container_initialize(); 
	
	this.box = new createjs.Shape();
	this.addChild(this.box);
	
	this.text = new createjs.Container();
	//Text("tooltip", "14px Arial", "#000");
	this.addChild(this.text);
	
	this.width = 0; //this.text.width;
	this.height = 0; //this.text.height;
	this.padding = 5;
	this.stemH = 10;
	this.stemHOffset = 19;
	this.stemVOffset = 10;
	this.box.alpha = 0.7;
	this.alpha = 0;
	this.delay = 200;
	//this.box.graphics.clear().setStrokeStyle(1).beginStroke("#000").beginFill("#FFF").drawRect(0, 0, this.width, this.height);
}

Tooltip.prototype.show = function(){
	return createjs.Tween.get(this, {override:true}).to({alpha:1}, this.delay, createjs.Ease.linear);
}

Tooltip.prototype.hide = function(){
	//var delay = 100; //this.delay/2;
    return createjs.Tween.get(this, {override:true}).to({alpha:0}, this.delay, createjs.Ease.linear);
}

Tooltip.prototype.setText = function(newText){
	
	this.text.removeAllChildren();
	if(newText.length > 0){
		var obj = this;
		this.hide().call(function(){
			var lines = newText.split("\n");
			for(var i=0; i < lines.length; i++){
				var f = (lines[i].indexOf("Tip:") != -1) ? "bold 15px Arial" : "14px Arial";
				var newTextLine = new createjs.Text(lines[i], f, "#000");
				obj.text.addChild(newTextLine);
			}
			arEasel.gridLayout(obj.text, {hSpace: obj.padding, vSpace: obj.padding});
			var bounds = arEasel.getBounds(obj.text);
			obj.width = bounds.width;
			obj.height = bounds.height;
			//obj.box.shadow = new createjs.Shadow("#565656", 3, 3, 5);
			obj.updatePosition();
			obj.updateBox();
			obj.show();
		});
		
	}else{
		this.hide();
	}
}

Tooltip.prototype.updateBox = function(){
	var stage = this.getStage();
	var pt = this.globalToLocal(stage.mouseX, stage.mouseY);
	this.box.graphics.clear().setStrokeStyle(1).beginStroke("#000").beginFill("#fff").mt(pt.x+this.stemVOffset+5, pt.y+this.stemH+this.stemHOffset).lt(pt.x+this.stemVOffset, pt.y+this.stemHOffset).lt(pt.x+this.stemVOffset-5, pt.y+this.stemH+this.stemHOffset)
		 .lt(0,0).lt(0,this.height+this.padding*2)
		 .lt(this.width+this.padding*2, this.height+this.padding*2)
		 .lt(this.width+this.padding*2, 0)
		 .lt(pt.x+this.stemVOffset+5, pt.y+this.stemH+this.stemHOffset).closePath();
		 //.drawRoundRect (0, 0, this.width+this.padding*2, this.height+this.padding*2, 5).closePath ();
}

Tooltip.prototype.updatePosition = function()
{
	var stage = this.getStage();
	//this.x = stage.mouseX - (((stage.mouseX+this.width) > this.getStage().canvas.width) ? this.width : -9);
	//this.y = stage.mouseY - (((stage.mouseY+this.height) > this.getStage().canvas.height) ? this.height+16 : -16);
	
	if((stage.mouseX+this.width) < this.getStage().canvas.width){
		this.x = stage.mouseX - 12;
	}else{
		this.x = this.getStage().canvas.width - this.width - this.padding*3 - 12;
	}
	
	
	this.y = stage.mouseY + this.stemH + this.stemHOffset;
	
	
	
	//if((stage.mouseX+this.width) > this.getStage().canvas.width){
	//	createjs.Tween.get(this, {override:true}).wait(500).to({x:stage.mouseX-this.width}, 200);
	//}else{
	//	
	//}
}

Tooltip.prototype.handleEvent = function(e) {
	if(e.type == "stagemousemove"){
		this.updatePosition();
		this.updateBox();
		//this.x = e.stageX - (((e.stageX+this.width) > this.getStage().canvas.width) ? this.width : -9);
		//this.y = e.stageY - (((e.stageY+this.height) > this.getStage().canvas.height) ? this.height+16 : -16);
	}
}

arEasel.Tooltip = Tooltip;
}());
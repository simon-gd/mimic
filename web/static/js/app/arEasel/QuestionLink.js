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
// define a new RadioButton class that extends Text, and handles drawing a hit area
// and implementing a hover color.
var QuestionLink = function(text, link, target, style) {
	this.initialize(text, link, target, style);
}
QuestionLink.prototype = new createjs.Text(); // extend Text.
// save off initialize method from Text so we can call it from our own:
QuestionLink.prototype.Text_initialize = QuestionLink.prototype.initialize;
// overwrite Text's initialize method with our own:
QuestionLink.prototype.initialize = function(text, link, target, style) {
	this.Text_initialize(text, style.font, style.color); 
	this.hoverColor = style.hoverColor;
	this.hover = false;
	this.hitArea = new createjs.Shape();
	this.textBaseline = "top";
	//this.cursor = "pointer";
	this.link = link;
	this.target = target;
	if(target){
		linkNames = link.split(",");
		for(var i=0; i < linkNames.length; i++){
			this.target.addHoverEventListener(linkNames[i], this);
		}
	}
}
// use the same approach with draw:
QuestionLink.prototype.Text_draw = QuestionLink.prototype.draw;
QuestionLink.prototype.draw = function(ctx, ignoreCache) {
	// save default color, and overwrite it with the hover color if appropriate:
	var color = this.color;
	if (this.hover) { this.color = this.hoverColor; }
	
	// call Text's drawing method to do the real work of drawing to the canvas:
	this.Text_draw(ctx, ignoreCache);
	
	// restore the default color value:
	this.color = color;
	
	// update hit area so the full text area is clickable, not just the characters:
	this.hitArea.graphics.clear().beginFill("#FFF").drawRect(0,0,this.lineWidth||this.getMeasuredWidth(), this.getMeasuredHeight());
}
// set up the handlers for mouseover / out:
QuestionLink.prototype.onMouseOver = function() {
	if(this.target){
		var linkNames = this.link.split(",");
		for(var i=0; i < linkNames.length; i++){
			this.target.setHovered(linkNames[i], true);
		}
	}
	this.hover = true;
}
QuestionLink.prototype.onMouseOut = function() {
	if(this.target){
		var linkNames = this.link.split(",");
		for(var i=0; i < linkNames.length; i++){
			this.target.setHovered(linkNames[i], false);
		}
	}
	this.hover = false;
}

QuestionLink.prototype.handleEvent = function(e) {

	if (e.type == "mouseover"){
		this.hover = true;
	}else if(e.type == "mouseout"){
		this.hover = false;
	}
}

arEasel.QuestionLink = QuestionLink;
}());
// namespace:
this.arEasel = this.arEasel||{};

(function () {

if(createjs.DisplayObject.prototype.width == null){
    createjs.DisplayObject.prototype.width = 0;
}
if(createjs.DisplayObject.prototype.height == null){
    createjs.DisplayObject.prototype.height = 0;
}

var getBounds = function(obj) {
  var bounds={x:Infinity,y:Infinity,width:0,height:0};
  
  
  if ( obj instanceof arEasel.PushButton ) {
    gp = obj.localToGlobal(0,0);
	gp2 = obj.localToGlobal(obj.width,obj.height);
	gp3 = obj.localToGlobal(obj.width,0);
	gp4 = obj.localToGlobal(0,obj.height);
	bounds.x = Math.min(Math.min(Math.min(gp.x,gp2.x),gp3.x),gp4.x);
    bounds.y = Math.min(Math.min(Math.min(gp.y,gp2.y),gp3.y),gp4.y);
    bounds.width = Math.max(Math.max(Math.max(gp.x,gp2.x),gp3.x),gp4.x) - bounds.x;
    bounds.height = Math.max(Math.max(Math.max(gp.y,gp2.y),gp3.y),gp4.y) - bounds.y;
  }else if ( obj instanceof createjs.Container ) {
    if(obj.width && obj.height){
		bounds.x = 0;
		bounds.y = 0;
		bounds.width = obj.width;
		bounds.height = obj.height;
	}else{
		var children = obj.children, l=children.length, cbounds, c;
		for ( c = 0; c < l; c++ ) {
		  cbounds = getBounds(children[c]);
		  if ( cbounds.x < bounds.x ) bounds.x = cbounds.x;
		  if ( cbounds.y < bounds.y ) bounds.y = cbounds.y;
		  if ( cbounds.x+cbounds.width > bounds.width ) bounds.width = cbounds.x+cbounds.width;
		  if ( cbounds.y+cbounds.height > bounds.height ) bounds.height = cbounds.y+cbounds.height;
		}
		
		bounds.width = bounds.width-bounds.x;
		bounds.height = bounds.height-bounds.y;
	}
	return bounds;
  } else {
    var gp,gp2,gp3,gp4,imgr;
    if ( obj instanceof createjs.Shape ) {
		gp = obj.localToGlobal(0,0);
		gp2 = obj.localToGlobal(obj.width,obj.height);
		gp3 = obj.localToGlobal(obj.width,0);
		gp4 = obj.localToGlobal(0,obj.height);
		bounds.x = Math.min(Math.min(Math.min(gp.x,gp2.x),gp3.x),gp4.x);
		bounds.y = Math.min(Math.min(Math.min(gp.y,gp2.y),gp3.y),gp4.y);
		bounds.width = Math.max(Math.max(Math.max(gp.x,gp2.x),gp3.x),gp4.x) - bounds.x;
		bounds.height = Math.max(Math.max(Math.max(gp.y,gp2.y),gp3.y),gp4.y) - bounds.y;
    }else if(obj instanceof createjs.Text ){
		gp = obj.localToGlobal(0,0);
		gp2 = obj.localToGlobal(obj.getMeasuredWidth(),obj.getMeasuredHeight());
		gp3 = obj.localToGlobal(obj.getMeasuredWidth(),0);
		gp4 = obj.localToGlobal(0,obj.getMeasuredHeight());
	
	} else if ( obj instanceof createjs.Bitmap ) {
		gp = obj.localToGlobal(0,0);
		gp2 = obj.localToGlobal(obj.width,obj.height);
		gp3 = obj.localToGlobal(obj.width,0);
		gp4 = obj.localToGlobal(0,obj.height);
	
    } else if ( obj instanceof createjs.BitmapAnimation ) {
		if ( obj.spriteSheet._frames && obj.spriteSheet._frames[obj.currentFrame] && obj.spriteSheet._frames[obj.currentFrame].image ){
			imgr = obj.spriteSheet.getFrame(obj.currentFrame).rect;
			gp = obj.localToGlobal(0,0);
			gp2 = obj.localToGlobal(imgr.width,imgr.height);
			gp3 = obj.localToGlobal(imgr.width,0);
			gp4 = obj.localToGlobal(0,imgr.height);
		}else{
			return bounds;
		}
	}else if(obj instanceof createjs.DOMElement ){
		if (obj.width && obj.height){
			gp = new createjs.Point(obj.x,obj.y);
			gp2 = new createjs.Point(obj.width,obj.height);
			gp3 = new createjs.Point(obj.width,obj.y);
			gp4 = new createjs.Point(obj.x,obj.height);
			bounds.x = Math.min(Math.min(Math.min(gp.x,gp2.x),gp3.x),gp4.x);
			bounds.y = Math.min(Math.min(Math.min(gp.y,gp2.y),gp3.y),gp4.y);
			bounds.width = Math.max(Math.max(Math.max(gp.x,gp2.x),gp3.x),gp4.x) - bounds.x;
			bounds.height = Math.max(Math.max(Math.max(gp.y,gp2.y),gp3.y),gp4.y) - bounds.y;
		}
		return bounds;
	} else {
		return bounds;
    }
    bounds.x = Math.min(Math.min(Math.min(gp.x,gp2.x),gp3.x),gp4.x);
    bounds.y = Math.min(Math.min(Math.min(gp.y,gp2.y),gp3.y),gp4.y);
    bounds.width = Math.max(Math.max(Math.max(gp.x,gp2.x),gp3.x),gp4.x) - bounds.x;
    bounds.height = Math.max(Math.max(Math.max(gp.y,gp2.y),gp3.y),gp4.y) - bounds.y;
  }
 
  return bounds;
}
var vAlign = function(container, pos)
{
	var cbounds = getBounds(container);
	
	var items = container.children;
	for (var i = 0; i < items.length; i++) {
		var bounds = getBounds(items[i]);
		if(pos == "center"){
			items[i].y = (cbounds.height / 2) - (bounds.height / 2);
		}
	}
}

var gridLayout = function (container, params) {
    // params: {hLayout:false, vSpace: 0, hSpace: 0}
	var items = container.children;
	var params = params || {};
    var hLayout = params.hLayout || false;
	var vSpace = params.vSpace || 5;
	var hSpace = params.hSpace || 5;
	
	var columns = params.columns || 2;
	var rows = params.rows || 0;
	if (rows > 0) {
		columns = Math.floor((items.length + rows - 1) / rows); 
	} else {
		rows = Math.floor((items.length + columns - 1) / columns);
	}	
	
    for (var i = 0; i < items.length; i++) {	
		if (i > 0) {
			if (items[i] instanceof createjs.DOMElement){
				// XXX - HACK we don't count the DOM element, we just place it on top of the previeus element
				var bounds = getBounds(items[i - 1]);
				items[i].x = bounds.x;
				items[i].y = bounds.y;
			}else{
				var bounds;
				var prev_item;
				if (items[i - 1] instanceof createjs.DOMElement){
					// XXX - HACK assumes that we never place DOMElement first
					bounds = getBounds(items[i - 2]);
					prev_item = items[i - 2];
				}else{
					bounds = getBounds(items[i - 1]);
					prev_item = items[i - 1];
				}
				var width = bounds.width; //items[i - 1].getMeasuredWidth();
				var height = bounds.height; //items[i - 1].getMeasuredHeight();
				var offsetX = hLayout ?  prev_item.x + width: 0;
				var offsetY = hLayout ? 0 : prev_item.y + height ;
				items[i].x = offsetX + hSpace;
				items[i].y = offsetY + vSpace;
			}
        } else {
            items[i].x = hSpace;
            items[i].y = vSpace;
        }
    }
}

var gridLayout2 = function (container, params) {
    // params: {hLayout:false, vSpace: 0, hSpace: 0}
	var items = container.children;
	var params = params || {};
    var hLayout = params.hLayout || false;
	var vSpace = params.vSpace || 0;
	var hSpace = params.hSpace || 0;
	
	var columns = params.columns || 2;
	var rows = params.rows || 0;
	if (rows > 0) {
		columns = Math.floor((items.length + rows - 1) / rows); 
	} else {
		rows = Math.floor((items.length + columns - 1) / columns);
	}	
	var offsetX=0, offsetY=0;
    for (var i = 0, j = 0; i < items.length; i++, j++) {	
		//if (i >= 0) {
			if (items[i] instanceof createjs.DOMElement){
				// XXX - HACK we don't count the DOM element, we just place it on top of the previeus element
				var bounds = getBounds(items[i - 1]);
				items[i].x = bounds.x;
				items[i].y = bounds.y;
			}else{
				var bounds;
				var prev_item;
				if (items[i - 1] instanceof createjs.DOMElement){
					// XXX - HACK assumes that we never place DOMElement first
					bounds = getBounds(items[i - 2]);
					prev_item = items[i - 2];
				}else{
					bounds = getBounds(items[i - 1]);
					prev_item = items[i - 1];
				}
				var width = bounds.width; //items[i - 1].getMeasuredWidth();
				var height = bounds.height; //items[i - 1].getMeasuredHeight();
				

				if (hLayout) {
					if (j >= columns) {
						offsetY += height + vSpace;
						offsetX = hSpace;
						j = 0;
					}
					else {
						offsetX += width + hSpace;
					}
				} else {
					if (j >= rows) {
						offsetX += width + hSpace;
						offsetY = vSpace;
						j = 0;
					} else {
						offsetY += height + vSpace;
					}
				}
				
				
				items[i].x = offsetX;
				items[i].y = offsetY;
			}
        //} else {
        //    items[i].x = hSpace;
        //    items[i].y = vSpace;
        //}
    }
}
	/*
	var grid = function (spec, shared) {
		var my = shared || {};
		var that = {};
		
		my.hgap = spec.hgap || 0;
		my.vgap = spec.vgap || 0;
		
		my.columns = spec.columns || my.items.length;
		my.rows = spec.rows || 0;
		my.fillVertical = spec.fill && spec.fill === 'vertical';

		that.layout = function (container) {
			var i, j;
			var insets = my.insets();
			var x = my.hgap;
			var y = my.vgap;
			var height;
			var width;
			for (i = 0, j = 1; i < container.children.length; i += 1, j += 1) {
				container.children[i].x = x;
				container.children[i].y = y;
				

				if (!my.fillVertical) {
					if (j >= my.columns) {
						y += height + my.vgap;
						x = insets.left;
						j = 0;
					}
					else {
						x += width + my.hgap;
					}
				} else {
					if (j >= my.rows) {
						x += width + my.hgap;
						y = insets.top;
						j = 0;
					} else {
						y += height + my.vgap;
					}
				}
			}
			return container;
		};

		
		return that;
	};
	*/
	
	
arEasel.gridLayout = gridLayout;
arEasel.gridLayout2 = gridLayout2;
arEasel.getBounds = getBounds;
arEasel.vAlign = vAlign;
}());

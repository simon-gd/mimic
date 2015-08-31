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

/*
 * BezierMotionGuidePlugin
 */

// namespace:
this.createjs = this.createjs||{};

(function() {
	/**
	 * A TweenJS plugin for working with motion guides.
	 *
	 * To use, install the plugin after TweenJS has loaded. Next tween the 'guide' property with an object as detailed below.
	 *
	 *       createjs.BezierMotionGuidePlugin.install();
	 *
	 * <h4>Example</h4>
	 *
	 *      // Using a Motion Guide
	 *	    Tween.get(target).to({cubicguide:{ path:[0,0, 0,200,200,200, 300,300] }},7000);
	 *	    // Visualizing the line
	 *	    graphics.moveTo(0,0).bezierCurveTo(0,200,200,200);
	 *
	 * Each path needs pre-computation to ensure there's fast performance. Because of the pre-computation there's no
	 * built in support for path changes mid tween. These are the Guide Object's properties:<UL>
	 *      <LI> path: Required, Array : The x/y points used to draw the path with a moveTo and 1 to n bezierCurveTo calls.</LI>
	 *      <LI> start: Optional, 0-1 : Initial position, default 0 except for when continuing along the same path.</LI>
	 *      <LI> end: Optional, 0-1 : Final position, default 1 if not specified.</LI>
	 *      <LI> orient: Optional, bool : Set the target's rotation parallel to the curve at its position.</LI>
	 * </UL>
	 * Guide objects should not be shared between tweens even if all properties are identical, the library stores
	 * information on these objects in the background and sharing them can cause unexpected behaviour. Values
	 * outside 0-1 range of tweens will be a "best guess" from the appropriate part of the defined curve.
	 *
	 * @class MotionGuidePlugin
	 * @constructor
	 **/
	var BezierMotionGuidePlugin = function() {
		throw("BezierMotionGuidePlugin cannot be instantiated.")
	};

	// static interface:
	/**
	 * @property priority
	 * @protected
	 * @static
	 **/
	BezierMotionGuidePlugin.priority = 0; // high priority, should run sooner

	/**
	 * Installs this plugin for use with TweenJS. Call this once after TweenJS is loaded to enable this plugin.
	 * @method install
	 * @static
	 **/
	BezierMotionGuidePlugin.install = function() {
		createjs.Tween.installPlugin(BezierMotionGuidePlugin, ["cubicguide", "x", "y", "rotation"]);
		return createjs.Tween.IGNORE;
	};

	/**
	 * @method init
	 * @protected
	 * @static
	 **/
	BezierMotionGuidePlugin.init = function(tween, prop, value) {
		var target = tween.target;
		if(!target.hasOwnProperty("x")){ target.x = 0; }
		if(!target.hasOwnProperty("y")){ target.y = 0; }
		if(!target.hasOwnProperty("rotation")){ target.rotation = 0; }
		return prop=="cubicguide"?null:value;
	};

	/**
	 * @method step
	 * @protected
	 * @static
	 **/
	BezierMotionGuidePlugin.step = function(tween, prop, startValue, endValue, injectProps) {
		if(prop != "cubicguide"){ return endValue; }
		var temp, data = endValue;
		if(!data.hasOwnProperty("path")){ data.path = []; }
		var path = data.path;
		if(!data.hasOwnProperty("end")){ data.end = 1; }
		if(!data.hasOwnProperty("start")){
			data.start = (startValue&&startValue.hasOwnProperty("end")&&startValue.path===path)?startValue.end:0;
		}
		if(data.hasOwnProperty("_segments") && data._length){ return endValue; }
		var l = path.length;
		var accuracy = 20;		// Adjust to improve line following precision but sacrifice performance (# of seg)
		if(l >= 8 && (l-2) % 6 == 0){	// Enough points && contains correct number per entry ignoring start
			data._segments = [];
			data._length = 0;
			for(var i=2; i<l; i+=6){
				var sx = path[i-2], sy = path[i-1];
				var c1x = path[i+0], c1y = path[i+1];
				var c2x = path[i+2], c2y = path[i+3];
				var ex = path[i+4], ey = path[i+5];
				var oldX = sx, oldY = sy;
				var tempX, tempY, total = 0;
				var sublines = [];
				for(var j=1; j<=accuracy; j++){
					var t = j/accuracy;
					var inv = 1 - t;
					tempX = inv*inv*inv * sx + 3 * inv * inv * t * c1x + 3*inv*t*t*c2x+ t*t*t * ex;
					tempY = inv*inv*inv * sy + 3 * inv * inv * t * c1y + 3*inv*t*t*c2y+ t*t*t * ey;
					total += sublines[sublines.push(Math.sqrt((temp=tempX-oldX)*temp + (temp=tempY-oldY)*temp))-1];
					oldX = tempX;
					oldY = tempY;
				}
				data._segments.push(total);
				data._segments.push(sublines);
				data._length += total;
			}
		} else {
			throw("invalid 'path' data, please see documentation for valid paths");
		}

		temp = data.orient;
		data.orient = false;
		BezierMotionGuidePlugin.calc(data, data.end, injectProps);
		data.orient = temp;
		return endValue;
	};

	/**
	 * @method tween
	 * @protected
	 * @static
	 **/
	BezierMotionGuidePlugin.tween = function(tween, prop, value, startValues, endValues, ratio, wait, end) {
		var data = endValues.guide;
		if(data == undefined || data === startValues.guide){ return value; }
		if(data.lastRatio != ratio){
			// first time through so calculate what I need to
			var t = ((data.end-data.start)*(wait?data.end:ratio)+data.start);
			BezierMotionGuidePlugin.calc(data, t, tween.target);
			if(data.orient){ tween.target.rotation += startValues.rotation||0; }
			data.lastRatio = ratio;
		}
		if(!data.orient && prop == "rotation"){ return value; }
		return tween.target[prop];
	};

	/**
	 * Determine the appropriate x/y/rotation information about a path for a given ratio along the path.
	 * Assumes a path object with all optional parameters specified.
	 * @param data Data object you would pass to the "guide:" property in a Tween
	 * @param ratio 0-1 Distance along path, values outside 0-1 are "best guess"
	 * @param target Object to copy the results onto, will use a new object if not supplied.
	 * @return {Object} The target object or a new object w/ the tweened properties
	 * @static
	 */
	BezierMotionGuidePlugin.calc = function(data, ratio, target) {
		if(data._segments == undefined){ MotionGuidePlugin.validate(data); }
		if(target == undefined){ target = {x:0, y:0, rotation:0}; }
		var seg = data._segments;
		var path = data.path;

		// find segment
		var pos = data._length * ratio;
		var cap = seg.length - 2;
		var n = 0;
		while(pos > seg[n] && n < cap){
			pos -= seg[n];
			n+=3;
		}

		// find subline
		var sublines = seg[n+1];
		var i = 0;
		cap = sublines.length-1;
		while(pos > sublines[i] && i < cap){
			pos -= sublines[i];
			i++;
		}
		var t = (i/++cap)+(pos/(cap*sublines[i]));

		// find x/y
		n = (n*3)+2;
		var inv = 1 - t;
		//target.x = inv*inv * path[n-2] + 2 * inv * t * path[n+0] + t*t * path[n+2];
		//target.y = inv*inv * path[n-1] + 2 * inv * t * path[n+1] + t*t * path[n+3];
		target.x = inv*inv*inv * path[n-2] + 3 * inv * inv * t * path[n] + 3*inv*t*t*path[n+2] + t*t*t * path[n+4];
		target.y = inv*inv*inv * path[n-1] + 3 * inv * inv * t * path[n+1] + 3*inv*t*t*path[n+3] + t*t*t * path[n+5];
		

		// orientation
		if(data.orient){
			target.rotation = 57.2957795 * Math.atan2(
			//	(path[n+1]-path[n-1])*inv + (path[n+3]-path[n+1])*t,
			//	(path[n+0]-path[n-2])*inv + (path[n+2]-path[n+0])*t);
				(path[n+1]-path[n-1])*inv + (path[n+5]-path[n+3])*t,
				(path[n+0]-path[n-2])*inv + (path[n+4]-path[n+2])*t);
		}

		return target;
	};

	// public properties:

	// private properties:

	// constructor:

	// public methods:

	// private methods:

	createjs.BezierMotionGuidePlugin = BezierMotionGuidePlugin;
}());

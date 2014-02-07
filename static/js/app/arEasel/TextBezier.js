this.createjs=this.createjs||{};

(function () {

    // define a new TextBezier class that extends Text and drawing arc text.
    var TextBezier = function (text, font, color, startPt, ctPt1, ctPt2, endPt) {
        this.initialize(text, font, color, startPt, ctPt1, ctPt2, endPt);
    }

    TextBezier.prototype = new createjs.Text(); // extend Text.

    // save off initialize method from Text so we can call it from our own:
    TextBezier.prototype.Text_initialize = TextBezier.prototype.initialize;

    // overwrite Text's initialize method with our own:
    TextBezier.prototype.initialize = function (text, font, color, startPt, ctPt1, ctPt2, endPt) {
        this.Text_initialize(text, font, color);
		this.startPt = startPt;
        this.ctPt1 = ctPt1;
		this.ctPt2 = ctPt2;
		this.endPt = endPt;
		this.letterSpacing = 10;
		this.startT = 0;
        
		
		//this.L = this.ArcLength(1.0);
		
		this.bezier = new arEasel.Bezier(startPt, ctPt1, ctPt2, endPt);
    }

    // use the same approach with draw:
    TextBezier.prototype.Text_drawTextLine = TextBezier.prototype._drawTextLine;
	/*
	TextBezier.prototype.ArcLength = function (tmax)
	{
		var temp = 1;
		var sx = this.startPt.x, sy = this.startPt.y;
		var c1x = this.ctPt1.x, c1y = this.ctPt1.y;
		var c2x = this.ctPt2.x, c2y = this.ctPt2.y;
		var ex = this.endPt.x, ey = this.endPt.y;
		var oldX = sx, oldY = sy;
		var tempX, tempY, total = 0;
		var sublines = [];
		var accuracy = 10;
		for(var j=1; j<=accuracy; j++){
			var t = j/accuracy;
			
			if(t <= tmax){
				var inv = 1 - t;
				tempX = inv*inv*inv * sx + 3 * inv * inv * t * c1x + 3*inv*t*t*c2x+ t*t*t * ex;
				tempY = inv*inv*inv * sy + 3 * inv * inv * t * c1y + 3*inv*t*t*c2y+ t*t*t * ey;
				total += sublines[sublines.push(Math.sqrt((temp=tempX-oldX)*temp + (temp=tempY-oldY)*temp))-1];
				oldX = tempX;
				oldY = tempY;
			}else{
				break;
			}
		}
		return total;
	}
	
	TextBezier.prototype.Y = function(t)
	{
		var sy = this.startPt.y;
		var c1y = this.ctPt1.y;
		var c2y = this.ctPt2.y;
		var ey = this.endPt.y;
		var inv = 1 - t;
		return inv*inv*inv * sy + 3 * inv * inv * t * c1y + 3*inv*t*t*c2y+ t*t*t * ey;
		
	}
	
	TextBezier.prototype.LengthDY = function(t)
	{
		return this.DY(t);			
	}
	TextBezier.prototype.DY = function(t)
	{
		var inv = 1 - t;
		return 3*inv*inv * (this.ctPt1.y-this.startPt.y) + 6*t*inv*(this.ctPt2.y-this.ctPt1.y) + 3 * t*t * (this.endPt.y-this.ctPt2.y);
			
	}
	
	TextBezier.prototype.Sigma= function(t)
	{
		return 1.0; //this.DY(t);
	}
	 
	TextBezier.prototype.GetCurveParameter = function(t) // tmin <= t <= tmax
	{
	  var tmin = 0.0, tmax = 1.0;
	  var umin = 0.0, umax = 1.0;
	  var n = 10;
	  var h = (t - tmin)/n; // step size, `n' is application-specified
		var u = umin; // initial condition
		t = tmin; // initial condition
		for (var i = 1; i <= n; i++)
		{
		// The divisions here might be a problem if the divisors are
		// nearly zero.
		var k1 = h*Sigma(t)/this.LengthDY(u);
		var k2 = h*Sigma(t + h/2)/this.LengthDY(u + k1/2);
		var k3 = h*Sigma(t + h/2)/this.LengthDY(u + k2/2);
		var k4 = h*Sigma(t + h)/this.LengthDY(u + k3);
		t += h;
		u += (k1 + 2*(k2 + k3) + k4)/6;
		}
		return u;
	}
	*/
	
	
	
    //Override _drawTextLine method
    TextBezier.prototype._drawTextLine = function (ctx, text, y) {
        var wordWidth = ctx.measureText(text).width;
        //var angle = 2 * Math.asin(wordWidth / ( 2 * this.radius ));
        //ctx.save();
        //ctx.rotate(-1 * angle / 2);
        //ctx.rotate(-1 * (angle / text.length) / 2);
		
		var totalWidth = this.bezier.length;
		var textWidth = ctx.measureText(text).width;
		
		var start = this.startT; //(this.textAlign == "center") ? ((totalWidth-textWidth)/2.0)/totalWidth : (this.textAlign == "right" || this.textAlign == "end") ? (totalWidth-textWidth)/totalWidth : 0.0;
		//var sx = this.startPt.x, sy = this.startPt.y;
		//var c1x = this.ctPt1.x, c1y = this.ctPt1.y;
		//var c2x = this.ctPt2.x, c2y = this.ctPt2.y;
		//var ex = this.endPt.x, ey = this.endPt.y;
		var letterX = 0;
       
		var oldX = this.startPt.x, oldY = this.startPt.y;
		for (var i = 0; i < text.length; i++) {
			ctx.save();
			var t = start+(letterX/totalWidth);
			var inv = 1.0 - t;
			// B(t) = (1-t)^3 * P0 + 3(1-t)^2 * t * P1 + 3(1-t) * t^2 * P2 + t^3 P3
			var tempX = this.bezier.mx(t);//inv*inv*inv * sx + 3 * inv * inv * t * c1x + 3*inv*t*t*c2x+ t*t*t * ex;
			var tempY = this.bezier.my(t);//inv*inv*inv * sy + 3 * inv * inv * t * c1y + 3*inv*t*t*c2y+ t*t*t * ey;
			
            ctx.translate(tempX, tempY);
			
			
			// B'(t) = 3*(1-t)^2 * (P1-P0) + 6*t*(1-t)(P2-P1) + 3 * t^2 * (P3-P2);
			var xPrime = this.bezier.mdx(t);//3*inv*inv * (this.ctPt1.x-this.startPt.x) + 6*t*inv*(this.ctPt2.x-this.ctPt1.x) + 3 * t*t * (this.endPt.x-this.ctPt2.x);
			var yPrime = this.bezier.mdy(t); //3*inv*inv * (this.ctPt1.y-this.startPt.y) + 6*t*inv*(this.ctPt2.y-this.ctPt1.y) + 3 * t*t * (this.endPt.y-this.ctPt2.y);
			
			var angle = Math.atan2(yPrime, xPrime);
			
			ctx.rotate(angle);
			
            this.Text_drawTextLine(ctx, text[i], y);
			letterX += ctx.measureText(text[i]).width; //Math.max(this.letterSpacing, ctx.measureText(text[i]).width);
            
			ctx.restore();
			
			oldX = tempX;
			oldY = tempY;
        }
		
        //ctx.restore();
    }

    createjs.TextBezier = TextBezier;
}());

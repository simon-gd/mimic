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

//http://gamedev.stackexchange.com/questions/5373/moving-ships-between-two-planets-along-a-bezier-missing-some-equations-for-acce
//https://gist.github.com/BonsaiDen/670236
//http://www.planetclegg.com/projects/WarpingTextToSplines.html

(function() {

var Bezier = function(a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    
    this.len = 100;
    this.arcLengths = new Array(this.len + 1);
    this.arcLengths[0] = 0;
    
    var ox = this.x(0), oy = this.y(0), clen = 0;
    for(var i = 1; i <= this.len; i += 1) {
        var x = this.x(i * 0.01), y = this.y(i * 0.01);
        var dx = ox - x, dy = oy - y;        
        clen += Math.sqrt(dx * dx + dy * dy);
        this.arcLengths[i] = clen;
        ox = x, oy = y;
    }
    this.length = clen;    
}

Bezier.prototype = {
    map: function(u) {
        var targetLength = u * this.arcLengths[this.len];
        var low = 0, high = this.len, index = 0;
        while (low < high) {
            index = low + (((high - low) / 2) | 0);
            if (this.arcLengths[index] < targetLength) {
                low = index + 1;
            
            } else {
                high = index;
            }
        }
        if (this.arcLengths[index] > targetLength) {
            index--;
        }
        
        var lengthBefore = this.arcLengths[index];
        if (lengthBefore === targetLength) {
            return index / this.len;
        
        } else {
            return (index + (targetLength - lengthBefore) / (this.arcLengths[index + 1] - lengthBefore)) / this.len;
        }
    },
    
    mx: function (u) {
        return this.x(this.map(u));
    },
    
    my: function (u) {
        return this.y(this.map(u));
    },
	
	mdx: function (u) {
        return this.dx(this.map(u));
    },
    
    mdy: function (u) {
        return this.dy(this.map(u));
    },
    
    x: function (t) {
		
		// B(t) = (1-t)^3 * P0 + 3(1-t)^2 * t * P1 + 3(1-t) * t^2 * P2 + t^3 P3
        return ((1 - t) * (1 - t) * (1 - t)) * this.a.x
               + 3 * ((1 - t) * (1 - t)) * t * this.b.x
               + 3 * (1 - t) * (t * t) * this.c.x
               + (t * t * t) * this.d.x;
    },
    
    y: function (t) {
        return ((1 - t) * (1 - t) * (1 - t)) * this.a.y
               + 3 * ((1 - t) * (1 - t)) * t * this.b.y
               + 3 * (1 - t) * (t * t) * this.c.y
               + (t * t * t) * this.d.y;
    },
	
	
	// B'(t) = 3*(1-t)^2 * (P1-P0) + 6*t*(1-t)(P2-P1) + 3 * t^2 * (P3-P2);
	dx: function (t) {
        return ( 3 * (1 - t) * (1 - t)) * (this.b.x-this.a.x)
               + 6 * t * (1 - t) * (this.c.x - this.b.x)
               + 3 * t * t * (this.d.x - this.c.x);
    },
    
    dy: function (t) {
        return ( 3 * (1 - t) * (1 - t)) * (this.b.y-this.a.y)
               + 6 * t * (1 - t) * (this.c.y - this.b.y)
               + 3 * t * t * (this.d.y - this.c.y);
    }
};
    arEasel.Bezier = Bezier;
}());
/*
 * Area-proportional Venn/Euler Diagrams for D3
 * Helen Lu, CS448B Fall 2012
 *
 ***************************************************************************************
 * ADAPTED FROM THE FOLLOWING:
 * VennEuler -- A Venn and Euler Diagram program.
 *
 * Copyright 2009 by Leland Wilkinson.
 *
 * The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License")
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the License.
 ***************************************************************************************
 * Also using the Numeric JS library for the SVN computation. http://www.numericjs.com/
 * The numeric-1.2.4.js (or other version number) file must be included.
 */

d3.layout.venn = function(){
    var width = 640;
    var height = 480;
	var nCircles;
	var nPolygons;
	var stress;
	var polyData = [];
	var polyAreas = [];
	var polyHats = [];
	var circleData = [];
	var circles = [];
	var totalCount = 0;

	var stepsize = .01;
	var minStress = .000001;
	var uninitialized = true;

	function compute(data) {			
		processAreaData(data);

        if (uninitialized)
		    computeInitialConfiguration();
		    
		scaleRadii();
	    scaleConfiguration();

		minimizeGlobal();
		
		/* This step does not make much of a difference, and is significantly slower. */
		//minimizeLocal();
		
		realSizeCircles = resize();
		
		computeLabelPoints(realSizeCircles);
		
		uninitialized = false;
		
		return realSizeCircles;
	}
	
	function convertData(data, labels) {
	    var groupSet = [];
	    for (var i=0; i<data.length; i++) {
	        for (var j=0; j<data[i].length; j++) {
	            groupSet[data[i][j]] = 1;
	        }
	    }
	    var groupArray = Object.keys(groupSet);
	    
	    for (var i=0; i<groupArray.length; i++)
	        labels[i] = groupArray[i];
	    
	    var newData = new Array(Math.pow(2, groupArray.length));
	    for (var i=0; i<newData.length; i++) {
	        newData[i] = 0;
	    }
	    
	    for (var i=0; i<data.length; i++) {
	        var index = 0;
	        for (var j=0; j<data[i].length; j++) {
	            var n = groupArray.indexOf(data[i][j]);
	            index += (1<<n);
	        }
	        newData[index]++;
	    }
	    
	    return newData;
	}

	function processAreaData(data) {
	    var labels = [];
	    if (Object.prototype.toString.call( data[0] ) === '[object Array]')
	        data = convertData(data, labels);
	
		nCircles = Math.log(data.length)/Math.log(2);
		nPolygons = data.length;

		var totalArea = 0.0;
		for (var i = 0; i < nPolygons; i++)
			totalArea += data[i];
			
		for (var i=0; i<nCircles; i++){
		    var ii = i;
            circleData[ii] = 0;
            for (var k=1; k<data.length; k++) {
                if (k & 1<<i)
                    circleData[ii] += data[k];
            }
            circleData[ii] = circleData[ii] / totalArea;
            if (uninitialized) {
                circles[i] = {outerRadius:0, x:0, y:0, label:"", labelX:0, labelY:0};
                if (labels.length > 0)
                    circles[i].label = labels[i];
            }
        }
		for (var i = 0; i < nPolygons; i++){
			polyData[i] = data[i] / totalArea;
            polyAreas[i] = 0;
		}
	}
	
	function calculateAreas () {
	    totalCount = 0;
	    var size = 200;
        var planes = [];
        
        for (var i=0; i<circles.length; i++) {
            planes[i] = new Array(size);
            for (var x=0; x < size; x++) {
                planes[i][x] = new Array(size);
                for (var y=0; y < size; y++) {
                    planes[i][x][y] = 0;
                }
            }
        }
        
        // Draw circles
        var min = Infinity;
		var max = -Infinity;
        for (var i = 0; i < nCircles; i++) {
			var r = circles[i].outerRadius;
			var x = circles[i].x;
			var y = circles[i].y;
			min = Math.min(x - r, min);
			min = Math.min(y - r, min);
			max = Math.max(x + r, max);
			max = Math.max(y + r, max);
		}
		
		for (var i = 0; i < nCircles; i++) {
			var xi = (circles[i].x - min) / (max - min);
			var yi = (circles[i].y - min) / (max - min);
			var ri = Math.floor(size * circles[i].outerRadius / (max - min));
			var cx = Math.floor(xi * size);
			var cy = Math.floor(size - yi * size);
			for (var x = 0; x < size; x++) {
				for (var y = 0; y < size; y++) {
					if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < ri * ri) {
						planes[i][x][y] = 1;
						}
				}
			}
		}
		
		for (var x=0; x < size; x++) {
            for (var y=0; y < size; y++) {
                var region = 0;
                var count = 0;
                for (var i=0; i<circles.length; i++) {
                    if (planes[i][x][y] == 1){
                        region += 1<<i;
                        count++;
                    }
                }
                if (count > 0) {
                    polyAreas[region]++;
                    totalCount++;
                }
            }
        }
		
		if (totalCount == 0)
			return;
		for (var i = 0; i < nPolygons; i++){
			polyAreas[i] = 100 * polyAreas[i] / totalCount;
		}
    }

	function computeInitialConfiguration() {
		var s = computeDistanceMatrix();
		
		if (s == null) {
			fixedStart();
			return;
		}

		var q = [];
		for (var i=0; i<nCircles; i++)
		    q[i] = 0;		

		computeScalarProducts(nCircles, s, q);

		result = numeric.svd(s);
		s = result.U;
		q = result.S;
		
		var rms = Math.sqrt(q[0]) + Math.sqrt(q[1]);
		if (isNaN(rms) || rms < .1) {
			fixedStart();
			return;
		}
		for (var i = 0; i < nCircles; i++) {
		    circles[i].x = .5 + .25 * s[i][0] * Math.sqrt(q[0]);
			circles[i].y = .5 + .25 * s[i][1] * Math.sqrt(q[1]);
		}	
	}

	function fixedStart() {
		var theta = Math.PI / 2;
		var delta = 2 * Math.PI / nCircles;
		for (var i = 0; i < nCircles; i++) {
			circles[i].x = .5 + Math.cos(theta);
			circles[i].y = .5 + Math.sin(theta);
			theta -= delta;
		}
	}

	function computeDistanceMatrix() {
		var nIntersections = 0;
		var s = [];
		for (var j = 0; j < nCircles; j++) {
		    s[j] = new Array(nCircles);
		    for (var k = 0; k < nCircles; k++) {
		        s[j][k] = 0;
		    }
		}
		
		for (var i = 0; i < nPolygons; i++) {
			for (var j = 0; j < nCircles; j++) {
			    if (((1<<j) & i) == 0) continue;
				for (var k = j + 1; k < nCircles; k++) {
				    if (((1<<k) & i) == 0) continue;
					s[j][k] += polyData[i];
					s[k][j] = s[j][k];
					nIntersections++;
				}
			}
		}
		
		for (var j = 0; j < nCircles; j++) {
			s[j][j] = 0;
			for (var k = 0; k < j; k++) {
				s[j][k] = 1 - s[j][k] / (circleData[j] + circleData[k]);
				s[k][j] = s[j][k];
			}
		}
		if (nIntersections < 1)
			return null;
		else
			return s;
	}

	function computeScalarProducts(nPoints, s, q) {
		var rms = 0;
		
		for (var i = 1; i < nPoints; i++) {
			for (var j = 0; j < i; j++) {
				var dij = s[i][j] * s[i][j];
				rms += dij + dij;
				q[i] += dij;
				q[j] += dij;
			}
		}

		rms = rms / (nPoints * nPoints);
		var dsm;
		for (var i = 0; i < nPoints; i++) {
			for (var j = 0; j <= i; j++) {
				if (i == j)
					dsm = 0;
				else
					dsm = s[i][j] * s[i][j];
				s[i][j] = ((q[i] + q[j]) / nPoints - rms - dsm) / 2;
				s[j][i] = s[i][j];
			}
		}
	}

	function scaleRadii() {
		for (var j = 0; j < nCircles; j++){
			circles[j].outerRadius = Math.sqrt(circleData[j] / Math.PI / nCircles);
		}
	}

	function rescaleRadii(realCircles, iteration) {
	for (var i = 0; i < nCircles; i++)
		if (iteration > 5) {
			return;
		} else if (iteration == 0) {
			var averageRadius = 0;
			for (var j = 0; j < nCircles; j++)
				averageRadius += realCircles[j].outerRadius;
			averageRadius /= nCircles;
			for (var j = 0; j < nCircles; j++)
				circles[j].outerRadius = averageRadius;
		} else if (iteration < 5) {
			for (var j = 0; j < nCircles; j++)
				circles[j].outerRadius = circles[j].outerRadius - (iteration / 5.0) * (circles[j].outerRadius - realCircles[j].outerRadius);
		} else {
			for (var j = 0; j < nCircles; j++)
				circles[j].outerRadius = realCircles[j].outerRadius;
		}
	}

	function scaleConfiguration() {
		var vc = 0;

        var mc = 0;
        for (var k = 0; k < nCircles; k++)
            mc += circles[k].x;
        mc /= nCircles;
        for (var k = 0; k < nCircles; k++) {
            circles[k].x -= mc;
            vc += circles[k].x * circles[k].x;
        }
        
        var mc = 0;
        for (var k = 0; k < nCircles; k++)
            mc += circles[k].y;
        mc /= nCircles;
        for (var k = 0; k < nCircles; k++) {
            circles[k].y -= mc;
            vc += circles[k].y * circles[k].y;
        }			
			
		vc = 10. * Math.sqrt(vc / (2 * nCircles));
		if (vc > 0) {
            for (var k = 0; k < nCircles; k++){
                circles[k].x /= vc;
                circles[k].y /= vc;
            }
		}
	}

	function computeStress() {
		/* regression through origin */
		calculateAreas();
		
		if (totalCount == 0) {
			scaleConfiguration();
			calculateAreas();
		}
		var xx = 0;
		var xy = 0;
		var n = polyData.length;
		var sst = 0;
		for (var i = 1; i < n; i++) {
			var x = polyData[i];
			var y = polyAreas[i];
			xy += x * y;
			xx += x * x;
			sst += y * y;
		}
		var slope = xy / xx;

		var sse = 0;
		for (var i = 1; i < n; i++) {
			var x = polyData[i];
			var y = polyAreas[i];
			var yhat = x * slope;
			polyHats[i] = yhat;
			sse += (y - yhat) * (y - yhat);
		}
		
		return sse / sst;
	}

	function minimizeGlobal() {
		var initialCircles = dupCircles (circles);
		var previousCircles = dupCircles (circles);
		
		var lastStress = 1;
		for (var iter = 0; iter < 50; iter++) {
		for (var i = 0; i < nCircles; i++)            
			rescaleRadii(initialCircles, iter);
			recenter();

			stress = computeStress();
		    if (isNaN(stress)) return;
			if (stress > lastStress)
				copyCircles(previousCircles, circles);
			else
				copyCircles(circles, previousCircles);
				
			if (iter > 10 && (stress < minStress || lastStress - stress < minStress))
				break;
		
			moveGlobal();			
			lastStress = stress;
		}
		rescaleRadii(initialCircles, 50);
		recenter();
		stress = computeStress();
	}

	function minimizeLocal() {
		var initialCircles = dupCircles (circles);
		var previousCircles = dupCircles (circles);
		var previousStress = stress;
		var lastStress = 1;
		for (var iter = 0; iter < 50; iter++) {
			rescaleRadii(initialCircles, iter);
			recenter();
			
			stress = computeStress();

	    	if (isNaN(stress)) return;
			if (stress > lastStress)
				copyCircles(previousCircles, circles);
			else
				copyCircles(circles, previousCircles);
			if (iter > 10 && (stress < minStress || lastStress - stress < minStress))
				break;
			
			moveLocal();
			lastStress = stress;
		}
		rescaleRadii(initialCircles, 50);
		if (previousStress < stress)
			copyCircles(initialCircles, circles);
		recenter();
		stress = computeStress();
	}

	function moveGlobal() {
		var gradients = [];
		for (var i = 0; i < nCircles; i++) 
		    gradients[i] = {x:0, y:0};
		    
		for (var i = 0; i < nPolygons; i++) {
			for (var j = 0; j < nCircles; j++) {
			    if (!(1<<j & i)) continue;
				for (var k = j + 1; k < nCircles; k++) {
					if (!(1<<k & i)) continue;
					var resid = polyAreas[i] - polyHats[i];
					var dx = resid * stepsize * (circles[j].x - circles[k].x);
					var dy = resid * stepsize * (circles[j].y - circles[k].y);
					gradients[j].x += dx;
					gradients[j].y += dy;
					gradients[k].x -= dx;
					gradients[k].y -= dy;
				}
			}
		}
		for (var i = 0; i < nCircles; i++) {
			circles[i].x += gradients[i].x;
			circles[i].y += gradients[i].y;
		}
	}

	function moveLocal() {
		var gradients = [];
		for (var i = 0; i < nCircles; i++) {
		    gradients[i] = new Array(2);
			circles[i].x += stepsize;
			var xPlus = computeStress();
			circles[i].x -= 2 * stepsize;
			var xMinus = computeStress();
			circles[i].x += stepsize;
			if (xPlus < xMinus)
				gradients[i][0] = stepsize;
			else
				gradients[i][0] = -stepsize;

			circles[i].y += stepsize;
			var yPlus = computeStress();
			circles[i].y -= 2 * stepsize;
			var yMinus = computeStress();
			circles[i].y += stepsize;
			if (yPlus < yMinus)
				gradients[i][1] = stepsize;
			else
				gradients[i][1] = -stepsize;
		}
		for (var i = 0; i < nCircles; i++) {
			circles[i].x += gradients[i][0];
			circles[i].y += gradients[i][1];
		}
	}

	function recenter() {
		var cx = 0;
		var cy = 0;
		for (var i = 0; i < nCircles; i++) {
			cx += circles[i].x;
			cy += circles[i].y;
		}
		cx = cx / nCircles;
		cy = cy / nCircles;
		for (var i = 0; i < nCircles; i++) {
			circles[i].x = .5 + circles[i].x - cx;
			circles[i].y = .5 + circles[i].y - cy;
		}
	}

	function dupCircles (src) {
	    dst = [];
	    for (var i=0; i<src.length; i++) {
	        dst[i] = {outerRadius: src[i].outerRadius,
	                  x:src[i].x,
	                  y:src[i].y,
	                  label:src[i].label,
	                  labelX:src[i].labelX,
	                  labelY:src[i].labelY,
	                  };
	    }
	    
	    return dst;
	}
	
	function copyCircles (src, dst) {
	    for (var i=0; i<src.length; i++) {
	        dst[i].outerRadius = src[i].outerRadius;
	        dst[i].x = src[i].x;
	        dst[i].y = src[i].y;
	        dst[i].label = src[i].label;
	        dst[i].labelX = src[i].labelX;
            dst[i].labelY = src[i].labelY;   
	    }
	}
	
	function resize () {
        var left = circles[0].x - circles[0].outerRadius;
        var right = circles[0].x + circles[0].outerRadius;
        var top = circles[0].y - circles[0].outerRadius;
        var bottom = circles[0].y + circles[0].outerRadius;
        
        for (var i=1; i<circles.length; i++) {
            var x1 = circles[i].x - circles[i].outerRadius;
            var x2 = circles[i].x + circles[i].outerRadius;
            var y1 = circles[i].y - circles[i].outerRadius;
            var y2 = circles[i].y + circles[i].outerRadius;
            
            if (x1 < left) left = x1;
            if (x2 > right) right = x2;
            if (y1 < top) top = y1;
            if (y2 > bottom) bottom = y2;
        }
        
        var scaleFactor = Math.min (width/(right - left), height/(bottom - top));
       
        var centerX = left + (right - left)/2;
        var centerY = top + (bottom - top)/2;
        
        var resizedCircles = [];
        for (var i=0; i<circles.length; i++) {
            resizedCircles[i] = {};
            resizedCircles[i].outerRadius = circles[i].outerRadius * scaleFactor;
            resizedCircles[i].x = width/2 + (circles[i].x - centerX) * scaleFactor;
            resizedCircles[i].y = height/2 + (circles[i].y - centerY) * scaleFactor;
            resizedCircles[i].labelX = circles.labelX;
            resizedCircles[i].labelY = circles.labelY;
            resizedCircles[i].label = circles.label;
        }
        
        return resizedCircles;
    }
    
    function computeLabelPoints(realSizeCircles) {
        var planes = [];
        
        for (var i=0; i<circles.length; i++) {
            planes[i] = new Array(width);
            for (var x=0; x < width; x++) {
                planes[i][x] = new Array(height);
                for (var y=0; y < height; y++) {
                    planes[i][x][y] = 0;
                }
            }
        }
        
        // Draw circles	
		for (var i = 0; i < nCircles; i++) {
			var xi = realSizeCircles[i].x;
			var yi = realSizeCircles[i].y;
			var ri = realSizeCircles[i].outerRadius;
			for (var x = 0; x < width; x++) {
				for (var y = 0; y < height; y++) {
					if ((x - xi) * (x - xi) + (y - yi) * (y - yi) < ri * ri) {
						planes[i][x][y] = 1;
						}
				}
			}
		}
		
		var labelData = [];
		for (var i=0; i<nCircles; i++) {
		    labelData[i] = {x:0, y:0, count:0};
		}
		
		for (var x=0; x < width; x++) {
            for (var y=0; y < height; y++) {
                var region = -1;
                var count = 0;
                for (var i=0; i<circles.length; i++) {
                    if (planes[i][x][y] == 1){
                        region = i;
                        count++;
                    }
                }
                if (count == 1) {
                    labelData[region].x += x;
                    labelData[region].y += y;
                    labelData[region].count++;
                }
            }
        }
    
		for (var i=0; i<nCircles; i++) {
		    if (labelData[i].count > width*height/60){
		        realSizeCircles[i].labelX = labelData[i].x / labelData[i].count - realSizeCircles[i].x;
		        realSizeCircles[i].labelY = labelData[i].y / labelData[i].count - realSizeCircles[i].y;
		    }
		    else {
		        realSizeCircles[i].labelX = 0;
		        realSizeCircles[i].labelY = 0;
		    }
		    realSizeCircles[i].label = circles[i].label;
		}
    }
	
	function venn (data, i) {
	    return compute(data);
	}
	
	venn.size = function(dim) {
        if (!arguments.length) return [width, height];
        width = dim[0];
        height = dim[1];
        return venn;
    }
    
    venn.stress = function() {
        return stress;
    }
    
    return venn;
}

// Adopted from 
d3.layout.venn = function() {
  var size = [1, 1],
	  hierarchy = d3.layout.hierarchy().sort(null).value(null),
	  normalize = false; //Keep the size of the areas standard
  
	function percentSort(nums){
		var max = Math.max.apply( Math, nums ); 
		var returnList = [];
		for (num in nums){
			returnList.push(nums[num]/max);
		}
		return returnList;
	}

	/*
	*   returns an object with calculated circle dimensions and
	*   relative positions for the given percent, and base radius
	*/
	function createCircleDims(pcnt,base_rad){
		var dims = {};
		dims['pcnt'] = pcnt;
		dims['rad'] = base_rad*Math.sqrt(pcnt);
		dims['diameter'] = dims['rad']*2;
		return dims;
	}

	/*
	* gets the intersecting points between two circles
	*/
	function intersectingPoints(c1,c2){
		// Formulas nabbed from http://2000clicks.com/mathhelp/GeometryConicSectionCircleIntersection.aspx
		var d = Math.sqrt(Math.pow((c2['center_x'] - c1['center_x']),2) + Math.pow(c2['center_y'] - c1['center_y'],2));
		var d_sq = Math.pow(d,2); // d squared
		var K = (.25)*Math.sqrt((Math.pow(c1['rad']+c2['rad'],2)-d_sq)*(d_sq-Math.pow(c1['rad']-c2['rad'],2)));
		// split up the equations for readability
		var xpart1 = (.5)*(c2['center_x']+c1['center_x']) + ((.5)*(c2['center_x']-c1['center_x'])*(Math.pow(c1['rad'],2) - Math.pow(c2['rad'],2))/d_sq);
		var xpart2 = 2*(c2['center_y']-c1['center_y'])*K/d_sq;

		var ypart1 = (.5)*(c2['center_y']+c1['center_y']) + ((.5)*(c2['center_y']-c1['center_y'])*(Math.pow(c1['rad'],2) - Math.pow(c2['rad'],2))/d_sq);
		var ypart2 = 2*(c2['center_x']-c1['center_x'])*K/d_sq;
		var points = {};
		points['x1'] = xpart1 + xpart2;
		points['x2'] = xpart1 - xpart2;
		points['y1'] = ypart1 - ypart2;
		points['y2'] = ypart1 + ypart2;
		return points;
	}
	
	function intersectionDetails(a,b)
    {
        var details = {};
        var ab = intersectingPoints(a,b); 
		// we are finding the intersection with regard to only 2 circles in this case 
		// find middle of the two points
		details['x'] = (ab['x1'] + ab['x2']) /2;
		details['y'] = (ab['y1'] + ab['y2']) /2;
		details['points'] = ab;
		return details;
        
	}
	
	/*
    *   Get area that overlaps the intersection of two circles.
    */
	function dot(v1,v2)
    {
		return (v1[0]*v2[0])+(v1[1]*v2[1]);
	}
	function dist(v)
    {
		return Math.sqrt(v[0]*v[0]+v[1]*v[1]);
	}
	
    function getIntersectingArea(c1,c2, ct)
    {
        var i = intersectionDetails(c1,c2);
        // the actual intersecting points
        var topy = i['points']['y1'];
        var topx = i['points']['x1'];
        var bottomy = i['points']['y2'];
        var bottomx = i['points']['x2'];
		
		var vec1 = [(topx-c1['center_x']), (topy-c1['center_y'])];
		var vec2 = [(bottomx-c1['center_x']), (bottomy-c1['center_y'])];
		var startAngle1 = Math.atan2(vec1[1], vec1[0]); 
		var endAngle1 = Math.atan2(vec2[1], vec2[0]);
		
		var vec3 = [(topx-c2['center_x']), (topy-c2['center_y'])];
		var vec4 = [(bottomx-c2['center_x']), (bottomy-c2['center_y'])];
		var startAngle2 = Math.atan2(vec3[1], vec3[0]); 
		var endAngle2 = Math.atan2(vec4[1], vec4[0]);
		
		var AB_Path = [{"arc": [c1['center_x'], c1['center_y'], c1['rad'], startAngle1, endAngle1, false]},
						{"arc": [c2['center_x'], c2['center_y'], c2['rad'], endAngle2,  startAngle2, false]}];
		var ApB_Path = [{"arc": [c1['center_x'], c1['center_y'], c1['rad'], startAngle1, endAngle1, false]},
						{"arc": [c2['center_x'], c2['center_y'], c2['rad'], endAngle2 ,startAngle2, true]}];
		var ABp_Path = [{"arc": [c1['center_x'], c1['center_y'], c1['rad'], startAngle1, endAngle1, true]},
						{"arc": [c2['center_x'], c2['center_y'], c2['rad'], endAngle2 ,startAngle2, false]}];
		var ApBp_Path = [{"arc": [c1['center_x'], c1['center_y'], c1['rad'], startAngle1, endAngle1, true]},
						{"arc": [c2['center_x'], c2['center_y'], c2['rad'], endAngle2 ,startAngle2, true]},
						{"moveTo":[ct['center_x']+ct['rad'], ct['center_y']]},
						{"arc": [ct['center_x'], ct['center_y'], ct['rad'], 0, 2*Math.PI, false]}];
		//i['path'] = intersectionPath;
		
		data = {}
		data["AB"] = AB_Path;
		data["A'B"] = ApB_Path;
		data["AB'"] = ABp_Path;
		data["A'B'"] = ApBp_Path;
 
        return data;
    }

  
	function compute2CircleVenn(data)
	{
		var height = size[1];
		var base_rad = height/2;
		
		
		
        // get the data
        var l1 = data['A'].size; // left 
        var r1 = data['B'].size; // right
        var both = data['AB'].size; // intersection
		var total = data['TOTAL'].size;
		
		
		
		var ctotal = {}; // overall circle
        var cl = {}; //left circle
        var cr = {}; //right circle
		
		ctotal['rad'] = base_rad;
		ctotal['center_y'] = size[1]/2; 
        ctotal['center_x'] = size[0]/2;
		
		

        // figure out the circle sizes
        percents = percentSort([l1,r1,both,total]);
        cl = createCircleDims(percents[0],base_rad);
        cr = createCircleDims(percents[1],base_rad);
		
		
        //figure out starting positions for the 2 circles
        //var center_y = Math.max(cl['rad'],cr['rad'])+2;
		
        cl['center_y'] = ctotal['center_y']; 
        cr['center_y'] = ctotal['center_y']; 
        
	cl['center_x'] = ctotal['center_x']-cl['rad']; //cl['rad'];
        //place right circle equally to the right
        cr['center_x'] = ctotal['center_x'] + cr['rad'] ;

        //with a 2 circle venn, we have the option of also scaling the overlap area
        
	var ld1 = cl['center_x'] - cl['rad'];
        var ld2 = cl['center_x'] + cl['rad'];
        var rd1 = cr['center_x'] - cr['rad'];
        var rd2 = cr['center_x'] + cr['rad'];
        var diff1 = rd1-ld1;
        var diff2 = rd2-ld2;
        var startPoint = cr['center_x'];
        var stopPoint = cl['center_x'] - cl['rad'] + cr['rad']; 
        if (diff1 > diff2)
        {
            //left circle is bigger
            stopPoint = cl['center_x'] +cl['rad'] - cr['rad'];             
        }
        var maxMovement = startPoint - stopPoint;
		
   
        if ((percents[2]/percents[0]) > 0)
        {
			if(normalize){
				cr['center_x'] = startPoint - (maxMovement*0.5*(percents[2]/percents[0]));//(maxMovement*(percents[2]+.2));
				cl['center_x'] = stopPoint + (maxMovement*0.5*(percents[2]/percents[0]));
			}else{
				cr['center_x'] = startPoint - (maxMovement*(percents[2]/percents[0]));
			}
        }
	if (!normalize){
	  console.log(cr['center_x'], cr['rad'], ctotal['center_x'], ctotal['rad']);
	  if ((cr['center_x']+cr['rad']) > (ctotal['center_x']+ctotal['rad'])){
	    var ct_dif = (cr['center_x']+cr['rad']) - (ctotal['center_x']+ctotal['rad']);
	    console.log("ct_dif", ct_dif);
	    cr['center_x'] = cr['center_x'] - ct_dif;
	    cl['center_x'] = cl['center_x'] - ct_dif;  
	  }else if ((cl['center_x']-cl['rad']) < (ctotal['center_x']-ctotal['rad'])){
	    var ct_dif = (cl['center_x']-cl['rad']) - (ctotal['center_x']-ctotal['rad']);
	    cr['center_x'] = cr['center_x'] - ct_dif;
	    cl['center_x'] = cl['center_x'] - ct_dif;  
	  }
	  
	  
	  
	}
		var iDetail = getIntersectingArea(cl, cr, ctotal);
		
		var areas = [{name:"TOTAL", size: data["TOTAL"].size, units: data["TOTAL"].units, detail: data["TOTAL"].detail, path:[{"arc": [ctotal['center_x'], ctotal['center_y'], ctotal['rad'], 0, 2*Math.PI, true]}]},
					 {name:"B", size: data["B"].size, units: data["B"].units, detail: data["B"].detail, path:[{"arc": [cr['center_x'], cr['center_y'], cr['rad'], 0, 2*Math.PI, true]}]},
					 {name:"A", size: data["A"].size, units: data["A"].units, detail: data["A"].detail, path:[{"arc": [cl['center_x'], cl['center_y'], cl['rad'], 0, 2*Math.PI, true]}]},
					 
					 {name:"AB'", size: data["AB'"].size, units: data["AB'"].units, detail: data["AB'"].detail, path:iDetail["AB'"]}, 
					 {name:"AB", size: data["AB"].size, units: data["AB"].units,detail: data["AB"].detail, path:iDetail["AB"]}, 
					 {name:"B'", size: data["B'"].size, units: data["B'"].units, detail: data["B'"].detail, path:[{"arc": [ctotal['center_x'], ctotal['center_y'], ctotal['rad'], 0, 2*Math.PI, false]},
																  {"moveTo":[cr['center_x']+cr['rad'], cr['center_y']]},
																  {"arc": [cr['center_x'], cr['center_y'], cr['rad'], 0, 2*Math.PI, true]}]},
					 {name:"A'", size: data["A'"].size, units: data["A'"].units, detail: data["A'"].detail, path:[{"arc": [ctotal['center_x'], ctotal['center_y'], ctotal['rad'], 0, 2*Math.PI, false]},
																  {"moveTo":[cl['center_x']+cl['rad'], cl['center_y']]},
																  {"arc": [cl['center_x'], cl['center_y'], cl['rad'], 0, 2*Math.PI, true]}]},
					 
					 
					 {name:"A'B", size: data["A'B"].size, units: data["A'B"].units, detail: data["A'B"].detail, path:iDetail["A'B"]}, 
					 {name:"A'B'", size: data["A'B'"].size, units: data["A'B'"].units, detail: data["A'B'"].detail, path:iDetail["A'B'"]},
					 
		            ];

		return areas;//[ctotal, cl, cr];
	}
  
	function venn(d, i) {
		var nodes = hierarchy.call(this, d, i),
			root = nodes[0],
			data = {};
				
		data['TOTAL'] ={}
		data['TOTAL'].size = root.size;
		data['TOTAL'].detail = root.detail;
		data['TOTAL'].units = root.units;
		for(var i=1; i < nodes.length; i++){
			if(data[nodes[i].name]){
				data[nodes[i].name].size += nodes[i].size;
			}else{
				data[nodes[i].name] = {}
				data[nodes[i].name].size = nodes[i].size;
				data[nodes[i].name].detail = nodes[i].detail;
				data[nodes[i].name].units = nodes[i].units;
			}
			if(nodes[i].depth > 1){
				// sort key so that A is always before B
				var key = (nodes[i].parent.name < nodes[i].name) ? nodes[i].parent.name+nodes[i].name : nodes[i].name+nodes[i].parent.name;
				if(data[key]){
					data[key].size += nodes[i].size;
					//data[nodes[i].parent.name+nodes[i].name].detail += " & " + nodes[i].detail;
				}else{
					data[key] = {}
					data[key].size = nodes[i].size;
					data[key].detail = nodes[i].parent.detail +" & "+ nodes[i].detail;
					data[key].units = nodes[i].units;
				}
			}
		}
		if(normalize){
			data["TOTAL"].size = 100;
			data["A"].size = 30;
			data["B"].size = 30;
			
			data["A'"].size = 70;
			data["B'"].size = 70;
			
			data["AB"].size = 10;
			data["AB'"].size = 20;
			data["A'B"].size = 20;
			data["A'B'"].size = 40;
		}
		
		return compute2CircleVenn(data);
	}

	venn.size = function(x) {
		if (!arguments.length) return size;
		size = x;
		return venn;
	};
	
	venn.normalize = function(x) {
		if (!arguments.length) return size;
		normalize = x;
		return venn;
	};

	venn.value = function(x) {
		if (!arguments.length) return value;
		value = x;
		return venn;
	};

	return venn;
};

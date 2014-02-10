    /*
    * GLOBALS
    */   
    var color_gradient = .5;
    var HIGHLIGHT = false;
    var COLORED_LABELS = false;
    /*
    *   takes a list of numbers. outputs a list in the same order,
    *   but with the number replaced by percentages relative to the highest
    *   number in the list.
    */
    function percentSort(nums)
    {
        // find max
        var max = Math.max.apply( Math, nums ); 
        // apply as a percentage to list of numbers 
        var returnList = [];
        for (num in nums)
        {
            returnList.push(nums[num]/max);
        }
        return returnList;
    }

    /*
    *   returns an object with calculated circle dimensions and
    *   relative positions for the given percent, and base radius
    */
    function createCircleDims(pcnt,base_rad)
    {
        var dims = {};
        dims['pcnt'] = pcnt;
        dims['rad'] = base_rad*Math.sqrt(pcnt);
        dims['diameter'] = dims['rad']*2;
        return dims;
    }

    /*
    * gets the intersecting points between two circles
    */
    function intersectingPoints(c1,c2)
    {
        // serious maths follow... Beware
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

    /*
    *   takes two(or three) circle objects and calculates the intersection point
    */
    function intersectionDetails(type,a,b,c)
    {
        var details = {};
        var ab = intersectingPoints(a,b); 

        if (type=="2" || type=="two")
        {
            // we are finding the intersection with regard to only 2 circles in this case 
            // find middle of the two points
            details['x'] = (ab['x1'] + ab['x2']) /2;
            details['y'] = (ab['y1'] + ab['y2']) /2;
            details['points'] = ab;
            return details;
        }

        // Now we have to find the intersections for a third circle
        var ac = intersectingPoints(a,c);
        var bc = intersectingPoints(b,c);
        var tx1,tx2,tx3,ty1,ty2,ty3;
        if(type=="abc")
        {
            //use 2nd point for ab
            tx1 = ab['x2'];
            ty1 = ab['y2'];
            //use 1st point for ac
            tx2 = ac['x1'];
            ty2 = ac['y1'];
            //use 2nd point for bc
            tx3 = bc['x2'];
            ty3 = bc['y2'];
        }
        else if (type=="ab")
        {
            //use 1st point for ab 
            tx3 = ab['x1'];
            ty3 = ab['y1'];
            //use 1st point for ac
            tx1 = ac['x1'];
            ty1 = ac['y1'];
            //use 2nd point for bc
            tx2 = bc['x2'];
            ty2 = bc['y2'];
        }
        else if (type=="ac")
        {
            //use 2nd point for bc 
            tx1 = bc['x2'];
            ty1 = bc['y2'];
            //use 2nd point for ab 
            tx2 = ab['x2'];
            ty2 = ab['y2'];
            //use 2nd point for ac 
            tx3 = ac['x2'];
            ty3 = ac['y2'];
        }
        else if (type=="bc")
        {
            //use 1st point for ac
            tx1 = ac['x1'];
            ty1 = ac['y1'];
            //use 1st point for bc
            tx2 = bc['x1'];
            ty2 = bc['y1'];
            //use 2nd point for ab
            tx3 = ab['x2'];
            ty3 = ab['y2'];
        }

        //use mid point of this triangle
        details['x'] = (tx1 + tx2 + tx3)/3; 
        details['y'] = (ty1 + ty2 + ty3)/3; 
        return details;
    }

    /*
    * basic wrapper for data on the venn graph
    */
    function dataLabel(xpos,ypos,html)
    {
        var xpad = 10;
        var ypad = 10;
        xpos = xpos - xpad;
        ypos = ypos - ypad;
        var label="<div class=\"venn-data\" style=\"position: absolute; top:"+ypos+"px; left:"+xpos+"px;\">"+
        html+"</div>";
        return label;
    }

    /*
    *   Draws and returns an area that overlaps the intersection of 
    *   two circles.
    */
    function drawIntersectingArea(paper,c1,c2,color)
    {
        var i = intersectionDetails("2",c1,c2);
        // the actual intersecting points
        var topy = i['points']['y1'];
        var topx = i['points']['x1'];
        var bottomy = i['points']['y2'];
        var bottomx = i['points']['x2'];
        var intersectionPath = ["M",topx,topy,"A",c2['rad'],c2['rad'],0,0,0,
            bottomx,bottomy,"A",c1['rad'],c1['rad'],0,0,0,topx,topy];

        var p = paper.path(intersectionPath).attr({fill:color});
        addMouseOverFunction(p,i['x'],i['y']);
        return i;
    }
    /*
    *   Draws and returns the areaa that overlap the intersection of 
    *   three circles.
    */
    function drawIntersectingAreas(paper,a,b,c,colors)
    {
        var ab = intersectionDetails("2",a,b);
        var ac = intersectionDetails("2",a,c);
        var bc = intersectionDetails("2",b,c);

        //draw ab overlap
        var x1 = ab['points']['x1'];
        var y1 = ab['points']['y1'];
        var x2 = bc['points']['x2'];
        var y2 = bc['points']['y2'];
        var x3 = ac['points']['x1'];
        var y3 = ac['points']['y1'];
        
        var intersectionPath = ["M",x1,y1,"A",b['rad'],b['rad'],0,0,0,
            x2,y2,"A",c['rad'],c['rad'],0,0,1,x3,y3,
            "A",a['rad'],a['rad'],0,0,0,x1,y1];
        var p = paper.path(intersectionPath).attr({fill:colors[0]});
        
        addMouseOverFunction(p,ab['x'],ab['y']);

        //draw ac overlap
        var x1 = bc['points']['x2'];
        var y1 = bc['points']['y2'];
        var x2 = ab['points']['x2'];
        var y2 = ab['points']['y2'];
        var x3 = ac['points']['x2'];
        var y3 = ac['points']['y2'];
        
        var intersectionPath = ["M",x1,y1,"A",b['rad'],b['rad'],0,0,0,
            x2,y2,"A",a['rad'],a['rad'],0,0,1,x3,y3,
            "A",c['rad'],c['rad'],0,0,1,x1,y1];
        var p = paper.path(intersectionPath).attr({fill:colors[1]});
        addMouseOverFunction(p,ac['x'],ac['y']);

        //draw bc overlap
        var x1 = ac['points']['x1'];
        var y1 = ac['points']['y1'];
        var x2 = bc['points']['x1'];
        var y2 = bc['points']['y1'];
        var x3 = ab['points']['x2'];
        var y3 = ab['points']['y2'];
        
        var intersectionPath = ["M",x1,y1,"A",c['rad'],c['rad'],0,0,1,
            x2,y2,"A",b['rad'],b['rad'],0,0,1,x3,y3,
            "A",a['rad'],a['rad'],0,0,0,x1,y1];
        var p = paper.path(intersectionPath).attr({fill:colors[2]});
        addMouseOverFunction(p,bc['x'],bc['y']);

        //draw abc overlap
        var x1 = bc['points']['x2'];
        var y1 = bc['points']['y2'];
        var x2 = ac['points']['x1'];
        var y2 = ac['points']['y1'];
        var x3 = ab['points']['x2'];
        var y3 = ab['points']['y2'];
        
        var intersectionPath = ["M",x1,y1,"A",c['rad'],c['rad'],0,0,1,
            x2,y2,"A",a['rad'],a['rad'],0,0,1,x3,y3,
            "A",b['rad'],b['rad'],0,0,1,x1,y1];
        var p = paper.path(intersectionPath).attr({fill:colors[3]});
        addMouseOverFunction(p,bc['x'],bc['y']);

        return {"ab":intersectionDetails("ab",a,b,c),
            "ac":intersectionDetails("ac",a,b,c),
            "bc":intersectionDetails("bc",a,b,c),
            "abc":intersectionDetails("abc",a,b,c)};
    }

    function addMouseOverFunction(obj,cx,cy)
    {
        if(HIGHLIGHT)
        {
            // If highlight option is set, then we attempt to brighten the color on mouseover
            // NOTE: It is hard to universally brighten any color without some looking weird.
            var rgb = Raphael.getRGB(obj.attr("fill"));
            obj.mouseover(function () {
            //        document.body.style.cursor = "pointer";
                    // brighten the color
                    var newcolor = Color.brighten(rgb.hex,50);
        //            alert(" old color: "+rgb.hex+" new color:"+newcolor);
                    obj.attr("fill",newcolor);
                }).mouseout(function () {
             //       document.body.style.cursor = "default";
                    // restore the color
                    obj.attr("fill",rgb.hex);
                    });
        }
    }

    /* main function to draw a 2 circle venn */
    function draw2CircleVenn(elementid,height,data)
    {
        var outerid = elementid;
        elementid = elementid+"_inner";
        $("#"+outerid).append("<div style=\"position: relative;\" id=\""+elementid+"\"></div>");

        var color1 = data['colors'][0];
        var color2 = data['colors'][1];
        var color3 = data['colors'][2];
        var base_rad = height/2;

        // get the data
        var l1 = data['data'][0]; // left 
        var r1 = data['data'][1]; // right
        var both = data['data'][2]; // intersection

        var cl = {}; //left circle
        var cr = {}; //right circle

        // figure out the circle sizes
        percents = percentSort([l1,r1,both]);
        cl = createCircleDims(percents[0],base_rad);
        cr = createCircleDims(percents[1],base_rad);

        //figure out starting positions for the 2 circles
        // use the bigger circle for the center x coord
        var center_y = Math.max(cl['rad'],cr['rad'])+2;
        cl['center_y'] = center_y; 
        cr['center_y'] = center_y; 
        cl['center_x'] = cl['rad'];
        //place right circle equally to the right
        cr['center_x'] = cl['center_x'] + cl['rad']+cr['rad'] ;

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
        // give it about twenty percent as a base
        if (percents[2] > 0)
        {
            cr['center_x'] = startPoint - (maxMovement*(percents[2]+.2));
        }
        
        var paper = Raphael(elementid,cr['center_x']+cr['rad']+2,center_y+base_rad+2);

        var underrightcircle = paper.circle(cr['center_x'],cr['center_y'],cr['rad']); 
        underrightcircle.attr("fill",color2);
        underrightcircle.attr("fill-opacity",0.9);

        var leftcircle = paper.circle(cl['center_x'],cl['center_y'],cl['rad']);
        leftcircle.attr("fill",color1);
        leftcircle.attr("stroke", "#000");
        addMouseOverFunction(leftcircle,cl['center_x'],cl['center_y']);

        var rightcircle = paper.circle(cr['center_x'],cr['center_y'],cr['rad']);
        rightcircle.attr("fill",color2);
        rightcircle.attr("fill-opacity",color_gradient);
        rightcircle.attr("stroke", "#000");
        addMouseOverFunction(rightcircle,cr['center_x'],cr['center_y']);

        //add the data
        var left_label_x = (cr['center_x'] - cr['rad']) /2;
        var left_label_y = cl['center_y'];
        var right_label_x = cl['center_x']+cl['rad'] + ((cr['center_x']+cr['rad']) - (cl['center_x']+cl['rad']))/2;
        var right_label_y = cr['center_y'];
        $("#"+elementid).append(dataLabel(left_label_x,left_label_y,l1));
        $("#"+elementid).append(dataLabel(right_label_x,right_label_y,r1));

        // figure out position of the intersection
        var i1 = drawIntersectingArea(paper,cl,cr,color3)
        $("#"+elementid).append(dataLabel(i1['x'],i1['y'],both));

        //add the labels
        var label2_width = height*.9;
        var label1_style="";
        var label2_style="";
        if(COLORED_LABELS)
        {
            label1_style=" color:"+color1+"; ";
            label2_style=" color:"+color2+"; ";
        }
        $("#"+outerid).prepend("<br/><br/>");
        $("#"+outerid).prepend("<div><span class=\"venn-label\" style=\""+label1_style+"position: absolute; left:"+height/6+"px;\">"+
            data['labels'][0]+"</span>"+
            "<span class=\"venn-label\" style=\""+label2_style+" position: absolute; left:"+label2_width+"px\">"+
            data['labels'][1]+"</span></div>");
    }

    /* main function to draw a 3 (or 2) circle venn */
    function drawVenn(elementid,height,data)
    {
        // set any configurable parameters
        if (data['highlight']) { HIGHLIGHT = true; }
        else HIGHLIGHT = false;
        if (data['colored_labels']) {COLORED_LABELS = true; }
        else COLORED_LABELS = false;
        
        if (data['data'].length < 4)
        { draw2CircleVenn(elementid,height,data); return; }
        else
        {
            // draw the more complicated 3 circle venn
            var outerid = elementid;
            elementid = elementid+"_inner";
            $("#"+outerid).append("<div style=\"position: relative;\" id=\""+elementid+"\"></div>");

            var color1 = data['colors'][0];
            var color2 = data['colors'][1];
            var color3 = data['colors'][2];

            var base_rad = height/2;

            // get the datas
            var t1 = data['data'][0]; // top
            var r1 = data['data'][1]; //right
            var b1 = data['data'][2]; //bottom
            var tb = data['data'][3]; //top and bottom
            var tr = data['data'][4]; //top and right
            var rb = data['data'][5]; //right and bottom
            var all = data['data'][6]; // intersection of all

            var ct = {}; //top circle
            var cr = {}; //right circle
            var cb = {}; //bottom circle

            // figure out the circle sizes
            percents = percentSort([t1,r1,b1]);
            ct = createCircleDims(percents[0],base_rad);
            cr = createCircleDims(percents[1],base_rad);
            cb = createCircleDims(percents[2],base_rad);

            //figure out starting positions for the 3 circles
            // position top and bottom together
            // use the bigger circle for the center x coord
            var center_y = Math.max(ct['rad'],cr['rad'])+2;
            ct['center_y'] = center_y; 
            cr['center_y'] = center_y; 
            ct['center_x'] = ct['rad'];
            //place right circle equally to the right
            cr['center_x'] = ct['center_x'] + ct['rad'] ;

            // place third circle bottom of first two, centered at their intersection
            cb['center_y'] = Math.max((ct['center_y'] + ct['rad']),(cr['center_y'] + cr['rad']));
            cb['center_x'] = ct['center_x'] + (cr['center_x']-ct['center_x'] )/2;

            var paper = Raphael(elementid,500,cb['center_y']+cb['rad']+2);

            var topcircle = paper.circle(ct['center_x'],ct['center_y'],ct['rad']);
            topcircle.attr("fill",color1);
            topcircle.attr("stroke", "#000");
            addMouseOverFunction(topcircle,ct['center_x'],ct['center_y']);

            var rightcircle = paper.circle(cr['center_x'],cr['center_y'],cr['rad']);
            rightcircle.attr("fill",color2);
            rightcircle.attr("stroke", "#000");
            addMouseOverFunction(rightcircle,cr['center_x'],cr['center_y']);

            var bottomcircle = paper.circle(cb['center_x'],cb['center_y'],cb['rad']);
            bottomcircle.attr("fill",color3);
            bottomcircle.attr("stroke", "#000");
            addMouseOverFunction(bottomcircle,cb['center_x'],cb['center_y']);

            var intersections = drawIntersectingAreas(paper,ct,cr,cb,[data['colors'][3],data['colors'][4],data['colors'][5],data['colors'][6]]);
            var i1 = intersections["ac"];
            var i2 = intersections["ab"];
            var i3 = intersections["bc"];
            var i4 = intersections["abc"];

            //add the labels
            var label2_width = height*.9;
            var label1_style= "";
            var label2_style="";
            var label3_style="";
            if(COLORED_LABELS)
            {
                label1_style=" color:"+color1+"; ";
                label2_style=" color:"+color2+"; ";
                label3_style=" color:"+color3+"; ";

            }
            $("#"+outerid).prepend("<br/><br/>");
            $("#"+outerid).prepend("<div><span class=\"venn-label\" style=\""+label1_style+"position: absolute; left:"+height/6+"px;\">"+
                data['labels'][0]+"</span>"+
                "<span class=\"venn-label\" style=\""+label2_style+" position: absolute; left:"+label2_width+"px\">"+
                data['labels'][1]+"</span></div>");
            $("#"+outerid).append("<div><span class=\"venn-label\" style=\""+label3_style+"position: absolute; left:"+height/5+"px;\">"+
                data['labels'][2]+"</span></div>");

            var top_label_x = (cr['center_x'] - cr['rad']) /2;
            var top_label_y = ct['center_y'];
            var right_label_x = ct['center_x']+ct['rad'] + ((cr['center_x']+cr['rad']) - (ct['center_x']+ct['rad']))/2;
            var right_label_y = cr['center_y'];
            var lowest_point = Math.max((ct['center_y'] +ct['rad']),(cr['center_y']+cr['rad']));
            var bottom_label_x = cb['center_x'];
            var bottom_label_y = lowest_point + ((cb['center_y']+cb['rad']) -lowest_point)/2;

            //add the data
            $("#"+elementid).append(dataLabel(top_label_x,top_label_y,t1));
            $("#"+elementid).append(dataLabel(right_label_x,right_label_y,r1));
            $("#"+elementid).append(dataLabel(bottom_label_x,bottom_label_y,b1));

            // find location of legend items
            var legend_x = cr['center_x']+cr['rad'] + 10;

            // draw the legend items
            drawLegendItem(paper,elementid,legend_x,i1,tb,50,[data['colors'][4]]);
            drawLegendItem(paper,elementid,legend_x,i2,tr,55,[data['colors'][3]]);
            drawLegendItem(paper,elementid,legend_x,i3,rb,20,[data['colors'][5]]);
            drawLegendItem(paper,elementid,legend_x,i4,all,10,[data['colors'][6]]);
        }
    }

    /*
    *   draws the legend item using the following information
    *   paper : the Raphael paper object
    *   elementid : name of div that we are drawing stuff in
    *   basex : How far over to the right do we want all the legend items to start
    *   i_obj : the intersection object that has coordinates for the overlap data point
    *   data : self explanatory
    *   colors : an array of colors used to make the overlap. (1st color is solid, then successive
    *       colors are placed on top with a gradient in order to blend them.
    */
    function drawLegendItem(paper,elementid,basex,i_obj,data,yoffset,colors)
    {
        // size of data point circle
        var pointsize = 2;
        // size of legend box
        var boxsize = 10;
        // moves dataLabel around in front of the legend box, instead of showing up on top of it.
        var css_xoffset=23;
        var css_yoffset=7;
        // moves line from top of legend box to somewhere in the middle
        var pathoffset = 5;

        // draw the circle for the data point
        var point = paper.circle(i_obj['x'],i_obj['y'],pointsize);

        var leg = paper.rect(basex,i_obj['y']+yoffset,boxsize,boxsize,2);
        // Go thru color array
        if (colors.length > 0)
        {
            // first color is solid fill
            leg.attr("fill",colors[0]);
            if (colors.length > 1)
            {
                //next colors are all gradient fill
                for (var i = 1; i<colors.length; i++)
                {
                    color = colors[i];
                    var next_leg = paper.rect(basex,i_obj['y']+yoffset,boxsize,boxsize,2);
                    next_leg.attr("fill",color);
                    next_leg.attr("fill-opacity",color_gradient);
                }
            }
        }
        // insert the data value
        $("#"+elementid).append(dataLabel(basex+css_xoffset,i_obj['y']+yoffset+css_yoffset,data));
        
        // draw the line from data point to legend box
        var ip = paper.path("M"+i_obj['x']+" "+i_obj['y']+"L"+(i_obj['x']+yoffset)+" "+(i_obj['y']+yoffset+pathoffset)+
           "L"+(basex)+" "+(i_obj['y']+yoffset+pathoffset));

    }

var Color = {
    hexToDec: function (hex) {
        var dec = parseInt(hex,16);
        if (dec == 0) { dec = 16; }
        return dec;
    },
    decToHex: function (dec) {
        var hex = dec.toString(16);
        if (hex.length==1) { hex = "0"+hex; }
        return hex;
    },
    decimalsToHex: function (r,g,b) {
        return ""+Color.decToHex(r)+Color.decToHex(g)+Color.decToHex(b);
    },
    brighten: function (hex,pcnt){
        // remove # symbol
        hex = hex.slice(1);
        var inc = 100 / (100-pcnt);
        var nR = Color.hexToDec(hex.substr(0,2));
        var nG = Color.hexToDec(hex.substr(2,2));
        var nB = Color.hexToDec(hex.substr(4,2));
        nR = Math.round(nR * inc);
        nG = Math.round(nG * inc);
        nB = Math.round(nB * inc);
        nR = nR > 255 ? 255 : nR;
        nG = nG > 255 ? 255 : nG;
        nB = nB > 255 ? 255 : nB;
        return "#"+Color.decimalsToHex(nR,nG,nB);
    }
}

var Inspect = {
    TYPE_FUNCTION: 'function',
    // Returns an array of (the names of) all methods
    methods: function(obj) {
        var testObj = obj || self;
        var methods = [];
        for (prop in testObj) {
            if (typeof testObj[prop] == Inspect.TYPE_FUNCTION && typeof Inspect[prop] != Inspect.TYPE_FUNCTION) {
                methods.push(prop);
            }
        }
        return methods;
    },
    // Returns an array of (the names of) all properties
    properties: function(obj) {
        var testObj = obj || self;
        var properties = [];
        for (prop in testObj) {
            if (typeof testObj[prop] != Inspect.TYPE_FUNCTION && typeof Inspect[prop] != Inspect.TYPE_FUNCTION) {
                properties.push(prop);
            }
        }
        return properties;
    }
}

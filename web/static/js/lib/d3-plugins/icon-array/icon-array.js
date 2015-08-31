d3.iconArray = function() {
  var size = [1, 1],
      r = 9, //9
      hierarchy = d3.layout.hierarchy().sort(null).value(null);
  
  function iconArray(d, i) {
    var nodes = hierarchy.call(this, d, i),
        root = nodes[0]
		items = [];
	var items_length = root.size;
	for(var i=0; i < items_length; i++)
	{
		var item = jQuery.extend({},root);
		items.push(item);
	}
	
	function appendNames(node, start_i) {
		var children = node.children;
		var n = start_i;
		if(children){
			for(var i=0; i < children.length; i++){
				var child = children[i];
				console.log(child, n);
				if(child){
					for(var j=0; j < child.size; j++){
						items[n+j].name += ","+child.name;
						if(items[n+j].detail.length == 0){
						  items[n+j].detail += child.detail;
						}else{
						  items[n+j].detail += " & "+child.detail;  
						}
						items[n+j].size = child.size;
						//console.log(child.size);
						
					}
					//if(!items[n+i].children){
					//	children 
					//}
					
					appendNames(child, n);
					n += child.size;
				}
			}
		}
	}
	
	appendNames(root, 0);
	
	//var columns = 2;
	//var rows = 0;
	//columns = Math.floor((items.length + rows - 1) / rows); 
	//rows = Math.floor((items.length + columns - 1) / columns);
	//var columns = Math.floor((items.length + rows - 1) / rows); 
	//var rows = Math.floor((items.length + columns - 1) / columns);
	
	return items;
  }

  iconArray.size = function(x) {
    if (!arguments.length) return size;
    size = x;
    return iconArray;
  };
  
  iconArray.r = function(x) {
    if (!arguments.length) return r;
    r = x;
    return iconArray;
  };
  
  iconArray.value = function(x) {
    if (!arguments.length) return value;
    value = x;
    return iconArray;
  };
 
  return iconArray;
};

var fs = require("fs");

//synthetic_data
var agents = ["China", "India", "Indonesia", "Italy", "France", "Spain", "Germany", "United States"];
var range = [1800, 2008];

var data = [];

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

agents.forEach(function(item){
	var newItem = {name: item, region: "Europe & Central Asia", income:[], population:[], lifeExpectancy:[]};
	var startAge = randomIntFromInterval(30,50);
	var startPopulation = randomIntFromInterval(1000000,100000000);
	var startIncome = randomIntFromInterval(1000,10000);
	var count = 1;
	for(var i=range[0]; i<=range[1]; ++i){
		
		newItem.income.push([i, startIncome+(count*100)+(Math.random()*1000)]);
		newItem.population.push([i, startPopulation + (count * 100000) + (Math.random()*100000)]);
		newItem.lifeExpectancy.push([i, startAge + (count * 0.1) + Math.sin(count * 0.1) + (Math.random())]);
		count++;
	}
	data.push(newItem);
});

var outputFilename = '../static/data/synteticData.json';

fs.writeFile(outputFilename, JSON.stringify(data, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + outputFilename);
    }
}); 
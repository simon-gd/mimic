function jBootstrapStatistic() {

	this.vector;
	
	this.setVector = function(vector) {
		if(!(vector instanceof jStat))
		{
			throw new Error('jBootstrapStatistic: Vector is not a jStat instance');
			return;	
		}
		//console.log(vector);
		this.vector = vector;
	};
	
	this.statistic = function () {	
		return 0;
	};
	
}

function jBootstrapStatisticStdev() {
	
	this.statistic = function () {
		return this.vector.stdev();
	};
	
}
jBootstrapStatisticStdev.prototype = new jBootstrapStatistic();

function jBootstrapStatisticMean() {
	
	this.statistic = function () {
		return this.vector.mean();
	};
	
}
jBootstrapStatisticMean.prototype = new jBootstrapStatistic();


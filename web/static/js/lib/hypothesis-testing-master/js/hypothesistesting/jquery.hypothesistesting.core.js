(function( $ ) {

	// METODOS COMUNES
	var methods = {
	   	init : function( options ) {
		},
		
		/** Retorna un numero entero aleatorio, entre 1 y max */
		random : function(max) {
			return Math.floor(Math.random() * max + 1);
		},

		/** Retorna un valor aleatorio dentro del vector */
		uniform : function(vector) {
			return vector[methods.random(vector.length - 1)];
		},

		/**
		 * Retorna un vector tal que contiene valores remuestreados con reposicion
		 * del mismo tamaño del vector original
		 */
		resample : function(vector) {

			var n = vector.length;
			var resample = [];
			var j = 0;

			for (j = 0; j < n; j++) {
				x0 = methods.uniform(vector, n);
				// //console.log(x0);
				resample.push(x0);
			}

			return resample;
		},

		/* Genera un vector con n numeros aleatorios entre a y b */
		randomVector : function(n,a,b,d) {

			if(n == undefined)
				n=100;
			if(a == undefined)
				a=0;
			if(b == undefined)
				b=1;
			if(d == undefined)
				d=0;

			var vector = [];
			
			for(i=0;i<n;i++)
			{
				vector.push( parseFloat(Math.random() * b + a ).toPrecision(d));
			}

			return vector;
		},

		/* Genera una matriz de B vectores remuestreados con reposicion */
		resampleVector : function(vector,b) {

			if(b == undefined)
				b=1;
			
			var matrix = [];

			for(i=0;i<b;i++)
			{
				matrix.push( methods.resample(vector) );
			}

			return matrix;
		},		

		parseFloatArray: function (vector_string) {

			vector = vector_string.replace(/\s/g, ',');
			vector = vector.split(',');
			output = [];

			for(var i=0; i<vector.length; i++) {
				x_i = vector[i];
				
				if(x_i != '' && x_i != null )
					x_i = +x_i; // cast
				
				//console.log(x_i);
				if(!isNaN(parseFloat(x_i)) && isFinite(x_i) )
					output.push(x_i);

			}

			return output;
		},

		parseMatrix: function(string_matrix)
		{
			matrix = [];

			if(string_matrix != undefined)
			{
				smatrix = string_matrix.split("\n");
				
				if(smatrix.length != 0)
				{
					for (var i = 0; i < smatrix.length; i++) {
						matrix.push( methods.parseFloatArray(smatrix[i]) );
					};
				}
			}
			return matrix;
		},

		sort : function (vector) {
			return vector.sort(function (a, b){
				return (a - b) //causes an array to be sorted numerically and ascending
			});
		},

		normalizeVector : function(vector, mean, stdev)
		{
			output = [];
			console.log(vector, mean, stdev);

			for (var i = 0; i < vector.length; i++) {

				output.push( (vector[i] - mean) / stdev );
			};

			return output;
		},

		/**
		 * Crea un vector con el valor x filtrado
		 */
		filter : function(vector, x) {

			var n = vector.length;
			var filtered = [];
			var j = 0;

			for (j = 0; j < n; j++) {
				if(vector[j] != x)
				{
					filtered.push(vector[j]);
				}
			}

			return filtered;
		}

	};

	// jQuery Plugin architecture
	jQuery.hypothesistesting = function( method ) {

		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.hypothesistesting' );
		}
	};

	// PRUEBAS DE CONTRASTE
	jQuery.hypothesistesting.test = {

	};

	// Estadisticos de Contraste
	jQuery.hypothesistesting.statistic = {
		/** ESTADISTICOS */
		jBootstrapStatistic : function () {
			
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
	};

})( jQuery );
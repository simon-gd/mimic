(function( $ ){

	/** ESTADISTICOS */
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


	// Metodo privado
	var _b;

	// 
	var _bootstrap = function() {

		if(properties.paused)
			return;

		//var self = this;

		// 0 Validaciones
		if (!(properties.vector instanceof jStat)) {
			// console.error('Vector is not a jStat instance');
			throw new Error('jBootstrap: Vector is not a jStat instance');
			return;
		}

		if (properties.vector.length != 1) {
			// console.error('Vector has wrong length: ' + self.vector.length);
			throw new Error('jBootstrap: Vector is not a jStat instance');
			return;
		}

		// [1] Declarado en el metodo setStatistic()
		// Validar Objeto Estadistico
		if ((!methods.isStatistic(properties.statistic))) {
			// console.error('Statistic function is not a jBootstrapStatistics
			// instance');
			throw new Error(
					'jBootstrap: Statistic function is not a jBootstrapStatistics instance');
			return;
		}

		// Inicializacion
		if (_b == undefined) {
			// [2]
			properties.statistic.setVector(properties.vector);
			properties.sample_statistic = properties.statistic.statistic();
			// //console.log("self.sample_statistic=" + self.sample_statistic);

			// [3]
			properties.NSIG = 0;
			properties.sample_statistic = properties.statistic.statistic();

			//console.log(properties.sample_statistic);

			// Primera recursion:
			setTimeout(function() {
				_b = 1;
				_bootstrap();
			}, 0);
			return;
		}

		// [4] Declarado en el metodo setResamples()

		var progress = 0;
		var n = properties.vector[0].length;
		var j = 0;
		var resample = []; // X*_b
		var x0;

		// //console.log("\n/**** RECURSION SEPARATOR ***/\n\n");
		// //console.log("b=" + b + " < B="+ self.B +"? / self.vector: " +
		// self.vector[0].length);

		// [5]
		if (_b <= properties.B) {
			progress = Math.round((_b * 100 / properties.B));
			// //console.log("cicle Nº: " + b);
			// //console.log("progress: " + progress + "%");
			$(properties.ui_progressbar).progressbar("option", "value", progress);

			// [5.1]
			/*
			 * resample = []; for(j=0;j<n;j++) { x0 =
			 * self.uniform(self.vector[0], n); //console.log(x0);
			 * resample.push(x0); }
			 */
			resample = $.hypothesistesting('resample', properties.vector[0]);

			// [5.2]
			jResample = new jStat(resample);
			properties.statistic.setVector(jResample);
			resample_statistic = properties.statistic.statistic();

			// //console.log("Pseudo-Estadistico Muestral: " + resample_statistic
			// + " versus Estadistico MUESTRAL: " + self.sample_statistic);

			//console.log(resample_statistic+','+resample);
			
			// [5.3]
			switch (properties.desicion) {
			case 'less':
				if (resample_statistic <= properties.sample_statistic) {
					properties.NSIG = properties.NSIG + 1;
				}
				break;
			case 'greater':
				if (resample_statistic >= properties.sample_statistic) {
					properties.NSIG = properties.NSIG + 1;
				}
				break;
			default:
				// do nothing
			}
			_b = _b + 1;
			setTimeout(function() {
				_bootstrap();
			}, 0);
		} else {
			// FIN (?)
			if (_b > self.B)
			{
				_b = undefined;
				debug.enableLogger();
				//console.log(self.NSIG );
			}
		}
		$(properties.ui_levelOfSignificance).val((properties.NSIG + 1) / (properties.B + 1));
		
		// //console.log("Nivel significacion unilateral="+ (self.NSIG+1) /
		// (self.B+1));
		// return (NSIG+1) / (this.B+1);
	};

	/** ALGORITMO BOOTSTRAP */

	/** *********************************************************************** */
	/* PROPIEDADES */
	/** *********************************************************************** */
		
	var properties = {
		
		/** Status */
		paused: false,

		/** Vector de datos */
		vector: {},

		/** Estadistico de Contraste */
		statistic: new jBootstrapStatistic(),

		/**
		 * Valor del Estadistico Θ^_0
		 * 
		 * El valor de aplicar el estadistico de contraste al vector de datos
		 * originales
		 */
		sample_statistic: undefined,

		/** Cantidad de remuestras */
		B: 100,

		/** Contador del nivel de significacion */
		NSIG: 0,

		/** Desicion */
		desicion: 'greater',

		/** jQuery UI etiqueta del progressbar */
		ui_progressbar: "#progressbar",
		/** jQuery UI etiqueta del resultado final */
		ui_levelOfSignificance: "#NSIG"
	}

	var methods = {
	   	init : function( options ) {
			return this;
		},

		log: function() {
			//console.log(properties);
		},

		/**
		 * Establece el nombre de la barra de progreso 
		 * donde se expondrá el resultado.
		 * Usa el formato de selector de jQuery. 
		 * @param progress
		 */
		setProgress : function(progress) {
			properties.ui_progressbar = progress;
		},

		/**
		 * Establece el nombre de objeto 
		 * donde se expondrá el resultado.
		 * Usa el formato de selector de jQuery. 
		 * @param progress
		 */
		setResult : function(NSIG) {
			properties.ui_levelOfSignificance = NSIG;
		},


		/** 
		 * Establece el vector de datos
		 */
		setVector: function(vector) {
			if (!(vector instanceof jStat)) {
				// console.error('Vector is not a jStat instance');
				throw new Error('jBootstrap: Vector is not a jStat instance');
				return;
			}

			properties.vector = vector;
		},
		
		/**
		 * Establece el valor de desicion
		 * 
		 * @param desicion
		 *            puede ser 'less' o 'greater'
		 */
		setDesicion : function(desicion) {
			switch (desicion) {
			case 'less':
			case 'greater':

				properties.desicion = desicion;

				break;
			default:

				throw new Error('jBootstrap: Desicion is not \'less\' or \'greater\'.');
				return;
			}
		},

		/**
		 * Establece la cantidad de veces que se hace el remuestreo
		 */
		setResamples : function(n) {
			// Validar entero mayor a cero

			// advertir si es muy pequeño o muy grande

			properties.B = n;
		},
		/** Establece el Estadistico de Contraste */
		setStatistic : function(statistic) {
			/*
			//console.log(statistic);
			//console.log(typeof statistic);
			//console.log(statistic.prototype instanceof jBootstrapStatistic);
			//console.log('statistic' in statistic); // workaround
			return;
			*/
			//if (!(statistic instanceof jBootstrapStatistic)) {
			if (!('statistic' in statistic)) {
				// console.error('Statistic function is not a jBootstrapStatistics
				// instance');
				throw new Error(
						'jBootstrap: Statistic function is not a jBootstrapStatistics instance');
				return;
			}

			properties.statistic = statistic;
		},

		isStatistic : function() {
			if ('statistic' in properties.statistic) {
				return true;
			}

			return false;
		},

		paused : function(paused) {
			if(paused == undefined)
				return properties.paused;
			
			else {
				if (paused) 
					properties.paused = true;
				else
					properties.paused = false;

				return methods;
			}
		},

		/** Bootstrap */
		bootstrap : function(resume) {
			if(!resume)
			{
				_b = undefined;
				properties.NSIG = 0;
			}
			properties.paused = false;
			return _bootstrap();
		}

	};

	// jQuery Plugin architecture

	jQuery.hypothesistesting.test.bootstrap = function( method ) {

		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			jQuery.error( 'Method ' +  method + ' does not exist on jQuery.hypothesistesting' );
		}    

	};

})( jQuery );
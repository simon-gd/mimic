function jBootstrap() {
	/** *********************************************************************** */
	/* PROPIEDADES */
	/** *********************************************************************** */
	

	
	/** Vector de datos */
	this.vector;

	/** Estadistico de Contraste */
	this.statistic = new jBootstrapStatistic();

	/**
	 * Valor del Estadistico Θ^_0
	 * 
	 * El valor de aplicar el estadistico de contraste al vector de datos
	 * originales
	 */
	this.sample_statistic;

	/** Cantidad de remuestras */
	this.B = 100;

	/** Contador del nivel de significacion */
	this.NSIG = 0;

	/** */
	this.desicion = 'greater';

	/** jQuery UI etiqueta del progressbar */
	this.ui_progressbar = "#progressbar";
	/** jQuery UI etiqueta del resultado final */
	this.ui_levelOfSignificance = "#NSIG";

	/** *********************************************************************** */
	/* METODOS */
	/** *********************************************************************** */

	/** Establece el vector de datos */
	this.setVector = function(vector) {
		if (!(vector instanceof jStat)) {
			// console.error('Vector is not a jStat instance');
			throw new Error('jBootstrap: Vector is not a jStat instance');
			return;
		}

		this.vector = vector;
	};

	/** Establece el Estadistico de Contraste */
	this.setStatistic = function(statistic) {
		if (!(statistic instanceof jBootstrapStatistic)) {
			// console.error('Statistic function is not a jBootstrapStatistics
			// instance');
			throw new Error(
					'jBootstrap: Statistic function is not a jBootstrapStatistics instance');
			return;
		}

		this.statistic = statistic;
	};

	/**
	 * Establece el valor de desicion
	 * 
	 * @param desicion
	 *            puede ser 'less' o 'greater'
	 */
	this.setDesicion = function(desicion) {
		switch (desicion) {
		case 'less':
		case 'greater':

			this.desicion = desicion;

			break;
		default:

			throw new Error('jBootstrap: Desicion is not \'less\' or \'greater\'.');
			return;
		}
	};

	/** Establece la cantidad de veces que se hace el remuestreo */
	this.setResamples = function(n) {
		// Validar entero mayor a cero

		// advertir si es muy pequeño o muy grande

		this.B = n;
	};

	/** Retorna un numero entero aleatorio, entre 1 y max */
	this.random = function(max) {
		return Math.floor(Math.random() * max + 1);
	};

	/** Retorna un valor aleatorio dentro del vector */
	this.uniform = function(vector) {
		// //console.log(vector.length);
		return vector[this.random(vector.length - 1)];
	};

	/**
	 * Retorna un vector tal que contiene valores remuestreados con reposicion
	 * del mismo tamaño del vector original
	 */
	this.resample = function(vector) {
		// //console.log(vector);

		var n = vector.length;
		var resample = [];
		var j = 0;

		for (j = 0; j < n; j++) {
			x0 = this.uniform(vector, n);
			// //console.log(x0);
			resample.push(x0);
		}

		return resample;
	};

	/** Bootstrap */
	this.bootstrap = function(b) {
		var self = this;

		/**
		 * 1. Decidir cuál es la prueba estadística de interés (Θ) 2.
		 * Calcular Θ^_0 para la muestra de datos originales X 3. Inicializar el
		 * contador NSIG = O 4. Fijar el numero de B de remuestras a efectuar 5.
		 * Para b = 1 hasta B: 5.1 Para i * 1 hasta n (tamaño de la muestra) a)
		 * x_i = elemento con posición en X_0 = UNIFORM(1,n) b) Añadir Xj a X^
		 * 5.2 Calcular el pseudo *estadistico Θ^*_b para la muestra generada
		 * X*_b. 5.3 Si Θ^*_b >= Θ^_0 (o, según el caso Si Θ^*_b <= Θ^_0) NSIG *
		 * NSIG + 1 6. Calcular el grado de significación unilateral; (NSIG+1) /
		 * (B+1)
		 */

		// 0 Validaciones
		if (!(self.vector instanceof jStat)) {
			// console.error('Vector is not a jStat instance');
			throw new Error('jBootstrap: Vector is not a jStat instance');
			return;
		}

		if (self.vector.length != 1) {
			// console.error('Vector has wrong length: ' + self.vector.length);
			throw new Error('jBootstrap: Vector is not a jStat instance');
			return;
		}

		// [1] Declarado en el metodo setStatistic()
		// Validar Objeto Estadistico
		if (!(self.statistic instanceof jBootstrapStatistic)) {
			// console.error('Statistic function is not a jBootstrapStatistics
			// instance');
			throw new Error(
					'jBootstrap: Statistic function is not a jBootstrapStatistics instance');
			return;
		}

		// Inicializacion
		if (b == undefined) {
			// [2]
			self.statistic.setVector(self.vector);
			self.sample_statistic = self.statistic.statistic();
			// //console.log("self.sample_statistic=" + self.sample_statistic);

			// [3]
			self.NSIG = 0;
			self.sample_statistic = self.statistic.statistic();

			//console.log(self.sample_statistic);

			// Primera recursion:
			setTimeout(function() {
				self.bootstrap(1);
			}, 0);
			return;
		}

		// [4] Declarado en el metodo setResamples()

		var progress = 0;
		var n = self.vector[0].length;
		var j = 0;
		var resample = []; // X*_b
		var x0;

		// //console.log("\n/**** RECURSION SEPARATOR ***/\n\n");
		// //console.log("b=" + b + " < B="+ self.B +"? / self.vector: " +
		// self.vector[0].length);

		// [5]
		if (b <= self.B) {
			progress = Math.round((b * 100 / self.B));
			// //console.log("cicle Nº: " + b);
			// //console.log("progress: " + progress + "%");
			$(self.ui_progressbar).progressbar("option", "value", progress);

			// [5.1]
			/*
			 * resample = []; for(j=0;j<n;j++) { x0 =
			 * self.uniform(self.vector[0], n); //console.log(x0);
			 * resample.push(x0); }
			 */
			resample = self.resample(self.vector[0]);

			// [5.2]
			jResample = new jStat(resample);
			self.statistic.setVector(jResample);
			resample_statistic = self.statistic.statistic();

			// //console.log("Pseudo-Estadistico Muestral: " + resample_statistic
			// + " versus Estadistico MUESTRAL: " + self.sample_statistic);

			//console.log(resample_statistic+','+resample);
			
			// [5.3]
			switch (self.desicion) {
			case 'less':
				if (resample_statistic <= self.sample_statistic) {
					self.NSIG = self.NSIG + 1;
				}
				break;
			case 'greater':
				if (resample_statistic >= self.sample_statistic) {
					self.NSIG = self.NSIG + 1;
				}
				break;
			default:
				// do nothing
			}
			b = b + 1;
			setTimeout(function() {
				self.bootstrap(b);
			}, 0);
		} else {
			// FIN (?)
			if (b > self.B)
			{
				debug.enableLogger();
				//console.log(self.NSIG );
			}
		}
		$(self.ui_levelOfSignificance).val((self.NSIG + 1) / (self.B + 1));
		
		// //console.log("Nivel significacion unilateral="+ (self.NSIG+1) /
		// (self.B+1));
		// return (NSIG+1) / (this.B+1);
	};

		//console.log(typeof this);
}

jBootstrap.prototype = new jStat();

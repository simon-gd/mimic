(function( $ ){

	/** Prueba Wilcoxon de muestras pareadas */

	/** *********************************************************************** */
	/* Estadisticos */
	/** *********************************************************************** */
	var statistics = {

		test: function()
		{
			
		}

	};

	/** *********************************************************************** */
	/* PROPIEDADES */
	/** *********************************************************************** */
		
	var properties = {
		/** Estadistico T tabulado para Wilcoxon de muestras pareadas */
		oneTail : {
			5	: { 0.05:	0	, 0.01: 	'–'	},
			6	: { 0.05:	2	, 0.01: 	'–'	},
			7	: { 0.05:	3	, 0.01: 	0	},
			8	: { 0.05:	5	, 0.01: 	5	},
			9	: { 0.05:	8	, 0.01: 	7	},
			10	: { 0.05:	10	, 0.01: 	5	},
			11	: { 0.05:	13	, 0.01: 	7	},
			12	: { 0.05:	17	, 0.01: 	9	},
			13	: { 0.05:	21	, 0.01: 	12	},
			14	: { 0.05:	25	, 0.01: 	15	},
			15	: { 0.05:	30	, 0.01: 	19	},
			16	: { 0.05:	35	, 0.01: 	23	},
			17	: { 0.05:	41	, 0.01: 	27	},
			18	: { 0.05:	47	, 0.01: 	32	},
			19	: { 0.05:	53	, 0.01: 	37	},
			20	: { 0.05:	60	, 0.01: 	43	},
			21	: { 0.05:	67	, 0.01: 	49	},
			22	: { 0.05:	75	, 0.01: 	55	},
			23	: { 0.05:	83	, 0.01: 	62	},
			24	: { 0.05:	91	, 0.01: 	69	},
			25	: { 0.05:	100	, 0.01: 	76	},
			26	: { 0.05:	110	, 0.01: 	84	},
			27	: { 0.05:	119	, 0.01: 	92	},
			28	: { 0.05:	130	, 0.01: 	101	},
			29	: { 0.05:	140	, 0.01: 	110	},
			30	: { 0.05:	151	, 0.01: 	120	}
		},

		towTails : {
			5	: { 0.05:	'–'	, 0.01: 	'–'	},
			6	: { 0.05:	0	, 0.01: 	'–'	},
			7	: { 0.05:	2	, 0.01: 	'–'	},
			8	: { 0.05:	3	, 0.01: 	0	},
			9	: { 0.05:	5	, 0.01: 	1	},
			10	: { 0.05:	8	, 0.01: 	3	},
			11	: { 0.05:	10	, 0.01: 	5	},
			12	: { 0.05:	13	, 0.01: 	7	},
			13	: { 0.05:	17	, 0.01: 	9	},
			14	: { 0.05:	21	, 0.01: 	12	},
			15	: { 0.05:	25	, 0.01: 	15	},
			16	: { 0.05:	29	, 0.01: 	19	},
			17	: { 0.05:	34	, 0.01: 	23	},
			18	: { 0.05:	40	, 0.01: 	27	},
			19	: { 0.05:	46	, 0.01: 	32	},
			20	: { 0.05:	52	, 0.01: 	37	},
			21	: { 0.05:	58	, 0.01: 	42	},
			22	: { 0.05:	65	, 0.01: 	48	},
			23	: { 0.05:	73	, 0.01: 	54	},
			24	: { 0.05:	81	, 0.01: 	61	},
			25	: { 0.05:	89	, 0.01: 	68	},
			26	: { 0.05:	98	, 0.01: 	75	},
			27	: { 0.05:	107	, 0.01: 	83	},
			28	: { 0.05:	116	, 0.01: 	91	},
			29	: { 0.05:	126	, 0.01: 	100	},
			30	: { 0.05:	137	, 0.01: 	109	}
		}
	};

	/** *********************************************************************** */
	/* METODOS */
	/** *********************************************************************** */
	
	var methods = {
	   	init : function( options ) {
			return this;
		},


		test: function(vectorX, vectorY, alpha, tails)
		{
			if(vectorX.length != vectorY.length)
			{
				jQuery.error('Las muestras deben contener la misma cantidad de sujetos.');
				return null;
			}

			if(alpha != 0.05 && alpha != 0.1)
			{
				jQuery.error('Se admite solo los siguientes valores para alpha: 0.05 y 0.1. Valor dado: ' + alpha);
				return null;
			}

			// DESCARTAR PARES DE MUESTRAS IGUALES
			var filteredX = [];
			var filteredY = [];
			var filtered = [];
			var j = 0;

			for (j = 0; j < vectorX.length; j++) {
				if(vectorX[j] != vectorY[j])
				{
					filteredX.push(vectorX[j]);
					filteredY.push(vectorY[j]);

					filtered.push( {
						'x' : vectorX[j],
						'y' : vectorY[j],
						'diff' : vectorY[j] - vectorX[j],
						'rtemp' : null,
						'rank' : null
					} );
				}
			}

			filtered.sort(function(a,b){return Math.abs(a.diff) - Math.abs(b.diff) });

			for (j = 0; j < filtered.length; j++) {
				filtered[j].rtemp = j+1;
			}

			var acum_rank = 0;
			var contador = 0;


			for (i = 0; i < filtered.length; i++) {
				acum_rank = 0;
				contador = 0;

				for (j = 0; j < filtered.length; j++) {
					

					if ( Math.abs(filtered[i].diff) == Math.abs(filtered[j].diff))
					{
						
						acum_rank += filtered[j].rtemp;
						contador++;

						//console.log(i,j, filtered[i].diff, filtered[j].diff, filtered[j].rtemp, acum_rank, contador);

					}
				}

				var sign = filtered[i].diff > 0 ? 1 : filtered[i].diff == 0 ? 0 : -1;
				filtered[i].rank = sign * (acum_rank / contador);
			}

			// salida
			T = {
				'Tplus' : 0,
				'Tminus' : 0,
				'T' : 0,
				'statistic' : null,
				'p_value' : null	
			};

			for (j = 0; j < filtered.length; j++) {

				T.T += filtered[j].rank;

				if( filtered[j].rank > 0)
				{
					T.Tplus += filtered[j].rank;
				} else {
					T.Tminus += Math.abs(filtered[j].rank);
				}
			}

			
			n = filtered.length
			H0 = tails;
			//console.log(n, H0, tails);

			var rechazarH0;

			switch (H0) {
				case 'eq':
					// 2 tails=> T
					if(n > 30)
					{
						// Aproximacion normal 1 cola
						Et = 0;
						Vt = n*(n+1)*((2*n)+1)/6;
						Z = (T.T - Et) / Math.sqrt(Vt);
						Zalpha = jStat.normal.inv(1-(alpha/2), 0, 1);
						T.statistic = Z;
						T.p_value = Zalpha;
					} else {
						T.statistic = T.T;
						T.p_value = properties.towTails[n][alpha];
					}
				break;
				case 'le':
					// 1 tail => T- 
					if(n > 30)
					{
						// Aproximacion normal 1 cola
						Et = n*(n+1)/4;
						Vt = n*(n+1)*((2*n)+1)/24;
						Z = (T.T - Et) / Math.sqrt(Vt);
						Zalpha = jStat.normal.inv(1-(alpha/2), 0, 1);
						T.p_value = null;
					} else {
						T.statistic = T.Tminus;
						T.p_value = properties.towTails[n][alpha];
					}
				break;
				case 'ge':
					// 1 tail => T+
					if(n > 30)
					{
						// Aproximacion normal 1 cola
						Et = n*(n+1)/4;
						Vt = n*(n+1)*((2*n)+1)/24;
						Z = (T.T - Et) / Math.sqrt(Vt);
						Zalpha = jStat.normal.inv(1-(alpha/2), 0, 1);
						T.Tfinal = null;
					} else {
						T.statistic = T.Tplus;
						T.p_value = properties.towTails[n][alpha];
					}
					
				break;
			}

			

			return T;
		}

	};

	/** *********************************************************************** */
	/* jQuery Plugin architecture */
	/** *********************************************************************** */

	jQuery.hypothesistesting.test.wilcoxon = function( method ) {
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			jQuery.error( 'Method ' +  method + ' does not exist on jQuery.hypothesistesting.test.k_s' );
		}
	};

})( jQuery );
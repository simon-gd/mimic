(function( $ ){

	/** Prueba Kolmogorov-Smirnov */

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
		/** Estdistico D_alpha tabulado para K-S */
		ANormalAlpha : {
			// intervalos de 0.025
			0	:	0	,
			0.025	:	0	,
			0.05	:	0	,
			0.075	:	0	,
			0.1	:	0	,
			0.125	:	0.0003	,
			0.15	:	0.0014	,
			0.175	:	0.0042	,
			0.2	:	0.0096	,
			0.225	:	0.0180	,
			0.25	:	0.0296	,
			0.275	:	0.0443	,
			0.3	:	0.0618	,
			0.325	:	0.0817	,
			0.35	:	0.1036	,
			0.375	:	0.1269	,
			0.4	:	0.1513	,
			0.425	:	0.1764	,
			0.45	:	0.2019	,
			0.475	:	0.2276	,
			0.5	:	0.2532 ,
			0.525	:	0.2786	,
			0.55	:	0.3036	,
			0.575	:	0.3281	,
			0.6	:	0.3520	,
			0.625	:	0.3753	,
			0.65	:	0.3930	,
			0.675	:	0.4199	,
			0.7	:	0.4412	,

			// intervalos de 0.05
			0.75	:	0.4815	,
			0.8	:	0.5190	,
			0.85	:	0.5537	,
			0.9	:	0.5858	,
			0.95	:	0.6154	,
			1	:	0.6427	,
			1.05	:	0.6680	,
			1.1	:	0.611	,
			1.15	:	0.7127	,
			1.2	:	0.7324	,
			1.25	:	0.7503	,
			1.3	:	0.7677	,
			1.35	:	0.7833	,
			1.4	:	0.7973	,
			1.45	:	0.8111	,
			1.5	:	0.8235	,
			1.55	:	0.8350	,
			1.6	:	0.8457	,
			1.65	:	0.8556	,
			1.7	:	0.8648	,
			1.75	:	0.8734	,
			1.8	:	0.8814	,
			1.85	:	0.8888	,
			1.9	:	0.8957	,
			1.95	:	0.9021	,
			2	:	0.9082	,
			2.05	:	0.9138	,
			2.1	:	0.9190	,
			2.15	:	0.9239	,
			2.2	:	0.9285	,
			2.25	:	0.9328	,
			2.3	:	0.9368	,
			2.35	:	0.9405	,
			2.4	:	0.9441	,
			2.45	:	0.9474	,
			2.5	:	0.9504	,
			2.55	:	0.9534	,
			2.6	:	0.9561	,
			2.65	:	0.9586	,
			2.7	:	0.9610	,
			2.75	:	0.9633	,
			2.8	:	0.9654	,
			2.85	:	0.9674	,
			2.9	:	0.9672	,
			2.95	:	0.9710	,
			3	:	0.9726	,
			3.05	:	0.9742	,
			3.1	:	0.9756	,
			3.15	:	0.9770	,
			3.2	:	0.9783	,
			3.25	:	0.9795	,
			3.3	:	0.9807	,
			3.35	:	0.9818	,
			3.4	:	0.9828	,
			3.45	:	0.837	,
			3.5	:	0.9846	,
			3.55	:	0.9855	,
			3.6	:	0.9863	,
			3.65	:	0.9870	,
			3.7	:	0.9878	,
			3.75	:	0.9884	,
			3.8	:	0.9891	,
			3.85	:	0.9897	,
			3.9	:	0.9902	,
			3.95	:	0.9908	,
			4	:	0.9913	,
			4.05	:	0.9917	,
			4.1	:	0.9922	,
			4.15	:	0.9926	,
			4.2	:	0.9930	,
			4.25	:	0.9934	,
			4.3	:	0.9938	,
			4.35	:	0.9941	,
			4.4	:	0.9944	,

			// intervalos de 0.1
			4.5	:	0.9950	,
			4.6	:	0.9960	,
			4.7	:	0.9964	,
			4.8	:	0.9968	,
			4.9	:	0.9968	,

			// intervalos de 1
			5	:	0.9971	,
			6	:	0.9990	,
			7	:	0.9997	,
			8 : 0.9999
		},

	};

	/** *********************************************************************** */
	/* METODOS */
	/** *********************************************************************** */
	
	var methods = {
	   	init : function( options ) {
			return this;
		},

		getANormal: function(a) {
			//console.log('a',a);
			/*
			for (var i = 0; i < 0.7; i=+parseFloat( (i+0.025).toPrecision(4)) )
			{
					console.log(i);
			};
			for (var i = 0.7; i < 4.4; i=+parseFloat( (i+0.05).toPrecision(4)) )
			{
					console.log(i);
			};
			for (var i = 4.4; i < 8; i=+parseFloat( (i+0.1).toPrecision(4)) )
			{
					console.log(i);
			};
			*/

			if(a < 0.025)
			{
				return 0;
			}
			else if(a < 0.7)
			{
				// intervalos de 0.025
				a = a*40;
				a1= +parseFloat(Math.floor(a)/40).toPrecision(3);
				a2= +parseFloat(Math.ceil(a)/40).toPrecision(3);
				a = a/40;
			}
			else if(a < 4.4)
			{
				// intervalos de 0.05
				a = a*20;
				a1= +parseFloat(Math.floor(a)/20).toPrecision(3);
				a2= +parseFloat(Math.ceil(a)/20).toPrecision(3);
				a = a/20;
			}
			else if(a < 4.9)
			{
				// intervalos de 0.1
				a = a*10;
				a1= +parseFloat(Math.floor(a)/10).toPrecision(3);
				a2= +parseFloat(Math.ceil(a)/10).toPrecision(3);
				a = a/10;
			}
			else if(a >= 8)
				return 1;


			if(a1==a2)
				return properties.ANormalAlpha[a1];
			else
			{
				pa1 = properties.ANormalAlpha[a1];
				pa2 = properties.ANormalAlpha[a2];
				// interpolacion lineal
				p = (((a-a1) / (a2-a1)) * (pa2 - pa1)) + pa1;

				return p;
			}
		},

		normal: function(vector, mean, stdev)
		{
			// vector ordenado
			vector = jQuery.hypothesistesting('sort', vector);
			// vector normalizado
			normalized = jQuery.hypothesistesting('normalizeVector', vector, mean, stdev);
			//console.log("normalizado", normalized);

			var N = normalized.length;
			var i;

			console.log("mean: " + mean, "stdev: " + stdev, "N: " + N);

			p = [];

			// calcular las acumuladas para cada valor normalizado
			for(i=0; i < N; i++) {
				p.push( jStat.normal.cdf(normalized[i], 0, 1) );
				//console.log(normalized[i], mean, stdev);
			}
			//console.log('acumuladas', p);

			// calcular estadistico
			suma = 0;
			for(i=1; i < N+1; i++) {
				//console.log( i, ((2*N) + 1 - (2*i)),  Math.log(p[i-1]), Math.log(1-p[i-1]));
				//console.log( i, ( ((2*i)-1)*Math.log(p[i-1]) ) + ( ((2*N) + 1 - (2*i)) * Math.log(1-p[i-1])) );
				
				sumai = ( ((2*i)-1)*Math.log(p[i-1]) ) + ( ((2*N) + 1 - (2*i)) * Math.log(1-p[i-1]));
				//console.log(sumai);
				suma = suma + sumai;
			}

			//console.log("d: " + d);
			result = -N - ((1/N)*suma);

			console.log(methods.getANormal(result));

			return result;
		}
	};

	/** *********************************************************************** */
	/* jQuery Plugin architecture */
	/** *********************************************************************** */

	jQuery.hypothesistesting.test.ad = function( method ) {
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
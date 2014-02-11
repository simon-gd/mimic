(function( $ ){

	/** TITULO */

	/** *********************************************************************** */
	/* PROPIEDADES */
	/** *********************************************************************** */
		
	var properties = {
		
	};

	/** *********************************************************************** */
	/* METODOS */
	/** *********************************************************************** */
	
	var methods = {
	   	init : function( options ) {
			return this;
		}
	};

	/** *********************************************************************** */
	/* jQuery Plugin architecture */
	/** *********************************************************************** */

	jQuery.hypothesistesting.test.skeleton = function( method ) {
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
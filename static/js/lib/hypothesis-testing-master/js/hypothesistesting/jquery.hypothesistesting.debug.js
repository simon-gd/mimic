(function( $ ){

var properties = {
	oldConsoleLog: console.log
}

var methods = {
   	init : function( options ) {
	},

	enableLogger : function() 
	{
		if(properties.oldConsoleLog == null)
			return;

		window['console']['log'] = properties.oldConsoleLog;
	},

	disableLogger : function ()
	{
		oldConsoleLog = console.log;
		window['console']['log'] = function() {};
	},

	redirectLogger : function (target)
	{
		methods.disableLogger();

		if(target != null)
		{
			window['console']['log'] = function(message) {
				//$(target).disable();
				var psconsole = $(target);

				psconsole.val($(target).val() + message + "\n");

				psconsole.scrollTop(
				    psconsole[0].scrollHeight - psconsole.height()
				);
			};
		}
	}
  };

  jQuery.hypothesistesting.debug = function( method ) {
    
    // Method calling logic
    if ( methods[method] ) {
      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.hypothesistesting' );
    }    
  
  };

})( jQuery );
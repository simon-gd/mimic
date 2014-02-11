var debug = function()
{
	var oldConsoleLog = null;
	var pub = {};

	pub.enableLogger =  function enableLogger() 
	{
		if(oldConsoleLog == null)
			return;

		window['console']['log'] = oldConsoleLog;
	};

	pub.disableLogger = function disableLogger()
	{
		oldConsoleLog = //console.log;
		window['console']['log'] = function() {};
	};

	pub.redirectLogger = function redirectLogger(target)
	{
		this.disableLogger();

		if(target != null)
		{
			window['console']['log'] = function(message) {
				//$(target).disable();
				$(target).val($(target).val() + message + "\n");
				$(target).focusEnd();
			};
		}
	};

	return pub;
}();	

(function( $ ) {
  $.fn.logger = function() {
  
    // Do your awesome plugin stuff here

  };
})( jQuery );
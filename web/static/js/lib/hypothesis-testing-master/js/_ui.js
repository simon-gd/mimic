/* <![CDATA[ */
/**
 * Los accordions deben activarse antes de los tabs
 * Fuente: http://stackoverflow.com/questions/1542161/jquery-ui-accordions-within-tabs
 */


$(document).ready(function() {

	/**************************************************************************/
	/* Ajustes predeterminados de la UI */
	/**************************************************************************/
	

	defaults = {
		// cifras significativas
		cs: 5,
		// Interfaz de Usuario ordenada en Tabs
		tabs: true,
		tab_selected: 0,
		// Cada prueba dentro de un Accordion
		accordion: true
	};

	if(window['settings'] == undefined)
	{
		window.settings = defaults;
	}

	/**************************************************************************/

	/** Accordions */
	if(window['settings']['accordion'] != undefined && window.settings.accordion)
	{
		$(".accordion").accordion({
			collapsible: true,
			active: false
		});
	}

	/** Tabs */
	if(window['settings']['tabs'] != undefined && window.settings.tabs)
	{
		$("#tabs").tabs({
			selected : (window['settings']['tab_selected'] != undefined) ? window['settings']['tab_selected'] : 0
		});
	}

	/** Formularios con mismo estilo de boton */
	$('input:text, input:password, textarea')
	.button()
	.css({
		'font' : 'inherit',
		'color' : 'inherit',
		'text-align' : 'left',
		'outline' : 'none',
		'cursor' : 'text'
	});

	/** Sets de opciones como botones */
	$(".radio-buttonset").buttonset();

});
/* ]]> */
// The MIT License (MIT)
//
// Copyright (c) 2014 Autodesk, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// http://opensource.org/licenses/MIT

var logBuffer = { 'version': "1.4.0", 'elements': {}, 'events': {} };;
var answer_inputCount = 0;
var tabindex = 1;

if (!window.console) { var console = {}; }
if (!console.log) { console.log = function () { }; }
if (!console.log) { console.log = function () { }; }
if (!console.error) { console.error = function () { }; }
if (!console.warn) { console.warn = function () { }; }

var nsURL = "/survey/not_supported/";
var debug = (window.location.href.indexOf("debug_question") > -1);

if ((!Modernizr.canvas || !Modernizr.inlinesvg) && window.location.href.indexOf(nsURL) == -1) {
    window.location.href = nsURL;
}

if ((bowser.msie && bowser.version >= 9) ||
    (bowser.chrome && bowser.version >= 14) ||
    (bowser.firefox && bowser.version >= 4.0) ||
    window.location.href.indexOf(nsURL) != -1) {
    // We are good
} else {
    window.location.href = nsURL;
}

$('#mainForm').find(':input').each(function () {
    if (this.type != "hidden") {
        var $input = $(this);
        $input.attr("tabindex", tabindex);
        tabindex++;
    }
});

function getSelectionText() {

    var startNode, startOffset, endNode, endOffset;
    var text = "";
    var sel = rangy.getSelection();
    text = sel.toString();
    if (text.length > 0) {
        var selectionData = rangy.serializeSelection(sel, true, $("body")[0]);
        return [text, selectionData];
    } else {
        return ["", ""];
    }
}
function getScrollXY() {
    var scrOfX = 0, scrOfY = 0;
    if (typeof (window.pageYOffset) == 'number') {
        //Netscape compliant
        scrOfY = window.pageYOffset;
        scrOfX = window.pageXOffset;
    } else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
        //DOM compliant
        scrOfY = document.body.scrollTop;
        scrOfX = document.body.scrollLeft;
    } else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
        //IE6 standards compliant mode
        scrOfY = document.documentElement.scrollTop;
        scrOfX = document.documentElement.scrollLeft;
    }
    //var scrOfX = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
    //var scrOfY = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    return [scrOfX, scrOfY];
}

function isDefined(e, prop) {
    return (prop in e) && typeof e[prop] !== 'undefined' && e[prop] != undefined && e[prop] != 'undefined';
}

function captureElementData2(id) {
    var elementData = {};
    var element = $("#" + id);
    elementData['id'] = id;
    elementData['width'] = element.width();
    elementData['height'] = element.height();
    elementData['innerWidth'] = element.innerWidth();
    elementData['innerHeight'] = element.innerHeight();
    elementData['outerWidth'] = element.outerWidth();
    elementData['outerHeight'] = element.outerHeight();
    elementData['outerWidthWithMargin'] = element.outerWidth(true);
    elementData['outerHeightWithMargin'] = element.outerHeight(true);
    elementData['offset'] = element.offset();
    elementData['position'] = element.position();
    elementData['class'] = element.attr('class');
    elementData['tabindex'] = element.attr('tabindex');
    elementData['nodeName'] = element[0].nodeName;

    return elementData;
}

function addElementData(e, idName) {
    var elementData = {};
    var identifier = "";
    if (isDefined(e[idName], 'id') && e[idName].id != "") {
        identifier = "#" + e[idName].id;
        if (!(identifier in logBuffer.elements)) {
            elementData['id'] = e[idName].id;
            elementData['width'] = $(identifier).width();
            elementData['height'] = $(identifier).height();
            elementData['innerWidth'] = $(identifier).innerWidth();
            elementData['innerHeight'] = $(identifier).innerHeight();
            elementData['outerWidth'] = $(identifier).outerWidth();
            elementData['outerHeight'] = $(identifier).outerHeight();
            elementData['outerWidthWithMargin'] = $(identifier).outerWidth(true);
            elementData['outerHeightWithMargin'] = $(identifier).outerHeight(true);
            elementData['offset'] = $(identifier).offset();
            elementData['position'] = $(identifier).position();
            elementData['class'] = $(identifier).attr('class');
            elementData['nodeName'] = $(identifier)[0].nodeName;
            elementData['tabindex'] = $(identifier).attr('tabindex');

            if ($(identifier)[0].nodeName == "OPTION" || $(identifier)[0].nodeName == "SELECT") {
                elementData['parent'] = captureElementData2($(identifier)[0].parentNode.id);
                //console.log(e, eventRaw, idName);
            }
            logBuffer.elements[identifier] = elementData;
        }
    } else if (isDefined(e[idName], 'documentElement')) {
        identifier = "document";
        if (!(identifier in logBuffer.elements)) {
            elementData['id'] = "document";
            elementData['width'] = $(document).width();
            elementData['height'] = $(document).height();
            elementData['clientWidth'] = document.documentElement.clientWidth;
            elementData['clientHeight'] = document.documentElement.clientHeight;
            elementData['offsetWidth'] = document.documentElement.offsetWidth;
            elementData['offsetHeight'] = document.documentElement.offsetHeight;
            elementData['nodeName'] = document.nodeName;
            logBuffer.elements[identifier] = elementData;
        }

    } 
    return identifier;
}

function logFormatted(logBuffer, e, typeOverwrite) {
    var eventName = typeOverwrite || e.type;
    var time_stamp = (new Date).getTime();
    if (!(eventName in logBuffer.events)){
        logBuffer.events[eventName] = [];
    }
    var eobj = {
        timeStamp: time_stamp
    }
    if (eventName == "init") {
        // Add all the elements we can
        if (!("navigator" in logBuffer.elements)) {
            logBuffer.elements['navigator'] = {};
            logBuffer.elements['navigator']['appCodeName'] = navigator.appCodeName;
            logBuffer.elements['navigator']['appName'] = navigator.appName;
            logBuffer.elements['navigator']['appVersion'] = navigator.appVersion;
            logBuffer.elements['navigator']['cookieEnabled'] = navigator.cookieEnabled;
            logBuffer.elements['navigator']['language'] = navigator.language;
            logBuffer.elements['navigator']['platform'] = navigator.platform;
            logBuffer.elements['navigator']['product'] = navigator.product;
            logBuffer.elements['navigator']['userAgent'] = navigator.userAgent;
        }
        if (!("screen" in logBuffer.elements)) {
            logBuffer.elements['screen'] = {};
            logBuffer.elements['screen']['width'] = screen.width;
            logBuffer.elements['screen']['height'] = screen.height;
            logBuffer.elements['screen']['availWidth'] = screen.availWidth;
            logBuffer.elements['screen']['availHeight'] = screen.availHeight;
            logBuffer.elements['screen']['colorDepth'] = screen.colorDepth;
            logBuffer.elements['screen']['pixelDepth'] = screen.pixelDepth;
        }
        if (!("window" in logBuffer.elements)) {
            logBuffer.elements['window'] = [];
            var offs = getScrollXY();
            var wobj = {
                timeStamp: time_stamp,
                width: $(window).width(),
                height: $(window).height(), 
                screenX: window.screenX,
                screenY: window.screenY,
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight,
                scrollOffset: {'pageXOffset': offs[0], 'pageYOffset':  offs[1]}, 
            }
            if (isDefined(window, 'mozInnerScreenX')) {
                wobj['offset'] = { 'left': window.mozInnerScreenX, 'top': window.mozInnerScreenY };
            }
            logBuffer.elements['window'].push(wobj);
        }       
    } else if (eventName == "resize") {
        eobj['width'] = $(window).width();
        eobj['height'] = $(window).height();

        var offs = getScrollXY();
        var wobj = {
            timeStamp: time_stamp,
            width: $(window).width(),
            height: $(window).height(), 
            screenX: window.screenX,
            screenY: window.screenY,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,
            scrollOffset: {'pageXOffset': offs[0], 'pageYOffset':  offs[1]}, 
        }
        if (isDefined(window, 'mozInnerScreenX')) {
            wobj['offset'] = { 'left': window.mozInnerScreenX, 'top': window.mozInnerScreenY };
        }
        logBuffer.elements['window'].push(wobj);

    } else if (eventName == "init" || eventName == "scroll" || eventName == "resize" || eventName == "mousewheel") {
        var offs = getScrollXY();
        eobj['scrollOffset'] = { 'pageXOffset': offs[0], 'pageYOffset': offs[1] };
    } else if (eventName == "mouseup" || eventName == "click" || eventName == "dblclick" || eventName == "keyup") {
        selectionData = getSelectionText();
        eobj['selectedText'] = selectionData[1];
    }

    if (isDefined(e, 'deltaX')) {
        eobj['deltaX'] = e.deltaX;
    }
    if (isDefined(e, 'deltaY')) {
        eobj['deltaY'] = e.deltaY;
    }
    if (isDefined(e, 'deltaFactor')) {
        eobj['deltaFactor'] = e.deltaFactor;
    }

    // Add dimentions of the target
    if (isDefined(e, 'target')) {
        //captureElementData(e, eventRaw, "target");
        var eid = addElementData(e, "target");
        eobj['target'] = eid;
    }

    if (eventName == "init" || eventName == "scroll" || eventName == "resize" || eventName == "keyup") {
        var zoom = detectZoom.zoom();
        var device = detectZoom.device();
        eobj['zoom'] = { 'zoomLevel': zoom, 'devicePixelRatio': device };
        //console.log(zoom, device);
    }
    if (isDefined(e, 'altKey')) {
        eobj['altKey'] = e.altKey;
    }
    if (isDefined(e, 'button')) {
        eobj['button'] = e.button;
    }
    if (isDefined(e, 'buttons')) {
        eobj['buttons'] = e.buttons;
    }
    if (isDefined(e, 'clientX')) {
        eobj['clientX'] = e.clientX;
    }
    if (isDefined(e, 'clientY')) {
        eobj['clientY'] = e.clientY;
    }
    if (isDefined(e, 'ctrlKey')) {
        eobj['ctrlKey'] = e.ctrlKey;
    }
    if (isDefined(e, 'currentTarget')) {
        var eid = addElementData(e, "currentTarget");
        eobj['currentTarget'] = eid;
    }
    if (isDefined(e, 'delegateTarget')) {
        var eid = addElementData(e, "delegateTarget");
        eobj['delegateTarget'] = eid;
    }

    if (isDefined(e, 'eventPhase')) {
        eobj['eventPhase'] = e.eventPhase;
    }
    if (isDefined(e, 'metaKey')) {
        eobj['metaKey'] = e.metaKey;
    }
    if (isDefined(e, 'offsetX')) {
        eobj['offsetX'] = e.offsetX;
    }
    if (isDefined(e, 'offsetY')) {
        eobj['offsetY'] = e.offsetY;
    }
    if (isDefined(e, 'pageX')) {
        eobj['pageX'] = e.pageX;
    }
    if (isDefined(e, 'pageY')) {
        eobj['pageY'] = e.pageY;
    }
    if (isDefined(e, 'relatedTarget')) {
        var eid = addElementData(e, "relatedTarget");
        eobj['relatedTarget'] = eid;
    }
    if (isDefined(e, 'screenX')) {
        eobj['screenX'] = e.screenX;
    }
    if (isDefined(e, 'screenY')) {
        eobj['screenY'] = e.screenY;
    }
    if (isDefined(e, 'shiftKey')) {
        eobj['shiftKey'] = e.shiftKey;
    }
    if (isDefined(e, 'timeStamp')) {
        eobj['timeStamp'] = (new Date).getTime(); //e.timeStamp;
    }
    if (isDefined(e, 'which')) {
        eobj['which'] = e.which;
    }

    // Add event
    logBuffer.events[eventName].push(eobj);
}

$(document).ready(function () {
    // Document Mouse Events
    if (!debug) {
        $(document).mousemove(function (e) {
            // First mouse move lets add a ready event
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });

        $(document).click(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });

        $(document).dblclick(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });

        $(document).mouseenter(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });

        $(document).mouseleave(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });

        $(document).mousedown(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });
        $(document).mouseup(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });

        // Keyboard Events
        $(document).keydown(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });
        $(document).keyup(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });
        $(document).keypress(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });
        $(document).focusin(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });
        $(document).focusout(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });
        $(document).mousewheel(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });

        // Window Events
        $(window).resize(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });
        $(window).scroll(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });
        $(window).focus(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });
        $(window).blur(function (e) {
            if (!logBuffer.events.init) {
                logFormatted(logBuffer, e, "init");
            }
            logFormatted(logBuffer, e);
        });
    }
}); //$(document).ready(function() {


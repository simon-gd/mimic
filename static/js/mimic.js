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

var logBuffer = [];
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
//(bowser.safari && bowser.version >= 5) ||
//(bowser.opera && bowser.version >= 11.0) ||

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
function captureElementData(e, eventRaw, idName) {
    eventRaw[idName] = {};
    var identifier = "";
    if (isDefined(e[idName], 'id') && e[idName].id != "") {
        //console.log("captureElementData: has id", e[idName].id, e, eventRaw, idName);
        eventRaw[idName]['id'] = e[idName].id;
        identifier = "#" + e[idName].id;
        eventRaw[idName]['width'] = $(identifier).width();
        eventRaw[idName]['height'] = $(identifier).height();
        eventRaw[idName]['innerWidth'] = $(identifier).innerWidth();
        eventRaw[idName]['innerHeight'] = $(identifier).innerHeight();
        eventRaw[idName]['outerWidth'] = $(identifier).outerWidth();
        eventRaw[idName]['outerHeight'] = $(identifier).outerHeight();
        eventRaw[idName]['outerWidthWithMargin'] = $(identifier).outerWidth(true);
        eventRaw[idName]['outerHeightWithMargin'] = $(identifier).outerHeight(true);
        eventRaw[idName]['offset'] = $(identifier).offset();
        eventRaw[idName]['position'] = $(identifier).position();
        eventRaw[idName]['class'] = $(identifier).attr('class');
        eventRaw[idName]['nodeName'] = $(identifier)[0].nodeName;
        eventRaw[idName]['tabindex'] = $(identifier).attr('tabindex');

        if ($(identifier)[0].nodeName == "OPTION" || $(identifier)[0].nodeName == "SELECT") {
            eventRaw[idName]['parent'] = captureElementData2($(identifier)[0].parentNode.id);
            //console.log(e, eventRaw, idName);
        }
    } else if (isDefined(e[idName], 'documentElement')) {
        eventRaw[idName]['id'] = "document";
        identifier = "document";
        eventRaw[idName]['width'] = $(document).width();
        eventRaw[idName]['height'] = $(document).height();
        eventRaw[idName]['clientWidth'] = document.documentElement.clientWidth;
        eventRaw[idName]['clientHeight'] = document.documentElement.clientHeight;
        eventRaw[idName]['offsetWidth'] = document.documentElement.offsetWidth;
        eventRaw[idName]['offsetHeight'] = document.documentElement.offsetHeight;
        eventRaw[idName]['nodeName'] = document.nodeName;
        eventRaw[idName]['offset'] = { 'left': 0, 'top': 0 };;

    } else if (isDefined(e[idName], 'document')) {
        eventRaw[idName]['id'] = "window";
        identifier = "window";
        eventRaw[idName]['width'] = $(window).width();
        eventRaw[idName]['height'] = $(window).height();
        eventRaw[idName]['screenX'] = (window.screenX !== undefined) ? window.screenX : window.screenLeft;
        eventRaw[idName]['screenY'] = (window.screenY !== undefined) ? window.screenY : window.screenTop;
        eventRaw[idName]['innerWidth'] = window.innerWidth;
        eventRaw[idName]['innerHeight'] = window.innerHeight;
        eventRaw[idName]['outerWidth'] = window.outerWidth;
        eventRaw[idName]['outerHeight'] = window.outerHeight;
        eventRaw[idName]['nodeName'] = window.nodeName;
        eventRaw[idName]['offset'] = { 'left': 0, 'top': 0 };;
        if (isDefined(window, 'mozInnerScreenX')) {
            eventRaw[idName]['offset'] = { 'left': window.mozInnerScreenX, 'top': window.mozInnerScreenY };
        }
        if (isDefined(window, 'innerScreenX')) {
            eventRaw[idName]['offset'] = { 'left': window.innerScreenX, 'top': window.innerScreenY };
        }


    } else {
        //console.warn("didn't find the element", e, eventRaw, idName);
    }
}
function logFormatted(e, typeOverwrite) {
    var eventName = typeOverwrite || e.type;
    var extraData = {};
    if (eventName == "init") {
        extraData['version'] = 2.0;
        extraData['navigator'] = {};
        extraData['navigator']['appCodeName'] = navigator.appCodeName;
        extraData['navigator']['appName'] = navigator.appName;
        extraData['navigator']['appVersion'] = navigator.appVersion;
        extraData['navigator']['cookieEnabled'] = navigator.cookieEnabled;
        extraData['navigator']['language'] = navigator.language;
        extraData['navigator']['platform'] = navigator.platform;
        extraData['navigator']['product'] = navigator.product;
        extraData['navigator']['userAgent'] = navigator.userAgent;

        extraData['screen'] = {};
        extraData['screen']['width'] = screen.width;
        extraData['screen']['height'] = screen.height;
        extraData['screen']['availWidth'] = screen.availWidth;
        extraData['screen']['availHeight'] = screen.availHeight;
        extraData['screen']['colorDepth'] = screen.colorDepth;
        extraData['screen']['pixelDepth'] = screen.pixelDepth;
    }
    // Add Window and Document Dimentionss
    if (eventName == "init" || eventName == "resize" || eventName == "focusin" || eventName == "focus") {
        extraData['window'] = {};
        extraData['window']['width'] = $(window).width();
        extraData['window']['height'] = $(window).height();
        extraData['window']['screenX'] = window.screenX;
        extraData['window']['screenY'] = window.screenY;
        extraData['window']['innerWidth'] = window.innerWidth;
        extraData['window']['innerHeight'] = window.innerHeight;
        extraData['window']['outerWidth'] = window.outerWidth;
        extraData['window']['outerHeight'] = window.outerHeight;
        extraData['window']['offset'] = { 'left': 0, 'top': 0 };
        if (isDefined(window, 'mozInnerScreenX')) {
            extraData['window']['offset'] = { 'left': window.mozInnerScreenX, 'top': window.mozInnerScreenY };
        }

        extraData['document'] = {};
        extraData['document']['width'] = $(document).width();
        extraData['document']['height'] = $(document).height();
        extraData['document']['clientWidth'] = document.documentElement.clientWidth;
        extraData['document']['clientHeight'] = document.documentElement.clientHeight;
        extraData['document']['offsetWidth'] = document.documentElement.offsetWidth;
        extraData['document']['offsetHeight'] = document.documentElement.offsetHeight;
        extraData['document']['offset'] = { 'left': 0, 'top': 0 };

        extraData['body'] = {};
        extraData['body']['width'] = $("body").width();
        extraData['body']['height'] = $("body").height();
        extraData['body']['innerWidth'] = $("body").innerWidth();
        extraData['body']['innerHeight'] = $("body").innerHeight();
        extraData['body']['outerWidth'] = $("body").outerWidth();
        extraData['body']['outerHeight'] = $("body").outerHeight();
        extraData['body']['outerWidthWithMargin'] = $("body").outerWidth(true);
        extraData['body']['outerHeightWithMargin'] = $("body").outerHeight(true);
        extraData['body']['offset'] = $("body").offset();
    }

    // Add scroll Data
    if (eventName == "init" || eventName == "scroll" || eventName == "resize" || eventName == "mousewheel") {
        var offs = getScrollXY();
        extraData['scrollOffset'] = {};
        extraData['scrollOffset']['pageXOffset'] = offs[0];
        extraData['scrollOffset']['pageYOffset'] = offs[1];

    }

    // Add text selections
    if (eventName == "mouseup" || eventName == "mousemove" || eventName == "click" || eventName == "dblclick" || eventName == "scroll" || eventName == "keyup") {
        selectionData = getSelectionText();
        extraData['selectedText'] = selectionData[1];
    }
    var eventRaw = {};

    if (isDefined(e, 'deltaX')) {
        eventRaw['deltaX'] = e.deltaX;
    }
    if (isDefined(e, 'deltaY')) {
        eventRaw['deltaY'] = e.deltaY;
    }
    if (isDefined(e, 'deltaFactor')) {
        eventRaw['deltaFactor'] = e.deltaFactor;
    }

    // Add dimentions of the target
    if (isDefined(e, 'target')) {
        captureElementData(e, eventRaw, "target");
    }

    if (eventName == "init" || eventName == "scroll" || eventName == "resize" || eventName == "keyup") {
        extraData['zoom'] = {}
        var zoom = detectZoom.zoom();
        var device = detectZoom.device();
        extraData['zoom']['zoomLevel'] = zoom;
        extraData['zoom']['devicePixelRatio'] = device;
        //console.log(zoom, device);
    }
    if (isDefined(e, 'altKey')) {
        eventRaw['altKey'] = e.altKey;
    }
    if (isDefined(e, 'button')) {
        eventRaw['button'] = e.button;
    }
    if (isDefined(e, 'buttons')) {
        eventRaw['buttons'] = e.buttons;
    }
    if (isDefined(e, 'clientX')) {
        eventRaw['clientX'] = e.clientX;
    }
    if (isDefined(e, 'clientY')) {
        eventRaw['clientY'] = e.clientY;
    }
    if (isDefined(e, 'ctrlKey')) {
        eventRaw['ctrlKey'] = e.ctrlKey;
    }
    if (isDefined(e, 'currentTarget')) {
        captureElementData(e, eventRaw, "currentTarget");
    }
    if (isDefined(e, 'delegateTarget')) {
        captureElementData(e, eventRaw, "delegateTarget");
    }

    if (isDefined(e, 'eventPhase')) {
        eventRaw['eventPhase'] = e.eventPhase;
    }
    if (isDefined(e, 'metaKey')) {
        eventRaw['metaKey'] = e.metaKey;
    }
    if (isDefined(e, 'offsetX')) {
        eventRaw['offsetX'] = e.offsetX;
    }
    if (isDefined(e, 'offsetY')) {
        eventRaw['offsetY'] = e.offsetY;
    }
    if (isDefined(e, 'pageX')) {
        eventRaw['pageX'] = e.pageX;
    }
    if (isDefined(e, 'pageY')) {
        eventRaw['pageY'] = e.pageY;
    }
    if (isDefined(e, 'relatedTarget')) {
        captureElementData(e, eventRaw, "relatedTarget");
    }
    if (isDefined(e, 'screenX')) {
        eventRaw['screenX'] = e.screenX;
    }
    if (isDefined(e, 'screenY')) {
        eventRaw['screenY'] = e.screenY;
    }
    if (isDefined(e, 'shiftKey')) {
        eventRaw['shiftKey'] = e.shiftKey;
    }
    if (isDefined(e, 'timeStamp')) {
        eventRaw['timeStamp'] = (new Date).getTime(); //e.timeStamp;
    }
    if (isDefined(e, 'which')) {
        eventRaw['which'] = e.which;
    }
    var eventObject = [eventName, eventRaw, extraData];
    logBuffer.push(eventObject);
}

$(document).ready(function () {
    // Document Mouse Events
    if (!debug) {
        $(document).mousemove(function (e) {
            // First mouse move lets add a ready event
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });

        $(document).click(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });

        $(document).dblclick(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });

        $(document).mouseenter(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });

        $(document).mouseleave(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });

        $(document).mousedown(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });
        $(document).mouseup(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });

        // Keyboard Events
        $(document).keydown(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });
        $(document).keyup(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });
        $(document).keypress(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });
        $(document).focusin(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });
        $(document).focusout(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });
        $(document).mousewheel(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });

        // Window Events
        $(window).resize(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });
        $(window).scroll(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });
        $(window).focus(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });
        $(window).blur(function (e) {
            if (logBuffer.length == 0) {
                logFormatted(e, "init");
            }
            logFormatted(e);
        });
        //$(document).on(screenfull.raw.fullscreenchange, function () {
            //console.log('Fullscreen change');
            //alert('Fullscreen change');
        //});

    }
}); //$(document).ready(function() {


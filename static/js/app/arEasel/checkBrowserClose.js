// namespace:
this.arEasel = this.arEasel||{};

(function() {

/**
* This javascript file checks for the brower/browser tab action.
* It is based on the file menstioned by Daniel Melo.
* Reference: http://stackoverflow.com/questions/1921941/close-kill-the-session-when-the-browser-or-tab-is-closed
*/

arEasel.validNavigationOnExit = false;

function wireUpBrowserCloseEvents() {
    /**
    * For a list of events that triggers onbeforeunload on IE
    * check http://msdn.microsoft.com/en-us/library/ms536907(VS.85).aspx
    *
    * onbeforeunload for IE and chrome
    * check http://stackoverflow.com/questions/1802930/setting-onbeforeunload-on-body-element-in-chrome-and-ie-using-jquery
    */
    var dont_confirm_leave = 0; //set dont_confirm_leave to 1 when you want the user to be able to leave withou confirmation
    var leave_message = 'You sure you want to move on?'
    function goodbye(e) {
        if (!arEasel.validNavigationOnExit) {
            if (dont_confirm_leave !== 1) {
                if (!e) e = window.event;
                //e.cancelBubble is supported by IE - this will kill the bubbling process.
                e.cancelBubble = true;
                e.returnValue = leave_message;
                //e.stopPropagation works in Firefox.
                if (e.stopPropagation) {
                    e.stopPropagation();
                    e.preventDefault();
                }
                //return works for Chrome and Safari
                return leave_message;
            }
        }
    }
    window.onbeforeunload = goodbye;

    // Attach the event keypress to exclude the F5 refresh
    $('document').bind('keypress', function (e) {
        if (e.keyCode == 116) {
            arEasel.validNavigationOnExit = true;
        }
    });

    // Attach the event click for all links in the page
    $("a").bind("click", function () {
        arEasel.validNavigationOnExit = true;
    });

    // Attach the event submit for all forms in the page
    $("form").bind("submit", function () {
        arEasel.validNavigationOnExit = true;
    });

    // Attach the event click for all inputs in the page
    $("input[type=submit]").bind("click", function () {
        arEasel.validNavigationOnExit = true;
    });

}

arEasel.wireUpBrowserCloseEvents = wireUpBrowserCloseEvents;

}());
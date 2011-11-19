// ==UserScript==
// @name 		Private Web 
// @namespace 		http://50.57.176.145
// @description 	Replace private web links with the content
// @version		0.1
// @include 		*
// ==/UserScript==


var $;

// Add jQuery
    (function(){
        if (typeof unsafeWindow.jQuery == 'undefined') {
            var GM_Head = document.getElementsByTagName('head')[0] || document.documentElement,
                GM_JQ = document.createElement('script');
    
            GM_JQ.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js';
            GM_JQ.type = 'text/javascript';
            GM_JQ.async = true;
    
            GM_Head.insertBefore(GM_JQ, GM_Head.firstChild);
        }
        GM_wait();
    })();

// Check if jQuery's loaded
    function GM_wait() {
        if (typeof unsafeWindow.jQuery == 'undefined') {
            window.setTimeout(GM_wait, 100);
        } else {
            $ = unsafeWindow.jQuery.noConflict(true);
            replaceLinks();
        }
    }

// All your GM code must be inside this function
    function replaceLinks() {
		$.getJSON('http://priv.ly/k/test.json?callback=?', function(json) { 
		    $('a[href^="http://priv.ly"]').text(json.content);
		    $("p:contains('http://priv.ly')").contents().filter(function() { return this.nodeType == 3; }).each(function() {
				var currentText = $(this).text();
				currentText = currentText.replace("http://priv.ly/c/19af", "<a href='http://priv.ly/c/19af'>" + json.content + "</a>");
				$(this).replaceWith(currentText);
			});
		  });
    }





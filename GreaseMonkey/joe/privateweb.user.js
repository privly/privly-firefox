// ==UserScript==
// @name 		Private Web 
// @namespace 		http://50.57.176.145
// @description 	Replace private web links with the content
// @version		0.1
// @include 		*
// ==/UserScript==


//            //
// Add jQuery //
//            //

// jQuery function
var $;

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

//                                                             //
// All your GM code must be inside this function to use jQuery //
//                                                             //
    function replaceLinks() {
	
		//replace all link bodies with the content on the other end
		$('a[href^="http://priv.ly"]').each(function() {
			var currentObject = $(this);
			var url = $(this).attr("href") 
			var callbackURL = url + '.json?callback=?';
			$.getJSON(callbackURL, function(json) { 
				var replaceWith = "<a href='" + url + "'>" + json.content + "</a>"
			    currentObject.replaceWith(replaceWith);
			});
		});

		//replace all plain text references to privly content with the referenced content
		$("p:contains('priv.ly')").contents().filter(function() { return this.nodeType == 3; }).each(function() {
				var currentObject = $(this);
				var currentText = $(this).text();
				
				//matches priv.ly urls with or without http:// in front
				var patt = /(http:\/\/)?priv\.ly\/[ck]\/[a-zA-Z0-9]+/;
				var resource = patt.exec(currentText)[0];
				if(resource)
				{
					var callbackURL;
					if(resource.indexOf("http://") != -1)
					{
						callbackURL = resource + ".json?callback=?";
					} 
					else
					{
						callbackURL = "http://" + resource + ".json?callback=?";
					}
					
					$.getJSON(callbackURL, function(json) { 
						currentText = currentText.replace(resource, "<a href='" + callbackURL + "'>" + json.content + "</a>");
						currentObject.replaceWith(currentText);
					});
				}
		});
    }





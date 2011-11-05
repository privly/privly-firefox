// ==UserScript==
// @name 		Private Web 
// @namespace 		http://50.57.176.145
// @description 	Replace private web links with the content
// @version		0.1
// @include 		*
// ==/UserScript==

(function() {
    var toFind = "http://50.57.176.145";
    var bodytext = document.body.textContent;
    if (bodytext.indexOf(toFind) != -1) {
      // do a more complicated check for links/pre/p/span content
      var as = document.body.getElementsByTagName('a');
      for (var i = 0; i < as.length; i++) {
		    if (as[i].href.indexOf(toFind) == 0) {
          // below only guaranteed to work on firefox
          var request = new XMLHttpRequest();
          // hardcoded URL below, also asynchronous
          request.open('GET', "http://50.57.176.145", false);
          try {
            request.send();
            if (request.status == 200) {
              as[i].innerHTML = request.responseText;
            }
          } catch(e) {
            throw(e);
          }
        }
      }	
    }    
})();

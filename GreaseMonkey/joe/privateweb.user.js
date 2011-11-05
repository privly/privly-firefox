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
        alert("working!");
    }    
})();

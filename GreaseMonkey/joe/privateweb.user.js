// ==UserScript==
// @name 		Privly
// @namespace 		http://priv.ly
// @description 	Replace private web links with the content
// @version		0.3
// @include 		*
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// @require       http://courses.ischool.berkeley.edu/i290-4/f09/resources/gm_jq_xhr.js

// ==/UserScript==

function replaceLinks() {
	
	//replace all link bodies with the content on the other end
	$('a[href^="http://priv.ly"]').each(function() {
		var currentObject = $(this);
		var url = $(this).attr("href") 
		
		$.get(url + ".gm", function(plainText) { 
			var replaceWith = "<a href='" + url + "'>" + plainText + "</a>"
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
					callbackURL = resource;
				} 
				else
				{
					callbackURL = "http://" + resource;
				}
				
				$.get(callbackURL + ".gm", function(plainText) { 
					currentText = currentText.replace(resource, "<a href='" + callbackURL + "'>" + plainText + "</a>");
					currentObject.replaceWith(currentText);
				});
			}
	});
   }

$(document).ready(function() {
	replaceLinks();
});




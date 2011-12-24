/*******************************************************************************
Open Source Initiative OSI - The MIT License (MIT):Licensing
[OSI Approved License]
The MIT License (MIT)

Copyright (c) Sean McGregor

Permission is hereby granted, free of charge, to any person obtaining a copy 
of this software and associated documentation files (the "Software"), to deal 
in the Software without restriction, including without limitation the rights 
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
copies of the Software, and to permit persons to whom the Software is 
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in 
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
DEALINGS IN THE SOFTWARE.

*******************************************************************************/

/******************************************************************************
Transforming the Greasemonkey userscript to extension javascript should be fairly straight forward - 
	Copy the greasemonkey userscript(privateweb.user.js) and paste it into privly.js. 
	Change all '$' references to 'jQ'.
******************************************************************************/

/*******************************************************************************
Inspired by Linkify script:
  http://downloads.mozdev.org/greasemonkey/linkify.user.js

Originally written by Anthony Lieuallen of http://arantius.com/
Licensed for unlimited modification and redistribution as long as
this notice is kept intact.
*******************************************************************************/
function createLinks() {
    
    //Matches:
    //              http://
    //              https://
    //                        priv.ly/textAndNumbers/any/number/of/times
    //                                                                          
    var regex = /\b(https?:\/\/){0,1}(priv\.ly)(\/\w*){2,}\b/gi;
    //also matches localhost:3000
    //var regex = /\b(https?:\/\/){0,1}(priv\.ly|localhost:3000)(\/\w*){2,}\b/gi;
    
    var hasHTTPRegex = /^((https?)\:\/\/)/i

    var excludeParents = ["a", "applet", "button", "code", "form",
                           "input", "option", "script", "select", "meta", 
                           "style", "textarea", "title"];
    var excludedParentsString = excludeParents.join(" or parent::");
    var xpathExpression = ".//text()[not(parent:: " + excludedParentsString +")]";

    textNodes = document.evaluate(xpathExpression, document.body, null, 
                                  XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    
    for(var i=0; i < textNodes.snapshotLength; i++){
        
        item = textNodes.snapshotItem(i);
        var itemText = item.nodeValue;

        if(regex.test(itemText)){
            var span = document.createElement("span");    
            var lastLastIndex = 0;
                regex.lastIndex = 0;
            for(var results = null; results = regex.exec(itemText); ){
                var href = results[0];
                span.appendChild(document.createTextNode(itemText.substring(lastLastIndex, results.index)));

                var    text = (href.indexOf(" ")==0)?href.substring(1):href;
                
                if(!hasHTTPRegex.test(href)) 
                    href="http://"+href;
                var a = document.createElement("a");
                a.setAttribute("href", href);
                a.appendChild(document.createTextNode(text.substring(0,4).toLowerCase()+text.substring(4)));
                if(href.indexOf(" ")==0) 
                    span.appendChild(document.createTextNode(" "));
                span.appendChild(a);
                lastLastIndex = regex.lastIndex;
            }
            span.appendChild(document.createTextNode(itemText.substring(lastLastIndex)));
            item.parentNode.replaceChild(span, item);
        }
    }
}


function replaceLinks(){
	//replace all link bodies with the content on the other end
	jQ('a[href^="http://priv.ly"]').each(function() {
		var currentObject = jQ(this);
		var pwUrl = jQ(this).attr("href");
		var postId = pwUrl.substr(pwUrl.indexOf("/posts")+7).replace(".iframe","");
		/*
		jQ.getJSON(pwUrl + ".json?callback=?", function(data) {
			var replaceWith = "<a href='" + pwUrl + "'>" + data['content'] + "</a>";
			currentObject.replaceWith(replaceWith);
			console.log('url: '+pwUrl+'; content: '+data['content']);
		});
		*/
		iframe = jQ('<iframe />', {"frameborder":"0", "vspace":"0", "hspace":"0", 
		"marginwidth":"0", "marginheight":"0", "src":pwUrl + ".iframe","id":"ifrm"+postId});
		iframe.attr('scrolling','no');
		iframe.css('overflow','hidden');
		currentObject.replaceWith(iframe);
	});
};



/* we want to execute the function replaceLinks() that is defined in privly.js(which is loaded on the webpage, hence it is part of 
the web page) from privly-setup.js(which is part of the extension). We want to run replaceLinks whenever the user tries to run 
the extension either via key press or by mouse click.
There is no straight way of calling a function defined on the web page from an extension. A hack for this is to add a HTML element
(in this case a button) to the page and to call the required function(here replaceLinks) on the button's click/mousedown. 
It is possible to simulate click/mousedown on any HTML element from the extension as content.document is available to the extension. 
refer - http://stackoverflow.com/a/2896066
 */
 
function addPWbutton(){
	var pwbutton = '<input type="button" id="pwbtn" style="visibility:hidden;" onclick="replaceLinks()" />';
	jQ('body').append(pwbutton);
}

jQ(document).ready(function(){
	if(document.URL.indexOf('localhost:3000') == -1 && document.URL.indexOf('priv.ly') == -1)
    addPWbutton();
    createLinks();
    replaceLinks();
    
    if(document.URL.indexOf('localhost:3000') == -1 && document.URL.indexOf('priv.ly') == -1)
    	window.addEventListener("IframeResizeEvent", function(e) { resizeIframe(e); }, false, true);
   
});

function resizeIframe(evt){
	//do nothing. Actual implementation is in privly-setup.js
}






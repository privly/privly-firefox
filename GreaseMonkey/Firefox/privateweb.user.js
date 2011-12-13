// ==UserScript==
// @name         Privly
// @namespace         http://priv.ly
// @description     Replace Privly links with the content
// @version        0.3
// @homepageURL      http://priv.ly
// @contributionURL https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QBPWME6HPNA5W&lc=US&item_name=Privly&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted
// @include         *
// @exclude         *.txt
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// @require       http://courses.ischool.berkeley.edu/i290-4/f09/resources/gm_jq_xhr.js

// ==/UserScript==
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

function replaceLinks() {
    //replace all link bodies with the content on the other end
    $('a[href^="http://priv.ly"]').each(function() {
        var currentObject = $(this);
        var url = $(this).attr("href") 
        
        $.get(url + ".gm", function(plainText) { 
            var replaceWith = "<a href='" + url + "'><pre>" + plainText + "<p/re></a>"
            currentObject.replaceWith(replaceWith);
        });
    });
}

$(document).ready(function() {
    createLinks();
    replaceLinks();
});




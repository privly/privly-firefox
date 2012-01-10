// ==UserScript==
// @name         Privly
// @namespace         http://priv.ly
// @description     Replace Privly links with the content
// @version        0.3
// @homepageURL      http://priv.ly
// @contributionURL https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QBPWME6HPNA5W&lc=US&item_name=Privly&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted
// @include         *
// @exclude         *.txt
// @exclude         *.iframe
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js

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

//Matches:
//              http://
//              https://
//                        priv.ly/textAndNumbers/any/number/of/times
//                                                                          
//also matches localhost:3000
var privlyReferencesRegex = /\b(https?:\/\/){0,1}(priv\.ly|localhost:3000)(\/\w*){2,}\b/gi;

/**
 * Takes a domain with an optional http(s) in front and returns a fully formed domain name
 */
function makeHref(domain){
  var hasHTTPRegex = /^((https?)\:\/\/)/i
  if(!hasHTTPRegex.test(domain)) 
      domain = "http://" + domain;
  return domain;
}

/**
 * Make plain text links into anchor elements
 */
function createLinks() {
    /*************************************************************************
    Inspired by Linkify script:
      http://downloads.mozdev.org/greasemonkey/linkify.user.js

    Originally written by Anthony Lieuallen of http://arantius.com/
    Licensed for unlimited modification and redistribution as long as
    this notice is kept intact.
    **************************************************************************/
    

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

        if(privlyReferencesRegex.test(itemText)){
            var span = document.createElement("span");    
            var lastLastIndex = 0;
            privlyReferencesRegex.lastIndex = 0;
            for(var results = null; results = privlyReferencesRegex.exec(itemText); ){
                var href = results[0];
                span.appendChild(document.createTextNode(itemText.substring(lastLastIndex, results.index)));

                var text = (href.indexOf(" ")==0)?href.substring(1):href;
                
                var href = makeHref(text);
                
                var a = document.createElement("a");
                a.setAttribute("href", href);
                a.appendChild(document.createTextNode(text.substring(0,4).toLowerCase()+text.substring(4)));
                if(href.indexOf(" ")==0) 
                    span.appendChild(document.createTextNode(" "));
                span.appendChild(a);
                lastLastIndex = privlyReferencesRegex.lastIndex;
            }
            span.appendChild(document.createTextNode(itemText.substring(lastLastIndex)));
            item.parentNode.replaceChild(span, item);
        }
    }
}

/**
 * Checks link attributes and text for privly links without the proper href attribute.
 * Twitter and other hosts change links so they can collect click events.
 */
function correctIndirection() {
  var allLinks = $("a");
  allLinks.each(function() {
      thisLink = $(this);
      linkBody = thisLink.html()

      if (privlyReferencesRegex.test(linkBody)) {        
        var href = thisLink.attr("href");
        // If the href is not present or is on a different domain
        if(href.indexOf("priv.ly/posts/") == -1 || href.indexOf("priv.ly/posts/") > 9)
        {
          privlyReferencesRegex.lastIndex = 0;
          var results = privlyReferencesRegex.exec(linkBody);
          var newHref = makeHref(results[0]);
          thisLink.attr("href", newHref);
        }
      }
  });
}

// Our iframe identifiers
var nextAvailableFrameID = 0;

/**
 * Replace a jQuery anchor element with its referenced content.
 */
function replaceLink(currentObject) {
  
  var linkUrl = currentObject.attr("href");
  var postId = linkUrl.substr(linkUrl.indexOf("/posts")+7);
  
  iframe = $('<iframe />', {"frameborder":"0",
    "vspace":"0",
    "hspace":"0",
    "width":"100%",
    "marginwidth":"0", 
    "marginheight":"0", 
    "src":linkUrl + ".iframe?frame_id=" + nextAvailableFrameID,
    "id":"ifrm"+nextAvailableFrameID});
  nextAvailableFrameID++;
  iframe.attr('scrolling','no');
  iframe.css('overflow','hidden');
  currentObject.replaceWith(iframe);
}


// This jquery selection string selects anchor elements 
// that point to the posts controller in the Web Application.
var selectors = 'a[href^="https://priv.ly/posts/"],'+ 
                 'a[href^="http://priv.ly/posts/"],'+ 
                 'a[href^="http://localhost:3000/posts/"]';

/**
 * Replaces all matching links with their referenced content.
 * Links with the attribute privly='exclude' are excluded.
 */
function replaceLinks() {
  $(selectors).each(function() {
      var exclude = $(this).attr("privly");
      
      if(exclude != "exclude")
      {
        replaceLink($(this));
      }
  });
}

/**
 * resizeIframe is called when the listener
 */
function resizeIframe(evt){	
	var iframeHeight = evt.target.getAttribute("height");
	var frame_id = evt.target.getAttribute("frame_id");
	var ifr = content.document.getElementById('ifrm'+frame_id);
	ifr.style.height = iframeHeight+'px';
}


// When the document is ready, it fetches the appropriate content
// It checks again whenever the body is clicked. This allows for
// dynamic content to be replaced. Note: GM automatically wraps this
// code in an onready event so this is not necessary in GM.
$(document).ready(function() {  
  
  window.addEventListener("IframeResizeEvent", resizeIframe, false);
  
  createLinks();
  correctIndirection();
  replaceLinks();
  $("body").live('click', function() {
    createLinks();
    correctIndirection();
    replaceLinks();
  });
});

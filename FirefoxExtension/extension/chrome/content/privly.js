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
  var allLinks = jQ("a");
  allLinks.each(function() {
      thisLink = jQ(this);
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


var nextAvailableFrameID = 0;

/**
 * Replace a jQuery anchor element with its referenced content.
 */
function replaceLink(currentObject) {
  
  var linkUrl = currentObject.attr("href");
  var postId = linkUrl.substr(linkUrl.indexOf("/posts")+7);
  
  iframe = jQ('<iframe />', {"frameborder":"0",
    "vspace":"0",
    "name":"privlyiframe",
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

function replaceLinks(){
  
  //don't recursively replace links
  if(document.URL.indexOf('priv.ly') != -1 || document.URL.indexOf('localhost:3000') != -1)
    return;
  
  jQ(selectors).each(function() {
    var exclude = jQ(this).attr("privly");
    if(exclude != "exclude")
    {
      replaceLink(jQ(this));
    }
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
  
  if(document.URL.indexOf('localhost:3000') == -1 && document.URL.indexOf('priv.ly') == -1){
	   addPWbutton();
	}
   createLinks();
   correctIndirection();
   replaceLinks();

    jQ("body").live('click', function() {
      createLinks();
      correctIndirection();
      replaceLinks();
    });

    if(document.URL.indexOf('localhost:3000') == -1 && document.URL.indexOf('priv.ly') == -1)
      window.addEventListener("IframeResizeEvent", function(e) { resizeIframe(e); }, false, true);
});

function resizeIframe(evt){
	//do nothing. Actual implementation is in privly-setup.js
}


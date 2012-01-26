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

var privly = {

  //Matches:
  //              http://
  //              https://
  //                        priv.ly/textAndNumbers/any/number/of/times
  //                                                                          
  //also matches localhost:3000
  privlyReferencesRegex: /\b(https?:\/\/){0,1}(priv\.ly|localhost:3000)(\/\w*){2,}\b/gi,
  
  // Takes a domain with an optional http(s) in front and returns a fully formed domain name
  makeHref: function(domain)
  {
    var hasHTTPRegex = /^((https?)\:\/\/)/i
    if(!hasHTTPRegex.test(domain)) 
        domain = "http://" + domain;
    return domain;
  },

  //Make plain text links into anchor elements
  createLinks: function() 
  {
      /*************************************************************************
      Inspired by Linkify script:
        http://downloads.mozdev.org/greasemonkey/linkify.user.js

      Originally written by Anthony Lieuallen of http://arantius.com/
      Licensed for unlimited modification and redistribution as long as
      this notice is kept intact.
      **************************************************************************/

      var excludeParents = ["a", "applet", "button", "code", "form",
                             "input", "option", "script", "select", "meta", 
                             "style", "textarea", "title", "div"];
      var excludedParentsString = excludeParents.join(" or parent::");
      var xpathExpression = ".//text()[not(parent:: " + excludedParentsString +")]";

      textNodes = document.evaluate(xpathExpression, document.body, null, 
                                    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

      for(var i=0; i < textNodes.snapshotLength; i++){
          item = textNodes.snapshotItem(i);

          var itemText = item.nodeValue;

          if(privly.privlyReferencesRegex.test(itemText)){
              var span = document.createElement("span");    
              var lastLastIndex = 0;
              privly.privlyReferencesRegex.lastIndex = 0;
              for(var results = null; results = privly.privlyReferencesRegex.exec(itemText); ){
                  var href = results[0];
                  span.appendChild(document.createTextNode(itemText.substring(lastLastIndex, results.index)));

                  var text = (href.indexOf(" ")==0)?href.substring(1):href;

                  var href = privly.makeHref(text);

                  var a = document.createElement("a");
                  a.setAttribute("href", href);
                  a.appendChild(document.createTextNode(text.substring(0,4).toLowerCase()+text.substring(4)));
                  if(href.indexOf(" ")==0) 
                      span.appendChild(document.createTextNode(" "));
                  span.appendChild(a);
                  lastLastIndex = privly.privlyReferencesRegex.lastIndex;
              }
              span.appendChild(document.createTextNode(itemText.substring(lastLastIndex)));
              item.parentNode.replaceChild(span, item);
          }
      }
  },
  
  //Checks link attributes and text for privly links without the proper href attribute.
  //Twitter and other hosts change links so they can collect click events.
  correctIndirection: function() 
  {
    var allLinks = jQ("a");
    allLinks.each(function() {
        thisLink = jQ(this);
        linkBody = thisLink.html();
        href = thisLink.attr("href");
        if(href && (href.indexOf("priv.ly/posts/") == -1 || href.indexOf("priv.ly/posts/") > 9))
        {
          
          if (privly.privlyReferencesRegex.test(linkBody)) {        
            
            // If the href is not present or is on a different domain
              privly.privlyReferencesRegex.lastIndex = 0;
              var results = privly.privlyReferencesRegex.exec(linkBody);
              var newHref = privly.makeHref(results[0]);
              thisLink.attr("href", newHref);
              //Preventing the default link behavior
              thisLink.attr("onmousedown", "event.cancelBubble = true; event.stopPropagation(); event.preventDefault(); privly.replaceLink(this)");
          }
        }
        else
        {
          
          //Preventing the default link behavior
          thisLink.attr("onmousedown", "event.cancelBubble = true; event.stopPropagation(); event.preventDefault(); privly.replaceLink(this)");
        }
    });
  },

  nextAvailableFrameID: 0,

  // Replace a jQuery anchor element with its referenced content.
  replaceLink: function(object) 
  {
    var currentObject = jQ(object)
    var linkUrl = currentObject.attr("href");
    var postId = linkUrl.substr(linkUrl.indexOf("/posts")+7);

    iframe = jQ('<iframe />', {"frameborder":"0",
      "vspace":"0",
      "hspace":"0",
      "name":"privlyiframe",
      "width":"100%",
      "marginwidth":"0", 
      "marginheight":"0",
      "height":"1px", 
      "src":linkUrl + ".iframe?frame_id=" + privly.nextAvailableFrameID,
      "id":"ifrm"+privly.nextAvailableFrameID});
    privly.nextAvailableFrameID++;
    iframe.attr('scrolling','no');
    iframe.css('overflow','hidden');
    currentObject.replaceWith(iframe);
  },

  // This jquery selection string selects anchor elements 
  // that point to the posts controller in the Web Application.
  selectors: 'a[href^="https://priv.ly/posts/"],'+ 
                   'a[href^="http://priv.ly/posts/"],'+ 
                   'a[href^="http://localhost:3000/posts/"]',

  //Replace Privly links with their iframe
  replaceLinks: function(){
    jQ(privly.selectors).each(function() {
      var exclude = jQ(this).attr("privly");
      if(exclude != "exclude")
      {
        privly.replaceLink(jQ(this));
      }
    });
  },

  resizeIframe: function(evt){
    //do nothing. Actual implementation is in privly-setup.js
  },
  
  //indicates whether the extension shoud immediatly replace all Privly
  //links it encounters
  active: true
};


jQ(document).ready(function(){
  
  //don't recursively replace links
  if(document.URL.indexOf('priv.ly') != -1 )
    return;
  
  //create and correct the links pointing
  //to Privly content
  privly.createLinks();
  privly.correctIndirection();
  
  //replace all available links on load, if in active mode
  if(privly.active)
    privly.replaceLinks();
  
  //Everytime the page is updated via javascript, we have to check
  //for new Privly content. This might not be supported on other platforms
  jQ(document).bind('DOMNodeInserted', function(event) {
        privly.createLinks();
        privly.correctIndirection();
        
        //replace them without clicking if the script is in
        //active mode
        if(privly.active)
        {
          privly.replaceLinks();
        }
  });
  
  //replace the clicked link only, the link must be prepped with
  //calls to privly.createLinks() and privly.correctIndirection()
  if(!privly.active)
  {
    jQ(privly.selectors).live('click', function(event) {
      event.preventDefault();
      privly.replaceLink(jQ(this));
    });
  }
  
  //The content's iframe will fire a resize event when it has loaded, resizeIframe
  //sets the height of the iframe to the height of the content contained within.
  window.addEventListener("IframeResizeEvent", function(e) { privly.resizeIframe(e); }, false, true);
});

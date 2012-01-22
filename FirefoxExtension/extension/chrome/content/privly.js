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
                             "style", "textarea", "title"];
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
        if (privly.privlyReferencesRegex.test(linkBody)) {        
          var href = thisLink.attr("href");
          // If the href is not present or is on a different domain
          if(href.indexOf("priv.ly/posts/") == -1 || href.indexOf("priv.ly/posts/") > 9)
          {
            privly.privlyReferencesRegex.lastIndex = 0;
            var results = privly.privlyReferencesRegex.exec(linkBody);
            var newHref = privly.makeHref(results[0]);
            thisLink.attr("href", newHref);
          }
        }
    });
  },

  nextAvailableFrameID: 0,


  // Replace a jQuery anchor element with its referenced content.
  replaceLink: function(currentObject) 
  {

    var linkUrl = currentObject.attr("href");
    var postId = linkUrl.substr(linkUrl.indexOf("/posts")+7);

    iframe = jQ('<iframe />', {"frameborder":"0",
      "vspace":"0",
      "hspace":"0",
      "width":"100%",
      "marginwidth":"0", 
      "marginheight":"0", 
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

    //don't recursively replace links
    if(document.URL.indexOf('priv.ly') != -1 )
      return;

    jQ(privly.selectors).each(function() {
      var exclude = jQ(this).attr("privly");
      if(exclude != "exclude")
      {
        privly.replaceLink(jQ(this));
      }
    });
  },



  /* we want to execute the function replaceLinks() that is defined in privly.js(which is loaded on the webpage, hence it is part of 
  the web page) from privly-setup.js(which is part of the extension). We want to run replaceLinks whenever the user tries to run 
  the extension either via key press or by mouse click.
  There is no straight way of calling a function defined on the web page from an extension. A hack for this is to add a HTML element
  (in this case a button) to the page and to call the required function(here replaceLinks) on the button's click/mousedown. 
  It is possible to simulate click/mousedown on any HTML element from the extension as content.document is available to the extension. 
  refer - http://stackoverflow.com/a/2896066
   */

  addPWbutton: function(){
    var pwbutton = '<input type="button" id="pwbtn" style="visibility:hidden;" onclick="replaceLinks()" />';
    jQ('body').append(pwbutton);
  },

  resizeIframe: function(evt){
    //do nothing. Actual implementation is in privly-setup.js
  }
};

jQ(document).ready(function(){

  if(document.URL.indexOf('localhost:3000') == -1 && document.URL.indexOf('priv.ly') == -1){
    privly.addPWbutton();
  }

  privly.createLinks();
  privly.correctIndirection();
  privly.replaceLinks();//replace all available links on load
  
  //replace all links whenever the page is clicked in the body
  jQ("body").live('click', function() {
    privly.createLinks();
    privly.correctIndirection();
    privly.replaceLinks();
  });
  
  //replace the clicked link only, the link must be prepped with
  //calls to privly.createLinks() and privly.correctIndirection()
  //jQ(privly.selectors).live('click', function(event) {
  //  event.preventDefault();
  //  privly.replaceLink(jQ(this));
  //});
  
  if(document.URL.indexOf('localhost:3000') == -1 && document.URL.indexOf('priv.ly') == -1)
  {
    window.addEventListener("IframeResizeEvent", function(e) { privly.resizeIframe(e); }, false, true);
  }
});

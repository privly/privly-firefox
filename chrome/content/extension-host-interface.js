var privlyExtension = 
{
  //https://developer.mozilla.org/en/Code_snippets/Preferences#Where_the_default_values_are_read_from
  preferences : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.privly."),
  
  //Matches:
  //              http://
  //              https://
  //                        priv.ly/textAndNumbers/any/number/of/times
  //                                                                          
  //also matches localhost:3000
  privlyReferencesRegex: /\b(https?:\/\/){0,1}(priv\.ly|localhost:3000)(\/posts)(\/\w*){1,}\b/gi,

  /*
   * enum to hold various extension modes and their value. extension modes are set through firefox's
   * extension api. https://developer.mozilla.org/en/Code_snippets/Preferences
   */ 
  extensionModeEnum : {
    ACTIVE : 0,
    PASSIVE : 1,
    CLICKTHROUGH : 2
  },
  
  // installs toolbar button in the navigation bar
  installToolbarButton : function(){
    var currentset = document.getElementById("nav-bar").currentSet;
    currentset = currentset+",privly-tlbr-btn";
    document.getElementById("nav-bar").setAttribute("currentset",currentset);
    document.getElementById("nav-bar").currentSet = currentset;
    document.persist("nav-bar","currentset");
    var tlbrbtn = document.getElementById("privly-tlbr-btn");
  },
 
  /* 
   * checks if toolbar button is installed or not. This function is called only once
   * immediately after the extension is installed
   */
  checkToolbarButton : function()
  {
    firstRun = "firstRunDone";
    if(!this.preferences.prefHasUserValue(firstRun)){
      setTimeout("privlyExtension.installToolbarButton()",2000);
      this.preferences.setBoolPref(firstRun,true);
    }
  },
  
  // function called when the user uses ctrl+alt+P - executes runPrivly function in privly.js
  runPrivly : function()
  {
    var pwbutton = content.document.getElementById('pwbtn');
    if(pwbutton)
      pwbutton.click();
  },
  
  /* 
   * function that posts content to privly's content server with the data in the 
   * 'form' html element
   */
  postToPrivly : function(privacySetting)
  {
    var target = document.popupNode;
    var value = target.value;
    var allPostsPublic = this.preferences.getBoolPref("allPostsPublic");
    var contentServerUrl = this.preferences.getCharPref("contentServerUrl");
    // the post can be either public or private (shared only with specific users)
    var postPrivacySetting = allPostsPublic || (privacySetting == 'public');
    if(value == "")
      alert("Sorry. You can not post empty content to Privly");
    else{
      jQ.ajax(
        {
          data: { auth_token: privlyAuthentication.authToken, "post[content]":value, 
            "post[public]":postPrivacySetting,
            endpoint:"extension", browser:"firefox", version:"0.1.1.1"
          },
          type: "POST",
          url: contentServerUrl+"/posts.json",
          contentType: "application/x-www-form-urlencoded; charset=UTF-8",
          dataType: "json",
          accepts: "json",
          success: function(data, textStatus, jqXHR){
            target.value=jqXHR.getResponseHeader("privlyurl");
          }
        }
      );
    }
  },
  
  //deprecated method of resizing the iframe at the extension level using 
  //an event. We now resize the iframe within the page context using post
  //message. We will eventually return this operation to the extension
  //level so that the host page can't capture how much content is in the
  //injected iframe
  resizeIframe : function(evt)
  {
    //var iframeHeight = evt.target.getAttribute("height");
    //var ifr = evt.target.ownerDocument.defaultView.frameElement;
    //ifr.style.height = iframeHeight+'px';
  },
  
  /* 
   * function that gets called when the user right-clicks and opens the context menu.
   * this function determines options to be shown in the content menu based on whether
   * the user is signed in or not.
   */
  checkContextForPrivly : function(evt)
  {
    var loginToPrivlyMenuItem = document.getElementById('loginToPrivlyMenuItem'); 
    var logoutFromPrivlyMenuItem = document.getElementById('logoutFromPrivlyMenuItem');   
    var publicPostToPrivlyMenuItem = document.getElementById('publicPostToPrivlyMenuItem');
    var privatePostToPrivlyMenuItem = document.getElementById('privatePostToPrivlyMenuItem');
    //check if the user is signed in
    if(privlyAuthentication.authToken)
    {
      loginToPrivlyMenuItem.hidden = true;
      logoutFromPrivlyMenuItem.hidden = false;
      disablePosts = this.preferences.getBoolPref("disablePosts");
      if(!disablePosts && evt.target.nodeName != null && 
          (evt.target.nodeName.toLowerCase() == 'input' || evt.target.nodeName.toLowerCase() == 'textarea')){
        publicPostToPrivlyMenuItem.hidden = false;
        privatePostToPrivlyMenuItem.hidden = false;
      }
      else {
        publicPostToPrivlyMenuItem.hidden = true;
        privatePostToPrivlyMenuItem.hidden = true;
      }
    }
    else
    {
      loginToPrivlyMenuItem.hidden = false;
      logoutFromPrivlyMenuItem.hidden = true;
      publicPostToPrivlyMenuItem.hidden = true;
      privatePostToPrivlyMenuItem.hidden = true;
    }
  },
  
  //toggle extension mode when toolbar button is clicked
  toggleExtensionMode : function()
  {
    extensionMode = this.preferences.getIntPref("extensionMode");
    //when the extension is in active mode and user clicks the toolbar button toggle to passive mode
    if(extensionMode == privlyExtension.extensionModeEnum.ACTIVE){
      extensionMode = privlyExtension.extensionModeEnum.PASSIVE;
    }
    //when the extension is in either click through or passive mode and user clicks the toolbar button toggle to active mode
    else if(extensionMode == privlyExtension.extensionModeEnum.PASSIVE || extensionMode == privlyExtension.extensionModeEnum.CLICKTHROUGH){
      extensionMode = privlyExtension.extensionModeEnum.ACTIVE;
    }
    this.updateExtensionMode(extensionMode);
  },
 
  /*
   * update the toolbar button's image and tool tip based on the new extension mode
   * after the user updates it.
   */
  updateToolbarButtonIcon : function()
  {
    privlyToolbarButton = document.getElementById('privly-tlbr-btn');
    extensionMode = this.preferences.getIntPref("extensionMode");
    if(privlyToolbarButton){
      if(extensionMode == privlyExtension.extensionModeEnum.ACTIVE){
        privlyToolbarButton.style.listStyleImage="url('chrome://privly/skin/logo_16.png')";
        privlyToolbarButton.tooltipText="Privly is in active mode";
      }
      else if(extensionMode == privlyExtension.extensionModeEnum.PASSIVE){
        privlyToolbarButton.style.listStyleImage="url('chrome://privly/skin/logo_16_dis.png')";
        privlyToolbarButton.tooltipText="Privly is in passive mode";
      }
      else if(extensionMode == privlyExtension.extensionModeEnum.CLICKTHROUGH){
        privlyToolbarButton.style.listStyleImage="url('chrome://privly/skin/logo_16_dis.png')";
        privlyToolbarButton.tooltipText="Privly is in require-clickthrough mode";
      }
    }
  },
  
  /* 
   * inserts an html element - 'privModeElement' with an attribute - 'mode' for
   * a given document object
   */
   insertPrivModeElement : function(doc,extensionMode){
     elements = doc.getElementsByTagName("privModeElement");
    if(elements != null && elements.length != 0){
      elements[0].setAttribute("mode", extensionMode);
    }
    else{
      element = doc.createElement("privModeElement");
      element.setAttribute("mode", extensionMode);
      doc.documentElement.appendChild(element);
    }
   },
  /*
   * inserts/updates the html element - 'privModeElement' with mode attribute 
   * on the host page and all iframes
   */
  updatePrivModeElement : function()
  {
    this.updateToolbarButtonIcon();
    extensionMode = this.preferences.getIntPref("extensionMode");
    this.insertPrivModeElement(content.document,extensionMode);
    //when the host page is done loading
    content.document.defaultView.onload = function(event){
      //get all iframes on the hostpage.
      iframes = content.document.getElementsByTagName('iframe');
      if(iframes){
        //loop through each iframe in the host page
        for(i in iframes){
          iframe = iframes[i];
          if(iframe){
            // if the iframe is done loading, insert the privModeElement into its DOM
            if(iframe.contentDocument.readyState == 'complete'){
              privlyExtension.privlyReferencesRegex.lastIndex = 0;
              // test if the iframe is not one of our own iframes from priv.ly or locahost:3000
              if(iframe.src && !privlyExtension.privlyReferencesRegex.test(iframe.src)){
                privlyExtension.insertPrivModeElement(iframe.contentDocument,extensionMode);
              }
            }
            // else, insert the privModeElement into the iframe's DOM once it is loaded
            else{
              iframe.contentDocument.defaultView.onload = function(event){
                privlyExtension.privlyReferencesRegex.lastIndex = 0;
                // test if the iframe is not one of our own iframes from priv.ly or locahost:3000
                if(iframe.src && !privlyExtension.privlyReferencesRegex.test(iframe.src)){
                  privlyExtension.insertPrivModeElement(iframe.contentDocument,extensionMode);
                }
              }
            }
            
          }
        }
      }
    }
  },
  
  updateExtensionMode : function(extensionMode)
  {
    this.preferences.setIntPref("extensionMode",extensionMode);
    this.updatePrivModeElement();
  }
}

Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript("chrome://privly/content/jquery-1.7.1.min.js",window);
jQ = window.jQuery.noConflict();

window.addEventListener("IframeResizeEvent", function(e) { privlyExtension.resizeIframe(e); }, false, true);
window.addEventListener("contextmenu", function(e) { privlyExtension.checkContextForPrivly(e);}, false);

/*
 * user could change the mode from the preferences menu in the add-on page. So, update toolbar
 * button and dispatch an event to alert privly.js about the mode change
 * whenever tab is switched
 */
gBrowser.addEventListener("select", function(event){
  privlyExtension.updatePrivModeElement();
}, true);

gBrowser.addEventListener("load", function(event){
    var doc = event.originalTarget;
    var wnd = doc.defaultView;
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
    //load privly.js to all the doms on the host page including iframes
    
    if (doc.nodeName == '#document'){
      extensionMode = privlyExtension.preferences.getIntPref("extensionMode");
      privlyExtension.insertPrivModeElement(doc,extensionMode);
      loader.loadSubScript("chrome://privly/content/privly.js", wnd);
    }
  if ((doc.nodeName == '#document') && (wnd.location.href == gBrowser.currentURI.spec)){
      setTimeout("privlyExtension.checkToolbarButton()",3000); 
      privlyExtension.updatePrivModeElement();
    }
    
}, true);

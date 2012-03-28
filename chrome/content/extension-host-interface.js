var privlyExtension = 
{
  //https://developer.mozilla.org/en/Code_snippets/Preferences#Where_the_default_values_are_read_from
  preferences : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.privly."),

  loadLibraries : function(evt)
  {
    var doc = evt.originalTarget;
    var wnd = doc.defaultView;
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
    preferences = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.privly.");
    wnd.balExtensionMode =preferences.getIntPref("extensionMode");
    //load the script running on the host page
    if(doc.URL){
      loader.loadSubScript("chrome://privly/content/privly.js", wnd);    
    }
  },
  runPrivly : function()
  {
    var pwbutton = content.document.getElementById('pwbtn');
    if(pwbutton)
      pwbutton.click();
  },
  
  postToPrivly : function(privacySetting)
  {
    var target = document.popupNode;
    var value = target.value;
    var allPostsPublic = this.preferences.getBoolPref("allPostsPublic");
    var contentServerUrl = this.preferences.getCharPref("contentServerUrl");
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
          url: contentServerUrl+"/posts",
          contentType: "application/x-www-form-urlencoded; charset=UTF-8", 
          url: privlySettings.contentServerUrl+"/posts.json",
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
  
  /*
   *when the server is down/busy, this function is called to convert the privly iframes to anchors on the web page 
   *depending upon the settings set in the extensionCommand header.
   */
  convertIframesToLinks : function()
  {
    var privlyIframes = content.document.getElementsByName("privlyiframe");
    extensionMode = this.preferences.getIntPref("extensionMode");
    if((extensionMode == 2 || extensionMode == 1) && privlyIframes != null && privlyIframes.length > 0){
      for(var i = 0; i < privlyIframes.length; i++){
        var anchor = content.document.createElement("a");
        var href = privlyIframes[i].src;
        href = href.substring(0,href.indexOf(".iframe"));
        anchor.setAttribute('href',href);
        if(extensionMode == 3){
            anchor.innerHTML = "Privly temporarily disabled all requests to its servers. Please try again later.";
        }
        else if(extensionMode == 2){
            anchor.innerHTML = "Privly is in sleep mode so it can catch up with demand. The content may still be viewable by clicking this link";
        }
        privlyIframes[i].parentNode.replaceChild(anchor,privlyIframes[i]);
      }
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
  
  checkContextForPrivly : function(evt)
  {
    var loginToPrivlyMenuItem = document.getElementById('loginToPrivlyMenuItem'); 
    var logoutFromPrivlyMenuItem = document.getElementById('logoutFromPrivlyMenuItem');   
    var publicPostToPrivlyMenuItem = document.getElementById('publicPostToPrivlyMenuItem');
    var privatePostToPrivlyMenuItem = document.getElementById('privatePostToPrivlyMenuItem');
  
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
    if(extensionMode == 0){
      extensionMode = 1;
    }
    else if(extensionMode == 1){
      extensionMode = 0;
    }
    this.updateExtensionMode(extensionMode);
  },
  
  updateToolbarButtonIcon : function()
  {
    privlyToolbarButton = document.getElementById('privly-tlbr');
    extensionMode = this.preferences.getIntPref("extensionMode");
    if(extensionMode == 0){
      privlyToolbarButton.style.listStyleImage="url('chrome://privly/skin/logo_16.png')";
      privlyToolbarButton.tooltipText="Privly is in active mode";
    }
    else if(extensionMode == 1){
      privlyToolbarButton.style.listStyleImage="url('chrome://privly/skin/logo_16_dis.png')";
      privlyToolbarButton.tooltipText="Privly is in passive mode";
    }
  },
  /* 
   * inserts a 'privModeElement' with an attribute - 'mode'
   */
  updatePrivModeElement : function()
  {
    this.updateToolbarButtonIcon();
    extensionMode = this.preferences.getIntPref("extensionMode");
    elements = content.document.getElementsByTagName("privModeElement");
    if(elements != null && elements.length != 0){
      elements[0].setAttribute("mode", extensionMode);
    }
    else{
      element = content.document.createElement("privModeElement");
      element.setAttribute("mode", extensionMode);
      content.document.documentElement.appendChild(element);
    }
  },
  /* updates the variable in preferences and alerts privly.js about the 
   * change. privly.js updates its 'active' variable
   * accordingly.
   */
  updateExtensionMode : function(extensionMode)
  {
    this.preferences.setIntPref("extensionMode",extensionMode);
    this.updatePrivModeElement();
  }
}

Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript("chrome://privly/content/jquery-1.7.1.min.js",window);
jQ = window.jQuery.noConflict();

window.addEventListener("load", function (e){
  var appcontent = document.getElementById("appcontent");
  if( appcontent) {
    appcontent.addEventListener("DOMContentLoaded", privlyExtension.loadLibraries, true);
    privlyExtension.updatePrivModeElement(); 
  }
}, false);

window.addEventListener("IframeResizeEvent", function(e) { privlyExtension.resizeIframe(e); }, false, true);
window.addEventListener("contextmenu", function(e) { privlyExtension.checkContextForPrivly(e);}, false);

/*
 * user could change the mode from the preferences menu in the add-on page. So, update toolbar
 * button and dispatch an event to alert privly.js about the mode change
 * whenever tab is switched
 */
gBrowser.addEventListener("select", function(event){
  privlyExtension.updatePrivModeElement();
}, false);

gBrowser.addEventListener("load", function(event){
  if ((event.originalTarget.nodeName == '#document') && 
    (event.originalTarget.defaultView.location.href == gBrowser.currentURI.spec)){
      privlyExtension.updatePrivModeElement();
    }
}, true);

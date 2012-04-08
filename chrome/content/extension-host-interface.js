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

  extensionModeEnum : {
    ACTIVE : 0,
    PASSIVE : 1,
    CLICKTHROUGH : 2,
    DISABLED:3
  },
  /*
  getExtensionVersion : function(){
    var extensionVersion = "";
      try{
        //for firefox versions >= 4
        Components.utils.import("resource://gre/modules/AddonManager.jsm");
        AddonManager.getAddonByID("privly@priv.ly", function(addon) {
          extensionVersion = addon['version'];
        });
      }
      catch(ex){
        //for firefox versions < 4
        var gExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
        extensionVersion = gExtensionManager.getItemForID("privly@priv.ly").version;
      }
      return extensionVersion;
  },
  */
  loadLibraries : function(evt)
  {
    var doc = evt.originalTarget;
    var wnd = doc.defaultView;
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
    preferences = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.privly.");
    //load the script running on the host page
    if(doc.URL){
      loader.loadSubScript("chrome://privly/content/privly.js", wnd);
    }
  },
  
  installToolbarButton : function(){
    var currentset = document.getElementById("nav-bar").currentSet;
    currentset = currentset+",privly-tlbr-btn";
    document.getElementById("nav-bar").setAttribute("currentset",currentset);
    document.getElementById("nav-bar").currentSet = currentset;
    document.persist("nav-bar","currentset");
    var menu = document.getElementById("privly-tlbr-menu");
    var tlbrbtn = document.getElementById("privly-tlbr-btn");
    if(menu && tlbrbtn)
      tlbrbtn.appendChild(menu);
  },
  
  checkToolbarButton : function()
  {
    /*
    version = privlyExtension.getExtensionVersion();
    alert(version);
    firstRun = "firstRun_v"+version;
    alert(firstRun);
    */
    firstRun = "firstRunDone";
    if(!this.preferences.prefHasUserValue(firstRun)){
      setTimeout("privlyExtension.installToolbarButton()",2000);
      this.preferences.setBoolPref(firstRun,false);
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
    else if(extensionMode == 1 || extensionMode == 2){
      extensionMode = 0;
    }
    this.updateExtensionMode(extensionMode);
  },
  
  updateToolbarButtonIcon : function()
  {
    privlyToolbarButton = document.getElementById('privly-tlbr-btn');
    extensionMode = this.preferences.getIntPref("extensionMode");
    if(privlyToolbarButton){
      if(extensionMode == 0){
        privlyToolbarButton.style.listStyleImage="url('chrome://privly/skin/logo_16.png')";
        privlyToolbarButton.tooltipText="Privly is in active mode";
      }
      else if(extensionMode == 1){
        privlyToolbarButton.style.listStyleImage="url('chrome://privly/skin/logo_16_dis.png')";
        privlyToolbarButton.tooltipText="Privly is in passive mode";
      }
      else if(extensionMode == 2){
        privlyToolbarButton.style.listStyleImage="url('chrome://privly/skin/logo_16_dis.png')";
        privlyToolbarButton.tooltipText="Privly is in require-clickthrough mode";
      }
      else if(extensionMode == 3){
        privlyToolbarButton.style.listStyleImage="url('chrome://privly/skin/logo_16_dis.png')";
        privlyToolbarButton.tooltipText="Privly is disabled.";
      }
    }
  },
  
  /* 
   * inserts a 'privModeElement' with an attribute - 'mode' for
   * a given document
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
   * updates/inserts the privmodeelement in all iframes
   * and host page
   */
  updatePrivModeElement : function()
  {
    this.updateToolbarButtonIcon();
    extensionMode = this.preferences.getIntPref("extensionMode");
    this.insertPrivModeElement(content.document,extensionMode);
    content.document.defaultView.onload = function(event){
      iframes = content.document.getElementsByTagName('iframe');
      if(iframes){
        for(i in iframes){
          iframe = iframes[i];
          if(iframe){
            if(iframe.contentDocument.readyState == 'complete'){
              privlyExtension.privlyReferencesRegex.lastIndex = 0;
                if(iframe.src && !privlyExtension.privlyReferencesRegex.test(iframe.src)){
                  privlyExtension.insertPrivModeElement(iframe.contentDocument,extensionMode);
                }
            }
            else{
              iframe.contentDocument.defaultView.onload = function(event){
                privlyExtension.privlyReferencesRegex.lastIndex = 0;
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
  /*
    appcontent.addEventListener("DOMContentLoaded", privlyExtension.loadLibraries, true);
    privlyExtension.updatePrivModeElement();
    setTimeout("privlyExtension.checkToolbarButton()",3000);
    */ 
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
}, true);

gBrowser.addEventListener("load", function(event){
    var doc = event.originalTarget;
    var wnd = doc.defaultView;
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
    //load the script running on the host page
    
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

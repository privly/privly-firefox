/**
 * @namespace
 * Handles interaction with the host page, including injecting the content
 * script, privly.js.
 */
var privlyExtension = {
  
  /**
   * Interface object to the extension preferences.
   */
  preferences: Components.classes["@mozilla.org/preferences-service;1"]
                         .getService(Components.interfaces.nsIPrefService)
                         .getBranch("extensions.privly."),

  /**
   * Enum to hold various extension modes and their value. 
   * Extension modes are set through firefox's extension api.
   * https://developer.mozilla.org/en/Code_snippets/Preferences
   */
  extensionModeEnum: {
    ACTIVE: 0,
    PASSIVE: 1,
    CLICKTHROUGH: 2
  },

  /**
   * Installs toolbar button in the navigation bar
   */
  installToolbarButton: function () {
    
    "use strict";
    
    var currentset = document.getElementById("nav-bar").currentSet;
    currentset = currentset + ",privly-tlbr-btn";
    document.getElementById("nav-bar").setAttribute("currentset", currentset);
    document.getElementById("nav-bar").currentSet = currentset;
    document.persist("nav-bar", "currentset");
    var tlbrbtn = document.getElementById("privly-tlbr-btn");
  },

  /**
   * Installs the toolbar button if it is not installed. 
   * This function is called only once immediately after the extension is
   * installed
   */
  checkToolbarButton: function () {
    
    "use strict";
    
    var firstRun = "firstRunDone";
    if (!this.preferences.prefHasUserValue(firstRun)) {
      setTimeout(
        function(){
          privlyExtension.installToolbarButton();
        },
        2000);
      this.preferences.setBoolPref(firstRun, true);
    }
  },

  /** 
   * Send data anonymously from the right-clicked form element to the content server, then
   * assign the form element to the returned URL.
   */
  postAnonymouslyToPrivly: function () {
    
    "use strict";
    
    var target = document.popupNode;
    var value = target.value;
    var contentServerUrl = this.preferences.getCharPref("contentServerUrl");
    if (value === "") {
      alert("Sorry. You can not post empty content to Privly");
    }
    else {
      jQ.ajax({
        data: { "post[content]": value,
          "post[public]": true,
          endpoint: "extension", browser: "firefox", version: "0.1.1.1"
        },
        type: "POST",
        url: contentServerUrl + "/posts/posts_anonymous.json",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        accepts: "json",
        success: function (data, textStatus, jqXHR) {
          target.value = jqXHR.getResponseHeader("privlyurl");
        }
      });
    }
  },

  /** 
   * Send data from the right-clicked form element to the content server, then
   * assign the form element to the returned URL.
   *
   * @param {string} privacySetting Indicates the privacy level of the post.
   * Accepted values are 'public', and anything else. If the extension is set
   * to "allPostsArePublic", then this parameter is ignored. 
   * If "allPostsArePublic" is not true, and privacySetting is anything other 
   * than public, the post is made as private.
   */
  postToPrivly: function (privacySetting) {
    
    "use strict";
    
    var target = document.popupNode;
    var value = target.value;
    var allPostsPublic = this.preferences.getBoolPref("allPostsPublic");
    var contentServerUrl = this.preferences.getCharPref("contentServerUrl");
    // the post can be either public or private (shared only with specific users)
    var postPrivacySetting = allPostsPublic || (privacySetting === 'public');
    if (value === "") {
      alert("Sorry. You can not post empty content to Privly");
    }
    else {
      jQ.ajax({
        data: { auth_token: privlyAuthentication.authToken,
          "post[content]": value,
          "post[public]": postPrivacySetting,
          endpoint: "extension", browser: "firefox", version: "0.1.1.1"
        },
        type: "POST",
        url: contentServerUrl + "/posts.json",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        accepts: "json",
        success: function (data, textStatus, jqXHR) {
          target.value = jqXHR.getResponseHeader("privlyurl");
        }
      });
    }
  },
  
  /**
   * Determines which menu options are shown in the right-click menu.
   *
   * @param {event} evt A right click event.
   *
   */
  checkContextForPrivly: function (evt) {
    
    "use strict";
    
    var loginToPrivlyMenuItem = document.getElementById('loginToPrivlyMenuItem');
    var logoutFromPrivlyMenuItem = document.getElementById('logoutFromPrivlyMenuItem');
    var publicPostToPrivlyMenuItem = document.getElementById('publicPostToPrivlyMenuItem');
    var privatePostToPrivlyMenuItem = document.getElementById('privatePostToPrivlyMenuItem');
    var anonymousPostToPrivlyMenuItem = document.getElementById('anonymousPostToPrivlyMenuItem');
    
    loginToPrivlyMenuItem.hidden = true;
    logoutFromPrivlyMenuItem.hidden = true;
    publicPostToPrivlyMenuItem.hidden = true;
    privatePostToPrivlyMenuItem.hidden = true;
    anonymousPostToPrivlyMenuItem.hidden = true;
    
    var disablePosts = this.preferences.getBoolPref("disablePosts");
    var loggedIn = privlyAuthentication.authToken !== "";
    var postable = !disablePosts && evt.target.nodeName !== null &&
        (evt.target.nodeName.toLowerCase() === 'input' ||
          evt.target.nodeName.toLowerCase() === 'textarea');
          
    if (postable) {
      anonymousPostToPrivlyMenuItem.hidden = false;
    }
    
    if (loggedIn && postable) {
      publicPostToPrivlyMenuItem.hidden = false;
      privatePostToPrivlyMenuItem.hidden = false;
    }
    
    if (loggedIn) {
      logoutFromPrivlyMenuItem.hidden = false;
    }
    
    if (!loggedIn) {
      loginToPrivlyMenuItem.hidden = false;
    }
  },

  /**
   * Toggle the extension mode between active and passive modes.
   */
  toggleExtensionMode: function () {
    
    "use strict";
    
    var extensionMode = this.preferences.getIntPref("extensionMode");
    //when the extension is in active mode and user clicks the toolbar 
    //button toggle to passive mode
    if (extensionMode === privlyExtension.extensionModeEnum.ACTIVE) {
      extensionMode = privlyExtension.extensionModeEnum.CLICKTHROUGH;
    }
    //when the extension is in either click through or passive mode and user
    //clicks the toolbar button toggle to active mode
    else if (extensionMode === privlyExtension.extensionModeEnum.PASSIVE ||
              extensionMode === privlyExtension.extensionModeEnum.CLICKTHROUGH) {
      extensionMode = privlyExtension.extensionModeEnum.ACTIVE;
    }
    this.updateExtensionMode(extensionMode);
  },

  /**
   * update the toolbar button's image and tooltip based on the current 
   * extension mode.
   */
  updateToolbarButtonIcon: function () {
    
    "use strict";
    
    var privlyToolbarButton = document.getElementById('privly-tlbr-btn');
    var extensionMode = this.preferences.getIntPref("extensionMode");
    if (privlyToolbarButton) {
      if (extensionMode === privlyExtension.extensionModeEnum.ACTIVE) {
        privlyToolbarButton.style.listStyleImage = "url('chrome://privly/skin/logo_16.png')";
        privlyToolbarButton.tooltipText = "Privly is in active mode";
      }
      else if (extensionMode === privlyExtension.extensionModeEnum.PASSIVE) {
        privlyToolbarButton.style.listStyleImage = "url('chrome://privly/skin/logo_16_dis.png')";
        privlyToolbarButton.tooltipText = "Privly is in passive mode";
      }
      else if (extensionMode === privlyExtension.extensionModeEnum.CLICKTHROUGH) {
        privlyToolbarButton.style.listStyleImage = "url('chrome://privly/skin/logo_16_dis.png')";
        privlyToolbarButton.tooltipText = "Privly is in require-clickthrough mode";
      }
    }
  },

  /** 
   * Inserts an html element - 'privModeElement' with the current mode 
   * of operation
   *
   * @param {document} doc The HTML document to insert the mode element.
   *
   */
  insertPrivModeElement: function (doc) {
    
    "use strict";
    
    var extensionMode = this.preferences.getIntPref("extensionMode");
    
    var elements = doc.getElementsByTagName("privModeElement");
    if (elements !== undefined && elements !== null && elements.length !== 0) {
      elements[0].setAttribute("mode", extensionMode);
      
      //Trigger a mutation event, which will make privly.js run
      var modeChange = doc.createElement("modeChange");
      elements[0].appendChild(modeChange);
    }
    else {
      var element = doc.createElement("privModeElement");
      element.setAttribute("mode", extensionMode);
      doc.documentElement.appendChild(element);
    }
  },
  
  /**
   * Inserts or updates the html element, 'privModeElement' with mode attribute
   * on the host page and all iframes
   */
  updatePrivModeElement: function () {
    
    "use strict";
    
    this.updateToolbarButtonIcon();

    this.insertPrivModeElement(content.document);
    //when the host page is done loading
    content.document.defaultView.onload = function (event) {
      //get all iframes on the hostpage.
      var iframes = content.document.getElementsByTagName('iframe');
      if (iframes) {
        //loop through each iframe in the host page
        for (frameIndex in iframes) {
          var iframe = iframes[frameIndex];
          if (iframe) {
            // if the iframe is done loading, insert the privModeElement into its DOM
            // else, insert the privModeElement into the iframe's DOM once it is loaded
            if (iframe.contentDocument.readyState === 'complete') {
              privlyExtension.insertPrivModeElement(iframe.contentDocument);
            } else {
              iframe.contentDocument.defaultView.onload = function (event) {
                privlyExtension.insertPrivModeElement(iframe.contentDocument);
              };
            }
          }
        }
      }
    };
  },
  
  /**
   * Change the mode of operation for the extension.
   * @param {int} extensionMode The integer identifier of the extension mode
   */
  updateExtensionMode: function (extensionMode) {
    
    "use strict";
    
    this.preferences.setIntPref("extensionMode", extensionMode);
    this.updatePrivModeElement();
  }
};

//Load jQuery for the overlay
Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
  .getService(Components.interfaces.mozIJSSubScriptLoader)
  .loadSubScript("chrome://privly/content/jquery-1.7.1.min.js", window);
jQ = window.jQuery.noConflict();

//change the displayed menus on right clicks
window.addEventListener("contextmenu",
  function (e) {
    "use strict";
    privlyExtension.checkContextForPrivly(e);
  },
  false);

/*
 * user could change the mode from the preferences menu in the add-on page. 
 * So, update toolbar button and dispatch an event to alert privly.js about 
 * the mode change whenever tab is switched
 */
gBrowser.addEventListener("select",
  function (event) {
    "use strict";
    privlyExtension.updatePrivModeElement();
  },
  true);

gBrowser.addEventListener("load",
  function (event) {
    
    "use strict";
    
    //load privly.js to all the doms on the host page including iframes
    var doc = event.originalTarget;
    var wnd = doc.defaultView;
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                      .getService(Components.interfaces.mozIJSSubScriptLoader);
    if (doc.nodeName === '#document') {
      privlyExtension.insertPrivModeElement(doc);
      loader.loadSubScript("chrome://privly/content/privly.js", wnd);
    }

    if ((doc.nodeName === '#document') &&
        (wnd.location.href === gBrowser.currentURI.spec)) {
      setTimeout(
        function(){
          privlyExtension.checkToolbarButton();
        },
        3000);
      privlyExtension.updatePrivModeElement();
    }
  },
  true);

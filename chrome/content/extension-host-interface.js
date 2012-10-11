/**
 * import the http observer module for listening to calls to privly servers
 */
Components.utils.import("resource://privly/observers.jsm");

/**
 * import privly constants
 */
Components.utils.import("resource://privly/constants.jsm");

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
   * Variable used during a posting transaction to save where the 
   * resulting URL will be pasted to.
   */
  currentTargetNode: undefined,
  
  /**
   * Variable used furing posting transaction to save which tab
   * contains the currentTargetNode.
   */
   tabReceivingPost: undefined,
  
  /** 
   * Begins posting dialog for a javascript application.
   * This function opens an iframe from the current content server
   * for the user to type their content into. It currently only works
   * with the zero_bin application, but other applications will be added.
   *
   * @see privlyExtension.handleUrlEvent
   *
   * @see privlyExtension.cancelPost
   */
  openPostingApplication: function () {
    
    "use strict";
    
    //Remember which tab the post is going to
    privlyExtension.tabReceivingPost = gBrowser.selectedTab;
    
    //Open the form from the selected content server
    var contentServerUrl = this.preferences.getCharPref("contentServerUrl");
    document.getElementById('encryption-iframe').setAttribute("src", contentServerUrl + "/zero_bin/");
    
    //display the form elements in the bottom of the browser chrome
    document.getElementById('encryption-splitter').hidden = false;
    document.getElementById('encryption-iframe-vbox').hidden = false;
    document.getElementById('encryption-cancel-button').hidden = false;
    
    //Save the destination for the encrypted URL
    privlyExtension.currentTargetNode = document.popupNode;
  },
  
  /**
   * Receive URL to encrypted post for posting to selected form element.
   * This function also closes the posting iframe and chnages its source
   * so it no longer contains the content.
   * 
   * @param {event} evt An event dispatched from the encryption application 
   * containing a string variable, "privlyUrl", bound to the url intended to
   * be pasted to the relevent form element.
   */
  handleUrlEvent: function(evt) {
    
    //Switch to the tab initiating the post
    gBrowser.selectedTab = privlyExtension.tabReceivingPost;
    
    // Focus the DOM Node, then fire keydown and keypress events
    privlyExtension.currentTargetNode.focus();
    var keydownEvent = document.createEvent("KeyboardEvent"); 
    keydownEvent.initKeyEvent('keydown', true, true, window, 0, 
                            false, 0, false, 0, 0); 
    privlyExtension.currentTargetNode.dispatchEvent(keydownEvent);
    var keypressEvent = document.createEvent("KeyboardEvent"); 
    keypressEvent.initKeyEvent('keypress', true, true, window, 0, 
                            false, 0, false, 0, 0); 
    privlyExtension.currentTargetNode.dispatchEvent(keypressEvent);
    
    // Some sites need time to execute form initialization 
    // callbacks following focus and keydown events.
    // One example includes Facebook.com's wall update
    // form and message page.
    setTimeout(function(){
      
      privlyExtension.currentTargetNode.value = evt.target.getAttribute("privlyUrl");
      privlyExtension.currentTargetNode.textContent = evt.target.getAttribute("privlyUrl");
      
      var event = document.createEvent("KeyboardEvent"); 
      event.initKeyEvent('keyup', true, true, window, 
                              0, false, 0, false, 0, 0); 
      privlyExtension.currentTargetNode.dispatchEvent(event);
      
      // Hide the posting window
      document.getElementById('encryption-splitter').hidden = true;
      document.getElementById('encryption-iframe-vbox').hidden = true;
      document.getElementById('encryption-cancel-button').hidden = true;
      document.getElementById('encryption-iframe').setAttribute("src", "");
      privlyExtension.currentTargetNode = undefined;
      privlyExtension.tabReceivingPost = undefined;
    },500);
  },
  
  /**
   * Cancel the post dialog after the form frame popped up. This
   * should only be called after postToPrivly is called.
   */
  cancelPost: function() {
    privlyExtension.tabReceivingPost = undefined;
    document.getElementById('encryption-splitter').hidden = true;
    document.getElementById('encryption-iframe-vbox').hidden = true;
    document.getElementById('encryption-cancel-button').hidden = true;
    document.getElementById('encryption-iframe').setAttribute("src", "");
    privlyExtension.currentTargetNode = undefined;
  },

  /** 
   * (Deprecated) Send data from the right-clicked form element to the content 
   * server, then assign the form element to the returned URL. This function 
   * will be retired once the Privly "Post" application is capable of 
   * accepting content via message passing.
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
    var authToken = this.preferences.getCharPref(privlyConstants.Strings.authToken);
    if (value === "") {
      alert("Sorry. You can not post empty content to Privly");
    }
    else{
      var data = {auth_token: authToken,
        "post":{ "content": value,
            "public": postPrivacySetting
      }};
      var xmlhttp = new XMLHttpRequest();
      var url = contentServerUrl + "/posts.json";
      xmlhttp.open("POST", url, true);
      xmlhttp.setRequestHeader("Content-type", "application/json; charset=UTF-8");
      xmlhttp.setRequestHeader('Accept', 'application/json');
      xmlhttp.onreadystatechange = function(){
        // process the server response
        if ( xmlhttp.readyState === 4 ) {
          if ( xmlhttp.status === 200 || xmlhttp.status === 201 ) {
            
            //Remember which tab the post is going to
            privlyExtension.tabReceivingPost = gBrowser.selectedTab;
            
            //Save the destination for the encrypted URL
            privlyExtension.currentTargetNode = target;
            
            //Switch to the tab initiating the post
            gBrowser.selectedTab = privlyExtension.tabReceivingPost;
            
            // Focus the DOM Node, then fire keydown and keypress events
            privlyExtension.currentTargetNode.focus();
            var keydownEvent = document.createEvent("KeyboardEvent"); 
            keydownEvent.initKeyEvent('keydown', true, true, window, 0, 
                                    false, 0, false, 0, 0); 
            privlyExtension.currentTargetNode.dispatchEvent(keydownEvent);
            var keypressEvent = document.createEvent("KeyboardEvent"); 
            keypressEvent.initKeyEvent('keypress', true, true, window, 0, 
                                    false, 0, false, 0, 0); 
            privlyExtension.currentTargetNode.dispatchEvent(keypressEvent);
            
            // Some sites need time to execute form initialization 
            // callbacks following focus and keydown events.
            // One example includes Facebook.com's wall update
            // form and message page.
            setTimeout(function(){

              privlyExtension.currentTargetNode.value = xmlhttp.getResponseHeader("X-Privly-Url");
              privlyExtension.currentTargetNode.textContent = xmlhttp.getResponseHeader("X-Privly-Url");
              
              var event = document.createEvent("KeyboardEvent"); 
              event.initKeyEvent('keyup', true, true, window, 
                                      0, false, 0, false, 0, 0); 
              privlyExtension.currentTargetNode.dispatchEvent(event);

              // Hide the posting window, if it is even displayed
              document.getElementById('encryption-splitter').hidden = true;
              document.getElementById('encryption-iframe-vbox').hidden = true;
              document.getElementById('encryption-cancel-button').hidden = true;
              document.getElementById('encryption-iframe').setAttribute("src", "");
              privlyExtension.currentTargetNode = undefined;
              privlyExtension.tabReceivingPost = undefined;
            },500);
          }
        }
      };    
      xmlhttp.send(JSON.stringify(data));
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
    var encryptedPostToPrivlyMenuItem = document.getElementById('encryptedPostToPrivlyMenuItem');
    
    loginToPrivlyMenuItem.hidden = true;
    logoutFromPrivlyMenuItem.hidden = true;
    publicPostToPrivlyMenuItem.hidden = true;
    encryptedPostToPrivlyMenuItem.hidden = true;
    
    var disablePosts = this.preferences.getBoolPref("disablePosts");
    var authToken = this.preferences.prefHasUserValue(privlyConstants.
          Strings.authToken) ? this.preferences.getCharPref(
          privlyConstants.Strings.authToken) : ""; 
    var loggedIn =  (authToken !== "");
        
    var postable = false;
    if (!disablePosts && evt.target.nodeName !== null) {
      if (evt.target.nodeName.toLowerCase() === 'input' ||
        evt.target.nodeName.toLowerCase() === 'textarea') {
          postable = true;
      }
      else if(evt.target.nodeName.toLowerCase() === 'div') {
        if (evt.target.getAttribute("contenteditable") === 'true') {
          postable = true;
        }
      }
    }
    
    if (loggedIn && postable) {
      logoutFromPrivlyMenuItem.hidden = false;
      encryptedPostToPrivlyMenuItem.hidden = false;
      publicPostToPrivlyMenuItem.hidden = false;
    } else {
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
    if (extensionMode === privlyConstants.extensionModeEnum.ACTIVE) {
      extensionMode = privlyConstants.extensionModeEnum.CLICKTHROUGH;
    }
    //when the extension is in either click through or passive mode and user
    //clicks the toolbar button toggle to active mode
    else if (extensionMode === privlyConstants.extensionModeEnum.PASSIVE ||
              extensionMode === privlyConstants.extensionModeEnum.CLICKTHROUGH) {
      extensionMode = privlyConstants.extensionModeEnum.ACTIVE;
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
      if (extensionMode === privlyConstants.extensionModeEnum.ACTIVE) {
        privlyToolbarButton.style.listStyleImage = "url('chrome://privly/skin/logo_16.png')";
        privlyToolbarButton.tooltipText = "Privly is in active mode";
      }
      else if (extensionMode === privlyConstants.extensionModeEnum.PASSIVE) {
        privlyToolbarButton.style.listStyleImage = "url('chrome://privly/skin/logo_16_dis.png')";
        privlyToolbarButton.tooltipText = "Privly is in passive mode";
      }
      else if (extensionMode === privlyConstants.extensionModeEnum.CLICKTHROUGH) {
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
     content.document.defaultView.addEventListener("load",
       function (e) {
         
         "use strict";
         
         //get all iframes on the hostpage.
         var iframes = content.document.getElementsByTagName('iframe');
         if (iframes) {
           //loop through each iframe in the host page
           for (var frameIndex in iframes) {
             var currentIframe = iframes[frameIndex];
             if (currentIframe && currentIframe.contentDocument) {
               // if the iframe is done loading, insert the privModeElement into its DOM
               // else, insert the privModeElement into the iframe's DOM once it is loaded
               if (currentIframe.contentDocument.readyState === 'complete') {
                 privlyExtension.insertPrivModeElement(currentIframe.contentDocument);
               } else {
                 //when the host page is done loading
                 currentIframe.contentDocument.defaultView.addEventListener("load",
                   function (e) {
                      privlyExtension.insertPrivModeElement(currentIframe.contentDocument);
                   },
                   false);
               }
             }
           }
         }
       },
       false);
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

/**
 * register observers for http requests and responses. Handles privly headers
 */
privlyObservers.httpRequestObserver.register();
//privlyObservers.httpResponseObserver.register();

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
    if (doc.nodeName === '#document' && doc.contentType !== "application/json") {
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

/**
 * Watch for encrypted URLs sent by the encryption iframe.
 */
window.addEventListener("load", function load(event){  
    document.getElementById('encryption-iframe')
      .addEventListener("PrivlyUrlEvent", 
        function(e) { privlyExtension.handleUrlEvent(e); }, false, true);   
  },false);

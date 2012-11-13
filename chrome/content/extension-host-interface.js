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

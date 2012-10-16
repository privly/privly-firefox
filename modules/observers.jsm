/**
 * @namespace
 * Module for modifying http requests
 */

/**
 * import Privly constants
 */
Components.utils.import("resource://privly/constants.jsm");

/**
 * see https://developer.mozilla.org/en/using_xmlhttprequest#Using_XMLHttpRequest_from_JavaScript_modules_.2F_XPCOM.C2.A0components
 * xmlhttprequest in javascript modules
 */ 
const { XMLHttpRequest } = Components.classes["@mozilla.org/appshell/appShellService;1"]
                                     .getService(Components.interfaces.nsIAppShellService)
                                     .hiddenDOMWindow;

var EXPORTED_SYMBOLS = ["privlyObservers"];

var privlyObservers =  {
    
  /**
   * @namespace
   * Sets headers on requests to Privly servers.
   */
  httpRequestObserver: {
    
    /**
     * Interface object to the extension preferences.
     */
    preferences: Components.classes["@mozilla.org/preferences-service;1"]
      .getService(Components.interfaces.nsIPrefService)
      .getBranch("extensions.privly."),
    
    /** 
     * Add headers to Privly requests containing the extension version
     *
     * @param {http subject} subject the interface for accessing the http
     * channel.
     *
     * @param {string} topic The name of the object being examined.
     * "http-on-modify-request" is expected, otherwise nothing is done.
     *
     * @param {data} data The response data. This variable is currently unused.
     *
     */
    observe: function(subject, topic, data) {
      
      "use strict";
      
      if (topic === "http-on-modify-request") {
        var httpChannel = subject.QueryInterface(Components
                                                .interfaces.nsIHttpChannel);
        
        // Set the extension version
        httpChannel.setRequestHeader("X-Privly-Version", "0.2.6", false);
      }
    },
    
    get observerService() {
      
      "use strict";
      
      return Components.classes["@mozilla.org/observer-service;1"]
                      .getService(Components.interfaces.nsIObserverService);
    },
    
    /**
     * Add the request observer to the overlay
     */
    register: function() {
      
      "use strict";
      
      this.observerService.addObserver(this, "http-on-modify-request", false);
    },
    
    /**
     * Remove this request observer from the overlay
     */
    unregister: function() {
      
      "use strict";
      
      this.observerService.removeObserver(this, "http-on-modify-request");
    }
  },
  
  /**
   * @namespace
   * The response observer checks whether localhost or priv.ly
   * set operation flags. These are usually set in instances
   * of high content server load. The extension will notify
   * the user of the issue, and switch into passive mode.
   *
   * The content server can set the extension to any one of the three modes.
   * it can do so by setting a header in the response header called 
   * 'privlyExtensionCommand'.
   * in responseObserver, we read this header value and set the extension mode
   * accordingly
   */
  httpResponseObserver: {
    
    /**
     * Interface object to the extension preferences.
     */
    preferences: Components.classes["@mozilla.org/preferences-service;1"]
                            .getService(Components.interfaces.nsIPrefService)
                            .getBranch("extensions.privly."),
    
    /** 
     * Deprecated, not registered.
     *
     * @param {http subject} subject the interface for accessing the http
     * channel.
     *
     * @param {string} topic The name of the object being examined.
     * "http-on-examine-response" is expected, otherwise nothing is done.
     *
     * @param {data} data The response data. This variable is currently unused.
     *
     */
    observe: function(subject, topic, data) {
      
      "use strict";
      
      if (topic === "http-on-examine-response") {
        var httpChannel = subject.QueryInterface(Components
                                                .interfaces.nsIHttpChannel);
        try {
          
          // add response observer code here
          
        }
        catch (err) {}
      }
    },
  
    get observerService() {
      
      "use strict";
      
      return Components.classes["@mozilla.org/observer-service;1"]
                       .getService(Components.interfaces.nsIObserverService);
    },
    
    /**
     * Add the response observer
     */
    register: function() {
      
      "use strict";
      
      this.observerService.addObserver(this, "http-on-examine-response", false);
    },
    
    /**
     * Remove the response observer
     */
    unregister: function() {
      
      "use strict";
      
      this.observerService.removeObserver(this, "http-on-examine-response");
    }
  }
};


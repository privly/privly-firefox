// We need to refactor this functionality into a JS module.
// Observers should be registered once per application,
// not once per window. Nils Maier Provided these resoucrces
// For example: https://gist.github.com/1630169
// https://developer.mozilla.org/en/JavaScript_modules
var privlyObservers =  {
    
  /**
   * enum to hold various extension modes and their value. extension modes 
   * are set through firefox's extension api.
   * https://developer.mozilla.org/en/Code_snippets/Preferences
   */ 
  extensionModeEnum: {
    ACTIVE: 0,
    PASSIVE: 1,
    CLICKTHROUGH: 2
  },
  
  /**
   * @namespace
   * Sets headers on requests to Privly servers.
   */
  httpRequestObserver: {
    
    "use strict";
    
    /**
     * Interface object to the extension preferences.
     */
    preferences: Components.classes["@mozilla.org/preferences-service;1"]
      .getService(Components.interfaces.nsIPrefService)
      .getBranch("extensions.privly."),
    
    /** 
     * Add headers to Privly requests containing the extension version
     * and the authentication token.
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
      
      if (topic == "http-on-modify-request") {
        var httpChannel = subject.QueryInterface(Components
                                                .interfaces.nsIHttpChannel);
        
        /* 
         * set the extension version and auth_token param on the request headers
         * the content server uses this authToken to identify a specific user.
         * TBD: 
         * 1. version number is hardcoded. write a function to retrieve the 
         * extension version number automatically
         * 2. use a regex to match the content server url to eliminate the 
         * if-else
         */
        extensionMode = this.preferences.getIntPref("extensionMode");
        if (/priv.ly/.test(httpChannel.originalURI.host)) {
          httpChannel.setRequestHeader("Privly-Version", "0.1.7", false);
          httpChannel.setRequestHeader("auth_token", 
                                        privlyAuthentication.authToken, false);
        }
        else if (/localhost/.test(httpChannel.originalURI.host)) {
          httpChannel.setRequestHeader("Privly-Version", "0.1.7", false);
          httpChannel.setRequestHeader("auth_token", 
                                        privlyAuthentication.authToken, false);
        }
      }
    },
  
    get observerService() {
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
     * Respond to mode changes from the server.
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
      
      if (topic == "http-on-examine-response") {
        var httpChannel = subject.QueryInterface(Components
                                                .interfaces.nsIHttpChannel);
        /*
         * read the extensionCommand header from the response.
         * if the response header is not set or the server
         * didn't reply, it will throw an error. so catch it
         */
        try {
          var extensionCommand = httpChannel.
                                 getResponseHeader("privlyExtensionCommand");
          
          if (/priv.ly/.test(httpChannel.originalURI.host) || 
             (/localhost/.test(httpChannel.originalURI.host) && 
                /posts/.test(httpChannel.originalURI.path))) { 
            /* 
             * the extensioncommand response header will be a json string. 
             * passive and requireClickthrough are mutually exclusive.
             * eg - extensionCommand = 
             * '{"disablePosts" : 200, "requireClickthrough":110}';
             * '{"disablePosts":110,"passive": 100}'
             */
            extensionCommand = '';
            var command = jQ.parseJSON(extensionCommand);
            /*
             * if requireClickthrough/passive field is present, change the extension 
             * mode to privlyObservers.extensionModeEnum.CLICKTHROUGH/PASSIVE 
             * accordingly. Set it back to active after the time interval  
             * specified in the json string.
             */
            if (command && command.requireClickthrough) {
              this.preferences.setIntPref("extensionMode",
                               privlyObservers.extensionModeEnum.CLICKTHROUGH);
              setTimeout(function() {
                  this.preferences.setIntPref("extensionMode",
                                     privlyObservers.extensionModeEnum.ACTIVE);
                },
                command.requireClickthrough);
            }
            else if (command && command.passive) {
              this.preferences.setIntPref("extensionMode",
                                    privlyObservers.extensionModeEnum.PASSIVE);
              setTimeout(function() {
                  this.preferences.setIntPref("extensionMode",
                                     privlyObservers.extensionModeEnum.ACTIVE);
                },
                command.passive);
            }
            // disable the ability to post content to the server, if the 
            // disablePosts field is present in the header.
            if (command && command.disablePosts) {
              this.preferences.setBoolPref('disablePosts', true);
              setTimeout(function() {
                  this.preferences.setBoolPref('disablePosts', false);
                },
                command.disablePosts);
            }
          }
        }
        catch (err) {}
      }
    },
  
    get observerService() {
      return Components.classes["@mozilla.org/observer-service;1"]
                       .getService(Components.interfaces.nsIObserverService);
    },
    
    /**
     * Add the response observer to the overlay
     */
    register: function() {
      
      "use strict";
      
      this.observerService.addObserver(this, "http-on-examine-response", false);
    },
    
    /**
     * Remove the response observer from the overlay
     */
    unregister: function() {
      
      "use strict";
      
      this.observerService.removeObserver(this, "http-on-examine-response");
    }
  }
};

privlyObservers.httpRequestObserver.register();
privlyObservers.httpResponseObserver.register();

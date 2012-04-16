// The request observer sets headers to authenticate the user, and 
// identify the extension to the server. The headers are only set on requests
// to priv.ly or the localhost. 
//
// The response observer checks whether localhost or priv.ly
// set operation flags. These are usually set in instances
// of high content server load. The extension will notify
// the user of the issue, and switch into passive mode. 


// We need to refactor this functionality into a JS module.
// Observers should be registered once per application,
// not once per window. Nils Maier Provided these resoucrces
// For example: https://gist.github.com/1630169
// https://developer.mozilla.org/en/JavaScript_modules
var privlyObservers = 
{
    
  /*
   * enum to hold various extension modes and their value. extension modes 
   * are set through firefox's extension api.
   * https://developer.mozilla.org/en/Code_snippets/Preferences
   */ 
  extensionModeEnum : {
    ACTIVE : 0,
    PASSIVE : 1,
    CLICKTHROUGH : 2
  },
  
  httpRequestObserver :
  {
    // get the prefrences data where extension mode is stored
    preferences : Components.classes["@mozilla.org/preferences-service;1"]
      .getService(Components.interfaces.nsIPrefService)
      .getBranch("extensions.privly."),

    observe: function(subject, topic, data)
    {
      if (topic == "http-on-modify-request") 
      {
        var httpChannel = subject.QueryInterface(Components.interfaces
                                                           .nsIHttpChannel);
        
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
        if (/priv.ly/.test(httpChannel.originalURI.host))
        {
          httpChannel.setRequestHeader("Privly-Version", "0.1.7", false);
          httpChannel.setRequestHeader("auth_token", 
                                        privlyAuthentication.authToken, false);
        }
        else if(/localhost/.test(httpChannel.originalURI.host))
        {
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
  
    register: function()
    {
      this.observerService.addObserver(this, "http-on-modify-request", false);
    },
  
    unregister: function()
    {
      this.observerService.removeObserver(this, "http-on-modify-request");
    }
  },
  /* 
   * the content server can set the extension to any one of the three modes.
   * it can do so by setting a header in the response header called 
   * 'privlyExtensionCommand'.
   * in responseObserver, we read this header value and set the extension mode
   * accordingly
   */
  httpResponseObserver :
  {
    preferences : Components.classes["@mozilla.org/preferences-service;1"]
                            .getService(Components.interfaces.nsIPrefService)
                            .getBranch("extensions.privly."),
                            
    observe: function(subject, topic, data)
    {
      if (topic == "http-on-examine-response") {
        var httpChannel = subject.QueryInterface(Components
                                                .interfaces.nsIHttpChannel);
        /*
         * read the extensionCommand header from the response.
         * if the response header is not set or the server
         * didn't reply, it will throw an error. so catch it
         */
        try{
          var extensionCommand = httpChannel.
                                  getResponseHeader("privlyExtensionCommand");
          
          if (/priv.ly/.test(httpChannel.originalURI.host) || 
              (/localhost/.test(httpChannel.originalURI.host) && 
              /posts/.test(httpChannel.originalURI.path)))
          { 
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
            if(command && command.requireClickthrough){
              this.preferences.setIntPref("extensionMode",
                                privlyObservers.extensionModeEnum.CLICKTHROUGH);
              setTimeout(function(){
                this.preferences.setIntPref("extensionMode",
                                    privlyObservers.extensionModeEnum.ACTIVE);},
                command.requireClickthrough);
            }
            else if(command && command.passive){
              this.preferences.setIntPref("extensionMode",
                privlyObservers.extensionModeEnum.PASSIVE);
              setTimeout(function(){
                this.preferences.setIntPref("extensionMode",
                  privlyObservers.extensionModeEnum.ACTIVE);},
                command.passive);
            }
            // disable the ability to post content to the server, if the 
            // disablePosts field is present in the header.
            if(command && command.disablePosts){
              this.preferences.setBoolPref('disablePosts',true);
              setTimeout(function(){this.preferences.
                                         setBoolPref('disablePosts',false);},
                command.disablePosts);
            }
          }
        }
        catch(err){}
      }
    },
  
    get observerService() {
      return Components.classes["@mozilla.org/observer-service;1"]
                      .getService(Components.interfaces.nsIObserverService);
    },
  
    register: function()
    {
      this.observerService.addObserver(this, "http-on-examine-response", false);
    },
  
    unregister: function()
    {
      this.observerService.removeObserver(this, "http-on-examine-response");
    }
  }
}

privlyObservers.httpRequestObserver.register();
privlyObservers.httpResponseObserver.register();

// The request observer sets headers to authenticate the user, and 
// identify the extension. The headers are only set on requests
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
    
  httpRequestObserver :
  {
  	preferences : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.privly."),

    observe: function(subject, topic, data)
    {
      if (topic == "http-on-modify-request") 
      {
        var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
        
        //cancel iframe requests to priv.ly when extensionMode is set to 2.
        //cancel all requests to priv.ly when extensionMode is set to 3
        extensionMode = this.preferences.getIntPref("extensionMode");
        if (extensionMode == 3)
        {
          if ((/priv.ly/.test(httpChannel.originalURI.host) || (/localhost/.test(httpChannel.originalURI.host))))
          {
            if(extensionMode == 3 || (/.iframe/g).test(httpChannel.originalURI.path))
            {
              subject.cancel(Components.results.NS_BINDING_ABORTED);
            }
          }
        }
        if (/priv.ly/.test(httpChannel.originalURI.host))
        {
          httpChannel.setRequestHeader("Privly-Version", "0.1.2", false);
          httpChannel.setRequestHeader("auth_token", privlyAuthentication.authToken, false);
        }
        else if(/localhost/.test(httpChannel.originalURI.host))
        {
          httpChannel.setRequestHeader("Privly-Version", "0.1.2", false);
          httpChannel.setRequestHeader("auth_token", privlyAuthentication.authToken, false);
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
  
  httpResponseObserver :
  {
  	preferences : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.privly."),
  
    observe: function(subject, topic, data)
    {
      if (topic == "http-on-examine-response") {
        var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
        //read the extensionCommand header from the response. if the response header is not set or the server 
        //didn't reply, it will throw an error. so catch it
        try{
          var extensionCommand = httpChannel.getResponseHeader("privlyExtensionCommand");
          
          if (/priv.ly/.test(httpChannel.originalURI.host) || (/localhost/.test(httpChannel.originalURI.host) && /posts/.test(httpChannel.originalURI.path)))
          { 
            /* the extensioncommand response header will be a json string. So far 3 params are identified.
             * disableIframes and requireClickthrough are mutually exclusive. Only one should appear in the header string.
             * eg - extensionCommand = '{"noRequests": 100,"disablePosts" : 200, requireClickthrough:110}';
             */
            extensionCommand = '';
            var command = jQ.parseJSON(extensionCommand);
            if(command && command.noRequests){
              //disable the extension. in the setTimeout function, enable the extension back.
              this.preferences.setIntPref("extensionMode",3);
              setTimeout(function(){this.preferences.setIntPref("extensionMode",0);},
                command.noRequests);
            }
            if(command && command.disablePosts){
              this.preferences.setBoolPref('disablePosts',true);
              setTimeout(function(){this.preferences.setBoolPref('disablePosts',false);},
                command.disablePosts);
            } 
            if(command && command.requireClickthrough){              
              /* set the extension mode to require-through. in the setTimeout function, set the
               * mode back to active.
               */
              this.preferences.setIntPref("extensionMode",2);
              setTimeout(function(){this.preferences.setIntPref("extensionMode",0);},
                command.requireClickthrough);
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

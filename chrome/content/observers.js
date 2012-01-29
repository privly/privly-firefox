// The request observer sets headers to authenticate the user, and 
// identify the extension. The headers are only set on requests
// to priv.ly or the localhost. 
//
// The response observer checks whether localhost or priv.ly
// set operation flags. These are usually set in instances
// of high content server load. The extension will notify
// the user of the issue, and switch into passive mode. 


// We need to refactor this functionality, see below.
// From: https://developer.mozilla.org/en/Setting_HTTP_request_headers
// You need to register a single http-on-modify-request observer per
// application (and not one per window). This means that you should
// put the observer's implementation in an XPCOM component instead
// of an overlay. If you want to support Gecko2 (Firefox4) you need
// to register your javascript component as described here:
// https://developer.mozilla.org/en/XPCOM/XPCOM_changes_in_Gecko_2.0#JavaScript_components.
var privlyObservers = 
{
  httpRequestObserver :
  {    
    observe: function(subject, topic, data)
    {
      if (topic == "http-on-modify-request") 
      {
        var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
        //cancel iframe requests to priv.ly when requireClickthrough is set.
        //cancel all requests to priv.ly when noRequests is set
        if (privlySettings.noRequests == true || privlySettings.requireClickthrough == true)
        {
          if ((/priv.ly/.test(httpChannel.originalURI.host) || (/localhost/.test(httpChannel.originalURI.host))))
          {
            if(privlySettings.noRequests == true || (/.iframe/g).test(httpChannel.originalURI.path))
            {
              subject.cancel(Components.results.NS_BINDING_ABORTED);
              convertIframesToLinks();
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
            //the extensioncommand response header will be a json string. So far 3 params are identified.
            //disableIframes and requireClickthrough are mutually exclusive. Only one should appear in the header string.
            //eg - extensionCommand = '{"noRequests": 100,"disablePosts" : 200, requireClickthrough:110}';
            extensionCommand = '';
            var command = jQ.parseJSON(extensionCommand);
            if(command && command.noRequests){
              privlySettings.noRequests = true;
              setTimeout(function(){privlySettings.noRequests=false;},
                command.noRequests);
            }
            if(command && command.disablePosts){
              privlySettings.disablePosts = true;
              setTimeout(function(){privlySettings.disablePosts=false;},
                command.disablePosts);
            } 
            if(command && command.requireClickthrough){
              privlySettings.requireClickthrough = true;
              setTimeout(function(){privlySettings.requireClickthrough=false;},
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
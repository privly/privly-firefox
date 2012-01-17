// This is a temporary fix. We need to implement this in an XPCOM
//
// From: https://developer.mozilla.org/en/Setting_HTTP_request_headers
// You need to register a single http-on-modify-request observer per 
// application (and not one per window). This means that you should 
// put the observer's implementation in an XPCOM component instead 
// of an overlay. If you want to support Gecko2 (Firefox4) you need 
// to register your javascript component as described here: 
// https://developer.mozilla.org/en/XPCOM/XPCOM_changes_in_Gecko_2.0#JavaScript_components.

var httpRequestObserver =
{
  observe: function(subject, topic, data)
  {
    if (topic == "http-on-modify-request") {
      
      var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
      if (/priv.ly/.test(httpChannel.originalURI.host))
      {
        httpChannel.setRequestHeader("Privly-Version", "0.1.1.1", false);
      }
      else if(/localhost/.test(httpChannel.originalURI.host))
      {
        httpChannel.setRequestHeader("Privly-Version", "0.1.1.1", false);
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
};

httpRequestObserver.register();

/**
 * @fileOverview This file manages authentication with the Privly server.
 * This file needs to be reformatted into a module, and it needs support for
 * multiple content server auth tokens.
 * @author Balaji Athreya, Sean McGregor
 **/

/**
 * import privly constants
 */
Components.utils.import("resource://privly/constants.jsm");


/**
 * @namespace
 * Handles authentication with the remote server.
 * 
 */  
var privlyAuthentication = {

  /**
   * Interface object to the extension preferences.
   */
  preferences: Components.classes["@mozilla.org/preferences-service;1"]
                            .getService(Components.interfaces.nsIPrefService)
                            .getBranch("extensions.privly."),
  
  /**
   * Prompt the user for their email and password, and attempt to log them
   * into a content server. If successful, this function assigns the 
   * auth_token. If it fails, an error message is displayed.
   */
  loginToPrivly: function() {
    
    "use strict";
    
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                          .getService(Components.interfaces.nsIPromptService);
    var email = { value: "" };
    var password = { value: "" };
    var result = prompts.promptUsernameAndPassword(null,
                          "Privly Authentication",
                          "Enter your Privly email and password:",
                          email, password, "", {});
    var userEmailAddress = email.value;
    var userPassword = password.value;
    
    var data = { email: userEmailAddress, password: userPassword };
    var xmlhttp = XMLHttpRequest();
    var url = privlyAuthentication.preferences
                .getCharPref("contentServerUrl")+"/token_authentications.json";
    xmlhttp.open("POST", url, false);
    xmlhttp.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xmlhttp.setRequestHeader('Accept', 'application/json');
    xmlhttp.onreadystatechange = function(){
      // process the server response
      if(xmlhttp.readyState === 4 ){
        if(xmlhttp.status === 200){
          var responseText = xmlhttp.responseText;  
          var response = JSON.parse(responseText);
          if(response && response.auth_key){
            var authToken = response.auth_key;
            if (authToken) {
              privlyAuthentication.preferences.setCharPref(privlyConstants.Strings.authToken,authToken);
              alert("You are now logged into Privly");
            }
            else {
              privlyAuthentication.preferences.setCharPref(privlyConstants.Strings.authToken,"");
              alert("Incorrect email or password for Priv.ly login");
            }
          return;
          }   
        }
      }
      privlyAuthentication.preferences.setCharPref(privlyConstants.Strings.authToken,"");
      alert("We could not contact the Priv.ly servers. If the problem persists, please file a bug report.");
    };
    xmlhttp.send(JSON.stringify(data));
  },
  
  /**
   * Destroys the auth_token locally and on the remote server.
   */
  logoutFromPrivly: function() {
    "use strict";
    var data = { _method: "delete",
      auth_token: privlyAuthentication.preferences.getCharPref(privlyConstants.Strings.authToken)
    };
    var xmlhttp = XMLHttpRequest();
    var url = privlyAuthentication.preferences
                .getCharPref("contentServerUrl")+"/token_authentications.json";
    xmlhttp.open("POST", url, false);
    xmlhttp.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xmlhttp.setRequestHeader('Accept', 'application/json');
    xmlhttp.onreadystatechange = function(){
      // process the server response
      if(xmlhttp.readyState === 4 ){
        if(xmlhttp.status === 200){
          privlyAuthentication.preferences.setCharPref(privlyConstants.Strings.authToken,"");
          alert("You are logged out from Priv.ly");
          return;
        }
      }
    };
    xmlhttp.send(JSON.stringify(data));	
  }
};

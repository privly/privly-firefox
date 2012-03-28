// Manages sessions for the content server

var privlyAuthentication = 
{
  //When added to every request to the content server
  //as the parameter auth_token, the extension has access
  //to the referenced user account
  authToken: "",
  
  //get a new auth token
  loginToPrivly : function()
  {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                          .getService(Components.interfaces.nsIPromptService);
    var email = {value: ""};
    var password = {value: ""};
    var result = prompts.promptUsernameAndPassword(null, "Privly Authentication", "Enter your Privly email and password:",
                                                email, password, "", {});
    var userEmailAddress = email.value;
    var userPassword = password.value;
                                                
    jQ.ajax(
      {
        data: { email: userEmailAddress, password: userPassword,
          endpoint:"extension", browser:"firefox", version:"0.1.1.1"
        },
        type: "POST",
        url: privlyExtension.preferences.getCharPref("contentServerUrl")+"/token_authentications.json",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        accepts: "json",
        success: function(data, textStatus, jqXHR){
          privlyAuthentication.authToken = data.auth_key;
          if(privlyAuthentication.authToken)
          {
            alert("You are now logged into Privly");
          }
          else
          {
            alert("Incorrect email or password for Priv.ly login");
          }
        },
        error: function(data, textStatus, jqXHR){
            alert("We could not contact the Priv.ly servers. If the problem persists, please file a bug report.");
        }
      }
    );
  },
  
  //destroy the auth token
  logoutFromPrivly : function()
  {
    jQ.ajax(
      {
        data: { _method: "delete", endpoint:"extension", browser:"firefox", 
          version:"0.1.1.1", auth_token: privlyAuthentication.authToken
        },
        type: "POST",
        url: privlyExtension.preferences.getCharPref("contentServerUrl")+"/token_authentications.json",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        accepts: "json",
        success: function(data, textStatus, jqXHR){
          privlyAuthentication.authToken = "";
          alert("You are logged out from Priv.ly");
        },
        error: function(data, textStatus, jqXHR){
          alert(data.error);
        }
      }
    );
  }
}

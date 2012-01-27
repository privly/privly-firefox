privly_user_auth_token = "";

var privlyAuthentication = 
{
  loginToPrivly : function()
  {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                          .getService(Components.interfaces.nsIPromptService);
    var email = {value: ""};
    var password = {value: ""};
    var result = prompts.promptUsernameAndPassword(null, "Privly Authentication", "Enter your Privly email and password:",
                                                email, password, "", {});
    userEmailAddress = email.value;
    userPassword = password.value;
                                                
    jQ.ajax(
      {
        data: { email: userEmailAddress, password: userPassword,
          endpoint:"extension", browser:"firefox", version:"0.1.1.1"
        },
        type: "POST",
        url: privly_server_url+"/token_authentications.json",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        success: function(data, textStatus, jqXHR){
          privly_user_auth_token = data.auth_key;
          if(privly_user_auth_token)
          {
            alert("You are now logged into Privly");
          }
          else
          {
            alert("Incorrect email or password for Priv.ly login");
          }
        }
      }
    );
  },
  
  logoutFromPrivly : function()
  {
    jQ.ajax(
      {
        data: { _method: "delete", endpoint:"extension", browser:"firefox", 
          version:"0.1.1.1", auth_token: privly_user_auth_token
        },
        type: "POST",
        url: privly_server_url+"/token_authentications.json",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        success: function(data, textStatus, jqXHR){
          privly_user_auth_token = "";
          alert("You are logged out from Priv.ly");
        },
        error: function(data, textStatus, jqXHR){
          alert(data.error);
        }
      }
    );
  }
}

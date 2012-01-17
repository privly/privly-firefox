var user_auth_token = "";

function onPgeLd(event){
	var appcontent = document.getElementById("appcontent");
	if( appcontent ) {
		appcontent.addEventListener("DOMContentLoaded", loadLibraries, true);
	}
}

function loadLibraries(evt) {
	var doc = evt.originalTarget;
	var wnd = doc.defaultView;
	var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
	 
	// load jQuery and save it as a property of the window
	loader.loadSubScript("chrome://privly/content/jquery-1.7.js",wnd);
	loader.loadSubScript("chrome://privly/content/privly.js", wnd);
}

function runPrivly(){
	var pwbutton = content.document.getElementById('pwbtn');
	if(pwbutton)
		pwbutton.click();
}

function postToPrivly(){
	var target = document.popupNode;
	var value = target.value;
	if(value == "")
		alert("Sorry. You can not post empty content to Privly");		
	else{
	jQ.ajax(
		{
			data: { auth_token: user_auth_token, "post[content]":value, endpoint:"extension",
			  browser:"firefox",version:"0.1.1.1"
			},
        	type: "POST",
        	//url: "https://priv.ly/posts",
        	url: "http://localhost:3000/posts",
        	contentType: "application/x-www-form-urlencoded; charset=UTF-8", 
        	success: function(data, textStatus, jqXHR){
        		target.value=jqXHR.getResponseHeader("privlyurl");
			}
		}
		);
	}
}

function loginToPrivly(){
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
      //url: "https://priv.ly/token_authentications.json",
      url: "http://localhost:3000/token_authentications.json",
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
      success: function(data, textStatus, jqXHR){
        user_auth_token = data.auth_key;
        if(user_auth_token)
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
}

function logoutFromPrivly(){
  jQ.ajax(
    {
      data: { _method: "delete", endpoint:"extension", browser:"firefox", 
        version:"0.1.1.1"
      },
      type: "POST",
      //url: "https://priv.ly/token_authentications.json",
      url: "http://localhost:3000/token_authentications.json",
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
      success: function(data, textStatus, jqXHR){
        user_auth_token = "";
        alert("You are logged out from Priv.ly");
      }
    }
  );
}

function resizeIframe(evt){	
	var iframeHeight = evt.target.getAttribute("height");
	var frame_id = evt.target.getAttribute("frame_id");
	var ifr = content.document.getElementById('ifrm'+frame_id);
	ifr.style.height = iframeHeight+'px';
}

function checkContextForPrivly(evt){
  
  var loginToPrivlyMenuItem = document.getElementById('loginToPrivlyMenuItem'); 
  var logoutFromPrivlyMenuItem = document.getElementById('logoutFromPrivlyMenuItem');   
  var postToPrivlyMenuItem = document.getElementById('postToPrivlyMenuItem');

  if(user_auth_token)
  {
    loginToPrivlyMenuItem.hidden = true;
    logoutFromPrivlyMenuItem.hidden = false;
    if(evt.target.nodeName != null && (evt.target.nodeName.toLowerCase() == 'input' || evt.target.nodeName.toLowerCase() == 'textarea')){
      postToPrivlyMenuItem.hidden = false;
    }
    else {
      postToPrivlyMenuItem.hidden = true;
    }
  }
  else
  {
    loginToPrivlyMenuItem.hidden = false;
    logoutFromPrivlyMenuItem.hidden = true;
    postToPrivlyMenuItem.hidden = true;
  }
}

Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript("chrome://privly/content/jquery-1.7.js",window);
window.jQ.noConflict();

window.addEventListener("load", onPgeLd, false);
window.addEventListener("IframeResizeEvent", function(e) { resizeIframe(e); }, false, true);
window.addEventListener("contextmenu", function(e) { checkContextForPrivly(e);}, false);



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
	var tBrowser = document.getElementById("content");
	var target = document.popupNode;
	var value = target.value;
	if(value == "")
		alert("Sorry. You can not post empty content to Privly");		
	else{
	token=prompt("enter token(copy it from the page source)","");
	jQ.ajax(
		{
			data: { auth_token: token
			, "post[content]":value, endpoint:"extension",browser:"firefox",version:"0.1.1.1"			
			},
        	type: "POST",
        	url: "http://localhost:3000/posts",
        	contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        	success: function(data, textStatus, jqXHR){
        		target.value=jqXHR.getResponseHeader("privlyurl");
			}
		}
		);
	}
	
}

function resizeIframe(evt){	
	var iframeHeight = evt.target.getAttribute("height");
	var frame_id = evt.target.getAttribute("frame_id");
	var ifr = content.document.getElementById('ifrm'+frame_id);
	ifr.style.height = iframeHeight+'px';
}

function checkContextForPrivly(evt){
	var menu = document.getElementById('postToPrivlyMenuItem');
    if(evt.target.nodeName != null && (evt.target.nodeName.toLowerCase() == 'input' || evt.target.nodeName.toLowerCase() == 'textarea')){ 
        menu.hidden = false;
    }
    else {
        menu.hidden = true;
    }	
}

Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript("chrome://privly/content/jquery-1.7.js",window);
window.jQ.noConflict();

window.addEventListener("load", onPgeLd, false);
window.addEventListener("IframeResizeEvent", function(e) { resizeIframe(e); }, false, true);
window.addEventListener("contextmenu", function(e) { checkContextForPrivly(e);}, false);

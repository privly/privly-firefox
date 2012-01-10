//get user preference information
//var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

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
	//loader.loadSubScript("chrome://privly/content/gm_jq_xhr.js", wnd);
	loader.loadSubScript("chrome://privly/content/privly.js", wnd);
}

function runPrivly(){
	var pwbutton = content.document.getElementById('pwbtn');
	if(pwbutton)
		pwbutton.click();
}

function resizeIframe(evt){	
	var iframeHeight = evt.target.getAttribute("height");
	var frame_id = evt.target.getAttribute("frame_id");
	var ifr = content.document.getElementById('ifrm'+frame_id);
	ifr.style.height = iframeHeight+'px';
}

window.addEventListener("load", onPgeLd, false);
window.addEventListener("IframeResizeEvent", function(e) { resizeIframe(e); }, false, true);

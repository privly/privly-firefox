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
	loader.loadSubScript("chrome://privateWeb/content/jquery-1.7.js",wnd);
	//loader.loadSubScript("chrome://privateWeb/content/gm_jq_xhr.js", wnd);
	loader.loadSubScript("chrome://privateWeb/content/privateWeb.js", wnd);
	autoRunPrivateWeb();
}

function runPrivateWeb(){
	var pwbutton = content.document.getElementById('pwbtn');
	if(pwbutton)
		pwbutton.click();
	else
		console.log('no pw button');
}

window.addEventListener("load", onPgeLd, false);



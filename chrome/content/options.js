var privlyPrefPane =
{
  preferences : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.privly."),

  onPaneLoad : function(event)
  {
    //get the extensionmode from preferences if it was modified using the toolbar button
    extensionMode = this.preferences.getIntPref("extensionMode");
    //update the radio buttons to reflect the changes.
    if(extensionMode == 0){
      document.getElementById('active').selected = true;
    }
    else if(extensionMode == 1){
      document.getElementById('passive').selected = true;
    }
    else if(extensionMode == 2){
      document.getElementById('require-clickthrough').selected = true;
    }
    else if(extensionMode == 3){
      document.getElementById('disable').selected = true;
    }
     //get the disable post option from preferences and update the checkbox 
    document.getElementById('disable-post').checked = this.preferences.getBoolPref("disablePosts");
  },
  updateMode : function()
  {
    if(document.getElementById('active').selected == true){
      mode = 0;
    }
    else if(document.getElementById('passive').selected == true){
      mode = 1;
    }
    else if(document.getElementById('require-clickthrough').selected == true){
      mode = 2;
    }
    else if(document.getElementById('disable').selected == true){
      mode = 3;
    }
    this.preferences.setIntPref("extensionMode",mode);
  }
	
}

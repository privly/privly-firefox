var privlyPrefPane =
{
  preferences : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.privly."),
  
  extensionModeEnum : {
    ACTIVE : 0,
    PASSIVE : 1,
    CLICKTHROUGH : 2
  },
  
  onPaneLoad : function(event)
  {
    //get the extensionmode from preferences if it was modified using the toolbar button
    extensionMode = this.preferences.getIntPref("extensionMode");
    //update the radio buttons to reflect the changes.
    if(extensionMode == privlyPrefPane.extensionModeEnum.ACTIVE){
      document.getElementById('active').selected = true;
    }
    else if(extensionMode == privlyPrefPane.extensionModeEnum.PASSIVE){
      document.getElementById('passive').selected = true;
    }
    else if(extensionMode == privlyPrefPane.extensionModeEnum.CLICKTHROUGH){
      document.getElementById('require-clickthrough').selected = true;
    }
     //get the disable post option from preferences and update the checkbox 
    document.getElementById('disable-post').checked = this.preferences.getBoolPref("disablePosts");
  },
  updateMode : function()
  {
    if(document.getElementById('active').selected == true){
      mode = privlyPrefPane.extensionModeEnum.ACTIVE;
    }
    else if(document.getElementById('passive').selected == true){
      mode = privlyPrefPane.extensionModeEnum.PASSIVE;
    }
    else if(document.getElementById('require-clickthrough').selected == true){
      mode = privlyPrefPane.extensionModeEnum.CLICKTHROUGH;
    }
    this.preferences.setIntPref("extensionMode",mode);
  },
  updatePostMode : function()
	{
	  if(document.getElementById('disable-post').checked == true){
	    this.preferences.setBoolPref('disablePosts',true);
	  }
	}
}

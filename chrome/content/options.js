/**
 * @namespace
 * Handles changes to the extension's preferences.
 */
var privlyPrefPane =
{
  
  /**
   * Interface object to the extension preferences.
   */
  preferences: Components.classes["@mozilla.org/preferences-service;1"]
                         .getService(Components.interfaces.nsIPrefService)
                         .getBranch("extensions.privly."),

  /**
   * enum to hold various extension modes and their value. extension modes 
   * are set through firefox's extension api.
   * https://developer.mozilla.org/en/Code_snippets/Preferences
   */
  extensionModeEnum: {
    ACTIVE: 0,
    PASSIVE: 1,
    CLICKTHROUGH: 2
  },
  
  /**
   * Handler for the loading of the extension preference pane.
   * @param {event} event The load event. Not currently used.
   */
  onPaneLoad: function (event) {
    
    "use strict";
    
    //get the extensionmode from preferences if it was modified using the toolbar button
    extensionMode = this.preferences.getIntPref("extensionMode");
    //update the radio buttons to reflect the changes.
    if (extensionMode === privlyPrefPane.extensionModeEnum.ACTIVE) {
      document.getElementById('active').selected = true;
    }
    else if (extensionMode === privlyPrefPane.extensionModeEnum.PASSIVE) {
      document.getElementById('passive').selected = true;
    }
    else if (extensionMode === privlyPrefPane.extensionModeEnum.CLICKTHROUGH) {
      document.getElementById('require-clickthrough').selected = true;
    }
     //get the disable post option from preferences and update the checkbox 
    document.getElementById('disable-post').checked = this.preferences.
                                                   getBoolPref("disablePosts");
  },
  
  /**
   * Handler for changing the extension mode from the preference pane.
   * This function checks the state of the preference pane, and assigns
   * the mode accordingly.
   */
  updateMode: function () {
    
    "use strict";
    
    var mode = 0;
    if (document.getElementById('active').selected === true) {
      mode = privlyPrefPane.extensionModeEnum.ACTIVE;
    }
    else if (document.getElementById('passive').selected === true) {
      mode = privlyPrefPane.extensionModeEnum.PASSIVE;
    }
    else if (document.getElementById('require-clickthrough').selected === true) {
      mode = privlyPrefPane.extensionModeEnum.CLICKTHROUGH;
    }
    this.preferences.setIntPref("extensionMode", mode);
  },
  
  /**
   * Handler for changing the post mode, which determines whether the
   * the extension can post content to remote servers.
   * This function checks the state of the preference pane, and assigns
   * the post mode accordingly.
   */
  updatePostMode: function () {
    
    "use strict";
    
    if (document.getElementById('disable-post').checked === true) {
      this.preferences.setBoolPref('disablePosts', true);
    }
  },
  
  /**
   * Handler for assigning the remote server accepting content posted
   * by the extension.
   * This function checks the state of the preference pane, and assigns
   * the remote server accordingly.
   */
  updateContentServerURL: function () {
    
    "use strict";
    
    var contentServerURL = "";
    if (document.getElementById('contentServerPrivly').selected === true) {
      contentServerURL = "https://priv.ly";
    }
    else if (document.getElementById('contentServerDev').selected === true) {
      contentServerURL = "https://dev.privly.org";
    }
    else if (document.getElementById('contentServerLocalhost').selected === true) {
      contentServerURL = "http://localhost:3000";
    }
    this.preferences.setStringPref("contentServerUrl", contentServerURL);
  }
};

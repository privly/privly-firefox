/**
 * import the module containing definition of all privly constants
 */
Components.utils.import("resource://privly/constants.jsm");

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
   * Handler for the loading of the extension preference pane.
   * @param {event} event The load event. Not currently used.
   */
  onPaneLoad: function (event) {
    
    "use strict";
    
    //get the extensionmode from preferences if it was modified using the 
    //toolbar button
    var extensionMode = this.preferences.getIntPref("extensionMode");
      
    //update the radio buttons to reflect the changes.
    if (extensionMode === privlyConstants.extensionModeEnum.PASIVE) {
      this.preferences.setIntPref("extensionMode", 
        privlyConstants.extensionModeEnum.CLICKTHROUGH);
    }
    
    // Get the current content server preference
    var contentServerURL = this.preferences.getCharPref("contentServerUrl");
    document.getElementById('contentServerCustom').value = contentServerURL;
    document.getElementById('contentServerCustomURL').value = contentServerURL;
    
    // Set the radio to the custom item if it is currently assigned properly
    if( contentServerURL !== 
        document.getElementById('privlyContentServer').selectedItem.value ) {
      document.getElementById('contentServerPrivly').setAttribute("selected", "false");
      document.getElementById('contentServerCustom').setAttribute("selected", "true");
    }
    
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
      mode = privlyConstants.extensionModeEnum.ACTIVE;
    } else if (document.getElementById('require-clickthrough').selected === true) {
      mode = privlyConstants.extensionModeEnum.CLICKTHROUGH;
    }
    this.preferences.setIntPref("extensionMode", mode);
  },
  
  /**
   * Handler for assigning the remote server accepting content posted
   * by the extension.
   * This function checks the state of the preference pane, and assigns
   * the remote server accordingly.
   */
  updateContentServerURL: function () {
    
    "use strict";
    
    // set custom content server value to current value of text area
    var contentServerURL = document.getElementById('contentServerCustomURL').value;
    document.getElementById('contentServerCustom').value = contentServerURL;
    
    // set preference to the value of the currently selected radio item
    contentServerURL = document.getElementById('privlyContentServer').selectedItem.value;
    this.preferences.setCharPref("contentServerUrl", contentServerURL);
    
    // set the textbox to the current value to avoid confusion
    document.getElementById('contentServerCustom').value = contentServerURL;
    document.getElementById('contentServerCustomURL').value = contentServerURL;
    
  }
};


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
      document.getElementById('contentServerPrivly').setAttribute("selected",
        "false");
      document.getElementById('contentServerCustom').setAttribute("selected",
        "true");
    }

    document.getElementById("userWhitelist").value = 
      this.preferences.getCharPref("userWhitelist");
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
  },
  
  
  /**
   * Update the user-defined whitelist of trusted servers.
   */
  saveWhitelist: function(event) {
    
    var user_whitelist_input = document.getElementById("userWhitelist");
  
    // characters to split entered domains on
    var invalid_chars = new RegExp("[^a-zA-Z0-9\-._]","g"); 
    var domains = user_whitelist_input.value.split(invalid_chars); 

    // Each subdomain can be from 1-63 characters and may contain alphanumeric 
    // characters, - and _ but may not begin or end with - or _
    // Each domain can be from 1-63 characters and may contain alphanumeric 
    // characters and - but may not begin or end with - Each top level domain may
    // be from 2 to 9 characters and may contain alpha characters
    var validateSubdomain = new RegExp("^(?!\-|_)[\\w\-]{1,63}","g"); //subdomains
    var validateDomain = new RegExp("^(?!\-)[a-zA-Z0-9\-?]{1,63}$","g"); //domain
    var validateTLD = new RegExp("^[a-zA-Z]{2,9}$","g"); //top level domain
    
    //needed because js regex does not have look-behind
    var notEndInHyphenOrUnder = new RegExp("[^\-_]$","g"); 
    var notEndInHyphen = new RegExp("[^\-]$","g");

    var domain_regexp = "";  //stores regex to match validated domains
    var valid_domains = [];  //stores validated domains
    
    //iterate over entered list, split by invalid chars
    for (var i = 0; i < domains.length; i++){ 
      var parts = domains[i].split(".");
      var valid_parts_count = 0;
      
      //iterate over domains, split by .
      for (var j = 0; j < parts.length; j++){ 
        switch (j){
        case parts.length-1: // validate TLD
          if (parts[j].match(validateTLD)){ 
              valid_parts_count++;
          }
          break;
        case parts.length-2: // validate Domain
          if (parts[j].match(validateDomain) &&
              parts[j].match(notEndInHyphen) ){ 
            valid_parts_count++;
          }
          break;
        default: // validate Subdomain(s)
          if (parts[j].match(validateSubdomain) && 
              parts[j].match(notEndInHyphenOrUnder)){ 
            valid_parts_count++;
          }
          break;
        }
      }
      //if all parts of domain are valid
      //append to regex for restricting domains of injected content
      if (valid_parts_count === parts.length && parts.length > 1){
        domain_regexp += "|" + domains[i].toLowerCase() + "\\/";
        valid_domains.push(domains[i].toLowerCase());
      }
    }
    
    // Save the list
    var whitelist_csv = valid_domains.join(" , ");
    this.preferences.setCharPref("userWhitelist", whitelist_csv);
    this.preferences.setCharPref("userWhitelistForRegularExpression", 
      domain_regexp);
  }
};


/**
 * @fileOverview This file opens a tab with the first run html doc under
 * appropriate conditions when the extension is loaded on browser launch or
 * on extension install.
 *
 * Appropriate conditions fall under two circumstances:
 * 1. LocalStorage does not have a stored value for the version of privly
 *    installed. (Privly was just installed or localStorage was cleared)
 * 2. The version stored in the manifest differs from the version stored in
 *    localStorage. (Privly was updated)
 *
 **/

/**
 * @namespace for the firstRun functionality.
 */
var firstRun = {

  /**
   * Open a window with the local first_run.html and ensures the localStorage
   * variables are assigned.
   */
  firstRun: function() {
    var postingDomain = ls.getItem("posting_content_server_url");
    if (postingDomain === undefined || postingDomain === null) {
      ls.setItem("posting_content_server_url", "https://privlyalpha.org");
    }

    // Initialize the spoofing glyph
    // The generated string is not cryptographically secure and should not be used
    // for anything other than the glyph.
    if ( ls.getItem("glyph_cells") === undefined ) {

      ls.setItem("glyph_color", Math.floor(Math.random()*16777215).toString(16));

      var glyph_cells = ((Math.random() < 0.5) ? "false" : "true");
      for(i = 0; i < 14; i++) {
        glyph_cells += "," + ((Math.random() < 0.5) ? "false" : "true");
      }
      ls.setItem("glyph_cells", glyph_cells);
    }

    // Open the first-run page after waiting a few seconds. Immediately opening a window
    // from Xul makes Firefox cranky.
    setTimeout(function(){
      var newwindow = window.open(
        "chrome://privly/content/privly-applications/Pages/ChromeFirstRun.html",
        "First Run",
        "menubar,toolbar,location,personalbar,resizable,scrollbars");
    }, 3000 );
  },

  /**
   * Check whether the first run html page should be opened.
   */
  checkFirstRun: function() {

    // Set the expected version to compare against the stored version
    // todo, set this dynamically
    var runningVersion = "0.3.5";
    var lastRunVersion = ls.getItem("version");

    if (lastRunVersion !== runningVersion ) {

      // Set this first or else it will open repeatedly on new Xul overlays
      ls.setItem("version", runningVersion);
      firstRun.firstRun();
    }
  }
}

// Run this script
firstRun.checkFirstRun();

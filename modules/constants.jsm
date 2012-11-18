/**
 * @namespace
 * define all constants, enums
 */
 
var EXPORTED_SYMBOLS = ["privlyConstants"];


var privlyConstants =  {
  
  /**
   * Enum to hold various extension modes and their value. 
   * Extension modes are set through firefox's extension api.
   * https://developer.mozilla.org/en/Code_snippets/Preferences
   */
  extensionModeEnum: {
    ACTIVE: 0,
    PASSIVE: 1,
    CLICKTHROUGH: 2
  },
  
  /**
   * This is the version number broadcast in headers while navigating the
   * internet. Having the header in place is important for the long-term 
   * functionality of the system since it allows servers to optionally return
   * content to the extension. The tradeoff is that Privly users are more
   * identifiable since their requests are more "unique." We can mitigate
   * this by only incrementing the broadcast version when there is a
   * reason to, and potentially pre-determining which domains are allowed
   * to receive the header.
   */
  broadcastVersion: "0.3.0",
  
  /**
   * Misc strings
   */
  Strings:{ }
}

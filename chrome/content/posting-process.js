/**
 * import the http observer module for listening to calls to privly servers
 */
Components.utils.import("resource://privly/observers.jsm");

/**
 * import privly constants
 */
Components.utils.import("resource://privly/constants.jsm");

/**
 * @namespace
 * Handles interaction with the host page, including injecting the content
 * script, privly.js.
 */
var privlyExtensionPosting = {
  
  /**
   * Interface object to the extension preferences.
   */
  preferences: Components.classes["@mozilla.org/preferences-service;1"]
                         .getService(Components.interfaces.nsIPrefService)
                         .getBranch("extensions.privly."),
  
  /**
   * Variable used during a posting transaction to save where the 
   * resulting URL will be pasted to.
   */
  currentTargetNode: undefined,
  
  /**
   * Variable used furing posting transaction to save which tab
   * contains the currentTargetNode.
   */
  tabReceivingPost: undefined,
  
  /**
   * This is the value of the form element being passed into 
   * the posting application. It should be cleared when the posting 
   * process completes
   */
  postingApplicationMessage: "",
  
  /**
   * This callback is executed when a posting application sends a secret
   * identifier to the extension to open the communication channel.
   *
   * @param e event The event fired by the posting application.
   *
   * See openPostingApplication
   *
   */
  handleMessageSecretEvent: function (e) {
    
    "use strict";
    
    var contentServerUrl = this.preferences.getCharPref("contentServerUrl");
    var postingDocument = document.getElementById('post-iframe').contentWindow;
    var secretMessage = e.target.getAttribute("privlyMessageSecret");
    postingDocument.postMessage(secretMessage +
      privlyExtensionPosting.postingApplicationMessage, contentServerUrl);
  },
  
  /** 
   * Begins posting dialog for a javascript application.
   * This function opens an iframe from the current content server
   * for the user to type their content into.
   *
   * @param postingApplication string A string that will be added to the
   * currently selected content server's URL. Currently supported values
   * are /zero_bin/ and /posts/, but the string could potentially be
   * anything.
   *
   * @see privlyExtensionPosting.handleUrlEvent
   *
   * @see privlyExtensionPosting.cancelPost
   */
  openPostingApplication: function (postingApplication) {
    
    "use strict";
    
    //Remember which tab the post is going to
    privlyExtensionPosting.tabReceivingPost = gBrowser.selectedTab;
    
    //Open the form from the selected content server
    var contentServerUrl = this.preferences.getCharPref("contentServerUrl");
    document.getElementById('post-iframe').setAttribute("src", 
      contentServerUrl + postingApplication);
    
    //display the form elements in the bottom of the browser chrome
    document.getElementById('post-splitter').hidden = false;
    document.getElementById('post-iframe-vbox').hidden = false;
    document.getElementById('post-cancel-button').hidden = false;
    
    //Save the destination for the encrypted URL
    privlyExtensionPosting.currentTargetNode = document.popupNode;
      
    //Get the current value of the form
    privlyExtensionPosting.postingApplicationMessage = 
      privlyExtensionPosting.currentTargetNode.value;
    
  },
  
  /**
   * Receive URL to encrypted post for posting to selected form element.
   * This function also closes the posting iframe and chnages its source
   * so it no longer contains the content.
   * 
   * @param {event} evt An event dispatched from the encryption application 
   * containing a string variable, "privlyUrl", bound to the url intended to
   * be pasted to the relevent form element.
   */
  handleUrlEvent: function(evt) {
    
    //Switch to the tab initiating the post
    gBrowser.selectedTab = privlyExtensionPosting.tabReceivingPost;
    
    // Focus the DOM Node, then fire keydown and keypress events
    privlyExtensionPosting.currentTargetNode.focus();
    var keydownEvent = document.createEvent("KeyboardEvent"); 
    keydownEvent.initKeyEvent('keydown', true, true, window, 0, 
                            false, 0, false, 0, 0); 
    privlyExtensionPosting.currentTargetNode.dispatchEvent(keydownEvent);
    var keypressEvent = document.createEvent("KeyboardEvent");
    keypressEvent.initKeyEvent('keypress', true, true, window, 0, 
                            false, 0, false, 0, 0); 
    privlyExtensionPosting.currentTargetNode.dispatchEvent(keypressEvent);
    
    // Some sites need time to execute form initialization 
    // callbacks following focus and keydown events.
    // One example includes Facebook.com's wall update
    // form and message page.
    setTimeout(function(){
      
      privlyExtensionPosting.currentTargetNode.value = evt.target.getAttribute("privlyUrl");
      privlyExtensionPosting.currentTargetNode.textContent = evt.target.getAttribute("privlyUrl");
      
      var event = document.createEvent("KeyboardEvent"); 
      event.initKeyEvent('keyup', true, true, window, 
                              0, false, 0, false, 0, 0); 
      privlyExtensionPosting.currentTargetNode.dispatchEvent(event);
      
      // Hide the posting window
      document.getElementById('post-splitter').hidden = true;
      document.getElementById('post-iframe-vbox').hidden = true;
      document.getElementById('post-cancel-button').hidden = true;
      document.getElementById('post-iframe').setAttribute("src", "");
      privlyExtensionPosting.currentTargetNode = undefined;
      privlyExtensionPosting.tabReceivingPost = undefined;
    },500);
  },
  
  /**
   * Cancel the post dialog after the form frame popped up. This
   * should only be called after postToPrivly is called.
   */
  cancelPost: function() {
    
    "use strict";
    
    privlyExtensionPosting.tabReceivingPost = undefined;
    document.getElementById('post-splitter').hidden = true;
    document.getElementById('post-iframe-vbox').hidden = true;
    document.getElementById('post-cancel-button').hidden = true;
    document.getElementById('post-iframe').setAttribute("src", "");
    privlyExtensionPosting.currentTargetNode = undefined;
  },
  
  /**
   * Determines which menu options are shown in the right-click menu.
   *
   * @param {event} evt A right click event.
   *
   */
  checkContextForPrivly: function (evt) {
    
    "use strict";
    
    var publicPostToPrivlyMenuItem = document.getElementById('publicPostToPrivlyMenuItem');
    var encryptedPostToPrivlyMenuItem = document.getElementById('encryptedPostToPrivlyMenuItem');
    var postingMenuSeparator = document.getElementById('postingMenuSeparator');
    
    publicPostToPrivlyMenuItem.hidden = true;
    encryptedPostToPrivlyMenuItem.hidden = true;
    postingMenuSeparator.hidden = true;
    
    var disablePosts = this.preferences.getBoolPref("disablePosts");
    
    var postable = false;
    if (!disablePosts && evt.target.nodeName !== null) {
      if (evt.target.nodeName.toLowerCase() === 'input' ||
        evt.target.nodeName.toLowerCase() === 'textarea') {
          postable = true;
      }
      else if(evt.target.nodeName.toLowerCase() === 'div') {
        if (evt.target.getAttribute("contenteditable") === 'true') {
          postable = true;
        }
      }
    }
    
    if ( postable ) {
      encryptedPostToPrivlyMenuItem.hidden = false;
      publicPostToPrivlyMenuItem.hidden = false;
      postingMenuSeparator.hidden = false;
    }
  },
  
  /**
   * Change the mode of operation for the extension.
   * @param {int} extensionMode The integer identifier of the extension mode
   */
  updateExtensionMode: function (extensionMode) {
    
    "use strict";
    
    this.preferences.setIntPref("extensionMode", extensionMode);
    this.updatePrivModeElement();
  }
};

/**
 * change the displayed menus on right clicks
 */
window.addEventListener("contextmenu",
  function (e) {
    "use strict";
    privlyExtensionPosting.checkContextForPrivly(e);
  },
  false);

/**
 * Watch for encrypted URLs sent by the encryption iframe.
 */
window.addEventListener("load", function load(event){  
    document.getElementById('post-iframe')
      .addEventListener("PrivlyUrlEvent", 
        function(e) { 
          privlyExtensionPosting.handleUrlEvent(e); 
        }, false, true);
    document.getElementById('post-iframe')
      .addEventListener("PrivlyMessageSecretEvent", 
        function(e) { 
          privlyExtensionPosting.handleMessageSecretEvent(e); }, false, true);
  },false);

/**
 * This file sets the default user preferences.
 */

/**
 * extensionMode takes 3 values - 0,1 and 2
 * extensionMode=0 - default mode - replaces content automatically.(active mode)
 * extensionMode=1 - extension loads content on the host page only when clicked(passive mode)
 * extensionMode=2 - extension doesn't load content on the host page automatically - But, when you click on the link, takes to the priv.ly page in a new tab(require-clickthrough)
 * extensionMode=3 - no requests sent to the server - when the server is down and we don't want any further requests to the server.(disabled)
 */
pref("extensions.privly.extensionMode", 0);

// all posts default to public
pref("extensions.privly.allPostsPublic", false);

// Where to store posts, examples include http://localhost:3000 and https://privlyalpha.org
pref("extensions.privly.contentServerUrl", "https://privlyalpha.org");

// User defined whitelist
pref("extensions.privly.userWhitelist", "");

// Whitelist for regular expression in privly.js. This is specially formatted
// so it can be added to privly.js many times quickly
pref("extensions.privly.userWhitelistForRegularExpression", "");

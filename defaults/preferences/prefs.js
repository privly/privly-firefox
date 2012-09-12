/*I felt there should be only one variable controlling extension mode instead of two varialbes - like norequests and require-clickthrough
* extensionMode takes 3 values - 0,1 and 2
* extensionMode=0 - default mode - replaces content automatically.(active mode)
* extensionMode=1 - extension loads content on the host page only when clicked(passive mode)
* extensionMode=2 - extension doesn't load content on the host page automatically - But, when you click on the link, takes to the priv.ly page in a new tab(require-clickthrough)
* extensionMode=3 - no requests sent to the server - when the server is down and we don't want any further requests to the server.(disabled)
*/
  
pref("extensions.privly.extensionMode", 0);
// disablePosts - when we don't want the extension to post content to the server.
pref("extensions.privly.disablePosts", false);
// all posts default to public
pref("extensions.privly.allPostsPublic", false);
// Where to store posts, for testing use "http://localhost:3000"https://priv.ly
pref("extensions.privly.contentServerUrl", "https://privlyalpha.org");
//pref("extensions.privly.firstRun", true);

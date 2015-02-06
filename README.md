## About ##

Privly is a developing set of browser extensions for protecting content wherever it is posted on the internet. This extension allows users to view content on any website, without the host site being able to read the content. For more information on what Privly is, [read about us](https://priv.ly/pages/about).

## Development Status ##

[![Build Status](https://travis-ci.org/privly/privly-firefox.svg)](https://travis-ci.org/privly/privly-chrome)

This extension currently supports:

* Posting to any website by right-clicking a form element.
* Turning on/off link injection via a button in the "chrome" of the browser.
* Locally served posting and injectable applications.
* All the implemented [Injectable Applications](https://github.com/privly/privly-organization/wiki/Injectable-Applications) of the content server.
* Setting the posting content server via extension preferences.
* [Active and passive mode](https://github.com/privly/privly-organization/wiki/Link-Operation-Modes) link injection.

**Alpha Version**

The Privly Firefox extension is currently maintained by [Sean McGregor](https://github.com/smcgregor), on behalf of the [Privly Foundation](http://www.privly.org).

## Installing/Testing/Submitting Bugs ##

To install the current version of the extension, you need to also clone the submodules. This can be achieved in one command with `git clone --recursive REPO_PATH`

Extension integration test cases are found at [test.privly.org](http://test.privly.org). If you have discovered a bug, only [open a public issue](https://github.com/privly/privly-firefox/issues/new) on GitHub if it could not possibly be a security related bug. If the bug affects the security of the system, please report it privately to privly@privly.org. We will then fix the bug and follow a process of responsible disclosure.

## Developer Documentation ##

An introduction for developers can be found on the [Priv.ly](https://priv.ly/pages/develop.html) website. Discussion of system concepts and high level processes are found in the [central wiki](https://github.com/privly/privly-organization/wiki).

## Resources ##

[Foundation Home](http://www.privly.org)  
[Privly Project Repository List](https://github.com/privly)  
[Development Mailing List](http://groups.google.com/group/privly)  
[Testing Mailing List](http://groups.google.com/group/privly-test)  
[Announcement Mailing List](http://groups.google.com/group/privly-announce)  
[Central Wiki](https://github.com/privly/privly-organization/wiki)  
[Submit a Bug](http://www.privly.org/content/bug-report)  
[IRC](http://www.privly.org/content/irc)  
[Production Content Server](https://privlyalpha.org)  
[Development Content Server](https://dev.privly.org)  
[Download Extension](https://priv.ly/pages/download)  

You can [install](https://addons.mozilla.org/en-US/firefox/addon/privly/) the latest release version of the extension from Mozilla.

You can [install](https://dev.privly.org/PrivlyFirefoxExtension.xpi) the latest development version of the extension (updated automatically every 15 minutes) from the development content server. **NOTE** Installing the extension from this URL will not update your extension in the future. You will have to periodically download new versions. If you are not testing the latest functionality, I would stick with the [Mozilla](https://addons.mozilla.org/en-US/firefox/addon/privly/) link.

## Contacts ##

**Email**:  
Community [the 'at' sign] privly.org  

**Mail**:  
Privly  
PO Box 79  
Corvallis, OR 97339 
 
**IRC**:  
Contact the Nick "[smcgregor](https://github.com/smcgregor)" on irc.freenode.net #privly

**Bug**:  
If you open a bug on this repository, you'll get someone's attention.

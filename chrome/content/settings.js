var privlySettings = 
{
  //when the server is down and we don't want any further requests to the server.
  noRequests: false,
  //disablePosts - when we don't want the extension to post content to the server.
  disablePosts: false,
  //when the server is busy and we don't want the extension to replace links on the page.
  requireClickthrough: false,
  //all posts default to public
  allPostsPublic: false,
  //Where to store posts, for testing use "http://localhost:3000"
  contentServerUrl: "https://priv.ly" 
}
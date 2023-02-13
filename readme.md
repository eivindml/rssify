# RSSify

## How to get the token?

* Use [Proxyman app for macOS](https://proxyman.io)
* Inspect traffic going to/from api.podme.com (make sure to login and browse podme.com to generate some request that you can inspect)
* Look at some of the reuqests (e.g. https://api.podme.com/web/api/v2/podcast/userpodcasts), and specifically at the request header
* In the request header you'll find the Authorization Bearer token
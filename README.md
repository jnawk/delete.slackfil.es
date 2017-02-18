# delete.slackfil.es
Slack bulk file deleter.  Allows you to delete files older than _X_ days, that have less than _Y_ stars, aren't pinned, etc, and whose name does not match a regular expression.

Runs on AWS Lambda / API Gateway, with Cloudfront sitting in front (ie, no CORS).

# Setup 
* Generate a PSK for encryption.
* Create an application in slack.  
    * Note your Client ID and Client secret.  
    * Set your redirect URI to http[s]://yourdomain.com/api/auth
* Configure API Gateway & Lambda
    * `lambda/delete-slackfil-es-authorizer.js` is a custom authorizer, attached to all API Gateway resources except for `/auth` and `/login`
        * Feed the PSK into CRYPTO_PSK env variable.
    * attach `GET /login` to `lambda/delete-slackfil-es-login.js`.
        * Feed your Client ID into CLIENT_ID env variable.
        * Feed your redirect URI into REDIRECT_URI env variable.
    * attach `GET /auth` to `lambda/delete-slackfil-es-auth.js`.
        * Feed the PSK into CRYPTO_PSK env variable.
        * Feed your Client ID into CLIENT_ID env variable.
        * Feed your Client Secret into CLIENT_SECRET env variable.
        * Feed your redirect URI into REDIRECT_URI env variable.
    * attach `GET /team` to `lambda/delete-slackfil-es-get-team.js`.
        * Feed the PSK into CRYPTO_PSK env variable.    
    * attach `GET /files` to `lambda/delete-slackfil-es-get-files.js`.  Give this 15 seconds timeout.
        * Feed the PSK into CRYPTO_PSK env variable.
    * attach `DELETE /files/{id}` to `lambda/delete-slackfil-es-delete.js`.
        * Feed the PSK into CRYPTO_PSK env variable.
    * Deploy the API under the `api` stage
* Configure Cloudfront & S3
    * Create a bucket in S3, upload `s3/index.html`, so that Cloudfront can read it
    * Set your default root object to `index.html`
    * Set the S3 bucket as your default origin
    * Create a custom origin, domain name is that of your API Gateway, path is blank
    * Create a custom behaviour for `/api/*`, forwarding query strings, and the `token` cookie.

# How it works
* OAuths against Slack.
* Stores the slack token encrypted in a browser cookie.
    * The encryption / decryption code is a bit of a cop-out - it should use AWS IAM KMS, but at $1 _per month_ on top of the rest of the charges, it seems a bit rich.   (NB: It's AES-256-CTR - while it's a cop-out, it's not insecure).
* When the 'go' button is pressed, the browser asks the back end for a list of file IDs to delete.  The back end filters out files that should not be deleted. 
* The browser then submits a request to delete each file, one by one.  (To hopefully not overwhelm slack).

# Wishlist
* Currently the cookie has no expiry, and is not a session cookie, nor is it HTTPonly.
* Currently no way to log out (ie, clear the cookie)
* The 'go' button is active before the team info has been retrieved (the cookie might not exist or be valid; login will be required).
* Once the 'go' button is pressed, there is no feedback, nor any way to abort, abort, ABORT!
* Cloudformation?
* Serverless?

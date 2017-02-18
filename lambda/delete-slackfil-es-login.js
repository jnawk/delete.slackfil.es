'use strict';

console.log('Loading function');
var scopes = 'files:write:user identify team:read files:read';

exports.handler = (event, context, callback) => {
    var location = 'https://slack.com/oauth/authorize?client_id=' + process.env.CLIENT_ID + '&scope=' + scopes + '&redirect_uri=' + process.env.REDIRECT_URI;
    callback(null, {
        statusCode: 302,
        body: "",
        headers: {
            'Location': encodeURI(location)
        }
    });  
};

'use strict';

console.log('Loading function');

exports.handler = (event, context, callback) => {
    var location = 'https://slack.com/oauth/authorize?client_id=' + process.env.CLIENT_ID + '&scope=' + process.env.SCOPES + '&redirect_uri=' + process.env.REDIRECT_URI;
    callback(null, {
        statusCode: 302,
        body: "",
        headers: {
            'Location': encodeURI(location)
        }
    });  
};

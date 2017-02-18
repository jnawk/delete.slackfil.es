'use strict';

console.log('Loading function');
var crypto = require('crypto');
var https = require('https');

var algorithm = 'aes-256-ctr';
    
function encrypt(text){
  var cipher = crypto.createCipher(algorithm, process.env.CRYPTO_PSK);
  var crypted = cipher.update(text,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var code = event.queryStringParameters.code;
    var url = 'https://slack.com/api/oauth.access?client_id=' + process.env.CLIENT_ID + '&client_secret=' + process.env.CLIENT_SECRET + '&code=' + code + '&redirect_uri=' + process.env.REDIRECT_URI 
    https.get(url, function(result){
        result.on('data', function(data) {
            var response = JSON.parse(data.toString('utf-8'));
            if(response.ok) {
                var encryptedToken = encrypt(response.access_token);
                callback(null, {
                    statusCode: 302,
                    body: "",
                    headers: {
                        'Location': 'https://delete.slackfil.es/',
                        'Set-Cookie': 'token=' + encryptedToken
                    }
                });  
            } else {
                callback(null, {
                    statusCode: 401,
                    body: ""
                });  
            }
        });
    }).on('error', function(err){
        callback(null, {
            statusCode: 401,
            body: ""
        });  
    });
};

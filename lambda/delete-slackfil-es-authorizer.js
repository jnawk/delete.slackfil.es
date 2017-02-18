'use strict';

console.log('Loading function');
var crypto = require('crypto');
var https = require('https');

function generatePolicy(principalId, effect, resource) {
    return { 
        'principalId': principalId, 
        'policyDocument': {
            'Version': '2012-10-17', 
            'Statement': [ {
                'Action': 'execute-api:Invoke', 
                'Effect': effect, 
                'Resource': resource
            } ] 
        } 
    };
}

var algorithm = 'aes-256-ctr';
    
function encrypt(text){
  var cipher = crypto.createCipher(algorithm, process.env.CRYPTO_PSK);
  var crypted = cipher.update(text,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm, process.env.CRYPTO_PSK);
  var dec = decipher.update(text,'hex','utf8');
  dec += decipher.final('utf8');
  return dec;
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var encryptedToken = event.authorizationToken.replace(/.*token=([^;]+).*/, '$1');
    console.log(encryptedToken);
    var token = decrypt(encryptedToken);
    
    https.get('https://slack.com/api/auth.test?token=' + token, function(result){
        result.on('data', function(data) {
            var response = JSON.parse(data.toString('utf-8'));
            if(response.ok) {
                callback(null, generatePolicy(response.user, 'Allow', event.methodArn));
            } else {
                callback('unauthorized'); // deny all, for now    
            }
        });
    }).on('error', function(err){
        callback('unauthorized'); // deny all, for now
    });
    
};

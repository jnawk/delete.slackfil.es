'use strict';
var crypto = require('crypto');
var https = require('https');

var algorithm = 'aes-256-ctr';

function decrypt(text){
    var decipher = crypto.createDecipher(algorithm, process.env.CRYPTO_PSK);
    var dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    
    var encryptedToken = event.headers.Cookie.replace(/.*token=([^;]+).*/, '$1');
    var token = decrypt(encryptedToken);
    https.get('https://slack.com/api/files.delete?token=' + token + '&file=' + event.pathParameters.id , function(result){
        result.on('data', function(data) {
            var dataString = data.toString('utf-8');
            var response = JSON.parse(dataString);
            if(response.ok) {
                callback(null, {
                    statusCode: 200,
                    body: dataString,
                });
            } else if(response.error == 'cant_delete_file') {
                callback(null, {
                    statusCode: 403,
                    body: dataString,
                });
            } else {
                callback('error'); 
            }
        });
    }).on('error', function(/*err*/){
        callback('error');
    });
    callback(null, {
        statusCode: 200,
        body: JSON.stringify('data')
    })
};

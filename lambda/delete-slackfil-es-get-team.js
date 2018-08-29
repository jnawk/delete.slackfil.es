'use strict';
const crypto = require('crypto');
const https = require('https');

const algorithm = 'aes-256-ctr';

function decrypt(text){
    const decipher = crypto.createDecipher(algorithm, process.env.CRYPTO_PSK);
    var dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    const encryptedToken = event.headers.Cookie.replace(/.*token=([^;]+).*/, '$1');
    const token = decrypt(encryptedToken);

    https.get('https://slack.com/api/auth.test?token=' + token, function(authResult) {
        authResult.on('data', function(authData) {
            var response = JSON.parse(authData.toString('utf-8'));
            if(response.ok) {
                const user = response.user;
                https.get('https://slack.com/api/team.info?token=' + token, function(teamResult) {
                    teamResult.on('data', function(teamData) {
                        var response = JSON.parse(teamData.toString('utf-8'));
                        if(response.ok) {
                            response.user = user;
                            callback(null, {
                                statusCode: 200,
                                body: JSON.stringify(response),
                            });
                        } else {
                            callback('error');
                        }
                    });
                }).on('error', function(/*err*/){
                    callback('error');
                });
            } else {
                callback('error');
            }
        });
    });
};

'use strict';
var crypto = require('crypto');
var https = require('https');

var algorithm = 'aes-256-ctr';
var urlPrefix = 'https://slack.com/api/files.list';

function decrypt(text){
    var decipher = crypto.createDecipher(algorithm, process.env.CRYPTO_PSK);
    var dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
}

function getFiles(page, pages, token, date, stars, savePattern, callback) {
    var dataString = '';
    var filesToDelete = [];
    console.log('requesting page ' + page);
    https.get(urlPrefix + '?token=' + token + '&ts_to=' + date + '&types=images&count=1000&page=' + page, function(result){
        result.on('data', function(data) {
            dataString += data.toString('utf-8');
        });
        result.on('end', function() {
            var response = JSON.parse(dataString);
            if(response.ok) {
                pages = response.paging.pages;
                console.log('requested page ' + page + ' of ' + pages);
                var files = response.files;
                var toSave = 0;
                files.map(function (f){
                    //console.log(JSON.stringify(f));
                    var inUse = f.is_external || f.public_url_shared || undefined !== f.pinned_to || ( undefined !== f.num_stars && f.num_stars < stars);
                    var save = null != f.name.match(savePattern);
                    if(inUse || save) {
                        toSave++;
                    } else {
                        filesToDelete.push({id: f.id, user: f.user});
                    }
                });
                
                if(page < pages) {
                    // more pages to retrieve
                    console.log('more pages...');
                    getFiles(page + 1, pages, token, date, stars, savePattern, function(err, data) {
                        if(err) {
                            callback(err);
                        } else {
                            console.log('adding ' + data.length + ' files, holding back ' + toSave);
                            data.map(function (i){
                                filesToDelete.push(i);
                            });
                            console.log('returning ' + filesToDelete.length + ' files...');
                            callback(null, filesToDelete);
                        }
                    });
                } else {
                    console.log('returning ' + filesToDelete.length + ' files...');
                    callback(null, filesToDelete);
                }
            } else {
                callback('error'); 
            }
        });
    }).on('error', function(/*err*/){
        callback('error');
    });
}

exports.handler = (event, context, callback) => {
    var encryptedToken = event.headers.Cookie.replace(/.*token=([^;]+).*/, '$1');
    var token = decrypt(encryptedToken);
    
    var days = event.queryStringParameters.days;
    var stars = event.queryStringParameters.stars;
    var savePattern = new RegExp(event.queryStringParameters.savePattern); // TODO collect this
    
    var nowMillis = new Date().getTime();
    var saveDaysMillis = 86400 * 1000 * days;
    var date = parseInt((nowMillis - saveDaysMillis) / 1000);
    
    getFiles(1, 1, token, date, stars, savePattern, function (err, data){
        if(err) {
            callback(err);
        } else {
            console.log('returning ' + data.length + ' files...');
            console.log(JSON.stringify(data));
            callback(null, {
                statusCode: 200,
                body: JSON.stringify(data)
            });
        }
    });
};

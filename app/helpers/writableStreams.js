var fs = require('fs');
var path = require('path');

var directory = path.join(__dirname, '..', 'logs');
var accessLogFileName = 'access.log';
var applicationLogFileName = 'application.log';

exports.accessLogs = fs.createWriteStream(path.join(directory, accessLogFileName), { flags: 'a' });
exports.applicationLogs = fs.createWriteStream(path.join(directory, applicationLogFileName), { flags: 'a' });

exports.readAccessLogs = function(callback) {
    fs.readFile(path.join(directory, accessLogFileName), function(error, data) {
        if (error)
            callback(error);
        
        callback(null, data);
    });
};

exports.readApplicationLogs = function(callback) {
    fs.readFile(path.join(directory, applicationLogFileName), function(error, data) {
        if (error)
            callback(error);

        callback(null, data);
    });
};
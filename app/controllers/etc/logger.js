var Error = require('./custom-error');
var Logger = require('../models/log');

function checkParameters(args) {
    var log, user, action, message, callback;
    log = args[0];
    user = args[1];
    action = args[2];
    message = args[3];
    callback = args[4];

    if (arguments.length < 5) {
        if (typeof log == 'string') {
            var temp = JSON.parse(JSON.stringify(arguments));
            if (typeof temp[3] == 'function')
                callback = temp[3];
            else
                throw new Error('Please provide callback function');
            user = temp[0];
            action = temp[1];
            message = temp[2];
        }
        if (typeof log == 'object') {
            if (typeof user == 'function')
                callback = user;
            else
                throw new Error('Please provide callback function');
            user = log.user || '0';
            action = log.action;
            message = log.message;
        }
    }
    return { log, user, action, message, callback };
}

module.exports = function(log, user, action, message, callback) {
    if (arguments.length == 0)
        throw new Error('Please provide arguments');
    var args = checkParameters(arguments);

    user = args.user;
    action = args.action;
    message = args.message;
    callback = args.callback;
    
    var logPiece = {
        message: message,
        date: new Date()
    };

    Logger.Log.findOne({
        userId: user,
        action: action
    }, function(err, log) {
        if (err)
            callback(new Error('an error occured while fetching logs\nMessage: ' + err));

        if (log) {
            var piece = new Logger.Piece(logPiece);
            log.log.unshift(piece);
            log.save(function(err) {
                if (err)
                    callback(new Error('an error occured while logging\nMessage: ' + err));

                callback(null, true);
            })
        } else {
            var newLog = {
                userId: user,
                action: action,
                log: [ logPiece ]
            };
            log = new Logger.Log(newLog);
            log.save(function(err) {
                if (err)
                    callback(new Error('an error occured while saving logging\nMessage: ' + err));

                callback(null, true);
            })
        }
    });
};
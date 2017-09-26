var appLogStream = require('./writableStreams').applicationLogs;
var streamLogger = require('./streamLogger')(appLogStream);

function log(type, content) {
    streamLogger.log(type, content);
    console[type](content);
}

module.exports = function(_console) {
    // clean console
    _console = {};

    // console.log
    _console.log = function(content) { log('log', content); };

    // console.warn
    _console.warn = function(content) { log('warn', content); };
    
    // console.info
    _console.info = function(content) { log('info', content); };

    // console.error
    _console.error = function(content) { log('error', content); };

    return _console;
};
var console = require('../helpers/consoleOverride')(console);
var async = require('async');
var nodemailer = require('nodemailer');
var notifier = require('node-notifier');
var mailConfig = require('../config/mail');
var configs = require('../config')();

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mailConfig.user,
        pass: mailConfig.pass
    }
});

exports = module.exports = function uncaughtExceptionHandler(options) {
    var opts = options || {};

    return function uncaughtExceptionHandler(error) {

        if (opts.consoleLog)
            console.error(error);

        if (opts.emailNotification) {
            async.forEachOf(mailConfig.errorRecipients, function (recipient, index, emailCallback) {
                transporter.sendMail({
                    from: mailConfig.email,
                    to: recipient,
                    subject: '[ERROR] Leap Reporting',
                    text: `Leap Process Terminated\nConfigs: ${JSON.stringify(configs)}\n${error.stack}`
                }, function (err, info) {
                    if (err)
                        console.error('[ERROR] Failed to send error report to: ' + recipient);

                    emailCallback();
                });
            }, function (error) {
                console.log('[SERVER] Shutting down server ...');
                process.exit(1);
            });
        } else {
            console.log('[SERVER] Shutting down server ...');
            process.exit(1);
        }
    }
};
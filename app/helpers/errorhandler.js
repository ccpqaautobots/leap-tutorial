var console = require('../helpers/consoleOverride')(console);
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

exports = module.exports = function errorHandler(options) {
    var opts = options || {};

    return function errorHandler(err, req, res, next) {

        if (opts.consoleLog)
            if (err)
                console.error(err.stack);

        if (req.xhr) {
            if (opts.hostNotification) {
                var title = `[ERROR] Method: ${req.method} - Url: ${req.url}`;
                notifier.notify({
                    title: title,
                    message: err.message,
                    sound: true
                }); // send notification to host machine
            }

            if (opts.emailNotification) {
                mailConfig.errorRecipients.forEach(function (recipient) {
                    transporter.sendMail({
                        from: mailConfig.email,
                        to: recipient,
                        subject: '[ERROR] Leap Reporting',
                        text: `Config: ${JSON.stringify(configs)}\nMethod: ${req.method}\nUrl: ${req.url}\nRequest Query: ${JSON.stringify(req.query)}\nRequest Parameters: ${JSON.stringify(req.params)}\nRequest Body: ${JSON.stringify(req.body)}\n\n${err.stack}`
                    }, function (err, info) {
                        if (err)
                            console.error('[ERROR] Failed to send error report to: ' + recipient);
                    });
                });
            }

            if (opts.displayError)
                return res.status(500).send('500 Internal Server Error\n' + err.stack);
            else
                return res.status(500).send('500 Internal Server Error');
        } else {
            next();
        }
    }
};
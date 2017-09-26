var nodemailer = require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var mailConfig = require('../config/mail');

exports.sendTemplateMail = function(template, to, data, callback) {
    var templateDir = path.join(__dirname, '..', 'templates');
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: mailConfig.user,
            pass: mailConfig.pass
        }
    });

    var emailTemp = new EmailTemplate(path.join(templateDir, template));
    emailTemp.render(JSON.parse(JSON.stringify(data)), function(err, result) {
        if (err)
            return callback(err);

        transporter.sendMail({
            from: mailConfig.email,
            to: to,
            subject: result.subject,
            html: result.html,
            text: result.text
        }, function(err, info) {
            if (err)
                return callback(err);
            
            return callback(null, { success: true, message: `Message ${info.messageId} sent ${info.response}` });
        });
    });
};
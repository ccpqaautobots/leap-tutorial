module.exports = {
    user: process.env.MAIL_USERNAME || 'ccpqaautobots@gmail.com',
    pass: process.env.MAIL_PASSWORD || 'coreuniquepassword1',
    email: process.env.MAIL_SENDER || 'Leap Team <ccpqaautobots@gmail.com>',
    errorRecipients: (process.env.ERROR_RECIPIENTS) ? process.env.ERROR_RECIPIENTS.split(',') : [ 'kcid@cambridge.org' ]
};
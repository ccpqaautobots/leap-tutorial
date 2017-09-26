var models = require('./models-sc');
var User = models.User;	    // user model - user schema
var mail = require('./mail');
var auth = require('./auth');
var Token = models.Token;
var async = require('async');
var appConfig = require('../config/app');

exports.getUsers = function (req, res) {
    if (!req.body.query)
        req.body.query = {};
    if (!req.body.options)
        req.body.options = {};

    var selectOptions = {};
    selectOptions = req.body.options.select || {};
    selectOptions.password = 0;

    // if (req.session.user.isAdmin)
    //     req.body.query.roles = { $nin: ['super'] };

    return User
        .find(req.body.query)
        .select(selectOptions)
        .limit(req.body.options.limit || 0)
        .skip(req.body.options.skip || 0)
        .exec(function (err, users) {
            if (err)
                return res.status(400).send({ success: false, message: 'error occured while querying users\n' + err });

            return res.status(200).json(users);
        });
};

exports.getUser = function (req, res) {
    return User.findOne({ _id: req.params.id }, function (err, user) {
        if (err)
            return res.status(500).send({ success: false, message: 'Internal Server Error:\n error occured while querying users\n' + err });

        return res.status(200).send(user);
    })
};

function emailVerificationSend(user, tokenType, template, callback) {
    var newEmailVer = new Token({
        user_id: user._id,
        type: tokenType
    });
    return newEmailVer.save(function (err, createdEmailVerification) {
        if (err)
            return callback('an error occured while generating email verification\n' + err);

        var locals = {
            host: appConfig,
            user: user,
            verification: createdEmailVerification
        };
        return mail.sendTemplateMail(template, user.email, locals, function (err) {
            if (err)
                return callback('an error occured while sending email\n' + err);

            return callback(null);
        });
    });
}

exports.resendEmailVerification = function(req, res) {
    return User.findOne({ 
        username: req.body.user
    }, function(err, user) {
        if (err)
            return res.status(500).send({ success: false, message: 'Internal Server Error:\n error occured \n' + err });

        if (user)
           return emailVerificationSend(user, 'accountverification', 'welcome', function(err) {
                if (err)
                    return res.status(500).send({ success: false, message: 'Internal Server Error:\n error occured \n' + err });

                return res.status(200).send({ success: true, message: 'Email verification sent.' });
        });
    });
};

function userCreation(user, callback) {
    var newUser = new User(user);
    return newUser.save(function (err, createdUser) {
        if (err)
            return callback(err);

        return emailVerificationSend(createdUser, 'accountverification', 'welcome', function (err) {
            if (err)
                return callback(err);

            return callback(null, createdUser);
        });
    })
}

exports.createUser = function (req, res) {
    return userCreation(req.body, function (err, result) {
        if (err) {
            if (err.name == 'ValidationError')
                return res.status(200).send({ success: false, validation: err.errors })
            else
                return res.status(500).send({ success: false, message: 'Internal Server Error:\n error occured \n' + err })
        }

        return res.status(200).send({ success: true, message: 'user created successfully', id: result._id });
    });
};

exports.updateUser = function (req, res) {
    return User.findOne({ _id: req.params.id }, function (err, user) {
        if (err)
            return res.status(500).send({ success: false, message: 'Internal Server Error:\n error occured while querying users\n' + err });

        if (user) {
            var oldUser = JSON.parse(JSON.stringify(user));
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.jobTitle = req.body.jobTitle || undefined;
            user.roles = req.body.roles || [];
            return user.save(function (err, updatedUser) {
                if (err) {
                    if (err.name == 'ValidationError')
                        return res.status(200).send({ success: false, validation: err.errors })
                    else
                        return res.status(500).send({ success: false, message: 'Internal Server Error:\n error occured while updating user \n' + err })
                }

                if (oldUser.email != user.email) {
                    return emailVerificationSend(user, 'accountverification', 'welcome', function (err) {
                        if (err)
                            return res.status(200).send({ success: true, message: 'failed to send email to user\n' + err });

                        auth.updateUserSession(req, updatedUser, function() {
                            return res.status(200).send({ success: true, message: 'user updated successfully' });
                        });
                    });
                } else {
                    auth.updateUserSession(req, updatedUser, function() {
                        return res.status(200).send({ success: true, message: 'user updated successfully' });
                    });
                }
            })
        }
    })
};

exports.disableUser = function (req, res) {
    return User.findOne({ _id: req.params.id }, function (err, user) {
        if (err)
            return res.status(500).send({ success: false, message: 'Internal Server Error:\n error occured while querying users\n' + err });

        user.enabled = false;
        return user.save(function () {
            return res.status(200).send({ success: true, message: 'user has been disabled' });
        })
    });
};

exports.inviteUsers = function (req, res) {
    var failed = [];
    async.each(req.body, function (user, callback) {
        userCreation(JSON.parse(JSON.stringify(user)), function (err) {
            if (err) {
                failed.push({ user: user.username, failed: err });
                callback();
            } else
                callback();
        })
    }, function () {
        res.status(200).send({ success: true, failures: failed });
    });
};

function removeEmailVerification(err, res, verification) {
    if (err)
        return res.status(500).send({ success: false, message: 'Internal Server Error:\n an error occured while saving user data\n' + err });

    return verification.remove(function (err) {
        if (err)
            return res.status(500).send({ success: true, message: 'Internal Server Error:\n an error occured while removing verification\n' + err });

        return res.status(200).send({ success: true, message: 'account verified' });
    })
}

exports.verifyUserEmail = function (req, res) {
    if (req.session.user)
        return res.redirect('/');

    return Token.findOne({ user_id: req.query.user_id, token: req.query.token, type: req.query.type }, function (err, verification) {
        if (err)
            return res.status(400).send({ success: false, message: 'an error occured while querying email verification\n' + err });

        if (!verification)
            return res.render('pages/404');
        
        if (verification.token == req.query.token) {
            return User.findOne({ _id: req.query.user_id }, function (err, user) {
                if (err)
                    return res.status(400).send({ success: false, message: 'an error occured while querying user\n' + err });

                if (req.method == 'POST' && !req.body.pass)
                    return res.status(400).send({ success: false, message: 'Please provide a password' });

                if (!user)
                    return res.status(400).send({ success: false, message: 'user was not found' });

                if (!req.body.pass)
                    return res.render('pages/userpasswordsetup');

                user.password = req.body.pass;
                user.enabled = true;
                return user.save(removeEmailVerification(err, res, verification));
            })
        }
    });
};

exports.userChangePassword = function (req, res) {
    if (!req.body.oldpass && !req.body.resetPass)
        return res.status(200).send({ success: false, message: 'please provide your old password' });
    if (!req.body.pass)
        return res.status(200).send({ success: false, message: 'please provide your new password' });

    return User.findOne({ username: req.params.username }, function (err, user) {
        if (err)
            return res.status(200).send({ success: false, message: 'an error occured while querying user\n' + err });

        if (user) {
            if (user.password != req.body.oldpass)
                return res.status(200).send({ success: false, message: 'old password does not match' });

            user.password = req.body.pass;
            return user.save(function (err) {
                if (err)
                    return res.status(200).send({ success: false, message: 'an error occured while updating user password\n' + err });

                return res.status(200).send({ success: true, message: 'user updated successfully' });
            })
        }
    })
};

exports.forgotPassword = function (req, res) {
    return User.findOne({
        $or: [
            { username: req.body.user },
            { email: req.body.user }
        ]
    }, function(err, user) {
        if (err)
            return res.status(400).send({ success: false, message: 'error while querying users\n' + err });

        if (!user)
                return res.status(200).send({ success: false, message: 'User does not exists.' });

        return emailVerificationSend(user, 'forgotpassword', 'passwordrecovery', function(err) {
            if (err)
                return res.status(400).send({ success: false, message: err });

            return res.status(200).send({ success: true, message: 'Password recovery email sent.' });
        })
    });
};

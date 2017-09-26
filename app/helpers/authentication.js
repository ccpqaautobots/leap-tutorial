var jwt = require('jsonwebtoken');
var appConfig = require('../config/app');

exports.authenticate = function(req, res, next) {
    // if session for user is undefined
    if (req.session)
        if (!req.session.user) {
            // render login page, pass url as reference
            return res.redirect('/login?ref=' + req.originalUrl);
        } else {
            // if user is locked
            if (req.session.user.locked) {
                return res.redirect('/unlock'); // redirect user to lockscreen
            }
        }

    return next(); // continue if authentication is successful
};

exports.authenticateLocked = function(req, res, next) {
    // if session exists,  user session exists, and user is locked
    if (req.session && req.session.user && req.session.user.locked)
        return res.redirect('/unlock'); // redirect user to lockscreen

    return next(); // continue if authentication is successful
};

exports.apiAuth = function(req, res, next) {
    var token = (req.session.user) ? req.session.user.token : req.body.token ||
        req.query.token ||
        req.headers['x-access-token'];

    if (token == 'secret-token') {
        return next();
    }

    if (token) {
        jwt.verify(token, appConfig.apiSecret, function(err, decoded) {
            if (err)
                return res.json({ success: false, message: 'Token authentication failed.' });
            else {
                req.decoded = decoded;
                return next();
            }
        })
    } else {
        return res.status(403).send({ success: false, message: 'No api token provided.' });
    }
};
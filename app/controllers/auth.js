var appConfig = require('../config/app');
var models = require('./models-sc');
var User = models.User;
var jwt = require('jsonwebtoken');

function updateUserSession (req, user, callback) {
	// clone user data for modification
	var userModified = JSON.parse(JSON.stringify(user));
	userModified.password = undefined; // set password to undefined
	userModified.fullname = user.getFullName(); // set fullname of user
	userModified.isSuper = user.isSuper; userModified.isAdmin = user.isAdmin;
	if (userModified.isSuper) {
		userModified.roles.splice(userModified.roles.indexOf('super'), 1);
	}
	if (userModified.isAdmin) {
		userModified.roles.splice(userModified.roles.indexOf('admin'), 1)
	}
	req.session.user = userModified; // store user data to session
	var apiToken = jwt.sign(req.session.user, appConfig.apiSecret, {
		expiresIn: 24 * 60 * 60 * 1000 // expires in 24 hours
	});
	req.session.user.token = apiToken;
	callback(null);
};

exports.updateUserSession = updateUserSession;

exports.login = function (req, res) {
	// query single User that matches username
	return User.findOne({
		$or: [
			{ username: req.body.user },
			{ email: req.body.user }
		]
	}, function (err, user) {
		if (err)
			throw new Error(err);

		// if no error occured and user exists
		if (user) {
			if (user.enabled) {
				// if password matches
				if (req.body.pass == user.password) {
					updateUserSession(req, user, function() {
						return res.status(200).send({ success: true });
					});
				} else {
					// send status 200 and json
					return res.status(200).send({ success: false, invalid: true, message: 'Invalid login credentials.' });
				}
			} else {
				return res.status(200).send({ success: false, notVerified: true, message: 'Account not yet verified.' });
			}
		} else {
			return res.status(200).send({ success: false, invalid: true, message: 'Invalid login credentials.' });
		}
	})
};

exports.unlock = function (req, res) {
	// query single User that matches username
	return User.findOne({ username: req.session.user.username }, function (err, user) {
		// if no error occured and user exists
		if (!err && user) {
			// if password matches
			if (req.body.pass == user.password) {
				req.session.user.locked = false; // unlock user session
				// send status 200 and json
				res.status(200).send({ 'status': 'unlocked' });
			} else {
				// send status 200 and json
				return res.status(200).send({ 'status': 'invalid password' });
			}
		}
	})
};
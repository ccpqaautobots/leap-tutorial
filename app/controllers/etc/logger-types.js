// ================================================================
//                      S E R V E R
// ================================================================
exports.Startup = function(message) {
    this.action = 'startup';
    this.message = message || 'server has started';

    return this;
};

exports.Shutdown = function(message) {
    this.action = 'shutdown';
    this.message = message || 'server terminated';

    return this;
};

// ================================================================
//                      L O G I N
// ================================================================
exports.Login = function(user, message) {
    this.user = user;
    this.action = 'login';
    this.message = message || 'user is now logged in';

    return this;
};

exports.LoginFailed = function(user, message) {
    this.user = user;
    this.action = 'login';
    this.message = message || 'user failed to login';

    return this;
};

// ================================================================
//                      L O G O U T
// ================================================================
exports.Logout = function(user, message) {
    this.user = user;
    this.action = 'logout';
    this.message = message || 'user logged out';

    return this;
};

// ================================================================
//                      L O C K S C R E E N
// ================================================================
exports.Lockscreen = function(user, message) {
    this.user = user;
    this.action = 'lockscreen';
    this.message = message || 'user is locked';

    return this;
};

exports.LockscreenUnlocked = function(user, message) {
    this.user = user;
    this.action = 'lockscreen';
    this.message = message || 'user is now unlocked';

    return this;
};

exports.LockscreenFailed = function(user, message) {
    this.user = user;
    this.action = 'lockscreen';
    this.message = message || 'user failed to unlock lockscreen';

    return this;
};

// ================================================================
//                      S C R I P T S ( C R U D )
// ================================================================
exports.ScriptCreated = function(user, message) {
    this.user = user;
    this.action = 'scriptCreate';
    this.message = message || 'script was created';

    return this;
};

exports.ScriptUpdated = function(user, message) {
    this.user = user;
    this.action = 'scriptUpdate';
    this.message = message || 'script was updated';

    return this;
};

exports.ScriptViewed = function(user, message) {
    this.user = user;
    this.action = 'scriptView';
    this.message = message || 'script was viewed';

    return this;
};

exports.ScriptDeleted = function(user, message) {
    this.user = user;
    this.action = 'scriptDelete';
    this.message = message || 'script was deleted';

    return this;
};
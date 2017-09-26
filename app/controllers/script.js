var mongoose = require('mongoose');
var models = require('./models-sc');
var Script = models.Script;
var Suite = models.Suite;

exports.getScript = function (req, res) {
    if (!req.body.query)
        req.body.query = {};
    if (!req.body.options)
        req.body.options = {};

    return Script
        .find(req.body.query)
        .select(req.body.options.select || {})
        .limit(req.body.options.limit || 0)
        .skip(req.body.options.skip || 0)
        .lean()
        .exec(function (err, scripts) {
            if (err)
                return res.status(400).send({ success: false, message: 'error occured while querying scripts\n' + err });

            return res.status(200).json(scripts);
        });
};

exports.getDependentSuites = function (req, res) {
    return Suite
        .find({
            'scripts.scriptId': {
                $in: [req.params.id]
            }
        })
        .select({
            project: 1,
            module: 1,
            suiteName: 1
        })
        .lean()
        .exec(function (error, dependent_suites) {
            if (error)
                return res.status(500).send('Internal Server Error: 500\n' + error);

            return res.status(200).send(dependent_suites);
        });
};

exports.deleteScript = function (req, res) {
    // if query id is provided
    if(req.params.id != undefined) {
    // remove testscript using id			
    return Script.remove({ _id: req.params.id }, function (err) {
        // if error occured
        if (err) {
            // send status 500 and message as json
            res.status(500).send(new ResponseMessage('danger', 'There was a problem adding the information to the database.', 'ban'));
        } else {
            // send status 200 and message as json
            return res.status(200).send(new ResponseMessage('success', 'Script was deleted successfully!', 'check'));
        }
    });
    }
};

exports.updateStatus = function (req, res) {
    // if query id is provided
    var parsed = req.body.test;
    return Script.findOne({ _id: parsed._id }, function (err, testscript) {
        // if testscript exists prepare for update
        if (testscript && !err) {
            // update top level attributes of testscript
            testscript.status = parsed.status;
            // save testscript
            return testscript.save(function (err, data) {
                if (err) {
                    // if error occured send response 500 to user
                    return res.status(500).send(new ResponseMessage('danger', 'There was a problem adding the information to the database.', 'ban'));
                } else {
                    // else send response 200 to user
                    return res.status(200).send(new ResponseMessage('success', 'Script status was updated successfully!', 'check', data._id));
                }
            });
        }
    });
};

exports.saveScript = function (req, res) {
    // when api gets called, get request data
    // request body - test, then parse to a json object
    var parsed = req.body.test;

    // if type is clone
    if (req.body.type === 'clone') {
        var newTestscript = new Script(parsed); // generate new testscript from parsed script
        newTestscript._id = mongoose.Types.ObjectId(); // generate new mongoose objectid
        newTestscript.isNew = true; // set script isNew to true
        // save testscript
        return newTestscript.save(function (err) {
            if (err) {
                return res.status(500).send(new ResponseMessage('danger', 'There was a problem adding the information to the database.', 'ban'));
            } else {
                // good thing happens too, so send response 200, because testscript was saved
                return res.status(201).send(new ResponseMessage('success', 'Script was created successfully!', 'check'));
            }
        })
    }

    // search mongo if testscript exists
    return Script.findOne({ _id: parsed._id }, function (err, testscript) {
        // if an error occured do not proceed
        if (!err) {
            // if testscript exists prepare for update
            if (testscript) {
                // update top level attributes of testscript
                testscript.testName = parsed.testName;
                testscript.lastUpdatedBy = parsed.lastUpdatedBy;
                testscript.scenarios = parsed.scenarios;
                testscript.status = parsed.status;
                testscript.module = parsed.module;
                testscript.updatedDate = new Date();
                // save testscript
                return testscript.save(function (err, data) {
                    if (err) {
                        // if error occured send response 500 to user
                        return res.status(500).send(new ResponseMessage('danger', 'There was a problem adding the information to the database.', 'ban'));
                    } else {
                        // else send response 200 to user
                        return res.status(200).send(new ResponseMessage('success', 'Script was updated successfully!', 'check', data._id));
                    }
                });
                // if testscript does not exists
            } else {
                // create a testscript from parsed json object
                // mongoose will handle unused attributes :) awesome
                var newTestscript = new Script(parsed);
                // save testscript
                return newTestscript.save(function (err, data) {
                    if (err) {
                        return res.status(500).send(new ResponseMessage('danger', 'There was a problem adding the information to the database.\n' + err, 'ban'));
                    } else {
                        // good thing happens too, so send response 200, because testscript was saved
                        return res.status(201).send(new ResponseMessage('success', 'Script was created successfully!', 'check', data._id));
                    }
                });
            }
        }
    });
};

function ResponseMessage(type, message, icon, data) {
    var _this = this;

    // types = [ 'success', 'warning', 'info', 'danger' ]
    _this.type = type;
    _this.message = message;
    _this.icon = icon || null;
    _this.data = data || undefined;
}
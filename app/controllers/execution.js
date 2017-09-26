var console = require('../helpers/consoleOverride')(console);
const fs = require('fs');
const async = require('async');
const models = require('./models-sc');
const TestScript = models.Script;
const TestResult = models.TestResult;
const generate_runmodels_task = require('./runners/nightwatchrunner/runmodel_task');
const Q = require('./runners/nightwatchrunner/nightwatch_q');
const Script = require('./runners/nightwatchrunner/nightwatch_script');
const Suite = require('./runners/nightwatchrunner/nightwatch_suite');

exports.queue_execution = (req, res) => {
    generate_runmodels_task(req.body, {
        name: req.query.name || req.decoded.fullname,
        username: req.query.username || req.decoded.username
    }, (error, run_models) => {
        if (error)
            return res.status(500).send('Internal Server Error: \n' + error);

        console.log('Total run model count: ' + run_models.length);

        run_models.forEach((run_model, index) => {
            console.log('Pushing run model #' + index);
            if (run_model.result.isSuite)
                Q.emit('receive', new Suite(Q, run_model));
            else if (run_model.result.isScript)
                Q.emit('receive', new Script(Q, run_model));
        });

        const run_ids = {
            suite: run_models.filter(_ => _.result.isSuite).map(_ => _.result._id),
            scripts: run_models.filter(_ => _.result.isScript).map(_ => _.result._id)
        };

        return res.status(200).send({ success: true, message: 'Successfully queued.', run_ids: run_ids });
    });
};

var getFiles = function (run, callback) {
    var files = [];
    run.forEach(function (item) {
        var x;
        var str = item.exec_path;
        if (str.substring(str.length - 3, str.length) == '.js') {
            console.log('Reading script: ' + str);
            files.push(fs.readFileSync(str, "utf8"));
        } else {
            console.log('Reading suite: ' + str);
            var scripts = [];
            var list = item.scripts;
            list.forEach(function (file) {
                scripts.push(fs.readFileSync(file.exec_path, "utf8"));
            });
            files.push(scripts);
        }
    });
    callback(files);
};

exports.getRunModels = (req, res) => {
    generate_runmodels_task(req.body, {
        name: req.query.name || req.decoded.fullname,
        username: req.query.username || req.decoded.username
    }, (error, run_models) => {
        if (error)
            return res.status(500).send('Internal Server Error: \n' + error);
        var files = [];
        getFiles(run_models, function (data) {
            files = data;
        });

        return res.status(200).send({ success: true, message: 'Scripts successfully exported', run_models: run_models, files: files });
    });
};

exports.queue_run_model_info = (req, res) => {
    const model_array = Q.getRunModelById(req.query._id);
    let model = undefined;
    if (model_array.length > 0) model = model_array[0].model;

    return res.status(200).send((model) ? model : undefined);
};

exports.getResultsByUser = (req, res) => {
    const username = req.query.username || req.decoded.username;

    return TestResult
        .find({ 'runBy.username': username })
        .sort({ runDate: -1 })
        .exec((error, results) => {
            if (error)
                return res.status(500).send({ success: false, message: 'error occured while querying test results: \n' + error });
            else
                return res.json(results);
        });
};

exports.getResultsByUserRole = (req, res) => {
    const roles = req.body.roles || req.decoded.roles;
    var isSuper = req.body.isSuper || req.decoded.isSuper;
    var isAdmin = req.body.isAdmin || req.decoded.isAdmin;

    var query = {};
    query.project = { $in: roles };

    if (isSuper || isAdmin) {
        delete query.project;
    }

    return TestResult
        .find(JSON.stringify(query))
        .sort({ runDate: -1 })
        .exec((error, results) => {
            if (error)
                return res.status(500).send({ success: false, message: 'error occured while querying test results: \n' + error });
            else
                return res.json(results);
        });
};

exports.getResultById = (req, res) => {
    const id = req.query.id || req.params.id;

    return TestResult.findById(id, (error, result) => {
        if (error)
            return res.status(500).send({ success: false, message: 'error occured while querying test result: \n' + error });
        else {
            if (result)
                return res.json(result);
            else
                return res.status(404).send({ success: false, message: 'test result was not found.' });
        }
    })
}

exports.getLiveResult = (req, res) => {
    let result = executions.filter(_ => _._id == req.query._id);
    result = (result.length > 0) ? result[0] : undefined;
    res.status(200).send(result || executions);

    if (result && result.done)
        executions.splice(executions.indexOf(result), 1);
};

exports.getResults = (req, res) => {
    var query = req.body.query || {};
    var limitRoles = req.body.options.limitRoles;
    var isSuper = req.body.options.isSuper || req.decoded.isSuper;
    var isAdmin = req.body.options.isAdmin || req.decoded.isAdmin;
    var isUserResults = req.body.options.isUserResults
    var roles = req.body.options.roles || req.decoded.roles;

    if (limitRoles && (!isSuper && !isAdmin))
        query.project = { '$in': roles };

    if (isUserResults) {
        var username = req.body.options.username || req.decoded.username;
        query['runBy.username'] = username;
    }

    return TestResult
        .find(query)
        .sort({ runDate: -1 })
        .exec((error, results) => {
            if (error)
                return res.status(500).send({ success: false, message: 'error occured while querying test results: \n' + error });
            else
                return res.status(200).send(results);
        });
};

exports.updateErrorRun = function (req, res) {
    return TestResult
        .findOneAndUpdate({ _id: req.params.id },
        { done: true, status: 'Stopped' },
        { new: true },
        function (error, testresult) {
            if (error)
                return res.status(500).send('Internal Server Error 500\n' + error);

            if (testresult.isSuite && !testresult.isScript) {
                async.eachSeries(testresult.scripts, function (script, callback) {
                    TestResult.findOneAndUpdate({ _id: script.testResultId },
                        { done: true, status: 'Stopped' },
                        function (error, scriptTestResult) {
                            if (error)
                                callback(error);
                            else
                                callback();
                        });
                }, function (error) {
                    if (error)
                        return res.status(500).send('Internal Server Error 500\n' + error);

                    return res.status(200).send(testresult);
                });
            } else {
                return res.status(200).send(testresult);
            }
        });
};
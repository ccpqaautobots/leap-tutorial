var async = require('async');
var models = require('./models-sc');
var Suite = models.Suite;
var Script = models.Script;
var Result = models.TestResult;

exports.updateTestResult = function (req, res) {
    var payload = req.body;

    // if payload is a suite
    if (payload.isSuite && !payload.isScript) {
        var newStats = {
            passed: 0,
            failed: 0,
            warning: 0
        };

        async.forEachOf(payload.scriptsResults, function (script_result, index, script_callback) {
            Result.findById(script_result._id, function (result_find_error, result_document) {
                result_document.status = script_result.status;
                result_document.remarks = script_result.remarks;
                result_document.failureCause = script_result.failureCause;
                result_document.lastUpdatedBy = req.decoded.fullname;
                newStats[script_result.status.toLowerCase()] += 1;

                if (script_result.forMaintenance) {
                    Script.findById(script_result.scriptId, function (script_find_error, script_document) {
                        script_document.status = 'Maintenance';
                        // update script 'lastUpdatedBy' ?
                        script_document.save(function (script_save_error) {
                            if (script_save_error)
                                script_callback(script_save_error);

                            result_document.save(function (result_save_error) {
                                if (result_save_error)
                                    script_callback(result_save_error);

                                script_callback();
                            });
                        });
                    });
                } else {
                    result_document.save(function (result_save_error) {
                        if (result_save_error)
                            script_callback(result_save_error);

                        script_callback();
                    });
                }
            });
        }, function (error) {
            if (error)
                return res.status(500).send(error);

            Result.findById(payload._id, function (find_error, result_document) {
                if (find_error)
                    return res.status(500).send(find_error);

                if (result_document) {
                    result_document.totalPassed = newStats.passed;
                    result_document.totalFailed = newStats.failed;
                    result_document.totalWarning = newStats.warning;
                    if (result_document.totalFailed > 0 || result_document.totalWarning > 0)
                        result_document.status = 'Failed';
                    else
                        result_document.status = 'Passed';

                    result_document.save(function (save_error) {
                        if (save_error)
                            return res.status(500).send(save_error);

                        return res.status(200).send({ success: true, message: 'Test Result Updated.' });
                    });
                } else {
                    return res.status(404).send('Test Result with id: ' + payload._id + ' was not found.');
                }
            });
        });
    }
    // else if payload is script 
    else if (!payload.isSuite && payload.isScript) {

    }
};
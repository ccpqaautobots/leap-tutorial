// import libraries
var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var models = require('../../models-sc');
var TestScript = models.Script;
var TestResult = models.TestResult;
var Scenario = models.Scenario.Scenario;

// database configuration ===========================================================
mongoose.Promise = require('bluebird'); // remove deprecated mongoose promise
mongoose.connect(require('../../../config/mongodb')(), { useMongoClient: true }); // connect to mongoose

module.exports = {
    // write function used by nightwatch - default params (result, options, done)
    write: function (results, options, done) {
        var fmodule; // store first module from the results - nightwatch result contains modules per script run
        var moduleKey;
        var identifier;

        _.forOwn(results.modules, (value, key) => {
            fmodule = value; // store module contents (object) to fmodule
            moduleKey = key; // store module key
            var moduleSplit = key.split('---'); // default key is 'Test Name --- random string'
            if (moduleSplit.length == 2)
                identifier = moduleSplit.pop().trim(); // split and get the random string, remove trailing spaces
        });

        // get test result
        TestResult.findById(new ObjectId(identifier), (error, tresult) => {
            // if error occured log the error
            if (error) {
                console.error(error);
                // terminate mongoose
                mongoose.disconnect(function () {
                    mongoose.connection.close(function () {
                        done(); // callback
                    });
                });
            } else {
                // if test result was found
                if (tresult) {
                    // set test result data
                    tresult.totalPassed = results.passed;
                    tresult.totalFailed = results.failed;
                    tresult.totalWarning = results.errors;
                    tresult.total = results.tests;
                    tresult.isFailure = (results.failed > 0) ? true : false;
                    tresult.status = (results.failed > 0 && results.status != 'Warning') ? 'Failed' : 'Passed';
                    var totalDuration = 0; // initialize duration

                    // foreach scenarios from result
                    _.forOwn(fmodule.completed, (value, key) => {
                        // add duration to total duration
                        totalDuration += value.timeMs;
                        // generate scenario object
                        var scenario = {
                            name: key,
                            passed: value.passed,
                            failed: value.failed,
                            _errors: value.errors,
                            skipped: value.skipped,
                            duration: value.timeMs,
                            isFailure: (value.failed > 0) ? true : false,
                            assertions: []
                        };

                        // foreach assertion in scenario
                        _.forOwn(value.assertions, (aValue, aKey) => {
                            // generate assertion object
                            var assertion = {
                                message: aValue.message,
                                stackTrace: aValue.stackTrace,
                                fullMsg: aValue.fullMsg,
                                isFailure: aValue.failure
                            };

                            // add assertion to scenario object
                            scenario.assertions.push(assertion);
                        });

                        // add scenario object to test result
                        tresult.scenarios.push(scenario);
                    });

                    // set test result duration to total duration
                    tresult.duration = totalDuration;

                    // get test script
                    TestScript.findById(new ObjectId(tresult.scriptId), (sError, script) => {
                        // if error occured
                        if (sError) {
                            console.error(error);
                            // terminate mongoose
                            mongoose.disconnect(function () {
                                mongoose.connection.close(function () {
                                    done(); // callback
                                });
                            });
                        } else {
                            // if script was found
                            if (script) {
                                async.forEachOf(script.scenarios, (script_scenario, script_scenario_index, script_scenario_callback) => {
                                    if (script_scenario.bound) {
                                        if (script_scenario.referenceId) {
                                            Scenario.findOne({ _id: script_scenario.referenceId }, (find_error, found_scenario) => {
                                                if (find_error)
                                                    script_scenario_callback(find_error);
                                                else {
                                                    if (found_scenario) {
                                                        script.scenarios[script_scenario_index] = found_scenario;
                                                        script_scenario_callback();
                                                    } else {
                                                        script_scenario_callback('[REPORTER] ERROR: Scenario does not exists with id: ' + script_scenario.referenceId);
                                                    }
                                                }
                                            });
                                        } else {
                                            script_scenario_callback();
                                        }
                                    } else {
                                        script_scenario_callback();
                                    }
                                }, (scenario_error) => {
                                    if (scenario_error)
                                        console.error(scenario_error);
                                    else {
                                        // iterate test script scenarios
                                        tresult.scenarios.forEach((tscenario, tsindex) => {
                                            // get script scenario by index
                                            var scriptScenario = script.scenarios[tsindex];
                                            var lastId = '';
                                            tscenario.steps = []; // initialize test script scenario steps
                                            // iterate test script scenario assertions
                                            tscenario.assertions.forEach((tsassertion, tsaindex) => {
                                                // split assertion message (format: message --- id)

                                                var fullMsg = (tsassertion.fullMsg.trim() == '') ? tsassertion.message : tsassertion.fullMsg;
                                                
                                                var assertionMessageSplit = fullMsg.split('---');
                                                var id = (assertionMessageSplit.pop() || '').trim(); // get id
                                                var message = (assertionMessageSplit.shift() || '').trim(); // get message

                                                // id must be an assertion
                                                // if an assertion failed, id is concatenated with expected and actual values
                                                // id - expected "a" actual "b"
                                                if (id.length > 24) {
                                                    id = id.replace(/\(/, '').replace(/\)/, '');
                                                    var assertionData = id.split('- ');
                                                    id = assertionData.shift().trim();
                                                    message = assertionData.join().trim();
                                                }

                                                if (scriptScenario) {
                                                    //console.log('\n ==================== SCENARIO ====================== \n');
                                                    //console.log(JSON.stringify(scriptScenario, null, 2));
                                                    // if scenario with step id exists
                                                    if (scriptScenario.steps.some(_ => _._id == id)) {
                                                        // get scenario step
                                                        var scriptStep = scriptScenario.steps.filter(_ => _._id == id)[0];
                                                        var scriptStepCopy = JSON.parse(JSON.stringify(scriptStep));
                                                        //console.log('\n ========================= STEP ========================= \n');
                                                        //console.log(JSON.stringify(scriptStep, null, 2));
                                                        //console.log('======================== RESULT ======================== \n');
                                                        //console.log(JSON.stringify(tsassertion, null, 2));
                                                        scriptStepCopy.isFailure = tsassertion.isFailure; // set step passed / failed
                                                        scriptStepCopy.message = message; // set step message
                                                        scriptStepCopy.assertions = [];
                                                        /*scriptStep.assertions = scriptStep.assertions.map((_) => {
                                                            _.message = 'NOT EXECUTED';
                                                            _.isFailure = true;
                                                            return _;
                                                        });*/
                                                        tscenario.steps.push(scriptStepCopy); // push step to test script scenario steps
                                                        //tscenario.steps[tscenario.length - 1].assertions = [];
                                                        lastId = id;
                                                    } else {
                                                        if (scriptScenario.steps.some(_ => _._id == lastId)) {
                                                            if (tscenario.steps.some(_ => _._id == lastId)) {
                                                                // get scenario step
                                                                var targetScriptStep = tscenario.steps.filter(_ => _._id == lastId)[0];
                                                                var scriptStep = scriptScenario.steps.filter(_ => _._id == lastId)[0];
                                                                if (scriptStep.assertions.some(_ => _._id == id)) {
                                                                    var stepAssertion = scriptStep.assertions.filter(_ => _._id == id)[0];
                                                                    //console.log('\n ========================= ASSERTION ============================ \n');
                                                                    //console.log(JSON.stringify(stepAssertion, null, 2));
                                                                    stepAssertion.message = message;
                                                                    stepAssertion.isFailure = tsassertion.isFailure;
                                                                    //console.log('=========================== RESULT ============================ \n');
                                                                    //console.log(JSON.stringify(tsassertion, null, 2));
                                                                    targetScriptStep.isFailure = (scriptStep.isFailure) ? true : tsassertion.isFailure; // override step failure when assertion failed
                                                                    targetScriptStep.assertions.push(stepAssertion);
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            });
                                        });

                                        // save test script
                                        tresult.save((saveError) => {
                                            if (saveError) {
                                                // if error occured
                                                console.error(saveError);
                                                done();
                                            } else {
                                                // terminate mongoose
                                                mongoose.disconnect(function () {
                                                    mongoose.connection.close(function () {
                                                        done();
                                                    });
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                // log error
                                console.error('[REPORTER] ERROR: No test script was found with id: ' + tresult.scriptId);
                                // terminate mongoose
                                mongoose.disconnect(function () {
                                    mongoose.connection.close(function () {
                                        done(); // callback
                                    });
                                });
                            }
                        }
                    });
                } else {
                    // log error
                    console.error('[REPORTER] ERROR: No test result was found with id: ' + identifier);
                    // terminate mongoose
                    mongoose.disconnect(function () {
                        mongoose.connection.close(function () {
                            done(); // callback
                        });
                    });
                }
            }
        });
    }
};
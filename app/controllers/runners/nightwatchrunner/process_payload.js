const fs = require('fs');
const path = require('path');
const async = require('async');
const crypto = require("crypto");
const config = require('./config');
const ObjectId = require('mongoose').Types.ObjectId;
const ScriptGenerator = require('./script-generator');

module.exports = (payload, callback) => {
    const data = {
        scripts: [],
        suites: []
    };

    async.parallel([
        (first_callback) => {
            var scripts_data = [];
            async.forEachOf(payload.scripts, (payload_script, i, script_callback) => {
                const test_script_resultId = new ObjectId();
                const generated = new ScriptGenerator(payload_script, payload.options);
                generated.initialize((init_error, init_result) => {
                    if (init_error)
                        first_callback(init_error);
                    else {
                        generated.compile((compile_error, compile_result) => {
                            if (compile_error)
                                first_callback(compile_error);
                            else {
                                generated.save(test_script_resultId, config.path.scripts, (save_error, location) => {
                                    if (save_error)
                                        first_callback(save_error);
                                    else {
                                        scripts_data.push({ script_id: test_script_resultId, script_dir: location, script: payload_script, options: payload.options });
                                        script_callback();
                                    }
                                })
                            }
                        });
                    }
                });
            }, (script_error) => {
                if (script_error)
                    callback(script_error);
                else
                    first_callback(null, scripts_data);
            });
        },
        (second_callback) => {

            var suites_data = [];
            async.forEachOf(payload.suites, (payload_suite, i, suite_callback) => {
                const test_suite_resultId = new ObjectId();
                const test_suite_directory_name = crypto.randomBytes(16).toString("hex");
                const test_suite_directory = path.join(config.path.suites, test_suite_directory_name);
                const test_suite_directory_full = path.join(__dirname, test_suite_directory);
                const test_script_ids = [];
                const suite_model = {
                    suite_id: test_suite_resultId,
                    suite_dir: test_suite_directory_full,
                    suite: payload_suite,
                    options: payload.options,
                    scripts: []
                };

                if (!fs.existsSync(test_suite_directory_full))
                    fs.mkdirSync(test_suite_directory_full);

                async.forEachOf(payload_suite.scripts, (payload_script, j, script_callback) => {
                    const test_script_resultId = new ObjectId();
                    const generated = new ScriptGenerator(payload_script, payload.options);
                    const script_model = {
                        script_id: test_script_resultId,
                        script_dir: undefined,
                        script: payload_script,
                        options: payload.options
                    };

                    generated.initialize((init_error, init_result) => {
                        if (init_error)
                            second_callback(init_error);
                        else {
                            generated.compile((compile_error, compile_result) => {
                                if (compile_error)
                                    second_callback(compile_error);
                                else {
                                    generated.save(test_script_resultId, test_suite_directory, (save_error, location) => {
                                        if (save_error)
                                            second_callback(save_error);
                                        else {
                                            script_model.script_dir = location;
                                            test_script_ids.push(payload_script._id);
                                            suite_model.scripts.push(script_model);
                                            script_callback();
                                        }
                                    })
                                }
                            });
                        }
                    });
                }, (script_error) => {
                    if (script_error)
                        callback(script_error);
                    else {
                        suite_model.suite.scripts = undefined;
                        suite_model.suite.scripts = test_script_ids;
                        suites_data.push(suite_model);
                        suite_callback();
                    }
                });
            }, (suite_error) => {
                if (suite_error)
                    callback(suite_error);
                else 
                    second_callback(null, suites_data);
            });
        }
    ], (error, parallel_callback_data) => {
        if (error)
            callback(error);
        else {
            var clean_data = [];
            parallel_callback_data.forEach((callback_data) => {
                if (callback_data instanceof Array) {
                    callback_data.forEach((array_data) => {
                        clean_data.push(array_data);
                    });
                } else {
                    clean_data.push(callback_data);
                }
            });
            callback(null, clean_data);
        }
    });
};
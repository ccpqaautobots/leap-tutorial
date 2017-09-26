const async = require('async');
const Result = require('../../../models/testresult');

module.exports = (payload, user, callback) => {
    const run_models = [];

    async.forEachOf(payload, (payload_data, i, foreach_callback) => {
        const test_result = new Result();
        test_result.runBy = { name: user.name, username: user.username };

        if (payload_data.script_id) {
            test_result.isScript = true;
            test_result._id = payload_data.script_id;
            test_result.project = payload_data.script.project;
            test_result.projectName = payload_data.script.projectName;
            test_result.testName = payload_data.script.testName;
            test_result.module = payload_data.script.module;   
            test_result.cycle = payload_data.script.cycle;         
            test_result.author = payload_data.script.author;
            test_result.scriptId = payload_data.script._id;
            test_result.options = payload_data.options;

            run_models.push({
                result: test_result,
                exec_path: payload_data.script_dir
            });
            foreach_callback();
        } else if (payload_data.suite_id) {
            test_result.isSuite = true;
            test_result._id = payload_data.suite_id;
            test_result.suiteId = payload_data.suite._id;
            test_result.project = payload_data.suite.project;
            test_result.projectName = payload_data.suite.projectName;
            test_result.module = payload_data.suite.module;
            test_result.cycle = payload_data.suite.cycle;   
            test_result.testName = payload_data.suite.suiteName;        
            test_result.author = payload_data.suite.author;
            test_result.type = 'Suite';
            test_result.options = payload_data.options;
            test_result.scripts = [];
            
            const suite_run_model = {
                result: test_result,
                exec_path: payload_data.suite_dir,
                scripts: []
            };

            payload_data.scripts.forEach((script_data) => {
                const script_test_result = new Result();
                script_test_result.isSuite = true;
                script_test_result.isScript = true;
                script_test_result.suiteId = payload_data.suite._id;
                script_test_result.referenceId = payload_data.suite_id;
                script_test_result._id = script_data.script_id;
                script_test_result.project = script_data.script.project;
                script_test_result.projectName = script_data.script.projectName;
                script_test_result.testName = script_data.script.testName;
                script_test_result.module = script_data.script.module;      
                script_test_result.cycle = script_data.script.cycle;      
                script_test_result.author = script_data.script.author;
                script_test_result.scriptId = script_data.script._id;
                script_test_result.options = script_data.options;
                test_result.scripts.push({
                    scriptId: script_data.script._id,
                    testResultId: script_data.script_id
                });
                suite_run_model.scripts.push({
                    result: script_test_result,
                    exec_path: script_data.script_dir
                });
            });

            run_models.push(suite_run_model);
            foreach_callback();
        } else {
            foreach_callback('malformed payload received: \n' + payload_data);
        }
    }, (error) => {
        if (error)
            callback(error);
        else
            callback(null, run_models);
    });
};
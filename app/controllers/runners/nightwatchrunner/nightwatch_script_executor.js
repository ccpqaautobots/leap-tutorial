var spawn = require('child_process').spawn;
const config = require('./config');
const Result = require('../../../models/testresult');

function convertToEntity(data) {
    return data.toString().replace(new RegExp(/</, 'g'), '&lt;').replace(new RegExp(/>/, 'g'), '&gt;');
};

module.exports = class ScriptExecutor {
    constructor(run_model, options) {
        this.options = options || {};
        this.nightwatch_config = this.options.nightwatch_config || config.nightwatch_config;
        this.nightwatch_reporter = this.options.nightwatch_reporter || config.nightwatch_reporter;

        this.run_model = run_model;
        this.status = {
            done: false,
            running: false
        };
        
        this.preSave = this._save.bind(this);
        this.preSave();
    };

    _save() {
        // pre save
        this.run_model.result.save((error) => {
            if (error) {
                console.error(error);
            }
        });
    }

    execute(callback) {
        if (this.status.running)
            return;

        if (this.run_model.result.status == 'Queued') {
            this.status.running = true;
            this.run_model.result.status = 'Running';
        }

        const args = [
            './node_modules/nightwatch/bin/nightwatch',
            '--test', this.run_model.exec_path,
            '--config', this.nightwatch_config,
            '--reporter', this.nightwatch_reporter
        ];

        const nightwatch_process = spawn('node', args);
        let warning = false;

        this.run_model.result.save((error, saved_test_result) => {
            if (error) {
                console.error(error);
            }

            this.run_model.result.logs += `Run id: ${this.run_model.result._id}\n`;
            this.run_model.result.logs += 'Configuring nightwatch complete .......\n';

            nightwatch_process.stdout.on('data', (data) => {
                this.run_model.result.logs += `${convertToEntity(data)}\n`;
            });

            nightwatch_process.stderr.on('data', (data) => {
                warning = true;
                this.run_model.result.logs += `${convertToEntity(data)}\n`;
            });

            nightwatch_process.on('close', (code) => {
                this.run_model.result.logs += `Exited with code ${code}\n`;
                this.run_model.result.logs += "================================================\n";
                this.run_model.result.logs += 'Testscript run done .......\n';
                this.status.done = true;
                this.run_model.result.done = true;
                Result.findById(this.run_model.result._id, (find_error, _testresult) => {
                    if (find_error) {
                        console.error(find_error);
                        callback(find_error);
                    } else {
                        if (_testresult) {
                            _testresult.logs += this.run_model.result.logs;
                            _testresult.done = true;
                            if ((_testresult.totalPassed == 0 || _testresult.totalFailed == 0) && warning)
                                _testresult.status = 'Warning';

                            _testresult.save((save_error) => {
                                if (save_error) {
                                    console.error(save_error);
                                    callback(save_error);
                                } else {
                                    callback(null, _testresult);
                                }
                            });
                        } else {
                            const missing_test_result_message = '[EXECUTION] ERROR: No test result was found with id: ' + this.run_model.result._id;
                            console.error(missing_test_result_message);
                            callback(missing_test_result_message);
                        }
                    }
                });
            });
        });
    }
};
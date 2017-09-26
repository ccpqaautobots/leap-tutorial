var console = require('../../../helpers/consoleOverride')(console);
var spawn = require('child_process').spawn;
const config = require('./config');
const Result = require('../../../models/testresult');
const selenium_config = require('../../../config/selenium');
const EventEmitter = require('events').EventEmitter;

function convertToEntity(data) {
    return data.toString().replace(new RegExp(/</, 'g'), '&lt;').replace(new RegExp(/>/, 'g'), '&gt;');
};

class Script extends EventEmitter {
    constructor(parent, model, options) {
        super();
        this.parent = parent;
        this.model = model;
        
        this.options = options || {};
        this.nightwatch_config = this.options.nightwatch_config || config.nightwatch_config;
        this.nightwatch_reporter = this.options.nightwatch_reporter || config.nightwatch_reporter;

        this.running = false;

        // save model
        this.model.result.save();

        // events
        this.once('execute', this.onExecute);
        this.on('done', this.onDone);
    }

    onExecute(callback) {
        this.running = true;
        this.model.result.status == 'Running';

        const args = [
            './node_modules/nightwatch/bin/nightwatch',
            '--test', this.model.exec_path,
            '--config', this.nightwatch_config,
            '--reporter', this.nightwatch_reporter,
            '--env', 'default'
        ];

        const nightwatch_process = spawn('node', args);
        let warning = false;
        let first = true;
        
        this.model.result.save((error, saved_result) => {
            console.log('ready to execute script...');
            if (error) console.error(error);

            this.model.result.logs += `Run id: ${this.model.result._id}\n`;
            this.model.result.logs += 'Configuring nightwatch complete ...\n';
            this.model.result.logs += `Selenium server: ${selenium_config.host}:${selenium_config.port}`;

            nightwatch_process.stdout.on('data', (data) => {
                if (first) { console.log('callback will fire'); callback(); first = false; };
                this.model.result.logs += `${convertToEntity(data)}\n`;
            });

            nightwatch_process.stderr.on('data', (data) => {
                if (first) { console.log('callback will fire'); callback(); first = false; };
                warning = true;
                this.model.result.logs += `${convertToEntity(data)}\n`;
            });

            nightwatch_process.on('close', (code) => {
                this.model.result.logs += `Exited with code ${code}\n`;
                this.model.result.logs += "================================================\n";
                this.model.result.logs += 'Testscript run done .......\n';
                this.model.result.done = true;
                Result.findById(this.model.result._id, (find_error, _testresult) => {
                    if (find_error) {
                        console.error(find_error);
                        return callback(find_error);
                    } else {
                        if (_testresult) {
                            _testresult.logs += this.model.result.logs;
                            _testresult.done = true;
                            if ((_testresult.totalPassed == 0 || _testresult.totalFailed == 0) && warning)
                                _testresult.status = 'Warning';

                            _testresult.save((save_error) => {
                                if (save_error) {
                                    console.error(save_error);
                                    this.emit('done', null);
                                } else {
                                    if (this.parent.constructor.name == 'Q')
                                        this.emit('done', this);
                                    else
                                        this.emit('done', _testresult);
                                }
                            });
                        } else {
                            const missing_test_result_message = '[EXECUTION] ERROR: No test result was found with id: ' + this.model.result._id;
                            console.error(missing_test_result_message);
                            this.emit('done', null);
                        }
                    }
                });
            });
        });
    }

    onDone(result) {
        this.parent.emit('done', result || this);
    }
};

module.exports = Script;
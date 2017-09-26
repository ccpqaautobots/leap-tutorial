const async = require('async');
const spawn = require('child_process').spawn;
const selenium_grid = require('selenium-grid-status');
const config = require('./config');
const models = require('../../models-sc');
const Result = models.TestResult;
const script_executor = require('./nightwatch_script_executor');
const seleniumConfig = require('../../../config/selenium');

function convertToEntity(data) {
    return data.toString().replace(new RegExp(/</, 'g'), '&lt;').replace(new RegExp(/>/, 'g'), '&gt;');
};

module.exports = class SuiteExecutor {
    constructor(run_model, options) {
        this.options = options || {};
        this.host = seleniumConfig.host || '127.0.0.1';
        this.port = seleniumConfig.port || 4444;
        this.nightwatch_config = this.options.nightwatch_config || config.nightwatch_config;
        this.nightwatch_reporter = this.options.nightwatch_reporter || config.nightwatch_reporter;

        this.run_model = run_model;
        this.run_model.scripts_executable = [];
        this.run_model.scripts_executable_results = [];
        this.run_model.scripts_executable_duration = 0;
        this.run_model.scripts.forEach((script) => {
            this.run_model.scripts_executable.push(new script_executor(script));
        });
        this.status = {
            total: this.run_model.scripts_executable.length,
            running: false,
            completed: 0,
            done: false
        };

        this.queued = [];
        this.onqueue = [];
        this.lock_model_fetcher = false;

        this.update_suite_info = this._update_suite_info.bind(this);
        this.checkGrid = this._checkGrid.bind(this);
        this.getModelsForExecution = this._getModelsForExecution.bind(this);
        this.executeModels = this._executeModels.bind(this);
        this.cleanUpExecutionModels = this._cleanUpExecutionModels.bind(this);
        this.preSave = this._save.bind(this);
        this.preSave();
        this.executeModelsFetcher = setInterval(this.getModelsForExecution, 10000);
    };

    _checkGrid(callback) {
        selenium_grid.available({
            host: this.host,
            port: this.port
        }, (error, status) => {
            if (error)
                callback('[SELENIUM GRID WATCHER] ERROR: ' + error);

            if (status) {
                if (status.length > 0) {
                    let nodes = {
                        firefox: 0,
                        ie: 0,
                        chrome: 0
                    };

                    status.forEach((hub) => {
                        const firefox_nodes = hub.browser.filter(_ => _.browserName == 'firefox').length;
                        const ie_nodes = hub.browser.filter(_ => _.browserName == 'internet explorer').length;
                        const chrome_nodes = hub.browser.filter(_ => _.browserName == 'chrome').length;

                        nodes.firefox += firefox_nodes;
                        nodes.ie += ie_nodes;
                        nodes.chrome += chrome_nodes;
                    });

                    callback(null, nodes);
                }
                callback(null);
            } else {
                callback(null);
            }
        });
    };

    _executeModels() {
        if (this.lock_model_executor) {
            //console.log('[EXECUTION] Status: Cancelled currently locked...');
            callback(true);
        }

        this.lock_model_executor = true;
        async.forEachOf(this.queued, (queued_object, index, async_callback) => {
            if (!queued_object.status.running) {
                queued_object.execute((execute_error, execute_result) => {
                    if (execute_error)
                        console.error(execute_error);

                    this.update_suite_info(execute_result);
                });
                async_callback();
            } else {
                async_callback();
            }
        }, (error) => {
            if (error)
                console.error('[EXECUTOR] ERROR: ' + error);

            this.lock_model_executor = false;
        });
    };

    _getModelsForExecution() {
        if (this.lock_model_fetcher)
            return; //console.log('[RUN MODEL QUEUER] Status: Cancelled currently locked...');

        this.checkGrid((grid_error, available_nodes) => {
            if (grid_error)
                return console.error(grid_error);

            const nodes = available_nodes;
            //console.log('[RUN MODEL QUEUER] Status: Available nodes: ' + JSON.stringify(nodes));
            if (this.onqueue.length > 0) {
                //console.log('[RUN MODEL QUEUER] Status: Total Queued: ' + this.onqueue.length);
                this.lock_model_fetcher = true;
                async.forEachOf(this.onqueue, (queued_object, index, callback) => {
                    if (!nodes || nodes.firefox <= 0)
                        return callback('No nodes available...');

                    if (!queued_object.status.done) {
                        if (queued_object.run_model.result.isScript) {
                            //console.log('[SCRIPT] Script model found...');
                            nodes.firefox -= 1;
                            //console.log('[SCRIPT] Total nodes after script: ' + nodes.firefox);
                            this.queued.push(queued_object);
                            callback();
                        }
                    }
                }, (status) => {
                    //if (status)
                    //    console.log('[RUN MODEL QUEUER] Status: ' + status);
                    //else
                    //    console.log('[RUN MODEL QUEUER] Status: Fetching models done...');

                    //console.log('[RUN MODEL QUEUER] Status: Total Queued: ' + this.onqueue.length);
                    //console.log('[RUN MODEL QUEUER] Status: Total Queued for execution: ' + this.queued.length);
                    //console.log('[RUN MODEL QUEUER] Status: Executing runs...');
                    this.cleanUpExecutionModels((done) => {
                        this.lock_model_fetcher = false;
                        this.executeModels();
                    });
                });
            } else {
                //console.log('[RUN MODEL QUEUER] Status: Nothing is queued...');
                this.cleanUpExecutionModels((done) => {
                    this.lock_model_fetcher = false;
                    this.executeModels();
                });
            }
        });
    };

    _cleanUpExecutionModels(callback) {
        this.queued.forEach((queued_object, iteration) => {
            const id = queued_object.run_model.result._id;
            if (this.onqueue.some(_ => _.run_model.result._id == id)) {
                this.onqueue.splice(this.onqueue.filter(_ => _.run_model.result._id == id)[0], 1);
            }
        });
        callback(true);
    };

    _save() {
        this.run_model.result.save((error) => {
            if (error)
                console.error(error);
        });
    }

    _update_suite_info(completed_run_model) {
        this.status.completed++;
        this.run_model.scripts_executable_results.push(completed_run_model);
        this.run_model.scripts_executable_duration += completed_run_model.duration || 0;
        this.run_model.result.logs += `${completed_run_model.testName} execution completed (${completed_run_model.duration} ms)..
        Results: ${completed_run_model.totalPassed} / ${completed_run_model.total}\n
        Suite status: ${this.run_model.scripts_executable_results.length} completed out of ${this.run_model.scripts_executable.length}\n`;

        if (this.run_model.scripts_executable.length == this.run_model.scripts_executable_results.length) {
            clearInterval(this.executeModelsFetcher);
            this.run_model.result.done = true;
            this.status.done = true;
            const status = (this.run_model.scripts_executable_results.some(_ => _.isFailure) || (this.run_model.scripts_executable_results.some(_ => _.status == 'Warning'))) ? 'Failed' : 'Passed';
            this.run_model.result.status = status;

            this.run_model.result.total = this.run_model.scripts_executable_results.length;
            this.run_model.result.totalPassed = this.run_model.scripts_executable_results.filter(_ => _.status == 'Passed').length;
            this.run_model.result.totalFailed = this.run_model.scripts_executable_results.filter(_ => _.status == 'Failed').length;
            this.run_model.result.totalWarning = this.run_model.scripts_executable_results.filter(_ => _.status == 'Warning').length;
            this.run_model.result.duration = this.run_model.scripts_executable_duration;

            this.run_model.result.logs += `Suite execution done ...`;
        }

        this.run_model.result.save((error, saved_test_result) => {
            if (error)
                this.run_model.result.logs += `[SUITE] ERROR: error while saving suite results: ${error}`;
        });
    };

    execute(callback) {
        if (this.run_model.result.status == 'Queued') {
            this.status.running = true;
            this.run_model.result.status = 'Running';
            this.run_model.result.logs += `Executing test suite: ${this.run_model.result.testName}\n`;
        }

        async.forEachOf(this.run_model.scripts_executable, (executable, index, async_callback) => {
            this.run_model.result.logs += `Executing test script: ${executable.run_model.result.testName} --- ${executable.run_model.result._id}\n`;
            this.onqueue.push(executable);
        }, (error) => {
            if (error)
                callback(error);
            else
                callback(null);
        });
    };
};
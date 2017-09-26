const async = require('async');
const selenium_grid = require('selenium-grid-status');
const nightwatch_suite_executor = require('./nightwatch_suite_executor');
const nightwatch_script_executor = require('./nightwatch_script_executor');
const seleniumConfig = require('../../../config/selenium');
const nightwatchConfigGenerator = require('./nightwatch_config_generator');

class Queuer {
    constructor(host, port, interval) {
        this.host = host || seleniumConfig.host || '127.0.0.1';
        this.port = port || seleniumConfig.port || 4444;
        this.queued = [];
        this.onqueue = [];
        this.dequeue = [];
        this.lock_model_fetcher = false;
        this.lock_model_executor = false;

        this.checkGrid = this._checkGrid.bind(this);
        this.getModelsForExecution = this._getModelsForExecution.bind(this);
        this.executeModels = this._executeModels.bind(this);
        this.cleanUpExecutionModels = this._cleanUpExecutionModels.bind(this);
        this.cleanUpCompletedModels = this._cleanUpCompletedModels.bind(this);
        this.executeModelsFetcher = setInterval(this.getModelsForExecution, 20000);
        nightwatchConfigGenerator((error, data) => {
            if (error)
                throw new Error('[SELENIUM SERVER QUEUER] Failed to generate nightwatch config: ' + error);

            console.log('[SELENIUM SERVER QUEUER] Nightwatch config generated ...');
        });
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

    _executeModels(callback) {
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
                });
                async_callback();
            } else {
                async_callback();
            }
        }, (error) => {
            if (error)
                console.error('[EXECUTOR] ERROR: ' + error);

            this.lock_model_executor = false;
            callback(true);
        });
    };

    _getModelsForExecution() {
        if (this.lock_model_fetcher)
            return;// console.log('[RUN MODEL QUEUER] Status: Cancelled currently locked...');

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
                        if (queued_object.run_model.result.isSuite) {
                            //console.log('[SUITE] Suite model found...');
                            //console.log('[SUITE] Total needed nodes: ' + queued_object.status.total + ', total nodes: ' + nodes.firefox);
                            if (queued_object.status.total > nodes.firefox) {
                                //console.log('[SUITE] Suite needs more node than provided...');
                                nodes.firefox -= queued_object.status.total;
                                //console.log('[SUITE] Total nodes after suite (large): ' + nodes.firefox);
                                this.queued.push(queued_object);
                                callback('Suite occupied all available nodes...');
                            } else {
                                //console.log('[SUITE] Suite does not need all nodes...');
                                nodes.firefox -= queued_object.status.total;
                                //console.log('[SUITE] Total nodes after suite (enough): ' + nodes.firefox);
                                this.queued.push(queued_object);
                                callback();
                            }
                        } else if (queued_object.run_model.result.isScript) {
                            //console.log('[SCRIPT] Script model found...');
                            nodes.firefox -= 1;
                            //console.log('[SCRIPT] Total nodes after script: ' + nodes.firefox);
                            this.queued.push(queued_object);
                            callback();
                        }
                    }
                }, (status) => {
                    //if (status)
                        //console.log('[RUN MODEL QUEUER] Status: ' + status);
                    //else
                        //console.log('[RUN MODEL QUEUER] Status: Fetching models done...');

                    this.cleanUpExecutionModels((done) => {
                        this.lock_model_fetcher = false;
                        //console.log('[RUN MODEL QUEUER] Status: Total Queued: ' + this.onqueue.length);
                        //console.log('[RUN MODEL QUEUER] Status: Total Queued for execution: ' + this.queued.length);
                        //console.log('[RUN MODEL QUEUER] Status: Executing runs...');
                        this.executeModels((done) => {
                            //console.log('[RUN MODEL QUEUER] Status: Cleaning finished runs...');
                            this.cleanUpCompletedModels();
                        });
                    });
                });
            } else {
                //console.log('[RUN MODEL QUEUER] Status: Nothing is queued...');
                this.cleanUpExecutionModels((done) => {
                    this.lock_model_fetcher = false;
                    //console.log('[RUN MODEL QUEUER] Status: Executing runs...');
                    this.executeModels((done) => {
                        //console.log('[RUN MODEL QUEUER] Status: Cleaning finished runs...');
                        this.cleanUpCompletedModels();
                    });
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

    _cleanUpCompletedModels() {
        for (var i = this.queued.length; i-- > 0;) {
            if (this.queued[i].status.done)
                this.queued.splice(i, 1);
        }
    };

    _getAvailableRunModel(limit, callback) {
        //console.log('getting available run model');
        this.queue.forEach((queued, i) => {
            if (queued.run_model.result.isSuite) {
                //console.log('entered a suite run model');
                if (!queued.status.done) {
                    const nodes_needed = queued.status.total - queued.status.running;
                    if (nodes_needed > 0) {
                        callback(null, queued);
                    } else {
                        //console.log('nodes needed is less than 0');
                        // do nothing
                    }
                } else {
                    //console.log('suite status is done');
                    // do nothing
                }
            } else if (queued.run_model.result.isScript) {
                if (!queued.status.running) {
                    //console.log('entered a script run model');
                    callback(null, queued);
                } else {
                    //console.log('script status is running');
                    // do nothing
                }
            }
        });
    };

    executeQueued(browser) {
        this.queue.forEach((queued, i) => {
            if (queued.run_model.result.done) {
                this.queue.splice(i, 1);
                //console.log('deleting item done...');
            }
        });

        this.checkGrid((check_grid_error, check_grid_results) => {
            console.log('execution locked: ' + this.locked);
            if (check_grid_error) {
                this.locked = false;
                console.error(check_grid_error);
                return;
            } else {
                this.locked = true;
                const browser_nodes = check_grid_results;
                //console.log(browser_nodes);
                async.whilst(
                    () => { /*console.log(browser_nodes.firefox > 0);*/ return browser_nodes.firefox > 0; },
                    (callback) => {
                        //console.log('entering queued executor...');
                        this.getAvailableRunModel(browser_nodes.firefox, (fetch_error, fetch_model) => {
                            //console.log('callback occured');
                            if (fetch_error)
                                callback(fetch_error);
                            else if (fetch_model) {
                                if (fetch_model.run_model.result.isSuite) {
                                    //console.log('model was a suite...');
                                    const nodes_needed = fetch_model.status.total - fetch_model.status.running;
                                    //console.log('total suite nodes needed: ' + nodes_needed);
                                    if (nodes_needed > 0 && browser_nodes.firefox > 0) {
                                        //console.log('executing suite...');
                                        fetch_model.execute(browser_nodes.firefox, (execute_error) => {
                                            if (execute_error)
                                                callback(execute_error);
                                            else {
                                                //console.log('suite callback occured...');
                                                browser_nodes.firefox -= (nodes_needed > browser_nodes.firefox) ?
                                                    browser_nodes.firefox : nodes_needed;

                                                //console.log('current available nodes after suite: ' + browser_nodes.firefox);
                                                callback();
                                            }
                                        });
                                    } else {
                                        //console.log('no available nodes or suite does not need anymore node...');
                                    }
                                } else if (fetch_model.run_model.result.isScript) {
                                    if (browser_nodes.firefox > 0) {
                                        //console.log('model was a script...');
                                        fetch_model.execute((execute_error) => {
                                            //console.log('script callback was called: ' + execute_error);
                                            if (execute_error)
                                                callback(execute_error);
                                            else {
                                                browser_nodes.firefox--;
                                                //console.log('current available nodes after script: ' + browser_nodes.firefox);
                                                callback();
                                            }
                                        });
                                    } else {
                                        //console.log('no available nodes');
                                    }
                                }
                            }
                        });
                    },
                    (error) => {
                        if (error)
                            console.error(error);

                        this.locked = false;
                    }
                );
            }
        });
    }

    stopWatcher() {
        clearInterval(this.gridWatcher);
    };

    startWatcher() {
        this.gridWatcher = setInterval(checkGrid(), interval || 10000);
    };

    getStatus() {
        return this.browsers;
    };

    getRunModelById(id) {
        return this.queued.filter(_ => _.run_model.result._id == id);
    };

    enqueue(run_model) {
        if (run_model.result.isSuite)
            this.onqueue.push(new nightwatch_suite_executor(run_model));
        else if (run_model.result.isScript)
            this.onqueue.push(new nightwatch_script_executor(run_model));
    };
};

module.exports = (host, port, interval) => {
    return new Queuer(host, port, interval);
};
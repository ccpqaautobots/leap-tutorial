var console = require('../../../helpers/consoleOverride')(console);
const async = require('async');
const selenium_grid = require('selenium-grid-status');
const EventEmitter = require('events').EventEmitter;
const Script = require('./nightwatch_script');
const Suite = require('./nightwatch_suite');
const selenium_config = require('../../../config/selenium');
const nightwatchConfigGenerator = require('./nightwatch_config_generator');

const eventify = function (array, callback) {
    array.push = function (e) {
        Array.prototype.push.call(array, e);
        callback(array);
    }
}

class Q extends EventEmitter {
    constructor() {
        super();
        this.queue = [];
        this.lockTrigger = false;

        this.on('receive', this.onReceive);
        this.on('trigger', this.onTrigger);
        this.on('done', this.onDone);

        setInterval(() => { if (this.lockTrigger) return; this.emit('trigger') }, 30000); // run queue every
        nightwatchConfigGenerator((error, data) => {
            if (error)
                throw new Error('[SELENIUM SERVER QUEUER] Failed to generate nightwatch config: ' + error);

            console.log('[SELENIUM SERVER QUEUER] Nightwatch config generated ...');
        });
    }

    getRunModelById(id) {
        return this.queue.filter(_ => _.model.result._id == id);
    }

    onReceive(model) {
        this.queue.push(model);
    }

    onTrigger() {
        console.log('triggering queuer: locked ' + this.lockTrigger);
        this.getGridStatus((error, nodes) => {
            if (error)
                return console.error(error); // cancel execution

            this.lockTrigger = true;

            console.log('total queued: ' + this.queue.length);

            async.eachSeries(this.queue, (queued, callback) => {
                if (!nodes.firefox || nodes.firefox <= 0)
                    return callback('no nodes available');
                else {
                    if (queued instanceof Suite) {
                        console.log('suite found... 1');
                        if (!queued.running) {
                            console.log('executing suite... 1');
                            queued.emit('execute', () => {
                                console.log('callback happened... 1');
                                nodes.firefox -= queued.model.scripts.length;
                                callback();
                            });
                        } else {
                            const not_executed = queued.scripts_executable.filter(_ => !_.running);
                            if (not_executed.length > 0) {
                                return callback('cancelling trigger, suite not done yet... 1');
                            } else {
                                console.log('skipping already running... 1');
                                callback();
                            }
                        }
                    } else if (queued instanceof Script) {
                        console.log('script found... 2')
                        if (!queued.running) {
                            console.log('executing script... 2');
                            queued.emit('execute', () => {
                                console.log('callback happened... 2');
                                nodes.firefox -= 1;
                                callback();
                            });
                        } else {
                            console.log('skipping already running... 2');
                            callback();
                        }
                    }
                }
            }, (error) => {
                if (error)
                    console.log(error);

                this.lockTrigger = false;
            });
        });
    }

    onDone(model) {
        if (this.queue.indexOf(model) != -1) {
            this.queue.splice(this.queue.indexOf(model), 1);
        }
    }
}

Q.prototype.getGridStatus = (callback) => {
    selenium_grid.available({
        host: selenium_config.host,
        port: selenium_config.port
    }, (error, status) => {
        if (error)
            return callback('[SELENIUM GRID WATCHER] WARN: ' + error);

        if (status) {
            if (status.length > 0) {
                const nodes = {};

                status.forEach((hub) => {
                    hub.browser.forEach((node) => {
                        let browserName = node.browserName.replace(/\s\S/, '_');
                        if (nodes[browserName])
                            nodes[browserName] += 1;
                        else
                            nodes[browserName] = 1;
                    });
                });

                return callback(null, nodes);
            }
        }
        callback('[SELENIUM GRID WATCHER] No nodes available.');
    });
}

module.exports = new Q();
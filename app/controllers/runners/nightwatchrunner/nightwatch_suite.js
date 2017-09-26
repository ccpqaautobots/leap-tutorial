var console = require('../../../helpers/consoleOverride')(console);
const async = require('async');
const spawn = require('child_process').spawn;
const config = require('./config');
const Result = require('../../../models/testresult');
const EventEmitter = require('events').EventEmitter;
const Script = require('./nightwatch_script');

function convertToEntity(data) {
    return data.toString().replace(new RegExp(/</, 'g'), '&lt;').replace(new RegExp(/>/, 'g'), '&gt;');
};

class Suite extends EventEmitter {
    constructor(parent, model, options) {
        super();
        this.parent = parent;
        
        this.options = options || {};
        this.nightwatch_config = this.options.nightwatch_config || config.nightwatch_config;
        this.nightwatch_reporter = this.options.nightwatch_reporter || config.nightwatch_reporter;

        this.model = model;
        this.scripts_executable = this.model.scripts.map((script) => { return new Script(this, script); });
        this.scripts_executable_results = [];
        this.scripts_executable_duration = 0;
        this.total = this.scripts_executable.length;
        this.completed = 0;
        this.lock = false;

        this.running = false;

        this.model.result.save();

        // events
        this.once('execute', this.onExecute);
        this.on('re_execute', this.onExecute);
        this.on('all_done', this.onCompleted);
        this.on('done', this.onDone);
    }

    onExecute(callback) {
        if (this.lock)
            return;

        this.lock = true; // lock to handle async returns

        console.log(`suite was executed: ${this.model.result._id} ...`);
        if (this.model.result.status == 'Queued') {
            this.running = true;
            this.model.result.status = 'Running';
            this.model.result.logs += `Executing test suite: ${this.model.result.testName}\n`;
        }

        this.parent.getGridStatus((error, nodes) => {
            if (error)
                return console.error(error);

            console.log('suite found nodes: ' + nodes.firefox);
            async.timesSeries(nodes.firefox || 0, (n, next) => {
                const queued = this.scripts_executable.filter(_ => !_.running);
                if (queued.length > 0) {
                    queued[0].emit('execute', () => {
                        console.log('callback from script...');
                        this.model.result.logs += `Executing test script: ${queued[0].model.result.testName} --- ${queued[0].model.result._id}\n`;
                        console.log(`${queued[0].model.result.testName} was executed...`);
                        console.log('going to next script...');
                        next();
                    });
                } else {
                    next();
                }
            }, (error) => {
                this.lock = false; // unlock to allow async triggers
                callback();
            });
        });
    }

    onDone(script_result) {
        this.completed++;

        this.scripts_executable_results.push(script_result);
        this.scripts_executable_duration += script_result.duration || 0;
        console.log('Total time: ' + script_result.duration);
        this.model.result.logs += `${script_result.testName} execution completed (${script_result.duration} ms)..
        Results: ${script_result.totalPassed} / ${script_result.total}\n
        Suite status: ${this.scripts_executable_results.length} completed out of ${this.scripts_executable.length}\n`;

        if (this.total == this.completed) {
            this.emit('all_done');
        }

        this.emit('re_execute', () => { });
    }

    onCompleted() {
        this.model.result.done = true;
        const status = (this.scripts_executable_results.some(_ => _.isFailure) || (this.scripts_executable_results.some(_ => _.status == 'Warning'))) ? 'Failed' : 'Passed'; // update this
        this.model.result.status = status;

        this.model.result.total = this.scripts_executable_results.length;
        this.model.result.totalPassed = this.scripts_executable_results.filter(_ => _.status == 'Passed').length;
        this.model.result.totalFailed = this.scripts_executable_results.filter(_ => _.status == 'Failed').length;
        this.model.result.totalWarning = this.scripts_executable_results.filter(_ => _.status == 'Warning').length;
        this.model.result.duration = this.scripts_executable_duration;

        this.model.result.logs += 'Suite execution done...';

        this.model.result.save((error, saved) => {
            if (error)
                this.model.result.logs += `[SUITE] ERROR: error while saving suite results: ${error}`;

            this.parent.emit('done', this);
        });
    }
};

module.exports = Suite;
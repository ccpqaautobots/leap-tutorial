var async = require('async');
var models = require('../../models-sc');
var Object = models.Object;
var Project = models.Project;
var Scenario = models.Scenario;
var StepsGenerator = require('./step-generator');
var Error = require('./error');
var fs = require('fs');
var path = require('path');
var crypto = require("crypto");
var _ = require('lodash');

var Script = function (script, options) {
    var root = this;
    root.errors = [];
    root.script = script;
    root.project = {};
    root.pages = [];
    root.nightwatchScript;
    root.tags = undefined;
    root.resolution = {
        width: 800,
        height: 600
    };
    root.timeout = 30000;
    root.converted = '';

    if (options) {
        _.forOwn(options, (value, key) => {
            root[key] = value;
        });
    }

    root.initializeScript = function (callback) {
        Project.findOne({ projectKey: root.script.project }, function (err, docProject) {
            if (err)
                callback('error occured while fetching project');

            if (docProject) {
                root.project = docProject;
                async.eachOfSeries(root.script.scenarios, function (scenario, scenarioIndex, scenarioCallback) {
                    if (scenario.bound) {
                        if (scenario.referenceId) {
                            Scenario.Scenario.findOne({ _id: scenario.referenceId }, function (template_error, template_scenario) {
                                if (template_error)
                                    root.errors.push(new Error({ scenario: scenario.name, error: 'error occured' }));
                                if (template_scenario) {
                                    root.script.scenarios[scenarioIndex] = template_scenario;
                                    async.eachSeries(template_scenario.steps, function (step, stepCallback) {
                                        Object.Page.findOne({ project: root.script.project, _id: step.pageId }).lean().exec(function (err, page) {
                                            if (err)
                                                root.errors.push(new Error({ scenario: scenario.name, step: scenario.steps.indexOf(step), error: 'error occured' }));
                                            if (page)
                                                if (!root.pages.some(_ => _.name == page.name))
                                                    root.pages.push(page);

                                            stepCallback();
                                        });
                                    }, function (err) {
                                        if (err)
                                            callback(err);

                                        scenarioCallback();
                                    });
                                }
                            });
                        } else {
                            async.eachSeries(scenario.steps, function (step, stepCallback) {
                                Object.Page.findOne({ project: root.script.project, _id: step.pageId }).lean().exec(function (err, page) {
                                    if (err)
                                        root.errors.push(new Error({ scenario: scenario.name, step: scenario.steps.indexOf(step), error: 'error occured' }));
                                    if (page)
                                        if (!root.pages.some(_ => _.name == page.name))
                                            root.pages.push(page);

                                    stepCallback();
                                });
                            }, function (err) {
                                if (err)
                                    callback(err);

                                scenarioCallback();
                            });
                        }
                    } else {
                        async.eachSeries(scenario.steps, function (step, stepCallback) {
                            Object.Page.findOne({ project: root.script.project, _id: step.pageId }).lean().exec(function (err, page) {
                                if (err)
                                    root.errors.push(new Error({ scenario: scenario.name, step: scenario.steps.indexOf(step), error: 'error occured' }));
                                if (page)
                                    if (!root.pages.some(_ => _.name == page.name))
                                        root.pages.push(page);

                                stepCallback();
                            });
                        }, function (err) {
                            if (err)
                                callback(err);

                            scenarioCallback();
                        });
                    }
                }, function (err) {
                    if (err)
                        callback(err);

                    async.forEachOf(root.pages, function (page, index, page_callback) {
                        if (page.url) {
                            if (root.host) {
                                root.pages[index].url = page.url.replace(/{{url}}/i, root.host);
                                page_callback();
                            } else {
                                page_callback();
                            }
                        } else {
                            page_callback();
                        }
                    }, function (modify_page_error) {
                        if (modify_page_error)
                            callback(modify_page_error);
                        
                        callback();
                    });
                });
            } else {
                callback('[SRIPT GENERATOR] ERROR: Project not found: ' + root.script.project);
            }
        });
    }
};

Script.prototype.initialize = function (callback) {
    this.initializeScript(function (err) {
        if (err)
            callback(err);
        else
            callback(null, true);
    });
}

Script.prototype.compile = function (callback) {
    var root = this;
    var tags = `tags: [${this.tags || ''}]`;
    var before = `before: function(browser) {
        // browser.timeouts('script', 120000); // timeout when to interrupt a script that is being evaluated
        browser.timeouts('page load', 120000); // 2 minutes - timeout when to interrup navigation of the browsing context
        browser.timeouts('implicit', 30000); // 30 seconds - timeout when to abort locating an element
        browser.resizeWindow(${this.resolution.width}, ${this.resolution.height});
    },\n`;
    var after = `after: function(browser) { browser.end(); }`;
    var test = '';
    async.eachSeries(this.script.scenarios, function (scenario, scenarioCallback) {
        var regex = new RegExp(`${scenario.name} - ${scenario.description}`, 'g');
        var occurrence = (test.match(regex) || []).length;

        test += (occurrence > 0) ? 
            `'${scenario.name} - ${scenario.description} ${occurrence + 1}': function (test) {\n` :
            `'${scenario.name} - ${scenario.description}': function (test) {\n`

        test += 'test.useXpath();\n';
        async.eachSeries(scenario.steps, function (step, stepCallback) {
            var stepGen = new StepsGenerator(root, step);
            if (typeof stepGen[step.action] == 'function') {
                stepGen[step.action](function (stepGenerated) {
                    stepGenerated.errors.forEach(function (err) {
                        root.errors.push(err);
                    });
                    if (stepGenerated.converted.length > 0) {
                        test += stepGenerated.converted;
                    }
                    stepCallback();
                });
            } else {
                root.errors.push(new Error({ scenario: scenario.name, step: scenario.steps.indexOf(step), error: `${step.action} - unsupported action type` }));
                stepCallback();
            }
        }, function (err) {
            if (err)
                callback(err);
            test += '},';
            scenarioCallback();
        });
    }, function (err) {
        if (err)
            callback(err);

        root.converted = `var data = {};\nmodule.exports = {\n${tags},\n${before}${test}\n${after}\n};`;
        callback(null, true);
    });
}

Script.prototype.save = function (id, target, callback) {
    var dir = path.join(__dirname, target);

    var unique = id || crypto.randomBytes(16).toString("hex");

    var scriptDir = path.join(dir, `${this.script.testName} --- ${unique}.js`);

    fs.writeFile(scriptDir, this.converted, function (error) {
        if (error)
            callback(error);
        else
            callback(null, scriptDir);
    });
}

module.exports = Script;
var Error = require('./error');
var async = require('async');
var AssertionsGenerator = require('./assertion-generator');

var Steps = function (script, step) {
    this.errors = [];
    this.script = script;
    this.step = step;
    this.converted = '';
};

function ExtractSelector(element, conditions) {
    var selector = {};
    if (element.selectors) {
        if (element.selectors.length == 0)
            selector = { selector: undefined };
        else if (element.selectors.length == 1)
            selector = element.selectors[0];
        else {
            if (conditions) {
                // write condition for choosing selector
            } else {
                var getDefault = element.selectors.filter(_ => _.default == true);
                selector = (getDefault.length > 0) ? getDefault[0] : { selector: undefined };
            }
        }
        selector = element.selectors[0];
    } else {
        selector = { selector: undefined };
    }
    return selector;
};

function ExtractData(step, conditions) {
    var data = { input: undefined, target: undefined };
    if (typeof step.testData == 'object') {
        if (step.testData.length == 0)
            data = { input: undefined, target: undefined };
        else if (step.testData.length == 1)
            data = { input: step.testData[0].input, target: step.testData[0].target };
        else {
            if (conditions) {
                // write condition for choosing a test data
            }
        }
    } else if (typeof step.testData == 'string') {
        data = { input: step.testData, target: undefined };
    } else {
        data = { input: undefined, target: undefined }
    }
    return data;
};

// nightwatch api
Steps.prototype.url = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(this.step.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        //root.converted += `test.perform(function() { console.log("\\033[36m Step: \\033[0m browsing to ${page.url}") });\n`;
        root.converted += `test.perform(function() { console.log("Step: navigating  to ${page.url}") });\n`;
        root.converted += `test.url("${page.url}", function(result) {
            test.assert.equal(result.status, 0, "url ${page.url} --- ${this.step._id}");
        });\n`;
        //root.converted += `test.waitForElementPresent("//body",${root.script.timeout},true,function(){},"url ${page.url} --- ${this.step._id}");\n`;
        async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
            var assertGen = new AssertionsGenerator(root.script, assertion);
            if (typeof assertGen[assertion.assertion] == 'function') {
                assertGen[assertion.assertion](function (assertionGenerated) {
                    assertionGenerated.errors.forEach(function (err) {
                        root.errors.push(err);
                    });
                    if (assertionGenerated.converted.length > 0) {
                        root.converted += assertionGenerated.converted;
                    }
                    assertionCallback();
                });
            } else {
                root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                assertionCallback();
            }
        }, function (err) {
            callback(root);
        });
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.clearValue = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(this.step.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(this.step.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);

            //root.converted += `test.perform(function() { console.log("\\033[36m Step: \\033[0m clearing value of ${page.name} > ${element.name}"); });\n`;
            root.converted += `test.perform(function() { console.log("Step: clearing value of ${page.name} > ${element.name}"); });\n`;
            root.converted += `test.waitForElementPresent("${matchSelector.selector}",${root.script.timeout},true,function(){},"clearValue ${page.name} > ${element.name} (${matchSelector.selector}) --- ${this.step._id}");\n`;
            root.converted += `test.clearValue("${matchSelector.selector}");\n`;
            async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
                var assertGen = new AssertionsGenerator(root.script, assertion);
                if (typeof assertGen[assertion.assertion] == 'function') {
                    assertGen[assertion.assertion](function (assertionGenerated) {
                        assertionGenerated.errors.forEach(function (err) {
                            root.errors.push(err);
                        });
                        if (assertionGenerated.converted.length > 0) {
                            root.converted += assertionGenerated.converted;
                        }
                        assertionCallback();
                    });
                } else {
                    root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                    assertionCallback();
                }
            }, function (err) {
                callback(root);
            });
        } else {
            root.errors.push(new Error('step generator', this.step.object, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.click = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(this.step.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(this.step.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);

            root.converted += `test.perform(function() { console.log("Step: clicking ${page.name} > ${element.name}"); });\n`;
            root.converted += `test.waitForElementPresent("${matchSelector.selector}",${root.script.timeout},true,function(){},"click ${page.name} > ${element.name} (${matchSelector.selector}) --- ${this.step._id}");\n`;
            root.converted += `test.click("${matchSelector.selector}");\n`;
            async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
                var assertGen = new AssertionsGenerator(root.script, assertion);
                if (typeof assertGen[assertion.assertion] == 'function') {
                    assertGen[assertion.assertion](function (assertionGenerated) {
                        assertionGenerated.errors.forEach(function (err) {
                            root.errors.push(err);
                        });
                        if (assertionGenerated.converted.length > 0) {
                            root.converted += assertionGenerated.converted;
                        }
                        assertionCallback();
                    });
                } else {
                    root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                    assertionCallback();
                }
            }, function (err) {
                callback(root);
            });
        } else {
            root.errors.push(new Error('step generator', this.step.object, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.closeWindow = function (callback) {
    var root = this;
    if (matchPage.length > 0) {
        root.converted += `test.perform(function() { console.log("Step: closing window"); });\n`;
        root.converted += `test.closeWindow(function(result) {
            test.assert.equal(result.status, 0, "closeWindow --- ${this.step._id}");
        });\n`;
        async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
            var assertGen = new AssertionsGenerator(root.script, assertion);
            if (typeof assertGen[assertion.assertion] == 'function') {
                assertGen[assertion.assertion](function (assertionGenerated) {
                    assertionGenerated.errors.forEach(function (err) {
                        root.errors.push(err);
                    });
                    if (assertionGenerated.converted.length > 0) {
                        root.converted += assertionGenerated.converted;
                    }
                    assertionCallback();
                });
            } else {
                root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                assertionCallback();
            }
        }, function (err) {
            callback(root);
        });
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.moveToElement = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(this.step.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(this.step.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);

            root.converted += `test.perform(function() { console.log("Step: moving cursor to ${page.name} > ${element.name}"); });\n`;
            root.converted += `test.waitForElementPresent("${matchSelector.selector}",${root.script.timeout},true,function(){},"moved cursor to ${page.name} > ${element.name} (${matchSelector.selector}) --- ${this.step._id}");\n`;
            root.converted += `test.moveToElement("${matchSelector.selector}", 1, 1);\n`; // default offset x & y - 1
            async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
                var assertGen = new AssertionsGenerator(root.script, assertion);
                if (typeof assertGen[assertion.assertion] == 'function') {
                    assertGen[assertion.assertion](function (assertionGenerated) {
                        assertionGenerated.errors.forEach(function (err) {
                            root.errors.push(err);
                        });
                        if (assertionGenerated.converted.length > 0) {
                            root.converted += assertionGenerated.converted;
                        }
                        assertionCallback();
                    });
                } else {
                    root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                    assertionCallback();
                }
            }, function (err) {
                callback(root);
            });
        } else {
            root.errors.push(new Error('step generator', this.step.object, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.setValue = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(this.step.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(this.step.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchTestData = ExtractData(this.step);
            var matchSelector = ExtractSelector(element);

            //root.converted += `test.perform(function() { console.log("\\033[36m Step: \\033[0m writing '${matchTestData.input}' to ${page.name} > ${element.name}"); });\n`;
            root.converted += `test.perform(function() { console.log("Step: writing '${matchTestData.input}' to ${page.name} > ${element.name}"); });\n`;
            root.converted += `test.waitForElementPresent("${matchSelector.selector}",${root.script.timeout},true,function(){},"setValue ${page.name} > ${element.name} (${matchSelector.selector}) --- ${this.step._id}");\n`;
            root.converted += `test.setValue("${matchSelector.selector}", "${matchTestData.input}");\n`;
            async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
                var assertGen = new AssertionsGenerator(root.script, assertion);
                if (typeof assertGen[assertion.assertion] == 'function') {
                    assertGen[assertion.assertion](function (assertionGenerated) {
                        assertionGenerated.errors.forEach(function (err) {
                            root.errors.push(err);
                        });
                        if (assertionGenerated.converted.length > 0) {
                            root.converted += assertionGenerated.converted;
                        }
                        assertionCallback();
                    });
                } else {
                    root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                    assertionCallback();
                }
            }, function (err) {
                callback(root);
            });
        } else {
            root.errors.push(new Error('step generator', this.step.object, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.waitForElementVisible = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(this.step.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(this.step.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];

            var matchSelector = ExtractSelector(element);


            //root.converted += `test.perform(function() { console.log("\\033[36m Step: \\033[0m waiting for visibility of ${page.name} > ${element.name}"); });\n`;
            root.converted += `test.perform(function() { console.log("Step: waiting for visibility of ${page.name} > ${element.name}"); });\n`;
            root.converted += `test.waitForElementVisible("${matchSelector.selector}",${root.script.timeout},true,function(){},"waitForElementVisible ${page.name} > ${element.name} (${matchSelector.selector}) --- ${this.step._id}");\n`;
            async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
                var assertGen = new AssertionsGenerator(root.script, assertion);
                if (typeof assertGen[assertion.assertion] == 'function') {
                    assertGen[assertion.assertion](function (assertionGenerated) {
                        assertionGenerated.errors.forEach(function (err) {
                            root.errors.push(err);
                        });
                        if (assertionGenerated.converted.length > 0) {
                            root.converted += assertionGenerated.converted;
                        }
                        assertionCallback();
                    });
                } else {
                    root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                    assertionCallback();
                }
            }, function (err) {
                callback(root);
            });
        } else {
            root.errors.push(new Error('step generator', this.step.object, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.waitForElementPresent = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(this.step.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(this.step.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);

            root.converted += `test.perform(function() { console.log("Step: waiting for element present of ${page.name} > ${element.name}"); });\n`;
            root.converted += `test.waitForElementPresent("${matchSelector.selector}",${root.script.timeout},true,function(){},"waitForElementPresent ${page.name} > ${element.name} (${matchSelector.selector}) --- ${this.step._id}");\n`;
            async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
                var assertGen = new AssertionsGenerator(root.script, assertion);
                if (typeof assertGen[assertion.assertion] == 'function') {
                    assertGen[assertion.assertion](function (assertionGenerated) {
                        assertionGenerated.errors.forEach(function (err) {
                            root.errors.push(err);
                        });
                        if (assertionGenerated.converted.length > 0) {
                            root.converted += assertionGenerated.converted;
                        }
                        assertionCallback();
                    });
                } else {
                    root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                    assertionCallback();
                }
            }, function (err) {
                callback(root);
            });
        } else {
            root.errors.push(new Error('step generator', this.step.object, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.waitForElementNotVisible = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(this.step.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(this.step.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);

            root.converted += `test.perform(function() { console.log("Step: waiting for ${page.name} > ${element.name} until not visible"); });\n`;
            root.converted += `test.waitForElementNotVisible("${matchSelector.selector}",${root.script.timeout},true,function(){},"waitForElementNotVisible ${page.name} > ${element.name} (${matchSelector.selector}) --- ${this.step._id}");\n`;
            async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
                var assertGen = new AssertionsGenerator(root.script, assertion);
                if (typeof assertGen[assertion.assertion] == 'function') {
                    assertGen[assertion.assertion](function (assertionGenerated) {
                        assertionGenerated.errors.forEach(function (err) {
                            root.errors.push(err);
                        });
                        if (assertionGenerated.converted.length > 0) {
                            root.converted += assertionGenerated.converted;
                        }
                        assertionCallback();
                    });
                } else {
                    root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                    assertionCallback();
                }
            }, function (err) {
                callback(root);
            });
        } else {
            root.errors.push(new Error('step generator', this.step.object, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.waitForElementNotPresent = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(this.step.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(this.step.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);

            root.converted += `test.perform(function() { console.log("Step: waiting for ${page.name} > ${element.name}"); });\n`;
            root.converted += `test.waitForElementNotPresent("${matchSelector.selector}",${root.script.timeout},true,function(){},"waitForElementNotPresent ${page.name} > ${element.name} (${matchSelector.selector}) --- ${this.step._id}");\n`;
            async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
                var assertGen = new AssertionsGenerator(root.script, assertion);
                if (typeof assertGen[assertion.assertion] == 'function') {
                    assertGen[assertion.assertion](function (assertionGenerated) {
                        assertionGenerated.errors.forEach(function (err) {
                            root.errors.push(err);
                        });
                        if (assertionGenerated.converted.length > 0) {
                            root.converted += assertionGenerated.converted;
                        }
                        assertionCallback();
                    });
                } else {
                    root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                    assertionCallback();
                }
            }, function (err) {
                callback(root);
            });
        } else {
            root.errors.push(new Error('step generator', this.step.object, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.pause = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(this.step.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(this.step.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchTestData = ExtractData(this.step);
            var matchSelector = ExtractSelector(element);

            var pauseForMs = parseInt(matchTestData.input || root.script.timeout);
            pauseForMs = (isNaN(pauseForMs)) ? 0 : pauseForMs;

            root.converted += `test.perform(function() { console.log("Step: pausing for ${pauseForMs} ms"); });\n`;
            root.converted += `test.pause(${pauseForMs});\n`;
            async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
                var assertGen = new AssertionsGenerator(root.script, assertion);
                if (typeof assertGen[assertion.assertion] == 'function') {
                    assertGen[assertion.assertion](function (assertionGenerated) {
                        assertionGenerated.errors.forEach(function (err) {
                            root.errors.push(err);
                        });
                        if (assertionGenerated.converted.length > 0) {
                            root.converted += assertionGenerated.converted;
                        }
                        assertionCallback();
                    });
                } else {
                    root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                    assertionCallback();
                }
            }, function (err) {
                callback(root);
            });
        } else {
            root.errors.push(new Error('step generator', this.step.object, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.switchWindow = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(this.step.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(this.step.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchTestData = ExtractData(this.step);
            var matchSelector = ExtractSelector(element);

            if (isNaN(matchTestData.input)) {
                matchTestData.input = 0;
            } else {
                matchTestData.input = Math.abs(matchTestData.input);
                matchTestData.input = Math.round(matchTestData.input);
            }

            matchTestData.input = (isNaN(parseInt(matchTestData.input))) ? 0 : parseInt(matchTestData.input);

            root.converted += `test.perform(function() { console.log("Step: switching to window at index '${matchTestData.input}'"); });\n`;
            root.converted += `test.window_handles(function(handles) { 
                var handle = handles.value[${matchTestData.input}]; 
                test.switchWindow(handle, function(result) {
                    test.assert.equal(result.status, 0, "switchWindow --- ${this.step._id}");
                }); 
            });`;
            async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
                var assertGen = new AssertionsGenerator(root.script, assertion);
                if (typeof assertGen[assertion.assertion] == 'function') {
                    assertGen[assertion.assertion](function (assertionGenerated) {
                        assertionGenerated.errors.forEach(function (err) {
                            root.errors.push(err);
                        });
                        if (assertionGenerated.converted.length > 0) {
                            root.converted += assertionGenerated.converted;
                        }
                        assertionCallback();
                    });
                } else {
                    root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
                    assertionCallback();
                }
            }, function (err) {
                callback(root);
            });
        } else {
            root.errors.push(new Error('step generator', this.step.object, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('step generator', this.step.pageId, { error: 'page not found' }));
        callback(root);
    }
}

Steps.prototype.resizeWindow = function (callback) {
    var root = this;
    var matchTestData = ExtractData(this.step);

    var resolution = matchTestData.input.split('x');
    var resolution_width = parseInt(resolution.unshift());
    var resolution_height = parseInt(resolution.pop());

    root.converted += `test.perform(function() { console.log("Step: resizing window to ${matchTestData.input}"); });\n`;
    root.converted += `test.resizeWindow(${resolution_width}, ${resolution_height}, function(result) {
        test.assert.equal(result.status, 0, "resizeWindow --- ${this.step._id}");
    });\n`;
    async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
        var assertGen = new AssertionsGenerator(root.script, assertion);
        if (typeof assertGen[assertion.assertion] == 'function') {
            assertGen[assertion.assertion](function (assertionGenerated) {
                assertionGenerated.errors.forEach(function (err) {
                    root.errors.push(err);
                });
                if (assertionGenerated.converted.length > 0) {
                    root.converted += assertionGenerated.converted;
                }
                assertionCallback();
            });
        } else {
            root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
            assertionCallback();
        }
    }, function (err) {
        callback(root);
    });
}

Steps.prototype.end = function (callback) {
    var root = this;
    async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
        var assertGen = new AssertionsGenerator(root, assertion);
        if (typeof assertGen[assertion.assertion] == 'function') {
            assertGen[assertion.assertion](function (assertionGenerated) {
                assertionGenerated.errors.forEach(function (err) {
                    root.errors.push(err);
                });
                if (assertionGenerated.converted.length > 0) {
                    root.converted += assertionGenerated.converted;
                }
                assertionCallback();
            });
        } else {
            root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
            assertionCallback();
        }
    }, function (err) {
        //root.converted += `test.perform(function() { console.log("\\033[36m Step: \\033[0m closing browser"); });\n`;
        root.converted += `test.perform(function() { console.log("Step: closing browser"); });\n`;
        root.converted += 'test.end();\n';
        callback(root);
    });
}

// selenium protocols
Steps.prototype.acceptAlert = function (callback) {
    var root = this;
    root.converted += `test.perform(function() { console.log("Step: accepting alert"); });\n`;
    root.converted += `test.acceptAlert(function(result) {
       test.assert.equal(result.status, 0, "acceptAlert --- ${this.step._id}");
    });\n`;
    async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
        var assertGen = new AssertionsGenerator(root.script, assertion);
        if (typeof assertGen[assertion.assertion] == 'function') {
            assertGen[assertion.assertion](function (assertionGenerated) {
                assertionGenerated.errors.forEach(function (err) {
                    root.errors.push(err);
                });
                if (assertionGenerated.converted.length > 0) {
                    root.converted += assertionGenerated.converted;
                }
                assertionCallback();
            });
        } else {
            root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
            assertionCallback();
        }
    }, function (err) {
        callback(root);
    });
}

Steps.prototype.dismissAlert = function (callback) {
    var root = this;
    root.converted += `test.perform(function() { console.log("Step: dismissing alert"); });\n`;
    root.converted += `test.dismissAlert(function(result) {
        test.assert.equal(result.status, 0, "dismissAlert --- ${this.step._id}");
    });\n`;
    async.eachSeries(root.step.assertions, function (assertion, assertionCallback) {
        var assertGen = new AssertionsGenerator(root.script, assertion);
        if (typeof assertGen[assertion.assertion] == 'function') {
            assertGen[assertion.assertion](function (assertionGenerated) {
                assertionGenerated.errors.forEach(function (err) {
                    root.errors.push(err);
                });
                if (assertionGenerated.converted.length > 0) {
                    root.converted += assertionGenerated.converted;
                }
                assertionCallback();
            });
        } else {
            root.errors.push(new Error({ step: this.step, error: `${assertion.assertion} - unsupported assertion type` }));
            assertionCallback();
        }
    }, function (err) {
        callback(root);
    });
}

// custom api
Steps.prototype.customStep = function (callback) {
    var root = this;

    root.step.testData.replace(/\$\{([^\}]+)\}/, function(string) {
        var getTargetProperty = string.replace(/\$\{this./, '').replace(/\}/, '');
        var currentProperty = root;
        getTargetProperty.split('.').forEach(function(property) {
            if (currentProperty[property] != undefined)
            currentProperty = currentProperty[property];
        });
        root.step.testData = root.step.testData.replace(string, currentProperty);
    });

    root.converted += "test.perform(function() { ";
    root.converted += "console.log(`";
    root.converted += `Step: running custom step:\n\t${this.step.testData}`;
    root.converted += "`); });\n";
    //root.converted += "eval(";
    //root.converted += "\`";
    root.converted += root.step.testData;
    root.converted += '\n';
    //root.converted += "\`";
    //root.converted += ");\n";
    callback(root);
}

module.exports = Steps;
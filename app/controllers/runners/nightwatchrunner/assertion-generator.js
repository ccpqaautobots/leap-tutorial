var Error = require('./error');

var Assertions = function (script, assertion) {
    this.errors = [];
    this.script = script;
    this.assertion = assertion;
    this.converted = '';
};

function unEntity(str) {
    if (!str)
        return undefined;

    return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

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

Assertions.prototype.attributeContains = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.attributeContains("${matchSelector.selector}", "${root.assertion.attribute}", "${unEntity(root.assertion.expected)}", "${root.assertion.page} > ${root.assertion.element} > attribute ${root.assertion.attribute} contains ${unEntity(root.assertion.expected)} --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion.element, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.attributeEquals = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.attributeEquals("${matchSelector.selector}", "${root.assertion.attribute}", "${unEntity(root.assertion.expected)}", "${root.assertion.page} > ${root.assertion.element} > attribute ${root.assertion.attribute} equals ${unEntity(root.assertion.expected)} --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion.element, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}


Assertions.prototype.containsText = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.containsText("${matchSelector.selector}", "${root.assertion.expected}", "${root.assertion.page} > ${root.assertion.element} > containsText ${unEntity(root.assertion.expected)} --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion.element, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.cssClassPresent = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.cssClassPresent("${matchSelector.selector}", "${unEntity(root.assertion.expected)}", "${root.assertion.page} > ${root.assertion.element} > has cssClass ${unEntity(root.assertion.expected)} --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion.element, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.cssClassNotPresent = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.cssClassNotPresent("${matchSelector.selector}", "${unEntity(root.assertion.expected)}", "${root.assertion.page} > ${root.assertion.element} > does not have cssClass ${unEntity(root.assertion.expected)} --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion.element, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.cssProperty = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.cssProperty("${matchSelector.selector}", "${root.assertion.attribute}", "${unEntity(root.assertion.expected)}", "${root.assertion.page} > ${root.assertion.element} > ${root.assertion.attribute} cssProperty is equal to ${unEntity(root.assertion.expected)} --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion.element, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.elementPresent = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.elementPresent("${matchSelector.selector}", "${root.assertion.page} > ${root.assertion.element} > element present --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion.element, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.elementNotPresent = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.elementPresent("${matchSelector.selector}", "${root.assertion.page} > ${root.assertion.element} > element not present --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion.element, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.hidden = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.hidden("${matchSelector.selector}", "${root.assertion.page} > ${root.assertion.element} > is hidden --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.title = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.title("${unEntity(root.assertion.expected)}", "Page title is equal to ${unEntity(root.assertion.expected)} --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.urlContains = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.urlContains("${unEntity(root.assertion.expected)}", "Url contains ${unEntity(root.assertion.expected)} --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.urlEquals = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.urlEquals("${unEntity(root.assertion.expected)}", "Url equals ${unEntity(root.assertion.expected)} --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.value = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.value("${matchSelector.selector}", "${unEntity(root.assertion.expected)}", "${root.assertion.page} > ${root.assertion.element} > value is equal to ${unEntity(root.assertion.expected)} --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion.element, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.valueContains = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.valueContains("${matchSelector.selector}", "${unEntity(root.assertion.expected)}", "${root.assertion.page} > ${root.assertion.element} > value contains ${unEntity(root.assertion.expected)} --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion.element, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

Assertions.prototype.visible = function (callback) {
    var root = this;
    var matchPage = root.script.pages.filter(_ => _._id.equals(root.assertion.pageId));
    if (matchPage.length > 0) {
        var page = matchPage[0];
        var matchElement = page.elements.filter(_ => _._id.equals(root.assertion.objectId));
        if (matchElement.length > 0) {
            var element = matchElement[0];
            var matchSelector = ExtractSelector(element);
            root.converted += `test.assert.visible("${matchSelector.selector}", "${root.assertion.page} > ${root.assertion.element} > is visible --- ${this.assertion._id}");`;
            callback(root);
        } else {
            root.errors.push(new Error('assertion generator', root.assertion, { error: 'object not found' }));
            callback(root);
        }
    } else {
        root.errors.push(new Error('assertion generator', root.assertion.page, { error: 'page not found' }));
        callback(root);
    }
}

module.exports = Assertions;
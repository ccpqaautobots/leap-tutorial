var models = require('./models-sc');
var Object = models.Object; // user model - user schema

exports.getPage = function(req, res) {
    if (!req.body.query)
        req.body.query = {};
    if (!req.body.options)
        req.body.options = {};

    return Object.Page
        .find(req.body.query)
        .select(req.body.options.select)
        .limit(req.body.options.limit || 0)
        .skip(req.body.options.skip || 0)
        .exec(function(err, pages) {
            if (err)
                return res.status(500).send({ success: false, message: 'error occured while querying pages\n' + err });

            return res.status(200).json(pages);
        });
};

exports.createPage = function(req, res) {
    return Object.Page.findOne({
        project: req.body.page.project.trim(),
        module: req.body.page.module.trim(),
        name: req.body.page.name.trim()
    }, function(err, page) {
        if (err)
            return res.status(500).send({ success: false, message: 'an error occured while querying pages\nMessage: ' + err });

        if (page)
            return res.status(200).send({ success: false, message: 'A page in the selected module already has the same name.' });

        var newPage = new Object.Page(req.body.page);
        newPage.save(function(err, saved) {
            if (err)
                return res.status(500).send({ success: false, message: 'an error occured while saving page\nMessage: ' + err });

            return res.status(200).send({ success: true, message: 'Page has been saved', page: saved._id });
        })
    })
};

exports.hasDuplicate = function(req, res) {
    return Object.Page.findOne({
        project: req.body.page.project.trim(),
        module: req.body.page.module.trim(),
        name: req.body.page.name.trim()
    }, function(err, page) {
        if (err)
            return res.status(500).send({ success: false, message: 'an error occured while querying pages\nMessage: ' + err });

        if (page) {
            if (page._id != req.body.page.id)
                return res.status(200).send({ success: true, message: 'A Page with same name already exists.' });
            else
                return res.status(200).send({ success: false, message: 'Page is unique.' });
        } else
            return res.status(200).send({ success: false, message: 'Page is unique.' });
    });
};

exports.updatePage = function(req, res) {
    return Object.Page.findOne({
        project: req.body.page.project.trim(),
        module: req.body.page.module.trim(),
        name: req.body.page.name.trim()
    }, function(err, page) {
        if (err)
            return res.status(500).send({ success: false, message: 'an error occured while querying pages\nMessage: ' + err });

        if (page) {
            if (page._id != req.body.page.id)
                return res.status(200).send({ success: false, message: 'A page in the selected module already has the same name.' });
        }
        if (!page || page._id == req.body.page.id) {
            return Object.Page.findOne({
                _id: req.body.page.id
            }, function(err, page) {
                if (err)
                    return res.status(500).send({ success: false, message: 'an error occured while querying pages\nMessage: ' + err });

                if (!page)
                    return res.status(200).send({ success: false, message: 'Page not found.' });

                if (page) {
                    page.project = req.body.page.project;
                    page.module = req.body.page.module;
                    page.name = req.body.page.name;
                    page.description = req.body.page.description;
                    page.url = req.body.page.url;
                    page.lastUpdatedBy = req.body.page.lastUpdatedBy;
                    return page.save(function(err) {
                        if (err)
                            return res.status(500).send({ success: false, message: 'an error occured while updating page\nMessage: ' + err });

                        return res.status(200).send({ success: true, message: 'Page has been updated.' });
                    });
                }
            });
        } else
            return res.status(500).send({ success: false, message: 'an error occured while querying pages\nMessage: ' + err });
    });
};

exports.deletePage = function(req, res) {
    return Object.Page.remove({ _id: req.body.pageId }, function(err) {
        if (err)
            return res.status(500).send({ success: false, message: 'an error occured while deleting page\nMessage: ' + err })

        return res.status(200).send({ success: true, message: 'Page has been deleted.' });
    })
};

exports.createElement = function(req, res) {
    return Object.Page.findOne({ _id: req.body.pageId }, function(err, page) {
        if (err)
            return res.status(200).send({ success: false, message: 'an error occured while querying pages\n' + err });

        if (!page)
            return res.status(200).send({ success: false, message: 'Page not found.' });

        if (!req.body.element.name || !req.body.element.type)
            return res.status(200).send({ success: false, message: 'Please fill up all required fields.' });

        if (req.body.element.name.length == 0 || req.body.element.type.length == 0)
            return res.status(200).send({ success: false, message: 'Please fill up all required fields.' });

        if (typeof req.body.element.selectors == "undefined" || req.body.element.selectors == null || req.body.element.selectors.length == null || req.body.element.selectors.length == 0)
            return res.status(200).send({ success: false, message: 'Please input a selector.' });

        if (!req.body.element.selectors[0].selector)
            return res.status(200).send({ success: false, message: 'Please input an Xpath value.' });

        if (page.elements.filter(_ => _.name == req.body.element.name).length > 0)
            return res.status(200).send({ success: false, message: 'Element with same name already exists.' });
        else {
            var element = new Object.Element(req.body.element);
            page.elements.push(element);
            page.save(function(err) {
                if (err)
                    return res.status(500).send({ success: false, message: 'an error occured while saving element\nMessage: ' + err });

                return res.status(200).send({ success: true, message: 'Element has been created.', element: element._id });
            })
        }
    });
};

exports.updateElement = function(req, res) {
    return Object.Page.findOne({ _id: req.body.pageId }, function(err, page) {
        if (err)
            return res.status(500).send({ success: false, message: 'an error occured while querying pages\n' + err });

        if (!page)
            return res.status(200).send({ success: false, message: 'Page not found.' });

        if (typeof req.body.element.selectors == "undefined" || req.body.element.selectors == null || req.body.element.selectors.length == null || req.body.element.selectors.length == 0)
            return res.status(200).send({ success: false, message: 'Please input a selector.' });

        if (!req.body.element.selectors[0].selector)
            return res.status(200).send({ success: false, message: 'Please input an Xpath value.' });

        if (page.elements.filter(_ => _.name == req.body.element.name && _._id != req.body.element._id).length > 0)
            return res.status(200).send({ success: false, message: 'Element with same name already exists.' });

        var index = page.elements.indexOf(page.elements.filter(_ => _._id == req.body.element._id)[0]);
        page.elements[index] = new Object.Element(req.body.element);
        page.save(function(err) {
            if (err)
                return res.status(500).send({ success: false, message: 'an error occured while updating element\nMessage: ' + err });

            return res.status(200).send({ success: true, message: 'Element has been updated.', element: req.body.element._id });
        })
    });
};

exports.deleteElement = function(req, res) {
    return Object.Page.findOne({ _id: req.body.pageId }, function(err, page) {
        if (err)
            return res.status(500).send({ success: false, message: 'an error occured while querying pages\n' + err });

        if (!page)
            return res.status(200).send({ success: false, message: 'Page not found.' });

        var index = page.elements.indexOf(page.elements.filter(_ => _._id == req.body.element._id)[0]);
        if (index >= 0) {
            page.elements.splice(index, 1);
            page.save(function(err) {
                if (err)
                    return res.status(500).send({ success: false, message: 'an error occured while deleting element\nMessage: ' + err });

                return res.status(200).send({ success: true, message: 'Element has been deleted.' });
            })
        } else
            return res.status(200).send({ success: false, message: 'Element not found.' });
    });
};
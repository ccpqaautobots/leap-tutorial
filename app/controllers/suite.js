var models = require('./models-sc');
var Suite = models.Suite; // user model - user schema

exports.getSuites = function(req, res) {
    if (req.query)
        if (req.query.type === 'authors') {
            return Suite
                .find({ project: req.query.project })
                .select({ author: 1, _id: 0 })
                .exec(function(err, authors) {
                    var uniqueAuthors = [];
                    authors.forEach(function(author) {
                        if (!(uniqueAuthors.indexOf(author.author) > -1))
                            uniqueAuthors.push(author.author);
                    });

                    return res.status(200).send(uniqueAuthors);
                });
        }

    if (req.query.id) { //find by id
        var query = { _id: req.query.id };
        if (req.query.project)
            query.project = req.query.project;

        return Suite
            .findOne(query, function(err, suite) {
                if (err)
                    return res.status(404).send({ success: false, message: 'Suite not found' });

                return res.status(200).send({ success: true, message: "Suite found", suite: suite });
            });
    }

    if (!req.body.query)
        req.body.query = {};
    if (!req.body.options)
        req.body.options = {};

    return Suite
        .find(req.body.query)
        .limit(req.body.options.limit || undefined)
        .sort(req.body.options.sort || undefined)
        .skip(req.body.options.skip || undefined)
        .exec(function(err, suites) {
            if (err)
                return res.status(200).send({ message: 'a problem occured while querying suites' });

            return res.json(suites);
        })
};

exports.saveSuite = function(req, res) {
    var payload = req.body;

    return Suite.findOne({
        project: payload.project,
        suiteName: payload.suiteName
    }, function(err, suites) {
        if (err)
            return res.status(500).send({ success: false, message: 'internal server error' });

        if (suites)
            return res.status(200).send({ success: false, message: 'Suite already exists.' });
        else {
            delete payload._id;
            var newsuite = new Suite(payload);
            return newsuite.save(function(err, data) {
                if (err)
                    return res.status(500).send({ success: false, message: 'An error was encountered whilst saving.', error: err });
                else
                    return res.status(201).send({ success: true, message: 'Suite successfully created.', suite: data });
            });
        }
    });
};

exports.updateSuite = function(req, res) {
    var payload = req.body;
    var query = {
        project: payload.project,
        _id: payload._id
    };
    var item = {};
    item = Object.assign(item, payload);
    delete item._id;

    Suite.findOneAndUpdate(query, item, function(err, data) {
        if (err)
            return res.status(500).send({ success: false, message: 'An error was encountered whilst saving: ' + err });
        else
            return res.status(201).send({ success: true, message: 'Suite successfully updated', suite: data });
    });
};

exports.deleteSuite = function(req, res) {
    if (req.params.id != undefined) {
        return Suite.remove({ _id: req.params.id }, function(err) {
            if (err)
                return res.status(500).send('internal server error');
            else
                return res.status(200).send({ success: true, message: 'Suite successfully deleted' });
        });
    }
};

exports.updateStatus = function(req, res) {
    // if query id is provided
    var parsed = req.body.test;
    return Suite.findOne({ _id: parsed._id }, function(err, suite) {
        // if suite exists prepare for update
        if (err) {
            return res.status(500).send({ success: false, message: 'Suite not found' });
        } else if (suite) {
            // update top level attributes of suite
            suite.status = parsed.status;
            suite.lastUpdatedBy = parsed.lastUpdatedBy;
            suite.updatedDate = new Date();
            // save suite
            return suite.save(function(err, data) {
                if (err) {
                    // if error occured send response 500 to user
                    return res.status(500).send({ success: false, message: 'There was a problem adding the information to the database.' });
                } else {
                    return res.status(200).send({ success: true, message: 'Suite status was updated successfully!' });
                }
            });
        }
    });
};
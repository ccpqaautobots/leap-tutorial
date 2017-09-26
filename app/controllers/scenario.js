var models = require('./models-sc');
var Scenario = models.Scenario; // user model - user schema

exports.getScenarios = function(req, res) {
    if (!req.body.query)
        req.body.query = {};
    if (!req.body.options)
        req.body.options = {};

    return Scenario.Scenario
        .find(req.body.query)
        .select(req.body.options.select || undefined)
        .limit(req.body.options.limit || undefined)
        .sort(req.body.options.sort || undefined)
        .skip(req.body.options.skip || undefined)
        .lean()
        .exec(function(err, scenarios) {
            if (err)
                return res.status(200).send({ message: 'a problem occured while querying scenarios\n' + err });

            return res.json(scenarios);
        })
};

exports.saveScenario = function(req, res) {
    var payload = req.body;

    return Scenario.Scenario.findOne({
        project: payload.project,
        name: payload.name
    }, function(err, scenarios) {
        if (err)
            return res.status(500).send({ success: false, message: 'internal server error' });

        if (scenarios)
            return res.status(200).send({ success: false, message: 'scenario already exists' });
        else {
            delete payload._id;
            var newScenario = new Scenario.Scenario(payload);
            return newScenario.save(function(err, data) {
                if (err)
                    return res.status(500).send({ success: false, message: 'An error was encountered whilst saving', error: err });
                else
                    return res.status(201).send({ success: true, message: 'scenario successfully created', scenario: data });
            });
        }
    });
};

exports.updateScenario = function(req, res) {
    var payload = req.body;

    Scenario.Scenario.update({ _id: payload._id, project: payload.project } , payload, function(err, updated) {
        if (err)
            return res.status(500).send({ success: false, message: 'An error was encountered whilst saving: ' + err });
        else
            return res.status(200).send({ success: true, message: 'Scenario successfully updated' });
    });
};

exports.deleteScenario = function(req, res) {
    if (req.params.id != undefined) {
        return Scenario.Scenario.remove({ _id: req.params.id }, function(err) {
            if (err)
                return res.status(500).send('internal server error');
            else
                return res.status(200).send({ success: true, message: 'scenario successfully deleted' });
        });
    }
};

exports.updateStatus = function(req, res) {
    // if query id is provided
    var parsed = req.body.test;
    var lastUpdatedBy = req.body.lastUpdatedBy;
    return Scenario.Scenario.findOne({ _id: parsed._id }, function(err, scenario) {
        // if scenario exists prepare for update
        if (err) {
            return res.status(500).send({ success: false, message: 'Scenario not found' });
        } else if (scenario) {
            // update top level attributes of scenario
            scenario.status = parsed.status;
            scenario.lastUpdatedBy = parsed.lastUpdatedBy;
            if (lastUpdatedBy)
                scenario.lastUpdatedBy = lastUpdatedBy;
            scenario.updatedDate = new Date();
            // save scenario
            return scenario.save(function(err, data) {
                if (err) {
                    // if error occured send response 500 to user
                    return res.status(500).send({ success: false, message: 'There was a problem adding the information to the database.' });
                } else {
                    return res.status(200).send({ success: true, message: 'Scenario status was updated successfully!' });
                }
            });
        }
    });
};
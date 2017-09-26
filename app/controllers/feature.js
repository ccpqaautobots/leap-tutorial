var models = require('./models-sc');
var Feature = models.Feature;

exports.addNewFeature = function(req, res) {
    var newFeature = new Feature(req.body);
    return newFeature.save(function(err, feature) {
        if (err)
            return res.status(400).send({ success: false, message: 'error occured while saving new feature\n' + err });

        return res.status(200).send({ success: true, feature: feature });
    })
}

exports.getFeatures = function(req, res) {
    return Feature
        .find()
        .sort({ date: -1 })
        .exec(function(err, features) {
        if (err)
            return res.status(400).send({ success: false, message: 'error occured while querying features\n' + err });

        return res.status(200).send({ success: true, features: features });
    })
}
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FeatureSchema = mongoose.Schema({
  feature: { type: String },
  date: { type: Date }
}, {
    versionKey: false,
    collection: 'features'
});

module.exports = mongoose.model('Feature', FeatureSchema);
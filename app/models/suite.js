var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scriptSchema = new Schema({
    scriptId: { type: String, trim: true },
    disabled: { type: Boolean, default: false }
});

var suiteSchema = new Schema({
    project: { type: String, required: true, trim: true, lowercase: true },
    projectName: { type: String, required: true, trim: true },
    suiteName: { type: String, required: true, trim: true, unique: true },
    author: { type: String, required: true, trim: true },
    status: { type: String, trim: true },
    lastUpdatedBy: { type: String },
    scripts: { type: [ scriptSchema ], default: [] },
    module: { type: String },
    cycle: { type: String },
    createdDate: { type: Date },
    updatedDate: { type: Date }
}, {
    versionKey: false,
    collection: 'suites'
});

// on every save, add the date
suiteSchema.pre('save', function(next) {
    // get the current date
    var currentDate = new Date();

    // change the updated_at field to current date, if createdDate exists
    if (this.createdDate && this.updatedDate)
        this.updatedDate = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.createdDate)
        this.createdDate = currentDate;

    next();
});

// make this available to our users in our Node applications
module.exports = mongoose.model('TestSuite', suiteSchema);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var testDataSchema = new Schema({
    input: { type: String },
    target: { type: String }
}, {
    versionKey: false
});

var assertionSchema = new Schema({
    page: { type: String, trim: true },
    element: { type: String, trim: true },
    pageId: { type: Schema.Types.ObjectId },
    objectId: { type: Schema.Types.ObjectId },
    assertion: { type: String, trim: true },
    attribute: { type: String, trim: true },
    expected: { type: String, trim: true },
    message: { type: String, trim: true },
    isFailure: { type: Boolean, default: false }
}, {
    versionKey: false
});

var stepsSchema = new Schema({
    page: { type: String, trim: true },
    object: { type: String, trim: true },
    pageId: { type: Schema.Types.ObjectId },
    objectId: { type: Schema.Types.ObjectId },
    option: { type: String, trim: true },
    action: { type: String, trim: true },
    isFailure: { type: Boolean, default: false },
    message: { type: String, trim: true },
    dataRequired: { type: Boolean, default: false },
    testData: { type: String },
    assertions: [assertionSchema]
}, {
    versionKey: false
});

var scenarioSchema = new Schema({
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    project: { type: String, trim: true, lowercase: true },
    author: { type: String, trim: true },
    lastUpdatedBy: { type: String },
    createdDate: { type: Date },
    updatedDate: { type: Date },
    useCounter: { type: Number, default: 0 },
    projectDisplayName: { type: String, trim: true },
    module: { type: String, trim: true }, //should be required in future card
    status: { type: String, trim: true },
    referenceId: { type: String, trim: true },
    bound: { type: Boolean, default: false },
    steps: [stepsSchema]
}, {
    versionKey: false,
    collection: 'scenarios'
});

// on every save, add the date
scenarioSchema.pre('save', function(next) {
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

exports.Scenario = mongoose.model('Scenario', scenarioSchema);
exports.Step = mongoose.model('Step', stepsSchema);
exports.Assertion = mongoose.model('Assertion', assertionSchema);
exports.TestData = mongoose.model('TestData', testDataSchema);
exports.StepSchema = stepsSchema;
exports.ScenarioSchema = scenarioSchema;
exports.TestDataSchema = testDataSchema;
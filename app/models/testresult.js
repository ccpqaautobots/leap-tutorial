var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Scenario = require('./scenario');

var scriptSchema = new Schema({
	scriptId: { type: String },
	testResultId: { type: String }
}, {
	versionKey: false,
	_id: false
});

var assertionSchema = new Schema({
	message: { type: String, trim: true },
	stackTrace: { type: String, trim: true },
	fullMsg: { type: String, trim: true },
	isFailure: { type: Boolean, default: false }
}, {
	versionKey: false,
	_id: false
});

var scenarioSchema = new Schema({
	name: { type: String, trim: true },
	passed: { type: Number, default: 0 },
	failed: { type: Number, default: 0 },
	_errors: { type: Number, default: 0 },
	skipped: { type: Number, default: 0 },
	duration: { type: Number, default: 0 },
	isFailure: { type: Boolean, default: false },
	steps: [ Scenario.StepSchema ],
	assertions: [ assertionSchema ]
}, {
	versionKey: false,
	_id: false
});

var testresultSchema = new Schema({
	updatedDate: { type: Date },
	lastUpdatedBy: { type: String },
	runBy: {
		name: { type: String, trim: true },
		username: { type: String, trim: true }
	},
	options: {
		host: { type: String, trim: true, lowercase: true },
		os: { type: String, trim: true, lowercase: true },
		browser: { type: String, trim: true, lowercase: true },
		browserVersion: { type: Number },
		testMode: { type: String, trim: true, lowercase: true },
		resolution: {
			width: { type: Number },
			height: { type: Number }
		}
	},
	runDate: { type: Date, default: Date.now },
	isFailure: { type: Boolean, default: false },
	status: { type: String, default: 'Queued', trim: true },
	type: { type: String, default: 'Script', trim: true },
	totalPassed: { type: Number, default: 0 },
	totalFailed: { type: Number, default: 0 },
	totalWarning: { type: Number, default: 0 },
	total: { type: Number, default: 0 },
	logs: { type: String, default: '' },
	duration: { type: Number, default: 0 },
	done: { type: Boolean, default: false },
	remarks: { type: String, trim: true },
	failureCause: { type: String, trim: true, lowercase: true },
	isSuite: { type: Boolean, default: false },
	isScript: { type: Boolean, default: false },
	scriptId: { type: String, trim: true },
	suiteId: { type: String, trim: true },
	referenceId: { type: String, trim: true },
	project: { type: String, trim: true, lowercase: true },
	projectName: { type: String, trim: true },
	module: { type: String, default: '', trim: true, lowercase: true },
    cycle: { type: [String] },
	testName: { type: String, trim: true },
	author: { type: String, trim: true },
	scenarios: [ scenarioSchema ],
	scripts: [ scriptSchema ]
}, {
	versionKey: false,
	collection: 'test-results'
});

testresultSchema.pre('save', function (next) {
	var currentDate = new Date();

	if (this.runDate)
		this.updatedDate = currentDate;

	next();
});

module.exports = mongoose.model('TestResult', testresultSchema);
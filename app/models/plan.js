var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var currentBuild = new Schema({
    buildNo: { type: Number },
    path: { type: String },
    logs: { type: String },
    passed: { type: Boolean },
    duration: { type: Number },
    runBy: { type: String },
    runDate: { type: Date }
}, {
    versionKey: false
})

var buildSchema = new Schema({
    buildNo: { type: Number },
    path: { type: String },
    logs: { type: String },
    passed: { type: Boolean },
    duration: { type: Number },
    runBy: { type: String },
    runDate: { type: Date }
}, {
    versionKey: false
});


var scriptsSchema = new Schema({
    id: { type: String },
    subProject: { type: String },
    testName: { type: String },
    author: { type: String }
}, {
    versionKey: false
});

var planSchema = new Schema({
	name: { type: String },
	description: { type: String },
	project: { type: String },
    path: { type: String },
    duration: { type: Number },
    running: { type: Boolean },
    currentBuild: currentBuild,
	scripts: [ scriptsSchema ],
    builds: [ buildSchema ]
}, {
    versionKey: false,
    collection: 'plans'
});

module.exports =mongoose.model('Plan', planSchema);
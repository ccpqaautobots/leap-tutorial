var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Scenario = require('./scenario');

var maintenanceHistoryData = new Schema({
    start: { type: Date },
    end: { type: Date}
}, {
    versionKey: false,
    _id: false
});

var scriptSchema = new Schema({
    project: { type: String, required: true, trim: true, lowercase: true },
    projectName: { type: String, required: true, trim: true },
    module: { type: String, default: '', trim: true },
    testName: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    status: { type: String, trim: true },
    cycle: { type: [String] },
    maintenanceHistory: [ maintenanceHistoryData ],
    lastUpdatedBy: { type: String },
    scenarios: [ Scenario.ScenarioSchema ],
    createdDate: { type: Date },
    updatedDate: { type: Date },
    completionDate: { type: Date }
}, {
    versionKey: false,
    collection: 'scripts'
});

// on every save
scriptSchema.pre('save', function(next) {
    // get the current date
    var currentDate = new Date();

    // change the updated_at field to current date, if createdDate exists
    if (this.createdDate && this.updatedDate)
        this.updatedDate = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.createdDate)
        this.createdDate = currentDate;
        
    // update maintenanceHistory
    if (this.status == 'Maintenance') {
        if (this.maintenanceHistory.length != 0) 
            var currentMaintenanceStatus = this.maintenanceHistory[0];
        if (currentMaintenanceStatus && !currentMaintenanceStatus.end)
            next();

        this.maintenanceHistory.unshift({
            start: Date.now()
        });
    } else {
        if (this.maintenanceHistory.length == 0)
            next();
        else {
            var currentMaintenanceStatus = this.maintenanceHistory[0];
            if (!currentMaintenanceStatus.end)
                currentMaintenanceStatus.end = Date.now();
        }
    }

    next();
});

// make this available to our users in our Node applications
module.exports = mongoose.model('TestScript', scriptSchema);
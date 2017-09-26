var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var testdataSchema = new Schema({
    project: { type: String, required: true, trim: true, lowercase: true },
    projectName: { type: String, required: true, trim: true },
	name: { type: String, required: true, unique: true, trim: true },
    author: { type: String, required: true, trim: true },
    lastUpdatedBy: { type: String, trim: true },
	createdDate: { type: Date },
	updatedDate: { type: Date },
    dataset: [
        new Schema({
            environment: { type: String, trim: true, lowercase: true },
            environmentName: { type: String, trim: true },
            default: { type: Boolean, default: false },
            data: [
                new Schema({
                    key: { type: String, trim: true, lowercase: true },
                    values: { type: [String] }
                })
            ]
        })
    ]
}, {
	versionKey: false,
	collection: 'test-data'
});

class TestDataClass {
	
}

testdataSchema.plugin(uniqueValidator, { message: '{PATH} \'{VALUE}\' is already exists.'} );
testdataSchema.loadClass(TestDataClass);

// on every save, add the date
testdataSchema.pre('save', function (next) {
	// get the current date
	var currentDate = new Date();

	// change the updated_at field to current date, if createdDate exists
	if (this.createdDate)
		this.updatedDate = currentDate;

	// if created_at doesn't exist, add to that field
	if (!this.createdDate)
		this.createdDate = currentDate;

	next();
});

// make this available to our users in our Node applications
module.exports = mongoose.model('TestData', testdataSchema);
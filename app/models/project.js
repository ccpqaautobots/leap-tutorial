var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var projectSchema = new Schema({
	projectKey: { type: String, required: true, unique: true, trim: true, lowercase: true },
	name: { type: String, required: true, unique: true, trim: true },
	environments: [
		new Schema({
			name: { type: String, trim: true, lowercase: true },
			url: { type: String, trim: true, lowercase: true },
			default: { type: Boolean, default: false }
		}, {
			versionKey: false
		})
	],
	createdDate: { type: Date },
	updatedDate: { type: Date }
}, {
	versionKey: false,
	collection: 'projects'
});

class ProjectClass {
	
}

projectSchema.plugin(uniqueValidator, { message: '{PATH} \'{VALUE}\' is already exists.'} );
projectSchema.loadClass(ProjectClass);

// on every save, add the date
projectSchema.pre('save', function (next) {
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
module.exports = mongoose.model('Project', projectSchema);
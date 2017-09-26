var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var selectorSchema = new Schema({
	default: { 
		type: Boolean,
		default: false
	},
	responsiveMode: { 
		type: Boolean,
		default: false
	},
	os: { type: String, trim: true, lowercase: true },
	browser: { type: String, trim: true, lowercase: true },
	selector: { type: String, trim: true }
});

var elementSchema = new Schema({
	type: { type: String, trim: true, lowercase: true },
	name: { type: String, trim: true },
	author: { type: String, trim: true },
	lastUpdatedBy: { type: String },
	createdDate: { type: Date },
	updatedDate: { type: Date },
	selectors: [selectorSchema],
}, {
		versionKey: false
	});

var pageSchema = new Schema({
	project: { type: String, required: true, trim: true, lowercase: true },
	module: { type: String, trim: true },
	name: { type: String, required: true, trim: true },
	description: { type: String, trim: true },
	url: { type: String, trim: true },
	author: { type: String, trim: true },
	lastUpdatedBy: { type: String },
	createdDate: { type: Date },
	updatedDate: { type: Date },
	elements: [elementSchema]
}, {
		versionKey: false,
		collection: 'objects'
	});

// on every save, add the date
pageSchema.pre('save', function (next) {
	// get the current date
	var currentDate = new Date();

	// change the updated_at field to current date, if createdDate exists
	if (this.createdDate)
		this.updatedDate = currentDate;

	// if createdDate doesn't exist, add to that field
	if (!this.createdDate)
		this.createdDate = currentDate;

	next();
});

// make this available to our users in our Node applications
exports.Page = mongoose.model('Page', pageSchema);
exports.Element = mongoose.model('Element', elementSchema);
exports.Selector = mongoose.model('Selector', selectorSchema);
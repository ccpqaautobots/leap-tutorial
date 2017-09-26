var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
		validate: [
			validate({
				validator: 'isLength',
				arguments: [8, 20],
				message: 'Username should be between {ARGS[0]} and {ARGS[1]} characters'
			}),
			validate({
				validator: 'isAlphanumeric',
				passIfEmpty: false,
				message: 'Username should contain alpha-numeric characters only'
			})
		]
	},
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
		validate: [
			validate({
				validator: 'matches',
				arguments: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@cambridge.org$/,
				message: 'Email should be a cambridge org email.'
			})
		]
	},
	password: {
		type: String,
		trim: true,
		validate: [
			validate({
				validator: 'isLength',
				arguments: [8, 20],
				message: 'Password should be between {ARGS[0]} and {ARGS[1]} characters'
			})
		]
	},
	firstName: { type: String, required: true, trim: true },
	lastName: { type: String, required: true, trim: true },
	jobTitle: { type: String, trim: true },
	createdDate: { type: Date, default: Date.now },
	updatedDate: { type: Date },
	roles: [String],
	enabled: { type: Boolean, default: false }
}, {
		versionKey: false,
		collection: 'accounts'
	});

// function to uppercase first letter of each word
function ToTitleCase(str) {
	return str.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

class UserClass {
	get isSuper() {
		return this.roles.includes('super');
	}

	get isAdmin() {
		return this.roles.includes('admin');
	}

	getFullName() {
		return `${ToTitleCase(this.firstName)} ${ToTitleCase(this.lastName)}`
	}
	
	checkPassword(payload) {
		return payload == this.password;
	}
}
userSchema.loadClass(UserClass);

userSchema.plugin(uniqueValidator, { message: '{PATH} {VALUE} is already used.' });

// on every save, add the date
userSchema.pre('save', function (next) {
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
module.exports = mongoose.model('User', userSchema);
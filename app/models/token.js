var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var randtoken = require('rand-token');

var emailVerificationSchema = new Schema({
	user_id: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    token: { type: String, default: function() {
        return randtoken.generate(42);
    }, trim: true }
}, {
		versionKey: false,
		collection: 'tokens'
});

module.exports = mongoose.model('Token', emailVerificationSchema);
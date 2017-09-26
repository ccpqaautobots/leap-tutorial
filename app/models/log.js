var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var logPieceSchema = new Schema({
	message: { type: String },
	date: { type: Date }
}, {
		versionKey: false
});

var logSchema = new Schema({
	userId: { type: String, required: true },
	action: { type: String, required: true },
	log: [logPieceSchema]
}, {
		versionKey: false,
		collection: 'logs'
});

exports.Log = mongoose.model('Log', logSchema);
exports.Piece = mongoose.model('Piece', logPieceSchema);
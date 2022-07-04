const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		name: { type: String, required: true },
		phone: { type: String, required: true, minlength: 10, unique: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true, minlength: 6 },
		grade: { type: Number, required: true, min: 1, max: 12 },
		birthday: { type: Date, required: true }
	},
	{
		timestamps: true
	}
);

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);

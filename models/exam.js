const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');

const Schema = mongoose.Schema;

const examSchema = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, slug: 'name', unique: true } 
    },
    {
        timestamps: true
    }
);

mongoose.plugin(slug);

module.exports = mongoose.model('Exam', examSchema);

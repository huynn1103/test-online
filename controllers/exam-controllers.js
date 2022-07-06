
const HttpError = require('../models/http-error');
const Exam = require('../models/exam');

const getAllExams = async (req, res, next) => {
    let exams;
    try {
        exams = await Exam.find();
    } catch (err) {
        const error = new HttpError(
            'Fetching exams failed, please try again later.',
            500
        );
        return next(error);
    }

    if (!exams || exams.length === 0) {
        return next(
            new HttpError('Could not find exams.', 404)
        );
    }

    res.json({
        exams: exams.map(exam =>
            exam.toObject({ getters: true })
        )
    });
};

const createExam = async (req, res, next) => {
    const { name } = req.body;

    const exam = new Exam({
        name
    });

    try {
        await exam.save();
    } catch (err) {
        const error = new HttpError(
            'Create exam failed, please try again later.',
            500
        );
        return next(error);
    }

    res.json({ exam });
}

exports.getAllExams = getAllExams;
exports.createExam = createExam;
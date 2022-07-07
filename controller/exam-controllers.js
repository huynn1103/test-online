
const HttpError = require('../model/http-error');
const Exam = require('../model/exam');

const getAllExams = async (req, res, next) => {
    let exams;

    try {
        exams = await Exam.find();
    } catch (err) {
        return next(new HttpError(
            `Fetching exams failed, please try again later. ${err.message}`, 500
        ));
    }

    if (!exams || exams.length === 0) {
        return next(new HttpError(
            'Could not find exams.', 404
        ));
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
        return next(new HttpError(
            `Create exam failed, please try again later. ${err.message}`, 500
        ));
    }

    res.json({ exam });
}

exports.getAllExams = getAllExams;
exports.createExam = createExam;
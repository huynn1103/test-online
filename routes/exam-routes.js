const express = require('express');

const examController = require('../controllers/exam-controllers');

const auth = require("../middlewares/check-auth");
const hasRole = require("../middlewares/has-roles");

const router = express.Router();

router.get('/', examController.getAllExams);
router.post('/create', [auth, hasRole(['admin'])], examController.createExam);

module.exports = router;
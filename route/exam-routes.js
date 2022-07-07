const express = require('express');

const examController = require('../controller/exam-controllers');

const auth = require("../middleware/check-auth");
const hasRole = require("../middleware/middleware");

const router = express.Router();

router.get('/', examController.getAllExams);
router.post('/create', [auth, hasRole(['admin'])], examController.createExam);

module.exports = router;
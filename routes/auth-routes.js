const express = require('express');
const { check } = require('express-validator');

const auth = require("../middlewares/check-auth");
const authController = require('../controllers/auth-controllers');

const router = express.Router();

router.post(
	'/signup',
	[
		check('name')
			.not()
			.isEmpty(),
		check('email')
			.normalizeEmail()
			.isEmail(),
		check('password').isLength({ min: 6 })
	],
	authController.signup
);

router.post('/login', authController.login);
router.post('/refreshToken', authController.refreshToken);
router.get('/getUser', auth, authController.getUser);

module.exports = router;
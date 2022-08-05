const express = require('express');
const { check } = require('express-validator');

// const auth = require("../middleware/check-auth");
const authController = require('../controller/auth-controllers');

const router = express.Router();

router.post(
	'/signup',
	[
		check('name')
			.not()
			.isEmpty(),
		check('phone')
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
router.get('/logout', authController.logout);
router.get('/refreshToken', authController.refreshToken);

module.exports = router;
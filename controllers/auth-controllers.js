const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const RefreshToken = require('../models/refresh-token');
const User = require('../models/user');

const signup = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError('Invalid inputs passed, please check your data.', 422)
		);
	}

	const { name, phone, email, password, grade, birthday, role } = req.body;

	let existingUser;
	try {
		existingUser = await User.findOne({ email: email });
		if (!existingUser) {
			existingUser = await User.findOne({ phone: phone });
		}
	} catch (err) {
		const error = new HttpError(
			'Signing up failed, please try again later.',
			500
		);
		return next(error);
	}

	if (existingUser) {
		const error = new HttpError(
			'User exists already, please login instead.',
			422
		);
		return next(error);
	}

	let hashedPassword;
	try {
		hashedPassword = await bcrypt.hash(password, 12);
	} catch (err) {
		const error = new HttpError(
			'Could not create user, please try again.',
			500
		);
		return next(error);
	}

	const createdUser = new User({
		name,
		phone,
		email,
		password: hashedPassword,
		grade,
		birthday,
		role
	});

	try {
		await createdUser.save();
	} catch (err) {
		const error = new HttpError(
			'Signing up failed, please try again later.',
			500
		);
		return next(error);
	}

	let token;
	try {
		token = jwt.sign(
			{ userId: createdUser.id },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: process.env.jwtExpiration }
		);
	} catch (err) {
		const error = new HttpError(
			'Signing up failed, please try again later.',
			500
		);
		return next(error);
	}

	res
		.status(201)
		.json({ userId: createdUser.id, token: token });
};

const login = async (req, res, next) => {
	const { email, password } = req.body;

	let existingUser;

	try {
		existingUser = await User.findOne({ email: email });
		if (!existingUser) {
			existingUser = await User.findOne({ phone: email });
		}
	} catch (err) {
		const error = new HttpError(
			`Logging in failed, please try again later. ${err.message}`,
			500
		);
		return next(error);
	}

	if (!existingUser) {
		const error = new HttpError(
			'Invalid credentials, could not log you in.',
			403
		);
		return next(error);
	}

	let isValidPassword = false;
	try {
		isValidPassword = await bcrypt.compare(password, existingUser.password);
	} catch (err) {
		const error = new HttpError(
			'Could not log you in, please check your credentials and try again.',
			500
		);
		return next(error);
	}

	if (!isValidPassword) {
		const error = new HttpError(
			'Invalid credentials, could not log you in.',
			403
		);
		return next(error);
	}

	let token;
	let refreshToken;
	try {
		token = jwt.sign(
			{ userId: existingUser.id },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: process.env.jwtExpiration }
		);
		refreshToken = await RefreshToken.createToken(existingUser);
	} catch (err) {
		const error = new HttpError(
			`Logging in failed, please try again later. ${err.message}`,
			500
		);
		return next(error);
	}

	res.json({
		userId: existingUser.id,
		token: token,
		refreshToken: refreshToken
	});
};

const refreshToken = async (req, res) => {
	const { refreshToken: requestToken } = req.body;

	if (requestToken == null) {
		return res.status(403).json({ message: "Refresh Token is required!" });
	}

	try {
		let refreshToken = await RefreshToken.findOne({ token: requestToken });

		if (!refreshToken) {
			res.status(403).json({ message: "Refresh token is not in database!" });
			return;
		}

		if (RefreshToken.verifyExpiration(refreshToken)) {
			RefreshToken.findByIdAndRemove(refreshToken._id, { useFindAndModify: false }).exec();

			res.status(403).json({
				message: "Refresh token was expired. Please make a new login request",
			});
			return;
		}

		let newAccessToken = jwt.sign({ id: refreshToken.user._id }, process.env.ACCESS_TOKEN_SECRET, {
			expiresIn: process.env.jwtExpiration,
		});

		return res.status(200).json({
			accessToken: newAccessToken,
			refreshToken: refreshToken.token,
		});
	} catch (err) {
		return res.status(500).send({ message: err.message });
	}
};

const getUser = async (req, res, next) => {
	res.status(200).send("Success.");
};

exports.signup = signup;
exports.login = login;
exports.refreshToken = refreshToken;
exports.getUser = getUser;

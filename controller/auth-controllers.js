const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { validateEmail, validatePhone } = require('../util/regex');

const HttpError = require('../model/http-error');
const User = require('../model/user');

const signup = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(new HttpError(
			'Invalid inputs passed, please check your data.', 422
		));
	}

	const { name, phone, email, password, grade, birthday, role } = req.body;

	if (phone && !validatePhone(phone))
		return next(new HttpError(
			'Phone format is incorrect.', 422
		));
	if (email && !validateEmail(email))
		return next(new HttpError(
			'Email format is incorrect.', 422
		));

	let existingUser;
	try {
		existingUser = await User.findOne({ email: email });
		if (!existingUser) {
			existingUser = await User.findOne({ phone: phone });
		}
	} catch (err) {
		return next(new HttpError(
			`Signing up failed, please try again later. ${err.message}`, 500
		));
	}

	if (existingUser) {
		return next(new HttpError(
			'User exists already, please login instead.', 422
		));
	}

	let hashedPassword;
	try {
		hashedPassword = await bcrypt.hash(password, 12);
	} catch (err) {
		return next(new HttpError(
			`Could not create user, please try again.${err.message}`, 500
		));
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
		return next(new HttpError(
			`Signing up failed, please try again later. ${err.message}`, 500
		));
	}

	res
		.status(201)
		.json({
			userId: createdUser.id
		});
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
		return next(new HttpError(
			`Logging in failed, please try again later. ${err.message}`, 500
		));
	}

	if (!existingUser) {
		return next(new HttpError(
			'Invalid credentials, could not log you in.', 403
		));
	}

	let isValidPassword = false;
	try {
		isValidPassword = await bcrypt.compare(password, existingUser.password);
	} catch (err) {
		return next(new HttpError(
			`Could not log you in, please check your credentials and try again. ${err.message}`, 500
		));
	}

	if (!isValidPassword) {
		return next(new HttpError(
			'Invalid credentials, could not log you in.', 403
		));
	}

	let token;
	try {
		token = jwt.sign(
			{ userId: existingUser.id },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: process.env.jwtExpiration }
		);
	} catch (err) {
		return next(new HttpError(
			`Logging in failed, please try again later. ${err.message}`, 500
		));
	}

	let refreshToken;
	try {
		refreshToken = jwt.sign(
			{ userId: existingUser.id },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: process.env.jwtRefreshExpiration }
		);
	} catch (err) {
		return next(new HttpError(
			`Signing up failed, please try again later. ${err.message}`, 500
		));
	}

	try {
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			path: "/api/auth/refreshToken",
			maxAge: process.env.jwtRefreshExpiration,
		});
	} catch (err) {
		return next(new HttpError(
			`Signing up failed, please try again later. ${err.message}`, 500
		));
	}

	res.json({
		userId: existingUser.id,
		token: token,
		refreshToken: refreshToken
	});
};

const logout = async (req, res, next) => {
	try {
		res.clearCookie("refreshToken", { path: "/api/auth/refreshToken" });
		return res.json({ msg: "Logged out!" });
	} catch (error) {
		return next(new HttpError(
			`Log out failed, please try again later. ${err.message}`, 500
		));
	}
};

const refreshToken = async (req, res, next) => {
	let refreshToken;
	try {
		// refreshToken = req.headers.authorization.split(' ')[1];
		refreshToken = req.cookie.refreshToken;
		if (!refreshToken) {
			return next(new HttpError(
				'Access cookie failed, please try again later.', 401
			));
		}
	} catch (err) {
		return next(new HttpError(
			`Refresh token failed, please log in and try again later. ${err.message}`, 401
		));
	}

	try {
		const decodedToken = jwt.verify(refreshToken, process.env.ACCESS_TOKEN_SECRET);
		console.log(decodedToken);
		let user = await User.findById(decodedToken.userId).select("-password");
		if (!user) {
			return next(new HttpError(
				'Invalid credentials', 401
			));
		}

		let accessToken;
		try {
			accessToken = jwt.sign(
				{ userId: user.id },
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: process.env.jwtExpiration }
			);
		} catch (err) {
			return next(new HttpError(
				`Logging in failed, please try again later. ${err.message}`, 500
			));
		}

		res.json({
			accessToken: accessToken
		});
	} catch (err) {
		return next(new HttpError(
			`Refresh token failed, please try again later. ${err.message}`, 401
		));
	}
};

exports.signup = signup;
exports.login = login;
exports.logout = logout;
exports.refreshToken = refreshToken;
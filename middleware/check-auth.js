const jwt = require('jsonwebtoken');

const HttpError = require('../model/http-error');

module.exports = (req, res, next) => {
	if (req.method === 'OPTIONS') {
		return next();
	}
	try {
		const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
		if (!token) {
			throw new Error('Authentication failed!');
		}
		const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		req.userData = { userId: decodedToken.userId };
		next();
	} catch (err) {
		const error = new HttpError(`Authentication failed! ${err.message}`, 403);
		return next(error);
	}
};

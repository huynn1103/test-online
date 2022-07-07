require('dotenv').config();

const express = require('express');
const db = require("./config/database");
const HttpError = require('./model/http-error');
const authRoutes = require('./route/auth-routes');
const examRoutes = require('./route/exam-routes');
const app = express();

// Connect database
db.connect();

app.use(express.json());

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');

	next();
});

// Routes
app.use('/api/exams', examRoutes);
app.use('/api/auth', authRoutes);
app.use((req, res, next) => {
	const error = new HttpError('Could not find this route.', 404);
	throw error;
});

// Handling error
app.use((error, req, res, next) => {
	if (res.headerSent) {
		return next(error);
	}
	res.status(error.code || 500);
	res.json({ message: error.message || 'An unknown error occurred!' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`Server started at http://localhost:${PORT}/`);
});

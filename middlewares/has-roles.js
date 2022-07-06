const HttpError = require('../models/http-error');
const User = require('../models/user');

module.exports = function hasRole(roles) {
    return async (req, res, next) => {
        try {
            let user = await User.findById(req.userData.userId).exec();
            console.log(user);
            if (!roles.includes(user.role)) {
                const error = new HttpError('Access denied!', 403);
                return next(error);
            }
            next();
        } catch (err) {
            const error = new HttpError('Internal server error', 500);
            return next(error);
        }
    };
};

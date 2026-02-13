const AppError = require('./AppError');

class AuthError extends AppError {
    constructor(message, status, details = null) {
        super(message, status, details);
    }
}

module.exports = AuthError;

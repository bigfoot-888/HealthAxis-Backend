const AppError = require('./AppError');

class ForbiddenError extends AppError {
    constructor(message, details = null) {
        super(message, 403, details);
    }
}

module.exports = ForbiddenError;

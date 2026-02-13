const AppError = require('./AppError');

class ConflictError extends AppError {
    constructor(message, details = null) {
        super(message, 409, details);
    }
}

module.exports = ConflictError;

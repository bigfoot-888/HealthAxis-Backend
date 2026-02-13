const AppError = require('./AppError');

class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, {fields: details}); 
    }
}

module.exports = ValidationError;

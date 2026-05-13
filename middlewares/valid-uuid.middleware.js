const { validate: uuidValidate } = require('uuid');
const ValidationError = require('../errors/ValidationError');

/**
 * Middleware to validate that a URL parameter is a proper UUID.
 * @param {string} paramName - The name of the parameter in the route (default: 'uuid')
 */
function validateUuidParam(paramName = 'uuid') {
    return (req, res, next) => {
        const uuid = req.params[paramName];
        
        if (!uuidValidate(uuid)) {
            return next(new ValidationError('El identificador proporcionado no es un UUID válido', { [paramName]: uuid }));
        }
        next();
    };
};

module.exports = { validateUuidParam };
const ForbiddenError = require('../errors/ForbiddenError');
function requireAuth(req, res, next) {
    if (!req.user) 
        return next(new ForbiddenError('Acceso no autorizado.'));
    next();
}

module.exports = {
    requireAuth,
};

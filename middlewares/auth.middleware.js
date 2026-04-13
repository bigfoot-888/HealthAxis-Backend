const ForbiddenError = require('../errors/ForbiddenError');
function requireAuth(req, res, next) {
    if (!req.user) {
        return next(new ForbiddenError('Acceso no autorizado.'));
    }
    next();
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ForbiddenError('Acceso no autorizado.'));
        }
        next();
    };
}

module.exports = {
    requireAuth,
    requireRole,
};

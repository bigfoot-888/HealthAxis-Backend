const ForbiddenError = require('../errors/ForbiddenError');

function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) 
            return next(new ForbiddenError('Error al obtener los datos del usuario.'));

        if (!req.user.permissions.includes(permission)) 
            return next(new ForbiddenError(`Permisos insuficientes: ${permission}`));
        
        next();
    };
}

module.exports = {requirePermission};

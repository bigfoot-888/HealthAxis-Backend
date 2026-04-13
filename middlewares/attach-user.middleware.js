const { User, Role, Permission } = require('../models');
const UserRepository = require('../repositories/user.repository');

async function attachUser(req, res, next) {
    try {
        if (!req.session?.user?.id) return next();

        const user = await UserRepository.findByIdWithRolesAndPermissions(req.session.user.id);

        if (!user) return next();

        const permissions = new Set();

        user.roles.forEach((role) => {
            role.permissions.forEach((p) => permissions.add(p.name));
        });

        req.user = {
            id: user.id,
            uuid: user.uuid,
            roles: user.roles.map((r) => r.name),
            permissions: [...permissions],
        };

        next();
    } catch (err) {
        next(err);
    }
}

module.exports = attachUser;

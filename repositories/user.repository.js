const { User, Role, UserDashboard, DashboardComponent, Permission, Agenda } = require('../models/index');
const { Op } = require('sequelize');
const { escapeLike } = require('../utils/query-utils');

// ===== CREATE =====

async function create(userData, options = {}) {
    return await User.create(userData, options);
}

async function bulkCreate(users, options = {}) {
    return await User.bulkCreate(users, options);
}

async function createDashboard(userId, options = {}) {
    return await UserDashboard.create({ userId }, options);
}

async function bulkCreateDashboardComponents(components, options = {}) {
    return await DashboardComponent.bulkCreate(components, options);
}

async function save(user, options = {}) {
    return await user.save(options);
}

// ===== ROLES =====

async function findOrCreateRole(roleName, options = {}) {
    const [role] = await Role.findOrCreate({
        where: { name: roleName },
        ...options,
    });
    return role;
}

async function addRoles(user, roles, options = {}) {
    return await user.addRoles(roles, options);
}

async function setRoles(user, roles, options = {}) {
    return await user.setRoles(roles, options);
}

// ===== READ =====

async function findAll(options = {}) {
    return await User.findAll({
        include: [{ model: Role, as: 'roles' }],
        ...options,
    });
}

async function searchFiltered(query, limit = 20, options = {}) {
    if (!query || query.length < 2) return [];

    const safeQuery = `%${escapeLike(query)}%`;

    return await User.findAll({
        attributes: ['id', 'name', 'surname', 'uuid'],
        where: {
            status: 'ACTIVE',
            [Op.or]: [{ name: { [Op.iLike]: safeQuery } }, { surname: { [Op.iLike]: safeQuery } }],
        },
        include: [
            {
                model: Role,
                as: 'roles',
                attributes: ['name'],
                required: false,
            },
        ],
        order: [
            ['surname', 'ASC'],
            ['name', 'ASC'],
        ],
        limit: Math.min(limit, 50),
        ...options,
    });
}

async function searchUsers({ name, limit = 20 }) {
    const where = {
        status: 'ACTIVE',
    };

    if (name) {
        const safeName = `%${escapeLike(name)}%`;

        where[Op.or] = [{ name: { [Op.iLike]: safeName } }, { surname: { [Op.iLike]: safeName } }];
    }

    return User.findAll({
        where,
        limit,
        order: [['createdAt', 'DESC']],
    });
}

async function findByUuid(uuid, options = {}) {
    return await User.findOne({
        where: { uuid },
        include: [{ model: Role, as: 'roles' }, {model: Agenda, as: "agenda"}],
        ...options,
    });
}

async function findByUuidPlain(uuid, options = {}) {
    return await User.findOne({
        where: { uuid },
        ...options,
    });
}

async function findById(id, options = {}) {
    return await User.findByPk(id, {
        include: [{ model: Role, as: 'roles' }, {model: Agenda, as: 'agenda'}],
        ...options,
    });
}

async function findByIdPlain(id, options = {}) {
    return await User.findByPk(id, options);
}

async function findByEmail(email, options = {}) {
    return await User.findOne({ where: { email }, ...options });
}

async function findByIdWithRolesAndPermissions(id) {
    return User.findByPk(id, {
        include: [
            {
                model: Role,
                as: 'roles',
                through: { attributes: [] },
                include: [
                    {
                        model: Permission,
                        as: 'permissions',
                        attributes: ['name'],
                        through: { attributes: [] },
                    },
                ],
            },
        ],
    });
}

// ===== UPDATE =====

async function updateByUuid(uuid, data, options = {}) {
    return await User.update(data, {
        where: { uuid },
        ...options,
    });
}

async function updateStatusById(id, status, options = {}) {
    return await User.update(
        { status },
        {
            where: { id },
            ...options,
        },
    );
}

async function updatePassword(user, hashedPassword, options = {}) {
    user.password = hashedPassword;
    return await user.save(options);
}

module.exports = {
    create,
    bulkCreate,
    save,

    createDashboard,
    bulkCreateDashboardComponents,

    findOrCreateRole,
    addRoles,
    setRoles,

    findAll,
    searchFiltered,
    findByUuid,
    findByUuidPlain,
    findById,
    findByIdPlain,
    findByEmail,
    searchUsers,
    findByIdWithRolesAndPermissions,

    updateByUuid,
    updateStatusById,

    updatePassword,
};

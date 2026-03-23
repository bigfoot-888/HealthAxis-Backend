const { User, Role, UserDashboard, DashboardComponent } = require('../models/index');

const { hashPassword, verifyPassword } = require('../utils/bcrypt');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const AppError = require('../errors/AppError');
const AuthError = require('../errors/AuthError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');

const { Op } = require('sequelize');

const sequelize = require('../config/database');

// ===== CREATE =====

async function createUser(userData, roles) {
    try {
        return sequelize.transaction(async (t) => {
            const hashed = await hashPassword(userData.password);
            const user = await User.create({ ...userData, password: hashed }, { transaction: t });

            const roleInstances = await Promise.all(
                roles.map(async (roleName) => {
                    const [role, created] = await Role.findOrCreate({
                        where: { name: roleName },
                        transaction: t,
                    });
                    return role;
                }),
            );
            await user.addRoles(roleInstances, { transaction: t });

            const dashboard = await UserDashboard.create(
                {
                    userId: user.id,
                },
                { transaction: t },
            );
            
            // The new dynamic, visualization-driven default dashboard
            const defaultComponents = [
                {
                    title: 'Total Pacientes',
                    type: 'KPI',
                    position: { x: 0, y: 0, w: 2, h: 2 },
                    config: {
                        visuals: { color: 'primary.main' },
                        query: { entity: 'Patient', aggregation: 'COUNT', targetColumn: 'id' },
                    },
                },
                {
                    title: 'Pacientes Activos',
                    type: 'KPI',
                    position: { x: 2, y: 0, w: 2, h: 2 },
                    config: {
                        visuals: { color: 'success.main' },
                        query: {
                            entity: 'Patient',
                            aggregation: 'COUNT',
                            targetColumn: 'id',
                            filters: { state: 'ACTIVE' },
                        },
                    },
                },
                {
                    title: 'Pacientes a lo largo del tiempo',
                    type: 'LINE_CHART',
                    position: { x: 0, y: 2, w: 4, h: 3 },
                    config: {
                        visuals: { xAxisKey: 'x', yAxisKey: 'y', yAxisLabel: 'Pacientes', tooltipLabel: 'Pacientes' },
                        query: {
                            entity: 'Patient',
                            aggregation: 'COUNT',
                            targetColumn: 'id',
                            groupBy: 'createdAt',
                            timeGrain: 'month',
                        },
                    },
                },
                {
                    title: 'Citas a lo largo del tiempo',
                    type: 'LINE_CHART',
                    position: { x: 0, y: 5, w: 4, h: 3 },
                    config: {
                        visuals: { xAxisKey: 'x', yAxisKey: 'y', yAxisLabel: 'Citas', tooltipLabel: 'Citas' },
                        query: {
                            entity: 'Appointment',
                            aggregation: 'COUNT',
                            targetColumn: 'id',
                            groupBy: 'start_time',
                            timeGrain: 'month',
                        },
                    },
                },
                {
                    title: 'Distribución por Severidad',
                    type: 'BAR_CHART',
                    position: { x: 4, y: 0, w: 2, h: 4 },
                    config: {
                        visuals: { xAxisKey: 'x', yAxisKey: 'y', tooltipLabel: 'Diagnósticos' },
                        query: {
                            entity: 'Diagnosis',
                            aggregation: 'COUNT',
                            targetColumn: 'id',
                            groupBy: 'severity',
                            filters: { recordState: 'VALID' },
                        },
                    },
                },
                {
                    title: 'Estado de Tratamientos',
                    type: 'PIE_CHART',
                    position: { x: 4, y: 4, w: 2, h: 4 },
                    config: {
                        visuals: { nameKey: 'x', valueKey: 'y', tooltipLabel: 'Tratamientos' },
                        query: {
                            entity: 'Treatment',
                            aggregation: 'COUNT',
                            targetColumn: 'id',
                            groupBy: 'state',
                            filters: { recordState: 'VALID' },
                        },
                    },
                },
            ];

            await DashboardComponent.bulkCreate(
                defaultComponents.map((component) => ({
                    ...component,
                    dashboardId: dashboard.id,
                })),
                { transaction: t },
            );

            return user;
        });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw new ConflictError('Error, email already exists', {
                email: userData.email,
            });
        }
        throw err;
    }
}

async function importUsers(users) {
    for (const user of users) {
        try {
            const hashed = await hashPassword(user.password);
            const uuid = uuidv4();
            await User.create({ ...user, password: hashed, uuid });
        } catch (err) {
            throw new AppError('Error al procesar los usuarios importados', 500, {
                originalMessage: err.message,
                user: user.email,
            });
        }
    }
    return users;
}

// ===== READ =====

async function getUsers() {
    const users = await User.findAll({
        include: [{ model: Role, as: 'roles' }],
        nest: true,
    });
    return users;
}

// Treat query as a literal string, escaping % and _ characters
const escapeLike = (str) => str.replace(/[%_]/g, '\\$&');

async function getFilteredUsers(query, limit = 20) {
    if (!query || query.length < 2) {
        return [];
    }
    const safeQuery = `%${escapeLike(query)}%`;
    const users = await User.findAll({
        attributes: ['id', 'name', 'surname'],
        where: {
            state: 'ACTIVE',
            [Op.or]: [{ name: { [Op.iLike]: safeQuery } }, { surname: { [Op.iLike]: safeQuery } }],
        },
        include: [
            {
                model: Role,
                as: 'roles',
                attributes: ['name'],
                required: false, // include users even if roles don't match
            },
        ],
        order: [
            ['surname', 'ASC'],
            ['name', 'ASC'],
        ],
        limit: Math.min(limit, 50),
    });
    console.log(users);
    return users;
}

async function getUser(uuid) {
    const user = await User.findOne({ where: { uuid: uuid }, include: [{ model: Role, as: 'roles' }], nest: true });
    if (user === null) throw new NotFoundError('Error, usuario no encontrado', { uuid });
    return user;
}

async function getUserById(id) {
    const user = await User.findByPk(id, { include: [{ model: Role, as: 'roles' }], nest: true });
    if (user === null) throw new NotFoundError('Error, usuario no encontrado', { id });
    return user;
}

async function getUserByIdPlain(id) {
    const user = await User.findByPk(id);
    if (user === null) throw new NotFoundError('Error, usuario no encontrado', { id });
    return user;
}

async function getUserByEmail(email) {
    return await User.findOne({ where: { email } });
}

// ===== UPDATE =====

async function updateUser(uuid, userData, newRoles) {
    return sequelize.transaction(async (t) => {
        const user = await User.findOne({
            where: { uuid },
            include: [{ model: Role, as: 'roles' }],
            transaction: t,
        });
        if (!user) throw new NotFoundError('Error, no se han podido editar los datos del usuario', { userUuid: uuid });
        await user.update({ ...userData }, { transaction: t });
        const roleInstances = await Promise.all(
            newRoles.map(async (roleName) => {
                const [role] = await Role.findOrCreate({ where: { name: roleName }, transaction: t });
                return role;
            }),
        );

        await user.setRoles(roleInstances, { transaction: t });
        await user.reload({ include: [{ model: Role, as: 'roles' }], transaction: t });
        return user;
    });
}

async function deactivateUser(id) {
    const [count] = await User.update({ state: 'INACTIVE' }, { where: { id } });
    if (count === 0) throw new NotFoundError('Error, el usuario no ha podido ser desactivado', { userId: id });
    return count;
}

async function reactivateUser(id) {
    const [count] = await User.update({ state: 'ACTIVE' }, { where: { id: id } });
    if (count === null) throw new NotFoundError('Error, el usuario no ha podido ser reactivado', { userId: id });
    return count;
}

// ===== AUTH =====

async function validateLogin(email, pwd) {
    const user = await User.findOne({ where: { email: email } });
    if (user === null) throw new AuthError('Error al validar inicio de sesión, usuario no encontrado', 401);
    else {
        const correctPwd = await verifyPassword(pwd, user.password);
        if (!correctPwd) throw new AuthError('Las credenciales introducidas son incorrectas', 401);
    }
    return user;
}

module.exports = {
    createUser,
    importUsers,

    getUsers,
    getUser,
    getUserById,
    getUserByEmail,
    getUserByIdPlain,
    getFilteredUsers,

    updateUser,
    deactivateUser,
    reactivateUser,

    validateLogin,
};

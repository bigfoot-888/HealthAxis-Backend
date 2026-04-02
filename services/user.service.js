const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const UserRepository = require('../repositories/user.repository');

const { hashPassword, verifyPassword } = require('../utils/bcrypt');

const AppError = require('../errors/AppError');
const AuthError = require('../errors/AuthError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const { throwIfNotExists } = require('../utils/error-utils');

const { createAuditLog } = require('../repositories/audit-log.repository');

// ===== CREATE =====

/**
 * Creates a new user with roles and initializes their dashboard.
 *
 * Workflow:
 * - Hashes password
 * - Creates user with UUID
 * - Resolves or creates roles and assigns them
 * - Creates default dashboard
 * - Creates default dashboard components
 * - Logs audit event
 *
 * @param {Object} userData - Core user data (name, email, password, etc.)
 * @param {Array<string>} roles - Array of role names
 * @param {number} [userId=1] - ID of the user performing the action
 * @returns {Promise<Object>} Created user instance
 * @throws {ConflictError} If email already exists
 */
async function createUser(userData, roles = [], userId = 1) {
    try {
        return await sequelize.transaction(async (t) => {
            const hashed = await hashPassword(userData.password);

            const user = await UserRepository.create(
                {
                    ...userData,
                    uuid: uuidv4(),
                    password: hashed,
                },
                { transaction: t },
            );

            const roleInstances = await Promise.all(
                roles.map((roleName) => UserRepository.findOrCreateRole(roleName, { transaction: t })),
            );

            await UserRepository.addRoles(user, roleInstances, { transaction: t });

            const dashboard = await UserRepository.createDashboard(user.id, { transaction: t });

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
                            filters: { status: 'ACTIVE' },
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
                            groupBy: 'startTime',
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
                            filters: { status: 'VALID' },
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
                            groupBy: 'status',
                            filters: { status: 'VALID' },
                        },
                    },
                },
            ];

            await UserRepository.bulkCreateDashboardComponents(
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

/**
 * Bulk imports users into the system.
 *
 * Workflow:
 * - Hashes passwords
 * - Generates UUIDs
 * - Inserts users in batch
 *
 * @param {Array<Object>} users - Array of user objects
 * @returns {Promise<Array<Object>>} Inserted users
 * @throws {AppError} If insertion fails
 */
async function importUsers(users) {
    try {
        const prepared = await Promise.all(
            users.map(async (user) => ({
                ...user,
                uuid: uuidv4(),
                password: await hashPassword(user.password),
            })),
        );

        await UserRepository.bulkCreate(prepared);
        return prepared;
    } catch (err) {
        throw new AppError('Error al procesar los usuarios importados', 500, {
            originalMessage: err.message,
        });
    }
}

// ===== READ =====

/**
 * Retrieves all users with roles.
 *
 * @returns {Promise<Array<Object>>}
 */
async function getUsers() {
    return await UserRepository.findAll();
}

/**
 * Searches active users by name or surname.
 *
 * @param {string} query - Search string
 * @param {number} [limit=20] - Maximum number of results
 * @returns {Promise<Array<Object>>}
 */
async function getFilteredUsers(query, limit = 20) {
    return await UserRepository.searchFiltered(query, limit);
}

/**
 * Retrieves a user by UUID.
 *
 * @param {string} uuid
 * @returns {Promise<Object>}
 * @throws {NotFoundError}
 */
async function getUser(uuid) {
    const user = await UserRepository.findByUuid(uuid);
    return throwIfNotExists(user, 'usuario', { uuid });
}

/**
 * Retrieves a user by email.
 *
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
async function getUserByEmail(email) {
    return await UserRepository.findByEmail(email);
}

/**
 * Retrieves a user by ID.
 *
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function getUserById(id) {
    const user = await UserRepository.findById(id);
    return throwIfNotExists(user, 'usuario', { id });
}

/**
 * Searches users using optional filters such as name.
 * If no filters are provided, returns a list of active users.
 *
 * @param {Object} params
 * @param {string} [params.name] - User name or surname (partial match).
 * @returns {Promise<Array<Object>>} List of matching users.
 */
async function searchUsers({ name }) {
    return UserRepository.searchUsers({ name });
}

// ===== UPDATE =====

/**
 * Updates user data and roles.
 *
 * Workflow:
 * - Finds user by UUID
 * - Updates fields
 * - Resolves roles and replaces associations
 *
 * @param {string} uuid - User UUID
 * @param {Object} userData - Fields to update
 * @param {Array<string>} newRoles - New roles
 * @returns {Promise<Object>} Updated user
 * @throws {NotFoundError}
 */
async function updateUser(uuid, userData, newRoles = []) {
    return await sequelize.transaction(async (t) => {
        const user = await UserRepository.findByUuid(uuid, { transaction: t });

        if (!user) {
            throw new NotFoundError('Usuario no encontrado', { uuid });
        }

        await user.update(userData, { transaction: t });

        const roleInstances = await Promise.all(
            newRoles.map((roleName) => UserRepository.findOrCreateRole(roleName, { transaction: t })),
        );

        await UserRepository.setRoles(user, roleInstances, { transaction: t });

        return user;
    });
}

/**
 * Deactivates a user by UUID.
 *
 * @param {string} uuid
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError}
 */
async function deactivateUser(uuid) {
    const user = await UserRepository.findByUuidPlain(uuid);

    if (!user) {
        throw new NotFoundError('Usuario no encontrado', { uuid });
    }

    const [count] = await UserRepository.updateStatusById(user.id, 'INACTIVE');

    if (count === 0) {
        throw new NotFoundError('No se ha podido desactivar el usuario', { uuid });
    }

    return count;
}

/**
 * Reactivates a user by UUID.
 *
 * @param {string} uuid
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError}
 */
async function reactivateUser(uuid) {
    const user = await UserRepository.findByUuidPlain(uuid);

    if (!user) {
        throw new NotFoundError('Usuario no encontrado', { uuid });
    }

    const [count] = await UserRepository.updateStatusById(user.id, 'ACTIVE');

    if (count === 0) {
        throw new NotFoundError('No se ha podido reactivar el usuario', { uuid });
    }

    return count;
}

// ===== AUTH =====

/**
 * Validates user login credentials.
 *
 * Workflow:
 * - Finds user by email
 * - Verifies password
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} Authenticated user
 * @throws {AuthError}
 */
async function validateLogin(email, password) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
        throw new AuthError('Usuario no encontrado', 401);
    }

    const valid = await verifyPassword(password, user.password);

    if (!valid) {
        throw new AuthError('Credenciales incorrectas', 401);
    }

    return user;
}

module.exports = {
    createUser,
    importUsers,

    getUsers,
    getFilteredUsers,
    getUser,
    getUserById,
    getUserByEmail,
    searchUsers,

    updateUser,
    deactivateUser,
    reactivateUser,

    validateLogin,
};

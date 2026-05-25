const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const UserRepository = require('../repositories/user.repository');
const AppointmentRepository = require('../repositories/appointment.repository');
const AgendaRepository = require('../repositories/agenda.repository');

const { hashPassword, verifyPassword } = require('../utils/password.utils');

const AppError = require('../errors/AppError');
const AuthError = require('../errors/AuthError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const ValidationError = require('../errors/ValidationError');
const { throwIfNotExists } = require('../utils/error-utils');
const { DEFAULT_DASHBOARD_COMPONENTS } = require('../config/dashboard');

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
 * @returns {Promise<Object>} Created user instance
 * @throws {ConflictError} If email already exists
 */
async function createUser(userData, roles = []) {
    return await sequelize.transaction(async (t) => {
        const hashed = await hashPassword(userData.password);

        const userExists = await UserRepository.findByEmail(userData.email, { transaction: t });
        if (userExists) throw new ConflictError('Error, el correo ya existe', { email: userData.email });

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
        
        await UserRepository.bulkCreateDashboardComponents(
            DEFAULT_DASHBOARD_COMPONENTS.map((component) => ({
                ...component,
                dashboardId: dashboard.id,
            })),
            { transaction: t },
        );

        return user;
    });
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
 * Retrieves users with optional filters.
 *
 * @returns {Promise<Array<Object>>}
 */
async function getUsers(query = {}) {
    const { agendaUuid } = query;
    const where = {};
    if (agendaUuid) {
        const agenda = await AgendaRepository.findByUuidPlain(agendaUuid);
        throwIfNotExists(agenda, 'agenda', { agendaUuid });
        where.agendaId = agenda.id;
    }
    return await UserRepository.findAll({ where });
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
 * Changes the password of a user.
 *
 * Workflow:
 * - Retrieves user by UUID
 * - Validates current password
 * - Ensures new password is different from current one
 * - Hashes new password
 * - Persists the updated password
 *
 * @param {string} uuid - UUID of the user
 * @param {string} currentPassword - Current (plain text) password
 * @param {string} newPassword - New (plain text) password
 *
 * @throws {NotFoundError} If the user does not exist
 * @throws {ValidationError} If the current password is incorrect
 * @throws {ValidationError} If the new password matches the current password
 *
 * @returns {Promise<void>}
 */
async function changeUserPassword(uuid, currentPassword, newPassword) {
    const user = await UserRepository.findByUuid(uuid);
    throwIfNotExists(user, 'usuario', { uuid });

    const isMatch = await verifyPassword(currentPassword, user.password);

    if (!isMatch) throw new ValidationError('La contraseña actual es incorrecta');

    const isSame = await verifyPassword(newPassword, user.password);

    if (isSame) throw new ValidationError('La nueva contraseña no puede ser igual a la actual');

    const hashedPassword = await hashPassword(newPassword);
    await UserRepository.updatePassword(user, hashedPassword);
}

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
    return await sequelize.transaction(async (t) => {
        const user = await UserRepository.findByUuidPlain(uuid, { transaction: t });

        if (!user) {
            throw new NotFoundError('Usuario no encontrado', { uuid });
        }

        const activeAppointments = await AppointmentRepository.hasActiveAppointmentsByUserId(user.id, {
            transaction: t,
        });

        if (activeAppointments) {
            throw new ValidationError('No se puede dar de baja a un usuario con citas activas.', 400, {
                activeAppointments,
            });
        }

        const [count] = await UserRepository.updateStatusById(user.id, 'INACTIVE', { transaction: t });

        if (count === 0) {
            throw new NotFoundError('No se ha podido desactivar el usuario', { uuid });
        }

        return count;
    });
}

/**
 * Reactivates a user by UUID.
 *
 * @param {string} uuid
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError}
 */
async function reactivateUser(uuid) {
    return await sequelize.transaction(async (t) => {
        const user = await UserRepository.findByUuidPlain(uuid, { transaction: t });

        if (!user) {
            throw new NotFoundError('Usuario no encontrado', { uuid });
        }

        const [count] = await UserRepository.updateStatusById(user.id, 'ACTIVE', { transaction: t });

        if (count === 0) {
            throw new NotFoundError('No se ha podido reactivar el usuario', { uuid });
        }

        return count;
    });
}

// ===== GUARDS =====

function ensureUserIsActive(user) {
    if (user.status !== 'ACTIVE') {
        throw new ValidationError('El usuario está dado de baja.');
    }
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
    changeUserPassword,

    ensureUserIsActive,
};

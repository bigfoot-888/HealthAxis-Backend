const User = require('../models/user-model');

const { hashPassword, verifyPassword } = require('../utils/bcrypt');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const AppError = require('../errors/AppError');
const AuthError = require('../errors/AuthError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');

// ===== CREATE =====

async function createUser(userData) {
    try {
        const hashed = await hashPassword(userData.password);
        const uuid = uuidv4();
        return await User.create({ ...userData, password: hashed, uuid });
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
            throw new AppError(
                'Error al procesar los usuarios importados', 500,
                { originalMessage: err.message, user: user.email },
            );
        }
    }
    return users;
}

// ===== READ =====

async function getUsers() {
    const users = await User.findAll();
    return users;
}

async function getUser(uuid) {
    const user = await User.findOne({ where: { uuid: uuid } });
    if (user === null)
        throw new NotFoundError("Error, usuario no encontrado", {uuid})
    return user;
}

async function getUserById(id) {
    const user = await User.findByPk(id);
    if (user === null)
        throw new NotFoundError("Error, usuario no encontrado", {id})
    return user;
}

async function getUserByEmail(email) {
    return await User.findOne({where: {email}}); 
}

// ===== UPDATE =====

async function updateUser(uuid, userData) {
    const [count] = await User.update(
        { ...userData },
        { where: { uuid } },
    );
    if (count === 0)
        throw new NotFoundError(
            'Error, no se han podido editar los datos del usuario',
            { userId: id },
        );
    return count;
}

async function deactivateUser(id) {
    const [count] = await User.update(
        { state: 'INACTIVE' },
        { where: { id } },
    );
    if (count === 0)
        throw new NotFoundError(
            'Error, el usuario no ha podido ser desactivado',
            { userId: id },
        );
    return count;
}

async function reactivateUser(id) {
    const [count] = await User.update(
        { state: 'ACTIVE' },
        { where: { id: id } },
    );
    if (count === null)
        throw new NotFoundError(
            'Error, el usuario no ha podido ser reactivado',
            { userId: id },
        );
    return count;
}

// ===== AUTH =====

async function validateLogin(email, pwd) {
    const user = await User.findOne({ where: { email: email } });
    if (user === null)
        throw new AuthError(
            'Error al validar inicio de sesión, usuario no encontrado',
            401,
        );
    else {
        const correctPwd = await verifyPassword(pwd, user.password);
        if (!correctPwd)
            throw new AuthError(
                'Las credenciales introducidas son incorrectas',
                401,
            );
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

    updateUser,
    deactivateUser,
    reactivateUser,

    validateLogin,
};

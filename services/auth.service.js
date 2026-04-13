const { verifyPassword } = require('../utils/password.utils');
const UserRepository = require('../repositories/user.repository');
const AuthError = require('../errors/AuthError');

async function login(data, req) {
    const { email, password } = data;

    const user = await UserRepository.findByEmail(email);
    if (!user) {
        throw new AuthError('Usuario no encontrado', 401);
    }
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
        throw new AuthError('Credenciales incorrectas', 401);
    }
    await createSession(req, user);
    return sanitizeUser(user);
}

async function getMe(req) {
    if (!req.session?.user?.id) {
        throw new AuthError('Acceso no autorizado', 401);
    }

    const user = await UserRepository.findById(req.session.user.id);
    if (!user) {
        throw new AuthError('Acceso no autorizado', 401);
    }

    return sanitizeUser(user);
}

async function logout(req) {
    console.log("hoal")
    return new Promise((resolve, reject) => {
        req.session.destroy((err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

// ===== helpers =====

async function createSession(req, user) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);

            req.session.user = {
                id: user.id,
                role: user.role,
            };

            req.session.save((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

function sanitizeUser(user) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.name + " " + user.surname,
    };
}

module.exports = {
    login,
    getMe,
    logout,
};

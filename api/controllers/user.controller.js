const userService = require('../../services/user.service');

// ===== CREATE =====

async function createUserController(req, res) {
    const { name, surname, email, password, roles, phone } = req.body;

    const userData = {
        name,
        surname,
        email,
        password,
        phone,
    };

    const newUser = await userService.createUser(userData, roles);
    res.status(201).json(newUser);
}

async function importUsersController(req, res) {
    const { users } = req.body;
    const imported = await userService.importUsers(users);
    res.status(201).json(imported);
}

// ===== READ =====

async function getUsersController(req, res) {
    const users = await userService.getUsers();
    res.status(200).json(users);
}

async function getFilteredUsersController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit, 10) || 20;

    const users = await userService.getFilteredUsers(query, limit);
    res.status(200).json(users);
}

async function getUserController(req, res) {
    const { uuid } = req.params;

    const user = await userService.getUser(uuid);
    res.status(200).json(user);
}

async function getProfile(req, res) {
    const userId = req.session.userID;

    if (!userId) {
        throw new Error('El usuario no existe.');
    }

    const user = await userService.getUserById(userId);
    res.status(200).json(user);
}

// ===== UPDATE =====

async function updateUserController(req, res) {
    const { uuid } = req.params;
    const { name, surname, email, phone, roles } = req.body;

    const userData = {
        name,
        surname,
        email,
        phone,
    };

    const updatedUser = await userService.updateUser(uuid, userData, roles);
    res.status(200).json(updatedUser);
}

// ===== STATE =====

async function deactivateUserController(req, res) {
    const { uuid } = req.params;

    const count = await userService.deactivateUser(uuid);
    res.status(200).json({ updated: count });
}

async function reactivateUserController(req, res) {
    const { uuid } = req.params;

    const count = await userService.reactivateUser(uuid);
    res.status(200).json({ updated: count });
}

// ===== AUTH =====

async function validateLogin(req, res) {
    const { email, password } = req.body;

    const user = await userService.validateLogin(email, password);

    req.session.fullName = `${user.name} ${user.surname}`;
    req.session.userID = user.id;

    res.status(200).json(user);
}

async function logout(req, res) {
    const userId = req.session.userID;

    req.session.destroy();
    res.status(200).json({ id: userId });
}

async function checkSession(req, res) {
    if (req.session.userID) {
        return res.status(200).json(req.session.userID);
    }
    return res.sendStatus(401);
}

module.exports = {
    createUserController,
    importUsersController,

    getUsersController,
    getFilteredUsersController,
    getUserController,
    getProfile,

    updateUserController,
    deactivateUserController,
    reactivateUserController,

    validateLogin,
    logout,
    checkSession,
};
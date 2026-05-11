const userService = require('../../services/user.service');

// ===== CREATE =====

async function createUserController(req, res) {
    const { name, surname, email, password, roles, phone, agenda } = req.body;

    const userData = {
        name,
        surname,
        email,
        password,
        phone,
        agendaId: agenda?.id,
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
    const users = await userService.getUsers(req.query);
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
    const userId = req.session.user.id;

    if (!userId) throw new Error('El usuario no existe.');

    const user = await userService.getUserById(userId);
    res.status(200).json(user);
}

// ===== UPDATE =====

async function updateUserController(req, res) {
    const { uuid } = req.params;
    const { name, surname, email, phone, roles, agenda } = req.body;

    const userData = {
        name,
        surname,
        email,
        phone,
        agendaId: agenda?.id,
    };

    const updatedUser = await userService.updateUser(uuid, userData, roles);
    res.status(200).json(updatedUser);
}

async function changeUserPasswordController(req, res) {
    const { uuid } = req.params;
    const { currentPassword, newPassword } = req.body;

    await userService.changeUserPassword(uuid, currentPassword, newPassword);

    res.status(204).send();
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
    changeUserPasswordController,
};

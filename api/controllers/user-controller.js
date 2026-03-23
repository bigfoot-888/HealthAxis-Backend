const userService = require('../../modules/user-service');

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

async function getUsersController(req, res) {
    try {
        const users = await userService.getUsers();
        res.status(201).json(users);
    } catch (err) {
        console.log(err);
    }
}

async function getFilteredUsersController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit) || 20;
    const users = await userService.getFilteredUsers(query, limit);
    res.status(201).json(users);
}

async function deactivateUserController(req, res) {
    try {
        const id = req.body.id;
        const user = await userService.deactivateUser(id);
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
}

async function reactivateUserController(req, res) {
    try {
        const id = req.body.id;
        const user = await userService.reactivateUser(id);
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
}

async function logout(req, res) {
    const id = req.session.userID;
    req.session.destroy();
    return res.status(201).json({ id: id });
}

async function validateLogin(req, res) {
    const { email, password } = req.body;
    const user = await userService.validateLogin(email, password);
    if (!user) {
        const error = new Error('Credencias incorrectas.');
        error.status = 401;
        throw error;
    } else {
        req.session.fullName = user.name + ' ' + user.surname;
        req.session.userID = user.id;
        return res.status(201).json(user);
    }
}

async function importUsersController(req, res) {
    const { users } = req.body;
    const upload = await userService.importUsers(users);
    return res.status(201).json(users);
}

async function getUserController(req, res) {
    const uuid = req.params.id;
    console.log(uuid);
    console.log('hola');
    const user = await userService.getUser(uuid);
    return res.status(201).json(user);
}

async function updateUserController(req, res) {
    const uuid = req.params.id;
    const { name, surname, email, phone, roles } = req.body;
    const userData = {
        name,
        surname,
        email,
        phone,
    };
    const user = userService.updateUser(uuid, userData, roles);
    return res.status(201).json(user);
}

async function getProfile(req, res) {
    if (!req.session.userID) {
        console.log('Vaya...');
        const error = new Error('El usuario no existe.');
        error.status = 400;
        throw error;
    } else {
        const id = req.session.userID;
        console.log(id);
        const user = await userService.getUserById(id);
        return res.status(201).json(user);
    }
}

async function checkSession(req, res) {
    console.log(req.session.userID);
    if (req.session.userID) return res.status(200).json(req.session.userID);
    else return res.sendStatus(401);
}

module.exports = {
    createUserController,
    getUsersController,
    deactivateUserController,
    validateLogin,
    importUsersController,
    getUserController,
    getFilteredUsersController,
    logout,
    checkSession,
    getProfile,
    updateUserController,
    reactivateUserController,
};

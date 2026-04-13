// auth.controller.js
const authService = require('../../services/auth.service');


async function login(req, res) {
    const user = await authService.login(req.body, req);
    res.json(user);
}

async function me(req, res) {
    try {
        const user = await authService.getMe(req);
        res.json(user);
    }
    catch (err) {
        res.sendStatus(401); 
    }
}

async function logout(req, res) {
    await authService.logout(req);
    res.status(204).send();
}

module.exports = {
    login,
    me,
    logout,
};

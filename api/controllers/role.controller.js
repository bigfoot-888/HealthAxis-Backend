const roleService = require("../../services/role.service")
// ===== READ =====

async function getRolesPlainController(req, res) {
    const roles = await roleService.getRolesPlain();
    res.status(200).json(roles);
}

async function getFilteredRolesController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit, 10) || 20;

    const roles = await roleService.getFilteredRoles(query, limit);
    res.status(200).json(roles);
}

module.exports = {
    getRolesPlainController,
    getFilteredRolesController
}
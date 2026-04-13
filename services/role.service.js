const RoleRepository = require('../repositories/role.repository');

// ===== READ =====

/**
 * Retrieves all roles without associations.
 *
 * @returns {Promise<Array<Object>>}
 */
async function getRolesPlain() {
    return await RoleRepository.findAllPlain();
}

/**
 * Searches roles by name.
 *
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array<Object>>}
 */
async function getFilteredRoles(query, limit = 20) {
    return await RoleRepository.searchFiltered(query, limit);
}

module.exports = {
    getRolesPlain,
    getFilteredRoles,
};

const { Role } = require('../models/index');
const { Op } = require('sequelize');
const { escapeLike } = require('../utils/query-utils');

// ===== READ =====

async function findAllPlain(options = {}) {
    return await Role.findAll(options);
}

async function searchFiltered(query, limit = 20, options = {}) {
    console.log(query)
    if (!query || query.length < 2) return [];

    const safeQuery = `%${escapeLike(query)}%`;

    return await Role.findAll({
        attributes: ['id', 'name'],
        where: {
            name: { [Op.iLike]: safeQuery },
        },
        order: [['id', 'DESC']],
        limit: Math.min(limit, 50),
        ...options,
    });
}

module.exports = {
    findAllPlain,
    searchFiltered,
};

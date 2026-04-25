const { FlowEvent } = require('../models/index');

async function findById(id, options = {}) {
    return FlowEvent.findByPk(id, options);
}

async function deleteById(id, options = {}) {
    return FlowEvent.destroy({
        where: { id },
        ...options,
    });
}

module.exports = {
    findById,
    deleteById,
};

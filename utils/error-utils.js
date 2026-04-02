const NotFoundError = require('../errors/NotFoundError');

/**
 * Checks if a record exists and throws a NotFoundError if it doesn't.
 * @param {Object|null} record - The database record to check
 * @param {string} entityName - The name of the entity for the error message
 * @param {Object} identifier - The identifier used in the query (e.g., { uuid: '123' })
 * @returns {Object} The record, if it exists
 */
function throwIfNotExists(record, entityName, identifier) {
    if (!record) {
        throw new NotFoundError(`Error, ${entityName} no encontrado`, identifier);
    }
    return record;
};

module.exports = {
    throwIfNotExists,
};
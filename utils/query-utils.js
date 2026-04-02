// Treat query as a literal string, escaping % and _ characters
/**
 * Treats the query as a literal string, escaping % and _ characters
 * @param {str} str - The query
 * @returns {str} The escaped query
 */
function escapeLike(str) {
    return str.replace(/[%_]/g, '\\$&');
}

/**
 * Appends a 'fullName' property to any entity object.
 * Fallbacks are in place to support both legacy (name/surname)
 * and standard (firstName/lastName) naming conventions.
 * @param {Object} entity - The database record (User, Patient, etc.)
 * @returns {Object} The entity with a merged fullName property
 */
function formatFullName(entity) {
    if (!entity) return entity;

    // Safely grab the names, preferring the new convention if it exists
    const first = entity.firstName || entity.name || '';
    const last = entity.lastName || entity.surname || '';

    return {
        ...entity,
        fullName: `${first} ${last}`.trim(),
    };
}
module.exports = {
    escapeLike,
};

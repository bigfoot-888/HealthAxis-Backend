const { AuditLog, User } = require('../models/index');
const AppError = require('../errors/AppError');
/**
 * Creates a new audit log entry.
 *
 * @param {Object} params
 * @param {string} params.action - The action performed ('CREATED', 'STATE_CHANGED', etc.)
 * @param {string} params.entityType - The type of entity ('DIAGNOSIS', 'TREATMENT', etc.)
 * @param {number} params.entityId - ID of the entity affected
 * @param {number} params.userId - ID of the user performing the action
 * @param {number} params.patientId - ID of the patient related to this action
 * @param {Object} [params.meta] - Optional extra metadata
 */
async function createAuditLog({ action, entityType, entityId, userId, patientId, meta = {}, transaction }) {
    try {
        const log = await AuditLog.create(
            {
                action,
                entityType,
                entityId,
                userId,
                patientId,
                meta,
            },
            { transaction },
        );

        return log;
    } catch (error) {
        throw new AppError('Error al crear registro de auditoría', 500, { originalError: error.message });
    }
}

/**
 * Retrieves audit logs by patient ID.
 *
 * @param {number} patientId
 * @returns {Promise<Array<Object>>} List of audit logs
 */
async function findByPatientId(patientId, { limit, offset }) {
    return AuditLog.findAndCountAll({
        where: { patientId },
        include: [
            {
                model: User,
                as: "user",
                attributes: ['id', 'name', 'surname'],
            },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });
}

module.exports = {
    findByPatientId,
    createAuditLog,
};

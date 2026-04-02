const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const ClinicalDocumentRepository = require('../repositories/clinical-document.repository');

const NotFoundError = require('../errors/NotFoundError');
const { throwIfNotExists } = require('../utils/error-utils');
const { getFileFromStorage } = require('../utils/file');

// ===== CREATE =====

/**
 * Creates a clinical document and associates attachments, entities, and users.
 *
 * Workflow:
 * - Creates clinical document with UUID
 * - Associates attachments
 * - Associates entities (diagnosis, treatment, etc.)
 * - Associates users with roles
 *
 * @param {Object} documentData - Clinical document base data
 * @param {Array<number>} attachments - Array of attachment IDs
 * @param {Array<{id: number, type: string}>} entities - Related entities
 * @param {Array<{userId: number, role: string}>} users - Users with roles
 * @returns {Promise<Object>} Created clinical document
 */
async function createClinicalDocument(documentData, attachments = [], entities = [], users = []) {
    return await sequelize.transaction(async (t) => {
        const document = await ClinicalDocumentRepository.create(
            {
                ...documentData,
                uuid: uuidv4(),
            },
            { transaction: t },
        );

        await Promise.all(
            attachments.map((attachmentId) =>
                ClinicalDocumentRepository.addAttachment(document, attachmentId, { transaction: t }),
            ),
        );

        await Promise.all(
            entities.map((ent) => ClinicalDocumentRepository.addEntity(document, ent.id, { transaction: t })),
        );

        await Promise.all(
            users.map(({ userId, role }) =>
                ClinicalDocumentRepository.addUser(document, userId, { role }, { transaction: t }),
            ),
        );

        return document;
    });
}

/**
 * Creates a clinical attachment entry.
 *
 * @param {Object} fileData
 * @param {string} fileData.storageKey
 * @param {string} fileData.fileName
 * @param {string} fileData.mimeType
 * @param {number} fileData.fileSize
 * @returns {Promise<Object>} Created attachment
 */
async function createClinicalAttachment(fileData) {
    return await ClinicalDocumentRepository.createAttachment({
        ...fileData,
        uuid: uuidv4(),
    });
}

// ===== READ =====

/**
 * Retrieves all clinical documents with associations.
 *
 * @returns {Promise<Array<Object>>}
 */
async function getClinicalDocuments() {
    return await ClinicalDocumentRepository.findAll();
}

/**
 * Retrieves a clinical document by UUID with associations.
 *
 * @param {string} uuid
 * @returns {Promise<Object>}
 * @throws {NotFoundError}
 */
async function getClinicalDocument(uuid) {
    const document = await ClinicalDocumentRepository.findByUuid(uuid);
    return throwIfNotExists(document, 'documento clínico', { uuid });
}

/**
 * Retrieves a clinical document by UUID without associations.
 *
 * @param {string} uuid
 * @returns {Promise<Object>}
 * @throws {NotFoundError}
 */
async function getClinicalDocumentPlain(uuid) {
    const document = await ClinicalDocumentRepository.findByUuidPlain(uuid);
    return throwIfNotExists(document, 'documento clínico', { uuid });
}

/**
 * Searches clinical documents by name.
 *
 * @param {string} query - Search string
 * @param {number} [limit=20] - Maximum number of results
 * @returns {Promise<Array<Object>>}
 */
async function getFilteredClinicalDocuments(query, limit = 20) {
    return await ClinicalDocumentRepository.searchFiltered(query, limit);
}

/**
 * Retrieves a clinical attachment file by UUID.
 *
 * Workflow:
 * - Fetches attachment metadata
 * - Retrieves file from storage
 *
 * @param {string} uuid - Attachment UUID
 * @returns {Promise<{fileBuffer: Buffer, mimeType: string, fileName: string}>}
 * @throws {NotFoundError}
 */
async function getClinicalAttachment(uuid) {
    const attachment = await ClinicalDocumentRepository.findAttachmentByUuid(uuid);

    const resolved = throwIfNotExists(attachment, 'archivo', { uuid });

    const fileBuffer = await getFileFromStorage(`${resolved.storageKey}.${resolved.fileName}`);

    return {
        fileBuffer,
        mimeType: resolved.mimeType,
        fileName: resolved.fileName,
    };
}

// ===== UPDATE =====

/**
 * Updates the system status of a clinical document.
 *
 * @param {string} uuid
 * @param {string} status
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError}
 */
async function updateClinicalDocumentStatus(uuid, status) {
    const [count] = await ClinicalDocumentRepository.updateStatusByUuid(uuid, status);

    if (count === 0) {
        throw new NotFoundError('No se ha podido actualizar el documento clínico', { uuid });
    }

    return count;
}

/**
 * Updates the system status of a clinical attachment.
 *
 * @param {string} uuid
 * @param {string} status
 * @returns {Promise<number>} Number of affected rows
 * @throws {NotFoundError}
 */
async function updateClinicalAttachmentStatus(uuid, status) {
    const [count] = await ClinicalDocumentRepository.updateAttachmentStatusByUuid(uuid, status);

    if (count === 0) {
        throw new NotFoundError('No se ha podido actualizar el archivo', { uuid });
    }

    return count;
}

module.exports = {
    createClinicalDocument,
    createClinicalAttachment,

    getClinicalDocuments,
    getClinicalDocument,
    getClinicalDocumentPlain,
    getFilteredClinicalDocuments,
    getClinicalAttachment,

    updateClinicalDocumentStatus,
    updateClinicalAttachmentStatus,
};

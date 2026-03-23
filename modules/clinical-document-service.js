const { ClinicalDocument, ClinicalAttachment, ClinicalDocumentEntity, User, Patient } = require('../models/index');
const { Op, literal } = require('sequelize');
const sequelize = require('../config/database');
const NotFoundError = require('../errors/NotFoundError');
const { getFileFromStorage } = require('../utils/file');

// ===== CREATE =====

/**
 * Creates a clinical document and associates attachments and entities
 * @param {Object} documentData - Clinical document data
 * @param {Array<Object>} attachments - Array of attachments {id}
 * @param {Array<Object>} entities - Array of entities {id, type}
 * @returns {Promise<Object>} The resulting clinical document
 */
async function createClinicalDocument(documentData, attachments = [], entities = [], users = []) {
    return sequelize.transaction(async (t) => {
        console.log("estoy aqui")
        const document = await ClinicalDocument.create({ ...documentData }, { transaction: t });

        // Associate attachments
        if (attachments.length > 0) {
            await Promise.all(attachments.map((id) => document.addClinicalAttachment(id, { transaction: t })));
        }

        // Associate entities (Diagnosis or Treatment)
        if (entities.length > 0) {
            await Promise.all(entities.map((ent) => document.addClinicalDocumentEntity(ent.id, { transaction: t })));
        }
        await Promise.all(
            users.map(({ user }) => {
                const throughData = {
                    role: user.role,
                };
                return document.addUser(user.id, {
                    through: throughData,
                    transaction: t,
                });
            }),
        );

        return document;
    });
}

async function createClinicalAttachment(fileData) {
    const {storageKey, fileName, mimeType, fileSize} = fileData
    return await ClinicalAttachment.create({ storageKey, fileName, mimeType, fileSize});
}

// ===== READ =====

async function getClinicalAttachment(id) {
    const attachment = await ClinicalAttachment.findByPk(id);
    if (!attachment) throw new NotFoundError('Archivo no encontrado', { id });

    // Fetch file from S3 or local storage using storageKey
    const fileBuffer = await getFileFromStorage(attachment.storageKey + "." + attachment.fileName);
    return {
        fileBuffer,
        mimeType: attachment.mimeType,
        fileName: attachment.fileName,
    };
}

async function getClinicalDocumentsPlain() {
    return await ClinicalDocument.findAll();
}

async function getClinicalDocumentsAndAttachments() {
    return await ClinicalDocument.findAll({
        include: [{ model: ClinicalAttachment, as: 'clinicalAttachments' }],
        raw: true,
        nest: true,
    });
}

async function getClinicalDocumentsAndEntities() {
    return await ClinicalDocument.findAll({
        include: [{ model: ClinicalDocumentEntity, as: 'clinicalDocumentEntities' }],
        raw: true,
        nest: true,
    });
}

async function getClinicalDocumentsAndUsers() {
    return await ClinicalDocument.findAll({
        include: [{ model: User, as: 'users' }],
        raw: true,
        nest: true,
    });
}

async function getClinicalDocuments() {
    return await ClinicalDocument.findAll({
        include: [
            { model: ClinicalAttachment, as: 'clinicalAttachments' },
            { model: ClinicalDocumentEntity, as: 'clinicalDocumentEntities' },
            {
                model: User,
                as: 'users',
                attributes: ['id', [literal(`"users"."name" || ' ' || "users"."surname"`), 'fullName']],
            },
        ],
        nest: true,
    });
}

async function getClinicalDocumentById(id) {
    const document = await ClinicalDocument.findByPk(id, {
        include: [
            { model: ClinicalAttachment, as: 'clinicalAttachments' },
            { model: ClinicalDocumentEntity, as: 'clinicalDocumentEntities' },
        ],
    });
    if (!document) throw new NotFoundError('Clinical document not found', { id });
    return document;
}

async function getClinicalDocument(uuid) {
    const document = await ClinicalDocument.findOne({
        where: { uuid },
        include: [
            { model: ClinicalAttachment, as: 'clinicalAttachments' },
            { model: ClinicalDocumentEntity, as: 'clinicalDocumentEntities' },
            { model: User, as: 'users' },
        ],
        nest: true
    });
    console.log(document)
    if (!document) throw new NotFoundError('Clinical document not found', { uuid });
    return document;
}

// Escape % and _ characters for safe LIKE queries
const escapeLike = (str) => str.replace(/[%_]/g, '\\$&');

async function getFilteredClinicalDocuments(query, limit = 20) {
    if (!query || query.length < 2) return [];

    const safeQuery = `%${escapeLike(query)}%`;
    const documents = await ClinicalDocument.findAll({
        attributes: ['id', 'name'],
        where: {
            state: 'ACTIVE',
            name: { [Op.iLike]: safeQuery },
        },
        order: [['name', 'ASC']],
        limit: Math.min(limit, 50),
    });

    return documents;
}

// ===== UPDATE =====

async function updateClinicalDocumentState(uuid, newState) {
    const [count] = await ClinicalDocument.update({ state: newState }, { where: { uuid } });
    if (count === 0) throw new NotFoundError('Unable to update state of clinical document', { uuid });
    return count;
}

async function updateClinicalDocumentRecordState(uuid, newRecordState) {
    const [count] = await ClinicalDocument.update({ recordState: newRecordState }, { where: { uuid } });
    if (count === 0) throw new NotFoundError('Unable to update record state of clinical document', { uuid });
    return count;
}

module.exports = {
    createClinicalDocument,
    createClinicalAttachment,

    getClinicalDocumentsPlain,
    getClinicalDocumentsAndAttachments,
    getClinicalDocumentsAndEntities,
    getClinicalDocumentsAndUsers,
    getClinicalDocuments,
    getFilteredClinicalDocuments,

    getClinicalDocumentById,
    getClinicalDocument,

    getClinicalAttachment,

    updateClinicalDocumentState,
    updateClinicalDocumentRecordState,
};

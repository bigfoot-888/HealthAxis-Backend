const { ClinicalDocument, ClinicalAttachment, ClinicalDocumentEntity, User } = require('../models/index');

const { Op, literal } = require('sequelize');
const { escapeLike } = require('../utils/query-utils');

// ===== CREATE =====

async function create(data, options = {}) {
    return await ClinicalDocument.create(data, options);
}

async function createAttachment(data, options = {}) {
    return await ClinicalAttachment.create(data, options);
}

async function addAttachment(document, attachmentId, options = {}) {
    return await document.addClinicalAttachment(attachmentId, options);
}

async function addEntity(document, entityId, options = {}) {
    return await document.addClinicalDocumentEntity(entityId, options);
}

async function addUser(document, userId, throughData, options = {}) {
    return await document.addUser(userId, {
        through: throughData,
        ...options,
    });
}

// ===== READ =====

async function findAll(options = {}) {
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
        ...options,
    });
}

async function findByUuid(uuid, options = {}) {
    return await ClinicalDocument.findOne({
        where: { uuid },
        include: [
            { model: ClinicalAttachment, as: 'clinicalAttachments' },
            { model: ClinicalDocumentEntity, as: 'clinicalDocumentEntities' },
            { model: User, as: 'users' },
        ],
        ...options,
    });
}

async function findByUuidPlain(uuid, options = {}) {
    return await ClinicalDocument.findOne({
        where: { uuid },
        ...options,
    });
}

async function findAttachmentByUuid(uuid, options = {}) {
    return await ClinicalAttachment.findOne({
        where: { uuid },
        ...options,
    });
}

async function searchFiltered(query, limit = 20, options = {}) {
    if (!query || query.length < 2) return [];

    const safeQuery = `%${escapeLike(query)}%`;

    return await ClinicalDocument.findAll({
        attributes: ['id', 'name'],
        where: {
            status: 'ACTIVE',
            name: { [Op.iLike]: safeQuery },
        },
        order: [['name', 'ASC']],
        limit: Math.min(limit, 50),
        ...options,
    });
}

// ===== UPDATE =====

async function updateStatusByUuid(uuid, status, options = {}) {
    return await ClinicalDocument.update(
        { status },
        {
            where: { uuid },
            ...options,
        },
    );
}

async function updateAttachmentStatusByUuid(uuid, status, options = {}) {
    return await ClinicalAttachment.update(
        { status },
        {
            where: { uuid },
            ...options,
        },
    );
}

module.exports = {
    create,
    createAttachment,
    addAttachment,
    addEntity,
    addUser,

    findAll,
    findByUuid,
    findByUuidPlain,
    findAttachmentByUuid,
    searchFiltered,

    updateStatusByUuid,
    updateAttachmentStatusByUuid,
};

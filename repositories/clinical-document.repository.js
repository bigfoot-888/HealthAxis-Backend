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

async function findByIdPlain(id, options = {}) {
    return await ClinicalDocument.findByPk(id, {
        ...options,
    });
}

async function findByIds(ids = [], options = {}) {
    if (ids.length === 0) return [];
    return await ClinicalDocument.findAll({
        where: { id: ids },
        ...options,
    });
}

async function findAttachmentById(id, options={}){
    return await ClinicalAttachment.findByPk(id, {...options})
}

async function searchFiltered(query, limit = 20, options = {}) {
    if (!query || query.length < 2) return [];

    const safeQuery = `%${escapeLike(query)}%`;
    console.log(safeQuery)
    return await ClinicalDocument.findAll({
        attributes: ['id', 'title'],
        where: {
            [Op.or]: [
                { title: { [Op.iLike]: safeQuery },},
            ],
        },
        order: [['title', 'ASC']],
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

async function updateAttachmentStatusById(id, status, options = {}) {
    return await ClinicalAttachment.update(
        { status },
        {
            where: { id },
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
    searchFiltered,
    findByIdPlain,
    findAttachmentById,
    findByIds,

    updateStatusByUuid,
    updateAttachmentStatusById,
};

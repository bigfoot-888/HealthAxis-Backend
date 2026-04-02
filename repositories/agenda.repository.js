const { Agenda, AgendaPeriod } = require('../models/index');
const { Op } = require('sequelize');
const { escapeLike } = require('../utils/query-utils');

// ===== CREATE =====

async function create(data, options = {}) {
    return await Agenda.create(data, options);
}

async function createPeriod(data, options = {}) {
    return await AgendaPeriod.create(data, options);
}

// ===== READ =====

async function findAll(options = {}) {
    return await Agenda.findAll({
        include: [{ model: AgendaPeriod, as: 'activePeriod' }],
        raw: true,
        nest: true,
        ...options,
    });
}

async function searchFiltered(query, limit = 20, options = {}) {
    if (!query || query.length < 2) return [];

    const safeQuery = `%${escapeLike(query)}%`;

    return await Agenda.findAll({
        attributes: ['id', 'name'],
        where: {
            status: 'ACTIVE',
            name: { [Op.iLike]: safeQuery },
        },
        include: [
            {
                model: AgendaPeriod,
                as: 'activePeriod',
                attributes: ['agendaStatus'],
                where: { agendaStatus: 'OPEN' },
                required: true,
            },
        ],
        order: [['name', 'ASC']],
        limit: Math.min(limit, 50),
        ...options,
    });
}

async function findByUuid(uuid, options = {}) {
    return await Agenda.findOne({
        where: { uuid },
        include: [{ model: AgendaPeriod, as: 'activePeriod' }],
        ...options,
    });
}

async function findByUuidPlain(uuid, options = {}) {
    return await Agenda.findOne({
        where: { uuid },
        ...options,
    });
}

async function findByIdPlain(id, options = {}) {
    return await Agenda.findByPk(id, {
        ...options,
    });
}

async function findByName(name, excludedUuid = null, options = {}) {
    return await Agenda.findOne({
        where: {
            name,
            ...(excludedUuid && { uuid: { [Op.ne]: excludedUuid } }),
        },
        ...options,
    });
}

async function findPeriodByUuid(uuid, options = {}) {
    return await AgendaPeriod.findOne({
        where: { uuid },
        ...options,
    });
}

async function findActivePeriodByAgendaId(agendaId, options = {}) {
    return await AgendaPeriod.findOne({
        where: {
            agendaId,
            status: 'ACTIVE',
        },
        ...options,
    });
}

// ===== UPDATE =====

async function updateByUuid(uuid, data, options = {}) {
    return await Agenda.update(data, {
        where: { uuid },
        ...options,
    });
}

async function updateStatusById(id, status, options = {}) {
    return await Agenda.update(
        { status },
        {
            where: { id },
            ...options,
        },
    );
}

async function updatePeriodByUuid(uuid, data, options = {}) {
    return await AgendaPeriod.update(data, {
        where: { uuid },
        ...options,
    });
}

async function deactivateActivePeriodsByAgendaId(agendaId, options = {}) {
    return await AgendaPeriod.update(
        { status: 'INACTIVE' },
        {
            where: { status: 'ACTIVE', agendaId },
            ...options,
        },
    );
}

module.exports = {
    create,
    createPeriod,

    findAll,
    searchFiltered,
    findByUuid,
    findByUuidPlain,
    findByName,
    findByIdPlain,
    findPeriodByUuid,
    findActivePeriodByAgendaId,

    updateByUuid,
    updateStatusById,
    updatePeriodByUuid,
    deactivateActivePeriodsByAgendaId,
};

const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const AgendaRepository = require('../repositories/agenda.repository');

const ConflictError = require('../errors/ConflictError');
const NotFoundError = require('../errors/NotFoundError');
const { throwIfNotExists } = require('../utils/error-utils');

// ===== CREATE =====

/**
 * Creates a new agenda with its initial period.
 *
 * Workflow:
 * - Validates unique agenda name
 * - Creates agenda with UUID
 * - Creates initial agenda period with UUID
 *
 * @param {Object} agendaData
 * @param {Object} periodData
 * @returns {Promise<Object>}
 */
async function createAgenda(agendaData, periodData) {
    const existingAgenda = await AgendaRepository.findByName(agendaData.name);

    if (existingAgenda) {
        throw new ConflictError('Error, ya existe una agenda con este nombre.', {
            name: agendaData.name,
        });
    }

    return await sequelize.transaction(async (t) => {
        const agenda = await AgendaRepository.create(
            {
                ...agendaData,
                uuid: uuidv4(),
            },
            { transaction: t },
        );

        await AgendaRepository.createPeriod(
            {
                ...periodData,
                agendaId: agenda.id,
                uuid: uuidv4(),
                status: 'ACTIVE',
                agendaStatus: 'OPEN',
            },
            { transaction: t },
        );

        return agenda;
    });
}

/**
 * Creates a new agenda period.
 *
 * Workflow:
 * - Resolves agenda by UUID
 * - Deactivates existing active periods
 * - Creates new active period
 *
 * @param {string} agendaUuid
 * @param {Object} periodData
 * @returns {Promise<Object>}
 */
async function createAgendaPeriod(agendaUuid, periodData) {
    return await sequelize.transaction(async (t) => {
        const agenda = await AgendaRepository.findByUuidPlain(agendaUuid, { transaction: t });
        const resolvedAgenda = throwIfNotExists(agenda, 'agenda', { uuid: agendaUuid });

        await AgendaRepository.deactivateActivePeriodsByAgendaId(resolvedAgenda.id, {
            transaction: t,
        });

        return await AgendaRepository.createPeriod(
            {
                ...periodData,
                agendaId: resolvedAgenda.id,
                uuid: uuidv4(),
                status: 'ACTIVE',
                agendaStatus: 'OPEN',
            },
            { transaction: t },
        );
    });
}

// ===== READ =====

/**
 * Retrieves all agendas with active period.
 */
async function getAgendas() {
    return await AgendaRepository.findAll();
}

/**
 * Searches active agendas with OPEN periods.
 */
async function getFilteredAgendas(query, limit = 20) {
    return await AgendaRepository.searchFiltered(query, limit);
}

/**
 * Retrieves an agenda by UUID.
 */
async function getAgenda(uuid) {
    const agenda = await AgendaRepository.findByUuid(uuid);
    return throwIfNotExists(agenda, 'agenda', { uuid });
}

/**
 * Retrieves a period by UUID.
 */
async function getAgendaPeriod(uuid) {
    const period = await AgendaRepository.findPeriodByUuid(uuid);
    return throwIfNotExists(period, 'periodo de agenda', { uuid });
}

/**
 * Retrieves an agenda by ID (plain).
 */
async function getAgendaById(id) {
    const period = await AgendaRepository.findByIdPlain(id);
    return throwIfNotExists(period, 'periodo de agenda', { id });
}

/**
 * Retrieves an agenda by name.
 */
async function getAgendaByName(name) {
    return await AgendaRepository.findByName(name);
}

// ===== UPDATE =====

/**
 * Updates agenda data.
 */
async function updateAgenda(uuid, agendaData) {
    const agenda = await AgendaRepository.findByUuidPlain(uuid);
    throwIfNotExists(agenda, 'agenda', { uuid });

    if (agendaData.name) {
        const existing = await AgendaRepository.findByName(agendaData.name, uuid);
        if (existing) {
            throw new ConflictError('Error, ya existe una agenda con este nombre.', {
                name: agendaData.name,
                uuid,
            });
        }
    }

    const [count] = await AgendaRepository.updateByUuid(uuid, agendaData);

    if (count === 0) {
        throw new NotFoundError('Error, no se han podido editar los datos de la agenda', { uuid });
    }

    return count;
}

/**
 * Deactivates an agenda and cancels active period if open.
 */
async function deactivateAgenda(uuid) {
    return await sequelize.transaction(async (t) => {
        const agenda = await AgendaRepository.findByUuidPlain(uuid, { transaction: t });
        const resolved = throwIfNotExists(agenda, 'agenda', { uuid });

        const [count] = await AgendaRepository.updateStatusById(resolved.id, 'INACTIVE', { transaction: t });

        if (count === 0) {
            throw new NotFoundError('Error, la agenda no ha podido ser desactivada', { uuid });
        }

        const activePeriod = await AgendaRepository.findActivePeriodByAgendaId(resolved.id, { transaction: t });

        if (activePeriod && activePeriod.agendaStatus === 'OPEN') {
            await activePeriod.update({ agendaStatus: 'CANCELLED' }, { transaction: t });
        }

        return count;
    });
}

/**
 * Reactivates an agenda.
 */
async function reactivateAgenda(uuid) {
    const agenda = await AgendaRepository.findByUuidPlain(uuid);
    const resolved = throwIfNotExists(agenda, 'agenda', { uuid });

    const [count] = await AgendaRepository.updateStatusById(resolved.id, 'ACTIVE');

    if (count === 0) {
        throw new NotFoundError('Error, la agenda no ha podido ser reactivada', { uuid });
    }

    return count;
}

/**
 * Updates an agenda period.
 */
async function updateAgendaPeriod(agendaUuid, periodUuid, periodData) {
    const agenda = await AgendaRepository.findByUuidPlain(agendaUuid);
    const resolvedAgenda = throwIfNotExists(agenda, 'agenda', { uuid: agendaUuid });

    const period = await AgendaRepository.findPeriodByUuid(periodUuid);
    const resolvedPeriod = throwIfNotExists(period, 'periodo de agenda', { uuid: periodUuid });

    if (resolvedPeriod.agendaId !== resolvedAgenda.id) {
        throw new NotFoundError('Error, el periodo no pertenece a la agenda', {
            agendaUuid,
            periodUuid,
        });
    }

    const [count] = await AgendaRepository.updatePeriodByUuid(periodUuid, periodData);

    if (count === 0) {
        throw new NotFoundError('Error, no se han podido editar los datos del periodo', {
            periodUuid,
        });
    }

    return count;
}

module.exports = {
    createAgenda,
    createAgendaPeriod,

    getAgendas,
    getFilteredAgendas,
    getAgenda,
    getAgendaPeriod,
    getAgendaByName,
    getAgendaById,

    updateAgenda,
    deactivateAgenda,
    reactivateAgenda,
    updateAgendaPeriod,
};

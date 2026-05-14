const NotFoundError = require('../errors/NotFoundError');

const PatientFlowRepository = require('../repositories/patient-flow.repository');

const HORIZONTAL_SPACING = 350;
const START_X = 100;
const START_Y = 200;

const SECONDARY_OFFSET_X = 30;
const SECONDARY_SPACING_Y = 100;

async function createPrimaryFlowEvent({ patientId, type, title, entityId, transaction }) {
    const flow = await PatientFlowRepository.findFlowByPatientId(patientId, { transaction });

    if (!flow) {
        throw new NotFoundError('Flujo no encontrado', { patientId });
    }

    const latestEvent = await PatientFlowRepository.findLatestPrimaryEvent(flow.id, { transaction });

    let positionX = START_X;
    let positionY = START_Y;

    if (latestEvent) {
        positionX = latestEvent.positionX + HORIZONTAL_SPACING;
        positionY = latestEvent.positionY;
    }

    return await PatientFlowRepository.createFlowEvent(
        {
            date: new Date(),
            title,
            type,
            role: 'PRIMARY',
            patientFlowId: flow.id,

            parentEventId: latestEvent ? latestEvent.id : null,

            entityId,
            positionX,
            positionY,
        },
        { transaction }
    );
}

async function createSecondaryFlowEvent({ patientId, type, title, parentId, entityId, transaction }) {
    const flow = await PatientFlowRepository.findFlowByPatientId(patientId, { transaction });

    if (!flow) {
        throw new NotFoundError('Flujo no encontrado', { patientId });
    }

    const parent = await PatientFlowRepository.findEventById(parentId, { transaction });

    if (!parent) {
        throw new NotFoundError('Evento padre no encontrado', { parentId });
    }

    const siblings = await PatientFlowRepository.findSecondaryEvents(parentId, { transaction });

    const index = siblings.length;

    const positionX = parent.positionX + SECONDARY_OFFSET_X;

    const positionY = parent.positionY + (index + 1) * SECONDARY_SPACING_Y;

    return await PatientFlowRepository.createFlowEvent(
        {
            date: new Date(),
            title,
            type,
            role: 'SECONDARY',
            patientFlowId: flow.id,
            parentEventId: parentId,
            entityId,
            positionX,
            positionY,
        },
        { transaction }
    );
}

module.exports = {
    createPrimaryFlowEvent,
    createSecondaryFlowEvent,
};

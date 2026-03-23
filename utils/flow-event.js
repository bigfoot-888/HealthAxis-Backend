const NotFoundError = require('../errors/NotFoundError');
const {FlowEvent, PatientFlow} = require('../models/index')

const HORIZONTAL_SPACING = 250;
const START_X = 100;
const START_Y = 200;

async function createPrimaryFlowEvent({ patientId, type, title, transaction }) {
    // Get the flow
    console.log(patientId)
    const flow = await PatientFlow.findOne({
        where: { patientId },
        transaction,
    });

    if (!flow) {
        throw new NotFoundError('Patient flow not found', { patientId });
    }

    // Get latest primary event
    const latestEvent = await FlowEvent.findOne({
        where: {
            patientFlowId: flow.id,
            role: 'PRIMARY',
        },
        order: [['date', 'DESC']],
        transaction,
    });

    let positionX = START_X;
    let positionY = START_Y;

    if (latestEvent) {
        positionX = latestEvent.positionX + HORIZONTAL_SPACING;
        positionY = latestEvent.positionY;
    }

    return FlowEvent.create(
        {
            date: new Date(),
            title,
            type,
            role: 'PRIMARY',
            patientFlowId: flow.id,
            parentEventId: latestEvent ? latestEvent.id : null,
            positionX,
            positionY,
        },
        { transaction }
    );
}

function getRadialPosition(centerX, centerY, index, total) {
    const RADIUS = 120;

    const angle = (2 * Math.PI * index) / total;

    return {
        x: centerX + RADIUS * Math.cos(angle),
        y: centerY + RADIUS * Math.sin(angle),
    };
}

async function createSecondaryFlowEvent({ patientId, type, title, transaction, parentId }) {
    const flow = await PatientFlow.findOne({
        where: { patientId },
        transaction,
    });

    if (!flow) {
        throw new NotFoundError('Patient flow not found', { patientId });
    }

    const parent = await FlowEvent.findByPk(parentId, { transaction });

    if (!parent) {
        throw new NotFoundError('Parent event not found', { parentId });
    }

    // Count existing secondary children
    const siblings = await FlowEvent.findAll({
        where: {
            parentEventId: parentId,
            role: 'SECONDARY',
        },
        transaction,
    });

    const index = siblings.length;
    const total = siblings.length + 1;

    const { x, y } = getRadialPosition(
        parent.positionX,
        parent.positionY,
        index,
        total
    );

    return FlowEvent.create(
        {
            date: new Date(),
            title,
            type,
            role: 'SECONDARY',
            patientFlowId: flow.id,
            parentEventId: parentId,
            positionX: x,
            positionY: y,
        },
        { transaction }
    );
}

module.exports = {
    createPrimaryFlowEvent,
    createSecondaryFlowEvent
}
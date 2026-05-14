const { FlowEvent, PatientFlow } = require('../models/index');

async function findById(id, options = {}) {
    return FlowEvent.findByPk(id, options);
}

async function deleteById(id, options = {}) {
    return FlowEvent.destroy({
        where: { id },
        ...options,
    });
}

async function findFlowByPatientId(patientId, options = {}) {
    return await PatientFlow.findOne({
        where: { patientId },
        ...options,
    });
}

async function findLatestPrimaryEvent(flowId, options = {}) {
    return await FlowEvent.findOne({
        where: {
            patientFlowId: flowId,
            role: 'PRIMARY',
        },
        order: [['date', 'DESC']],
        ...options,
    });
}

async function findEventById(eventId, options = {}) {
    return await FlowEvent.findByPk(eventId, options);
}

async function findSecondaryEvents(parentId, options = {}) {
    return await FlowEvent.findAll({
        where: {
            parentEventId: parentId,
            role: 'SECONDARY',
        },
        order: [['date', 'ASC']],
        ...options,
    });
}

async function createFlowEvent(eventData, options = {}) {
    return await FlowEvent.create(eventData, options);
}

module.exports = {
    findById,
    deleteById,
    findFlowByPatientId,
    findLatestPrimaryEvent,
    findEventById,
    findSecondaryEvents,
    createFlowEvent,
};
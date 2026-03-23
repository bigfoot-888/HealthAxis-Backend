const agendaService = require('../../modules/agenda-service');

// ===== CREATE =====

async function createAgendaController(req, res) {
    const { name, opening_date, closing_date } = req.body;
    const agendaData = { name, };
    const periodData = {opening_date, closing_date}
    const newAgenda = await agendaService.createAgenda(agendaData, periodData);
    res.status(201).json(newAgenda);
}

async function createAgendaPeriodController(req, res) {
    const agendaUuid = req.params.uuid
    const agenda = await agendaService.getAgenda(agendaUuid); 
    const { opening_date, closing_date } = req.body;
    const periodData = {
        opening_date,
        closing_date,
        agendaId: agenda.id,
    } 
    const newPeriod = await agendaService.createAgendaPeriod(periodData);
    res.status(201).json(newPeriod);
}

async function getAgendasController(req, res) {
    const agendas = await agendaService.getAgendas();
    console.log("TERMINE DE MIRAR AGENAS")
    res.status(201).json(agendas);
}

async function getFilteredAgendasController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit) || 20;
    const agendas = await agendaService.getFilteredAgendas(query, limit);
    res.status(201).json(agendas);
}

async function getAgendaController(req, res) {
    const uuid = req.params.uuid;
    const agenda = await agendaService.getAgenda(uuid);
    res.status(201).json(agenda);
}

async function openAgendaPeriodController(req, res) {
    const id = req.params.id;
    const period = await agendaService.openAgendaPeriod(id);
    res.status(201).json(period);
}

async function closeAgendaPeriodController(req, res) {
    const id = req.params.id;
    const period = await agendaService.closeAgendaPeriod(id);
    res.status(201).json(period);
}

async function cancelAgendaPeriodController(req, res) {
    const id = req.params.id;
    const period = await agendaService.cancelAgendaPeriod(id);
    res.status(201).json(period);
}

async function updateAgendaController(req, res) {
    const uuid = req.params.uuid;
    const { name } = req.body;
    const agendaData = { name };
    const agenda = agendaService.updateAgenda(uuid, agendaData);
    return res.status(201).json(agenda);
}

async function deactivateAgendaController(req, res) {
    const id = req.body.id;
    const agenda = await agendaService.deactivateAgenda(id);
    res.status(201).json(agenda);
}

async function reactivateAgendaController(req, res) {
    const id = req.body.id;
    const agenda = await agendaService.reactivateAgenda(id);
    res.status(201).json(agenda);
}

async function updateAgendaPeriodController(req, res) {
    const uuid = req.params.uuid;
    const { opening_date, closing_date } = req.body;
    const periodData = { opening_date, closing_date };
    const period = agendaService.updateAgendaPeriod(uuid, periodData);
    res.status(201).json(period);
}

module.exports = {
    createAgendaController,
    createAgendaPeriodController,

    getAgendasController,
    getFilteredAgendasController,

    openAgendaPeriodController,
    closeAgendaPeriodController,
    cancelAgendaPeriodController,
    getAgendaController,
    updateAgendaController,
    updateAgendaPeriodController,

    deactivateAgendaController,
    reactivateAgendaController,
};

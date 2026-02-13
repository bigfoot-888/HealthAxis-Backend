const {Agenda, AgendaPeriod} = require('../models/index');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const AppError = require('../errors/AppError');
const AuthError = require('../errors/AuthError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');

// ===== CREATE =====

async function createAgenda(agendaData, periodData) {
    try {
        const agendaUuid = uuidv4();
        const agendaPeriodUuid = uuidv4();
        const agenda = await Agenda.create({ ...agendaData, uuid: agendaUuid });
        await AgendaPeriod.create({...periodData, agendaId: agenda.id, uuid: agendaPeriodUuid})
        return agenda; 
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw new ConflictError('Error, this agenda name already exists', {
                name: agendaData.name
            });
        }
        throw err;
    }
}

async function createAgendaPeriod(periodData) {
    const uuid = uuidv4();
    return await AgendaPeriod.create({ ...periodData, uuid})
}

// ===== READ =====

async function getAgendas() {
    try {
        console.log("o2o")
        const agendas = await Agenda.findAll({
            include: [{ model: AgendaPeriod, as: 'activePeriod' }],
            raw: true,
            nest: true
        });
        return agendas; 
    } catch (err){
        console.log(err)
    }
}

async function getAgendasPlain(){
    return await Agenda.findAll();
}

async function getAgendaById(id) {
    const agenda = await Agenda.findByPk(id, {
        include: [{ model: AgendaPeriod, as: 'activePeriod' }]
    })
    if (agenda === null)
        throw new NotFoundError("Error, agenda agenda no encontrada", {id})
    return agenda;
}

async function getAgenda(uuid) {
  const agenda = await Agenda.findOne({
    where: { uuid },  
    include: [{ model: AgendaPeriod, as: 'activePeriod' }]
  });

  if (agenda === null) {
    throw new NotFoundError("Error, agenda no encontrada", { uuid });
  }
  return agenda;
}

async function getAgendaByName(name, uuid = null) {
    return await Agenda.findOne({
        where: { name, ...(uuid && { uuid: { [Op.ne]: uuid } }) },
    });
}


async function getAgendaByIdPlain(id){
    const agenda = await Agenda.findByPk(id); 
    if (agenda === null)
        throw new NotFoundError("Error, agenda agenda no encontrada", {id})
    return agenda;
}

async function getAgendaPeriods() {
    return await AgendaPeriod.findAll();
}

async function getAgendaPeriod(uuid) {
    const period = await AgendaPeriod.findOne({where: {uuid}}); 
    if (period === null)
        throw new NotFoundError("Error, periodo de agenda no encontrado", {uuid})
    return period;
}

// ===== UPDATE =====

async function updateAgenda(uuid, agendaData) {
    const [count] = await Agenda.update(
        { ...agendaData },
        { where: { uuid } },
    );
    if (count === 0)
        throw new NotFoundError(
            'Error, no se han podido editar los datos de la agenda',
            { uuid },
        );
    return count;
}

async function deactivateAgenda(id) {
    const [count] = await Agenda.update(
        { state: 'INACTIVE' },
        { where: { id } },
    );
    if (count === 0)
        throw new NotFoundError(
            'Error, la agenda no ha podido ser desactivada',
            { id },
        );
    return count;
}

async function reactivateAgenda(id) {
    const [count] = await Agenda.update(
        { state: 'ACTIVE' },
        { where: { id } },
    );
    if (count === null)
        throw new NotFoundError(
            'Error, la agenda no ha podido ser reactivada',
            { id },
        );
    return count;
}

async function updateAgendaPeriod(uuid, periodData) {
    const [count] = await AgendaPeriod.update(
        { ...periodData },
        { where: { uuid } },
    );
    if (count === 0)
        throw new NotFoundError(
            'Error, no se han podido editar los datos del periodo de agenda',
            { uuid },
        );
    return count;
}

async function openAgendaPeriod(id) {
    const [count] = await AgendaPeriod.update(
        { state: 'OPEN' },
        { where: { id } },
    );
    if (count === null)
        throw new NotFoundError(
            'Error, el periodo de agenda no ha podido ser abierto',
            { id },
        );
    return count;
}

async function closeAgendaPeriod(id) {
    const [count] = await AgendaPeriod.update(
        { state: 'CLOSED' },
        { where: { id } },
    );
    if (count === null)
        throw new NotFoundError(
            'Error, el periodo de agenda no ha podido ser cerrado',
            { id },
        );
    return count;
}

async function cancelAgendaPeriod(id) {
    const [count] = await AgendaPeriod.update(
        { state: 'CANCELLED' },
        { where: { id } },
    );
    if (count === null)
        throw new NotFoundError(
            'Error, el periodo de agenda no ha podido ser cancelado',
            { id },
        );
    return count;
}

module.exports = {
    createAgenda,
    createAgendaPeriod,

    getAgendas,
    getAgendaPeriods,
    getAgendasPlain,
    getAgendaById,
    getAgendaByIdPlain,
    getAgendaPeriods,
    getAgendaPeriod,
    getAgenda,
    getAgendaByName,

    updateAgenda,
    deactivateAgenda,
    reactivateAgenda,
    updateAgendaPeriod,
    openAgendaPeriod,
    closeAgendaPeriod,
    cancelAgendaPeriod
};

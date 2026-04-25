jest.mock('@/repositories/agenda.repository', () => ({
  findByName: jest.fn(),
  create: jest.fn(),
  createPeriod: jest.fn(),
  findByUuidPlain: jest.fn(),
  deactivateActivePeriodsByAgendaId: jest.fn(),
  findByUuid: jest.fn(),
  findPeriodByUuid: jest.fn(),
  updateByUuid: jest.fn(),
  updateStatusById: jest.fn(),
  findActivePeriodByAgendaId: jest.fn(),
  updatePeriodByUuid: jest.fn(),
}));

jest.mock('@/config/database', () => ({
  transaction: jest.fn((cb) => cb({})),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

const agendaService = require('@/services/agenda.service');
const AgendaRepository = require('@/repositories/agenda.repository');

const NotFoundError = require('@/errors/NotFoundError');
const ConflictError = require('@/errors/ConflictError');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createAgenda', () => {
  it('should create agenda successfully', async () => {
    AgendaRepository.findByName.mockResolvedValue(null);
    AgendaRepository.create.mockResolvedValue({ id: 1 });

    const result = await agendaService.createAgenda(
      { name: 'General de Cardiología' },
      { startDate: '2027-01-01' }
    );

    expect(result).toBeDefined();
    expect(AgendaRepository.create).toHaveBeenCalled();
    expect(AgendaRepository.createPeriod).toHaveBeenCalled();
  });

  it('should throw if agenda name exists', async () => {
    AgendaRepository.findByName.mockResolvedValue({ id: 1 });

    await expect(
      agendaService.createAgenda({ name: 'General de Cardiología' }, {})
    ).rejects.toThrow(ConflictError);
  });
});

describe('createAgendaPeriod', () => {
  it('should create new period and deactivate previous', async () => {
    AgendaRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
    AgendaRepository.createPeriod.mockResolvedValue({ id: 2 });

    const result = await agendaService.createAgendaPeriod('uuid', {});

    expect(result).toBeDefined();
    expect(AgendaRepository.deactivateActivePeriodsByAgendaId).toHaveBeenCalled();
    expect(AgendaRepository.createPeriod).toHaveBeenCalled();
  });

  it('should throw if agenda not found', async () => {
    AgendaRepository.findByUuidPlain.mockResolvedValue(null);

    await expect(
      agendaService.createAgendaPeriod('abc', {})
    ).rejects.toThrow(NotFoundError);
  });
});

describe('getAgenda', () => {
  it('should return agenda if exists', async () => {
    AgendaRepository.findByUuid.mockResolvedValue({ id: 1 });

    const result = await agendaService.getAgenda('uuid');

    expect(result).toBeDefined();
  });

  it('should throw if not found', async () => {
    AgendaRepository.findByUuid.mockResolvedValue(null);

    await expect(agendaService.getAgenda('Agenda Inexistente')).rejects.toThrow(NotFoundError);
  });
});

describe('updateAgenda', () => {
  it('should update successfully', async () => {
    AgendaRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
    AgendaRepository.findByName.mockResolvedValue(null);
    AgendaRepository.updateByUuid.mockResolvedValue([1]);

    const result = await agendaService.updateAgenda('General de Cardiología', { name: 'Agenda Cambiada' });

    expect(result).toBe(1);
  });

  it('should throw if name already exists', async () => {
    AgendaRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
    AgendaRepository.findByName.mockResolvedValue({ id: 2 });

    await expect(
      agendaService.updateAgenda('General de Cardiología', { name: 'Agenda Cambiada' })
    ).rejects.toThrow(ConflictError);
  });
});

describe('deactivateAgenda', () => {
  it('should deactivate agenda and cancel active period', async () => {
    const activePeriod = {
      agendaStatus: 'OPEN',
      update: jest.fn(),
    };

    AgendaRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
    AgendaRepository.updateStatusById.mockResolvedValue([1]);
    AgendaRepository.findActivePeriodByAgendaId.mockResolvedValue(activePeriod);

    const result = await agendaService.deactivateAgenda('General de Cardiología');

    expect(result).toBe(1);
    expect(activePeriod.update).toHaveBeenCalled();
  });

  it('should throw if agenda not found', async () => {
    AgendaRepository.findByUuidPlain.mockResolvedValue(null);

    await expect(
      agendaService.deactivateAgenda('General de Cardiología')
    ).rejects.toThrow(NotFoundError);
  });
});

describe('reactivateAgenda', () => {
  it('should reactivate successfully', async () => {
    AgendaRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
    AgendaRepository.updateStatusById.mockResolvedValue([1]);

    const result = await agendaService.reactivateAgenda('General de Cardiología');

    expect(result).toBe(1);
  });
});

describe('updateAgendaPeriod', () => {
  it('should update successfully', async () => {
    AgendaRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
    AgendaRepository.findPeriodByUuid.mockResolvedValue({ id: 2, agendaId: 1 });
    AgendaRepository.updatePeriodByUuid.mockResolvedValue([1]);

    const result = await agendaService.updateAgendaPeriod('agendaUuid', 'periodUuid', {});

    expect(result).toBe(1);
  });

  it('should throw if period does not belong to agenda', async () => {
    AgendaRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
    AgendaRepository.findPeriodByUuid.mockResolvedValue({ id: 2, agendaId: 543 });

    await expect(
      agendaService.updateAgendaPeriod('agendaUuid', 'periodUuid', {})
    ).rejects.toThrow(NotFoundError);
  });
});
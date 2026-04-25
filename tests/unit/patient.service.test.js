jest.mock('@/repositories/patient.repository', () => ({
    create: jest.fn(),
    save: jest.fn(),
    findByUuidPlain: jest.fn(),
    findByIdPlain: jest.fn(),
    updateStatusById: jest.fn(),
    updateByUuid: jest.fn(),
}));

jest.mock('@/repositories/appointment.repository', () => ({
    hasActiveAppointmentsByPatientId: jest.fn(),
}));

jest.mock('@/repositories/audit-log.repository', () => ({
    createAuditLog: jest.fn(),
}));

jest.mock('@/repositories/clinical-document.repository', () => ({
    findByIdPlain: jest.fn(),
}));

jest.mock('@/repositories/flow-event.repository', () => ({
    findById: jest.fn(),
    deleteById: jest.fn(),
}));

jest.mock('@/utils/flow-event', () => ({
    createPrimaryFlowEvent: jest.fn(),
    createSecondaryFlowEvent: jest.fn(),
}));

jest.mock('@/models/index', () => ({
    PatientFlow: { create: jest.fn() },
    FlowEvent: { findByPk: jest.fn() },
}));

jest.mock('@/config/database', () => ({
    transaction: jest.fn((cb) => cb({})),
}));

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid'),
}));

const patientService = require('@/services/patient.service');

const PatientRepository = require('@/repositories/patient.repository');
const AppointmentRepository = require('@/repositories/appointment.repository');
const FlowEventRepository = require('@/repositories/flow-event.repository');
const { createPrimaryFlowEvent } = require('@/utils/flow-event');

const NotFoundError = require('@/errors/NotFoundError');
const ValidationError = require('@/errors/ValidationError');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createPatient', () => {
    it('should create patient successfully', async () => {
        PatientRepository.create.mockResolvedValue({ id: 1, uuid: 'patientUuid' });
        PatientRepository.findByUuidPlain.mockResolvedValue({ id: 1 });

        const result = await patientService.createPatient({ name: 'John' }, 234);

        expect(result).toBeDefined();
        expect(PatientRepository.create).toHaveBeenCalled();
        expect(PatientRepository.save).toHaveBeenCalled();
        expect(createPrimaryFlowEvent).toHaveBeenCalled();
    });
});

describe('getPatient', () => {
    it('should return patient if exists', async () => {
        PatientRepository.findByUuidPlain.mockResolvedValue({ id: 1 });

        const result = await patientService.getPatient('patientUuid');

        expect(result).toBeDefined();
    });

    it('should throw if not found', async () => {
        PatientRepository.findByUuidPlain.mockResolvedValue(null);

        await expect(patientService.getPatient('patientUuid')).rejects.toThrow(NotFoundError);
    });
});

describe('deactivatePatient', () => {
    it('should deactivate patient successfully', async () => {
        PatientRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
        AppointmentRepository.hasActiveAppointmentsByPatientId.mockResolvedValue(false);
        PatientRepository.updateStatusById.mockResolvedValue([1]);

        const result = await patientService.deactivatePatient('patientUuid');

        expect(result).toBe(1);
        expect(createPrimaryFlowEvent).toHaveBeenCalled();
    });

    it('should throw if patient not found', async () => {
        PatientRepository.findByUuidPlain.mockResolvedValue(null);

        await expect(patientService.deactivatePatient('patientUuid')).rejects.toThrow(NotFoundError);
    });

    it('should throw if has active appointments', async () => {
        PatientRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
        AppointmentRepository.hasActiveAppointmentsByPatientId.mockResolvedValue(true);

        await expect(patientService.deactivatePatient('patientUuid')).rejects.toThrow(ValidationError);
    });
});

describe('updatePatient', () => {
    it('should update successfully', async () => {
        PatientRepository.updateByUuid.mockResolvedValue([1]);

        const result = await patientService.updatePatient('patientUuid', { name: 'Jesus' });

        expect(result).toBe(1);
    });

    it('should throw if update fails', async () => {
        PatientRepository.updateByUuid.mockResolvedValue([0]);

        await expect(patientService.updatePatient('patientUuid', { name: 'Jesus' })).rejects.toThrow(NotFoundError);
    });
});

describe('ensurePatientIsActive', () => {
    it('should not throw if active', () => {
        expect(() => patientService.ensurePatientIsActive({ status: 'ACTIVE' })).not.toThrow();
    });

    it('should throw if inactive', () => {
        expect(() => patientService.ensurePatientIsActive({ status: 'INACTIVE' })).toThrow(ValidationError);
    });
});

jest.mock('@/repositories/treatment.repository', () => ({
    create: jest.fn(),
    associateUsers: jest.fn(),
    findByUuidDetailed: jest.fn(),
    findByUuidPlain: jest.fn(),
    findAll: jest.fn(),
    updateClinicalStatus: jest.fn(),
    updateStatus: jest.fn(),
}));

jest.mock('@/repositories/patient.repository', () => ({
    findByUuidPlain: jest.fn(),
}));

jest.mock('@/repositories/appointment.repository', () => ({
    findByUuidPlain: jest.fn(),
}));

jest.mock('@/repositories/diagnosis.repository', () => ({
    findByUuidPlain: jest.fn(),
}));

jest.mock('@/repositories/audit-log.repository', () => ({
    createAuditLog: jest.fn(),
}));

jest.mock('@/utils/flow-event', () => ({
    createPrimaryFlowEvent: jest.fn(),
}));

jest.mock('@/config/database', () => ({
    transaction: jest.fn((cb) => cb({})),
}));

const treatmentService = require('@/services/treatment.service');

const TreatmentRepository = require('@/repositories/treatment.repository');
const PatientRepository = require('@/repositories/patient.repository');
const AppointmentRepository = require('@/repositories/appointment.repository');
const DiagnosisRepository = require('@/repositories/diagnosis.repository');
const AuditLogRepository = require('@/repositories/audit-log.repository');

const NotFoundError = require('@/errors/NotFoundError');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createTreatment', () => {
    it('should create treatment successfully', async () => {
        TreatmentRepository.create.mockResolvedValue({
            id: 1,
            patientId: 13,
        });

        TreatmentRepository.findByUuidDetailed.mockResolvedValue({ id: 1 });

        const result = await treatmentService.createTreatment({ patientId: 134 }, [], 134);

        expect(result).toBeDefined();
        expect(TreatmentRepository.create).toHaveBeenCalled();
        expect(AuditLogRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should associate users if provided', async () => {
        TreatmentRepository.create.mockResolvedValue({
            id: 1,
            patientId: 534,
        });

        TreatmentRepository.findByUuidDetailed.mockResolvedValue({ id: 1 });

        await treatmentService.createTreatment({ patientId: 23 }, [{ user: { id: 1, role: 'AUTHOR' } }], 432);

        expect(TreatmentRepository.associateUsers).toHaveBeenCalled();
    });
});

describe('getTreatment', () => {
    it('should return treatment if exists', async () => {
        TreatmentRepository.findByUuidDetailed.mockResolvedValue({ id: 1 });

        const result = await treatmentService.getTreatment('treatmentUuid');

        expect(result).toBeDefined();
    });

    it('should throw if not found', async () => {
        TreatmentRepository.findByUuidDetailed.mockResolvedValue(null);

        await expect(treatmentService.getTreatment('treatmentUuid')).rejects.toThrow(NotFoundError);
    });
});

describe('getTreatments', () => {
    it('should filter by patientUuid', async () => {
        PatientRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
        TreatmentRepository.findAll.mockResolvedValue([]);

        await treatmentService.getTreatments({ patientUuid: 'patientUuid' });

        expect(PatientRepository.findByUuidPlain).toHaveBeenCalled();
        expect(TreatmentRepository.findAll).toHaveBeenCalled();
    });

    it('should throw if patient not found', async () => {
        PatientRepository.findByUuidPlain.mockResolvedValue(null);

        await expect(treatmentService.getTreatments({ patientUuid: 'patientUuid' })).rejects.toThrow();
    });
});

describe('updateTreatmentClinicalStatus', () => {
    it('should update and log when status changes', async () => {
        TreatmentRepository.findByUuidPlain.mockResolvedValue({
            id: 1,
            patientId: 13,
            clinicalStatus: 'ONGOING',
        });

        TreatmentRepository.updateClinicalStatus.mockResolvedValue([1]);

        const result = await treatmentService.updateTreatmentClinicalStatus('treatmentUuid', 'COMPLETED', 124);

        expect(result).toBe(1);
        expect(AuditLogRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should throw if treatment not found', async () => {
        TreatmentRepository.findByUuidPlain.mockResolvedValue(null);

        await expect(treatmentService.updateTreatmentClinicalStatus('treatmentUuid', 'COMPLETED', 999)).rejects.toThrow(
            NotFoundError,
        );
    });
});

describe('updateTreatmentStatus', () => {
    it('should update successfully', async () => {
        TreatmentRepository.findByUuidPlain.mockResolvedValue({
            id: 1,
            patientId: 400,
            status: 'VALID',
        });

        TreatmentRepository.updateStatus.mockResolvedValue([1]);

        const result = await treatmentService.updateTreatmentStatus('treatmentUuid', 'VOID', 777);

        expect(result).toBe(1);
    });
});

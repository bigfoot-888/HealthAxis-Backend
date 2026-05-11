jest.mock('@/repositories/diagnosis.repository', () => ({
    create: jest.fn(),
    associateUsers: jest.fn(),
    findByUuid: jest.fn(),
    findAll: jest.fn(),
    findByUuidPlain: jest.fn(),
    updateClinicalStatusByUuid: jest.fn(),
    updateRecordStatusByUuid: jest.fn(),
    updateResolvedAt: jest.fn(), 
}));

jest.mock('@/repositories/user.repository', () => ({
    findById: jest.fn(),
}));

jest.mock('@/repositories/appointment.repository', () => ({
    findByUuidPlain: jest.fn(),
}));

jest.mock('@/repositories/patient.repository', () => ({
    findByUuidPlain: jest.fn(),
    findByIdPlain: jest.fn(),
    updateResolvedAt: jest.fn(),
}));

jest.mock('@/repositories/audit-log.repository', () => ({
    createAuditLog: jest.fn(),
}));

jest.mock('@/utils/flow-event', () => ({
    createPrimaryFlowEvent: jest.fn(),
}));

jest.mock('@/config/database', () => ({
    transaction: jest.fn(async (cb) => cb({})),
}));

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid'),
}));

const diagnosisService = require('@/services/diagnosis.service');

const DiagnosisRepository = require('@/repositories/diagnosis.repository');
const PatientRepository = require('@/repositories/patient.repository');
const AppointmentRepository = require('@/repositories/appointment.repository');
const UserRepository = require('@/repositories/user.repository');
const AuditLogRepository = require('@/repositories/audit-log.repository');

const NotFoundError = require('@/errors/NotFoundError');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createDiagnosis', () => {
    it('should create diagnosis successfully', async () => {
        PatientRepository.findByIdPlain.mockResolvedValue({ id: 1 });
        UserRepository.findById.mockResolvedValue({ id: 1 });

        DiagnosisRepository.create.mockResolvedValue({
            id: 1,
            patientId: 111,
        });

        const result = await diagnosisService.createDiagnosis({ patientId: 111 }, [{ userId: 1, role: 'AUTHOR' }], 453);

        expect(result).toBeDefined();
        expect(DiagnosisRepository.create).toHaveBeenCalled();
        expect(AuditLogRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should associate users if provided', async () => {
        PatientRepository.findByIdPlain.mockResolvedValue({ id: 1 });
        UserRepository.findById.mockResolvedValue({ id: 1 });

        DiagnosisRepository.create.mockResolvedValue({
            id: 1,
            patientId: 54,
        });

        await diagnosisService.createDiagnosis({ patientId: 123 }, [{ userId: 1, role: 'AUTHOR' }], 999);

        expect(DiagnosisRepository.associateUsers).toHaveBeenCalled();
    });
});

describe('getDiagnosis', () => {
    it('should return diagnosis if exists', async () => {
        DiagnosisRepository.findByUuid.mockResolvedValue({ id: 1 });

        const result = await diagnosisService.getDiagnosis('diagnosisUuid');

        expect(result).toBeDefined();
    });

    it('should throw if not found', async () => {
        DiagnosisRepository.findByUuid.mockResolvedValue(null);

        await expect(diagnosisService.getDiagnosis('diagnosisUuid')).rejects.toThrow(NotFoundError);
    });
});

describe('getDiagnoses', () => {
    it('should filter by patientUuid', async () => {
        PatientRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
        DiagnosisRepository.findAll.mockResolvedValue([]);

        await diagnosisService.getDiagnoses({ patientUuid: 'patientUuid' });

        expect(PatientRepository.findByUuidPlain).toHaveBeenCalled();
        expect(DiagnosisRepository.findAll).toHaveBeenCalled();
    });

    it('should throw if patient not found', async () => {
        PatientRepository.findByUuidPlain.mockResolvedValue(null);

        await expect(diagnosisService.getDiagnoses({ patientUuid: 'patientUuid' })).rejects.toThrow();
    });
});

describe('updateDiagnosisClinicalStatus', () => {
    it('should update successfully', async () => {
        DiagnosisRepository.findByUuidPlain.mockResolvedValue({
            id: 1,
            patientId: 42,
            clinicalStatus: 'ACTIVE',
        });

        DiagnosisRepository.updateClinicalStatusByUuid.mockResolvedValue([1]);

        const result = await diagnosisService.updateDiagnosisClinicalStatus('diagnosisUuid', 'RESOLVED', 345);

        expect(result).toBe(1);
        expect(AuditLogRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should throw if not found', async () => {
        DiagnosisRepository.findByUuidPlain.mockResolvedValue(null);

        await expect(diagnosisService.updateDiagnosisClinicalStatus('diagnosisUuid', 'RESOLVED', 543)).rejects.toThrow(
            NotFoundError,
        );
    });
});

describe('updateDiagnosisRecordStatus', () => {
    it('should update successfully', async () => {
        DiagnosisRepository.findByUuidPlain.mockResolvedValue({
            id: 1,
            patientId: 1111,
            status: 'ACTIVE',
        });

        DiagnosisRepository.updateRecordStatusByUuid.mockResolvedValue([1]);

        const result = await diagnosisService.updateDiagnosisRecordStatus('diagnosisUuid', 'INACTIVE', 43);

        expect(result).toBe(1);
    });
});

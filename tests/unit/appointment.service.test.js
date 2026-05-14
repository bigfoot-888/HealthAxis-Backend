jest.mock('@/repositories/appointment.repository', () => ({
    create: jest.fn(),
    findByUuid: jest.fn(),
    findByUuidPlain: jest.fn(),
    updateByUuid: jest.fn(),
    updateEndTime: jest.fn()
}));

jest.mock('@/repositories/user.repository', () => ({
    findById: jest.fn(),
}));

jest.mock('@/repositories/patient.repository', () => ({
    findByIdPlain: jest.fn(),
}));

jest.mock('@/repositories/diagnosis.repository', () => ({
    create: jest.fn(),
    associateUsers: jest.fn(),
}));

jest.mock('@/repositories/treatment.repository', () => ({
    bulkCreate: jest.fn(),
    associateUsers: jest.fn(),
}));

jest.mock('@/repositories/audit-log.repository', () => ({
    createAuditLog: jest.fn(),
}));

jest.mock('@/services/patient-flow.service', () => ({
    createPrimaryFlowEvent: jest.fn(),
}));

jest.mock('@/services/patient.service', () => ({
    ensurePatientIsActive: jest.fn(),
}));

jest.mock('@/services/user.service', () => ({
    ensureUserIsActive: jest.fn(),
}));

jest.mock('@/config/database', () => ({
    transaction: jest.fn((cb) => cb({})),
}));

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid'),
}));

const appointmentService = require('@/services/appointment.service');
const AppointmentRepository = require('@/repositories/appointment.repository');
const PatientRepository = require('@/repositories/patient.repository');
const UserRepository = require('@/repositories/user.repository');
const DiagnosisRepository = require('@/repositories/diagnosis.repository');
const TreatmentRepository = require('@/repositories/treatment.repository');
const AuditLogRepository = require('@/repositories/audit-log.repository');

const { ensurePatientIsActive } = require('@/services/patient.service');
const { ensureUserIsActive } = require('@/services/user.service');

const { createPrimaryFlowEvent } = require('@/services/patient-flow.service');

beforeEach(() => {
    jest.clearAllMocks();
    ensurePatientIsActive.mockImplementation(() => true);
    ensureUserIsActive.mockImplementation(() => true);
});

const mockPatientInactive = () => {
    ensurePatientIsActive.mockImplementation(() => {
        throw new Error('inactivo');
    });
};

const mockUserInactive = () => {
    ensureUserIsActive.mockImplementation(() => {
        throw new Error('inactivo');
    });
};

describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
        PatientRepository.findByIdPlain.mockResolvedValue({ id: 1, status: 'ACTIVE' });
        UserRepository.findById.mockResolvedValue({
            id: 1,
            status: 'ACTIVE',
            agenda: {
                activePeriod: {
                    agendaStatus: 'OPEN',
                },
            },
        });
        AppointmentRepository.create.mockResolvedValue({
            id: 100,
            patientId: 1,
            startDate: new Date(),
        });

        const result = await appointmentService.createAppointment({ patientId: 1, userId: 2 }, 222);

        expect(result).toBeDefined();
        expect(AppointmentRepository.create).toHaveBeenCalled();
    });

    it('should throw if patient does not exist', async () => {
        PatientRepository.findByIdPlain.mockResolvedValue(null);

        await expect(appointmentService.createAppointment({ patientId: 1, userId: 2 }, 544)).rejects.toThrow();
    });

    it('should throw if patient is inactive', async () => {
        PatientRepository.findByIdPlain.mockResolvedValue({ id: 1, status: 'INACTIVE' });
        mockPatientInactive();
        await expect(appointmentService.createAppointment({ patientId: 1, userId: 2 }, 999)).rejects.toThrow();
    });

    it('should throw if user does not exist', async () => {
        PatientRepository.findByIdPlain.mockResolvedValue({ id: 1, status: 'ACTIVE' });
        UserRepository.findById.mockResolvedValue(null);

        await expect(appointmentService.createAppointment({ patientId: 1, userId: 2 }, 999)).rejects.toThrow();
    });

    it('should throw if user is inactive', async () => {
        PatientRepository.findByIdPlain.mockResolvedValue({ id: 1, status: 'INACTIVE' });
        UserRepository.findById.mockResolvedValue({ id: 2, agendaId: 10, status: 'INACTIVE' });
        mockUserInactive();
        await expect(appointmentService.createAppointment({ patientId: 1, userId: 2 }, 123)).rejects.toThrow();
    });

    it('should create flow event and audit log', async () => {
        PatientRepository.findByIdPlain.mockResolvedValue({ id: 1, status: 'ACTIVE' });
        UserRepository.findById.mockResolvedValue({
            id: 1,
            status: 'ACTIVE',
            agenda: {
                activePeriod: {
                    agendaStatus: 'OPEN',
                },
            },
        });

        AppointmentRepository.create.mockResolvedValue({
            id: 100,
            patientId: 1,
            startDate: new Date(),
        });
        await appointmentService.createAppointment({ patientId: 1, userId: 2 }, 111);

        expect(createPrimaryFlowEvent).toHaveBeenCalled();
        expect(AuditLogRepository.createAuditLog).toHaveBeenCalled();
    });
});

describe('updateAppointmentStatus', () => {
    it('should update status successfully', async () => {
        AppointmentRepository.findByUuidPlain.mockResolvedValue({
            id: 1,
            patientId: 1,
            status: 'SCHEDULED',
        });

        AppointmentRepository.updateByUuid.mockResolvedValue([1]);

        const result = await appointmentService.updateAppointmentStatus('appointmentUuid', { status: 'COMPLETED' }, 999);

        expect(result).toBe(1);
    });

    const AuditLogRepository = require('@/repositories/audit-log.repository');

    it('should create audit log when status changes', async () => {
        AppointmentRepository.findByUuidPlain.mockResolvedValue({
            id: 1,
            patientId: 1,
            status: 'SCHEDULED',
        });

        AppointmentRepository.updateByUuid.mockResolvedValue([1]);

        await appointmentService.updateAppointmentStatus('appointmentUuid', { status: 'COMPLETED' }, 123);

        expect(AuditLogRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should throw if appointment does not exist', async () => {
        AppointmentRepository.findByUuidPlain.mockResolvedValue(null);

        await expect(
            appointmentService.updateAppointmentStatus('appointmentUuid', { status: 'COMPLETED' }, 434),
        ).rejects.toThrow();
    });
    it('should not create audit log if status does not change', async () => {
        const AuditLogRepository = require('@/repositories/audit-log.repository');

        AppointmentRepository.findByUuidPlain.mockResolvedValue({
            id: 1,
            patientId: 1,
            status: 'SCHEDULED',
        });

        AppointmentRepository.updateByUuid.mockResolvedValue([1]);

        await appointmentService.updateAppointmentStatus('appointmentUuid', { status: 'SCHEDULED' }, 544);

        expect(AuditLogRepository.createAuditLog).not.toHaveBeenCalled();
    });

    it('should create flow event for relevant status', async () => {
        AppointmentRepository.findByUuidPlain.mockResolvedValue({
            id: 1,
            patientId: 1,
            status: 'SCHEDULED',
        });

        AppointmentRepository.updateByUuid.mockResolvedValue([1]);

        await appointmentService.updateAppointmentStatus('appointmentUuid', { status: 'COMPLETED' }, 999);

        expect(createPrimaryFlowEvent).toHaveBeenCalled();
    });
});

jest.mock('@/repositories/user.repository', () => ({
    create: jest.fn(),
    findOrCreateRole: jest.fn(),
    addRoles: jest.fn(),
    createDashboard: jest.fn(),
    bulkCreateDashboardComponents: jest.fn(),
    findByUuid: jest.fn(),
    findByUuidPlain: jest.fn(),
    updateStatusById: jest.fn(),
    setRoles: jest.fn(),
    findByEmail: jest.fn(),
}));

jest.mock('@/repositories/appointment.repository', () => ({
    hasActiveAppointmentsByUserId: jest.fn(),
}));

jest.mock('@/repositories/agenda.repository', () => ({
    findByUuidPlain: jest.fn(),
}));

jest.mock('@/utils/password.utils', () => ({
    hashPassword: jest.fn(),
}));

jest.mock('@/config/database', () => ({
    transaction: jest.fn((cb) => cb({})),
}));

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid'),
}));

const userService = require('@/services/user.service');

const UserRepository = require('@/repositories/user.repository');
const AppointmentRepository = require('@/repositories/appointment.repository');
const AgendaRepository = require('@/repositories/agenda.repository');
const { hashPassword } = require('@/utils/password.utils');

const NotFoundError = require('@/errors/NotFoundError');
const ValidationError = require('@/errors/ValidationError');
const ConflictError = require('@/errors/ConflictError');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createUser', () => {
    it('should create user successfully', async () => {
        hashPassword.mockResolvedValue('hashed');

        UserRepository.create.mockResolvedValue({ id: 1 });
        UserRepository.findOrCreateRole.mockResolvedValue({ id: 20 });
        UserRepository.createDashboard.mockResolvedValue({ id: 17 });

        const result = await userService.createUser({ email: 'john@test.com', password: '123' }, ['ADMIN'], 999);

        expect(result).toBeDefined();
        expect(hashPassword).toHaveBeenCalled();
        expect(UserRepository.create).toHaveBeenCalled();
        expect(UserRepository.addRoles).toHaveBeenCalled();
        expect(UserRepository.createDashboard).toHaveBeenCalled();
    });

    it('should throw ConflictError if email exists', async () => {
        hashPassword.mockResolvedValue('hashed');

        UserRepository.findByEmail.mockResolvedValue({ id: 1 });

        await expect(userService.createUser({ email: 'john@test.com', password: 'pork' })).rejects.toThrow(
            ConflictError,
        );
    });
});

describe('getUser', () => {
    it('should return user if exists', async () => {
        UserRepository.findByUuid.mockResolvedValue({ id: 1 });

        const result = await userService.getUser('userUuid');

        expect(result).toBeDefined();
    });

    it('should throw if user not found', async () => {
        UserRepository.findByUuid.mockResolvedValue(null);

        await expect(userService.getUser('userUuid')).rejects.toThrow(NotFoundError);
    });
});

describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
        UserRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
        AppointmentRepository.hasActiveAppointmentsByUserId.mockResolvedValue(false);
        UserRepository.updateStatusById.mockResolvedValue([1]);

        const result = await userService.deactivateUser('userUuid');

        expect(result).toBe(1);
    });

    it('should throw if user not found', async () => {
        UserRepository.findByUuidPlain.mockResolvedValue(null);

        await expect(userService.deactivateUser('userUuid')).rejects.toThrow(NotFoundError);
    });

    it('should throw if user has active appointments', async () => {
        UserRepository.findByUuidPlain.mockResolvedValue({ id: 1 });
        AppointmentRepository.hasActiveAppointmentsByUserId.mockResolvedValue(true);

        await expect(userService.deactivateUser('userUuid')).rejects.toThrow(ValidationError);
    });
});

describe('ensureUserIsActive', () => {
    it('should not throw if active', () => {
        expect(() => userService.ensureUserIsActive({ status: 'ACTIVE' })).not.toThrow();
    });

    it('should throw if inactive', () => {
        expect(() => userService.ensureUserIsActive({ status: 'INACTIVE' })).toThrow(ValidationError);
    });
});

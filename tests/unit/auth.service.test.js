jest.mock('@/repositories/user.repository', () => ({
    findByEmail: jest.fn(),
    findById: jest.fn(),
}));

jest.mock('@/utils/password.utils', () => ({
    verifyPassword: jest.fn(),
}));

const authService = require('@/services/auth.service');

const UserRepository = require('@/repositories/user.repository');
const { verifyPassword } = require('@/utils/password.utils');

const AuthError = require('@/errors/AuthError');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('login', () => {
    const mockReq = {
        session: {
            regenerate: jest.fn((cb) => cb()),
            save: jest.fn((cb) => cb()),
        },
    };

    it('should login successfully', async () => {
        UserRepository.findByEmail.mockResolvedValue({
            id: 1,
            email: 'john@test.com',
            password: 'hashed',
            role: 'ADMIN',
            name: 'John',
            surname: 'Pork',
        });

        verifyPassword.mockResolvedValue(true);

        const result = await authService.login({ email: 'john@test.com', password: '123' }, mockReq);

        expect(result).toHaveProperty('email', 'john@test.com');
        expect(mockReq.session.user).toBeDefined();
    });

    it('should throw if user not found', async () => {
        UserRepository.findByEmail.mockResolvedValue(null);

        await expect(authService.login({ email: 'oops', password: 'oops' }, mockReq)).rejects.toThrow(AuthError);
    });

    it('should throw if password is incorrect', async () => {
        UserRepository.findByEmail.mockResolvedValue({
            id: 1,
            password: 'hashed',
        });

        verifyPassword.mockResolvedValue(false);

        await expect(authService.login({ email: 'oops', password: 'oops' }, mockReq)).rejects.toThrow(AuthError);
    });
});

describe('getMe', () => {
    it('should return user if session valid', async () => {
        const req = {
            session: { user: { id: 1 } },
        };

        UserRepository.findById.mockResolvedValue({
            id: 1,
            email: 'john@test.com',
            role: 'ADMIN',
            name: 'John',
            surname: 'Pork',
        });

        const result = await authService.getMe(req);

        expect(result).toHaveProperty('email');
    });

    it('should throw if no session', async () => {
        const req = { session: {} };

        await expect(authService.getMe(req)).rejects.toThrow(AuthError);
    });

    it('should throw if user not found', async () => {
        const req = {
            session: { user: { id: 1 } },
        };

        UserRepository.findById.mockResolvedValue(null);

        await expect(authService.getMe(req)).rejects.toThrow(AuthError);
    });
});

describe('logout', () => {
    it('should destroy session successfully', async () => {
        const req = {
            session: {
                destroy: jest.fn((cb) => cb()),
            },
        };

        await expect(authService.logout(req)).resolves.toBeUndefined();
    });

    it('should reject if error occurs', async () => {
        const req = {
            session: {
                destroy: jest.fn((cb) => cb(new Error('fail'))),
            },
        };

        await expect(authService.logout(req)).rejects.toThrow();
    });
});

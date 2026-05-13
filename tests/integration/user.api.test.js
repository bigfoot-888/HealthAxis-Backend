jest.mock('@/middlewares/auth.middleware', () => ({
    requireAuth: (req, res, next) => next(),
}));

jest.mock('@/middlewares/permissions.middleware', () => ({
    requirePermission: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('@/services/user.service', () => ({
    getUser: jest.fn(),
}));

const request = require('supertest');
const app = require('@/app');

const userService = require('@/services/user.service');
const NotFoundError = require('@/errors/NotFoundError');

describe('GET /api/users/:uuid', () => {
    it('should return 200 and user data', async () => {
        userService.getUser.mockResolvedValue({
            uuid: '123e4567-e89b-12d3-a456-426614174000',
            name: 'John',
            surname: 'Pork',
        });

        const res = await request(app).get('/api/users/123e4567-e89b-12d3-a456-426614174000');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('uuid', '123e4567-e89b-12d3-a456-426614174000');
        expect(res.body).toHaveProperty('name', 'John');
    });

    it('should return 404 if user not found', async () => {
        userService.getUser.mockRejectedValue(new NotFoundError('usuario no encontrado'));

        const res = await request(app).get('/api/users/123e4567-e89b-12d3-a456-426614174000');

        expect(res.statusCode).toBe(404);
    });
});

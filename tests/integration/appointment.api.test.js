jest.mock('@/middlewares/auth.middleware', () => ({
  requireAuth: (req, res, next) => next(),
}));

jest.mock('@/middlewares/permissions.middleware', () => ({
  requirePermission: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('@/services/appointment.service', () => ({
    getAppointment: jest.fn(),
}));

const request = require('supertest');
const app = require('@/app');

const appointmentService = require('@/services/appointment.service');
const NotFoundError = require('@/errors/NotFoundError');

describe('GET /api/appointments/:uuid', () => {
    it('should return 200 and appointment data', async () => {
        appointmentService.getAppointment.mockResolvedValue({
            uuid: 'abc',
            patientId: 1,
        });

        const res = await request(app).get('/api/appointments/abc');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('uuid', 'abc');
    });
    it('should return 404 if appointment not found', async () => {
        appointmentService.getAppointment.mockRejectedValue(new NotFoundError('cita no encontrada'));

        const res = await request(app).get('/api/appointments/abc');

        expect(res.statusCode).toBe(404);
    });
});

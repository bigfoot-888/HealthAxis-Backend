const { Role } = require('../models/role.model');
const { Permission } = require('../models/permission.model');

async function seedRolesAndPermissions() {
    const roles = ['ADMINISTRATIVE', 'CARDIOLOGIST'];

    const permissions = [
        // Patient
        'patient:read',
        'patient:create',
        'patient:update',
        'patient:delete',

        // Appointment
        'appointment:complete',
        'appointment:read',
        'appointment:create',
        'appointment:update',
        'appointment:delete',

        // Diagnosis
        'diagnosis:read',
        'diagnosis:create',
        'diagnosis:update',
        'diagnosis:delete',

        // Treatment
        'treatment:read',
        'treatment:create',
        'treatment:update',
        'treatment:delete',

        // Clinical Docs
        'clinical-document:read',
        'clinical-document:create',
        'clinical-document:update',
        'clinical-document:delete',

        // Agenda
        'agenda:read',
        'agenda:create',
        'agenda:update',
        'agenda:delete',

        // User
        'user:read',
        'user:create',
        'user:update',
        'user:delete',

        // Patient Flow
        'patient-flow:read',
        'patient-flow:update',

        // Dashboard
        'dashboard:read',
        'role:read'
    ];

    const roleInstances = {};
    for (const role of roles) {
        const [instance] = await Role.findOrCreate({ where: { name: role } });
        roleInstances[role] = instance;
    }

    const permissionInstances = {};
    for (const perm of permissions) {
        const [instance] = await Permission.findOrCreate({ where: { name: perm } });
        permissionInstances[perm] = instance;
    }

    await roleInstances.ADMINISTRATIVE.setPermissions(
        Object.values(permissionInstances)
    );

    const restricted = [
        'agenda:create',
        'agenda:update',
        'user:create',
    ];

    const cardiologistPermissions = Object.entries(permissionInstances)
        .filter(([name]) => !restricted.includes(name))
        .map(([, instance]) => instance);

    await roleInstances.CARDIOLOGIST.setPermissions(cardiologistPermissions);

    console.log('RBAC seeded');
}

module.exports = { seedRolesAndPermissions };
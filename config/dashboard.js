const DEFAULT_DASHBOARD_COMPONENTS = [
    {
        title: 'Pacientes Activos',
        type: 'KPI',
        position: { x: 0, y: 0, w: 2, h: 2 },
        source: 'SYSTEM',

        config: {
            visuals: { color: 'success.main' },
            query: {
                entity: 'Patient',
                aggregation: 'COUNT',
                targetColumn: 'id',
                filters: { status: 'ACTIVE' },
            },
        },
    },

    {
        title: 'Citas Hoy',
        type: 'KPI',
        position: { x: 2, y: 0, w: 2, h: 2 },
        source: 'SYSTEM',

        config: {
            visuals: { color: 'info.main' },
            query: {
                entity: 'Appointment',
                aggregation: 'COUNT',
                targetColumn: 'id',
                filters: { date: 'today' },
            },
        },
    },

    {
        title: 'Citas en espera',
        type: 'KPI',
        position: { x: 4, y: 0, w: 2, h: 2 },
        source: 'SYSTEM',

        config: {
            visuals: { color: 'warning.main' },
            query: {
                entity: 'Appointment',
                aggregation: 'COUNT',
                targetColumn: 'id',
                filters: { status: 'CHECKED_IN' },
            },
        },
    },

    {
        title: 'Próximas Citas',
        type: 'LIST',
        position: { x: 6, y: 0, w: 2, h: 5 },
        source: 'SYSTEM',

        config: {
            visuals: {
                columns: ['patientId', 'startTime', 'status'],
            },
            query: {
                type: 'LIST',
                entity: 'Appointment',
                scope: 'SELF',
                filters: { upcoming: true },
                orderBy: {
                    field: 'startTime',
                    direction: 'ASC',
                },
                limit: 5,
            },
        },
    },

    {
        title: 'Citas a lo largo del tiempo',
        type: 'LINE_CHART',
        position: { x: 0, y: 2, w: 6, h: 3 },
        source: 'SYSTEM',

        config: {
            visuals: {
                xAxisKey: 'x',
                yAxisKey: 'y',
                yAxisLabel: 'Citas',
                tooltipLabel: 'Citas',
            },
            query: {
                entity: 'Appointment',
                aggregation: 'COUNT',
                targetColumn: 'id',
                groupBy: 'startTime',
                timeGrain: 'week',
            },
        },
    },
];

module.exports = {
    DEFAULT_DASHBOARD_COMPONENTS,
}
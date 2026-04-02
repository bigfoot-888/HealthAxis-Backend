function buildBundle(resources) {
    return {
        resourceType: 'Bundle',
        type: 'searchset',
        timestamp: new Date().toISOString(),
        total: resources.length,
        entry: resources.map((resource) => ({
            resource,
        })),
    };
}

module.exports = { buildBundle };

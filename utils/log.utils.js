function getChanges(oldEntity, newData, options = {}) {
    const { ignoreFields = [] } = options;
    const changes = {};

    for (const key of Object.keys(newData)) {
        if (ignoreFields.includes(key)) continue;
        if (!(key in oldEntity)) continue;

        const oldValue = oldEntity[key];
        const newValue = newData[key];

        if (newValue === undefined) continue;

        let isDifferent = false;

        const isDate = oldValue instanceof Date || newValue instanceof Date;

        if (isDate) {
            const oldTime = oldValue ? new Date(oldValue).getTime() : null;
            const newTime = newValue ? new Date(newValue).getTime() : null;

            if (isNaN(oldTime) && isNaN(newTime)) {
                isDifferent = false;
            } else {
                isDifferent = oldTime !== newTime;
            }
        } else {
            isDifferent = oldValue !== newValue;
        }

        if (isDifferent) {
            changes[key] = {
                from: oldValue,
                to: newValue,
            };
        }
    }

    return changes;
}

module.exports = {
    getChanges,
};

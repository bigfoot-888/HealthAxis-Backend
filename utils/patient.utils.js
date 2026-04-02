function createNHC(id) {
    return `${String(id).padStart(6, '0')}`;
}

module.exports = {
    createNHC,
};

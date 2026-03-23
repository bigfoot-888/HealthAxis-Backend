const fs = require('fs').promises;
const path = require('path');

async function getFileFromStorage(storageKey) {
    const filePath = path.join(__dirname, '../uploads', storageKey);
    const fileBuffer = await fs.readFile(filePath); // returns Buffer
    return fileBuffer;
}
module.exports = {
    getFileFromStorage,
}
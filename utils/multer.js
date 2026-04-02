const multer = require('multer');
const path = require('path');

const { v4: uuidv4 } = require('uuid');

function generateStorageKey(originalName) {
    const ext = originalName.substring(originalName.lastIndexOf('.'));
    return `${Date.now()}-${uuidv4()}${ext}`;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads')); // adjust path
    },
    filename: (req, file, cb) => {
        const uuid = uuidv4(); // valid UUID
        req.storageKey = uuid; // store for DB
        console.log(file.originalname);
        cb(null, uuid + '.' + file.originalname); // actual file on disk
    },
});

const upload = multer({ storage });

module.exports = { upload };

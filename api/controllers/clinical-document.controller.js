const clinicalDocumentService = require('../../services/clinical-document.service');

// ===== CREATE =====

async function createClinicalDocumentController(req, res) {
    const { attachments, users = [], ...documentData } = req.body;
    const mappedUsers = users.map((u) => ({
        userId: u.user.id,
        role: u.role,
    }));
    documentData.userId = req.user.id;
    const document = await clinicalDocumentService.createClinicalDocument(
        documentData,
        attachments,
        mappedUsers,
    );

    res.status(201).json(document);
}

async function createClinicalAttachmentController(req, res) {
    const file = req.file;

    if (!file) {
        throw new Error('El archivo es obligatorio');
    }

    const attachment = await clinicalDocumentService.createClinicalAttachment({
        storageKey: req.storageKey.split('.')[0],
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        userId: req.user.id
    });

    res.status(201).json(attachment);
}

// ===== READ =====

async function getClinicalDocumentsController(req, res) {
    const documents = await clinicalDocumentService.getClinicalDocuments();
    res.status(200).json(documents);
}

async function getFilteredClinicalDocumentsController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit, 10) || 20;
    const documents = await clinicalDocumentService.getFilteredClinicalDocuments(query, limit);
    res.status(200).json(documents);
}

async function getClinicalDocumentController(req, res) {
    const { uuid } = req.params;

    const document = await clinicalDocumentService.getClinicalDocument(uuid);
    res.status(200).json(document);
}

async function getClinicalDocumentPlainController(req, res) {
    const { uuid } = req.params;

    const document = await clinicalDocumentService.getClinicalDocumentPlain(uuid);
    res.status(200).json(document);
}

async function getClinicalAttachmentController(req, res) {
    const { id } = req.params;

    const { fileBuffer, mimeType, fileName } =
        await clinicalDocumentService.getClinicalAttachment(id);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(fileBuffer);
}

// ===== UPDATE =====

async function updateClinicalDocumentController(req, res){
    const { uuid } = req.params;
    const { ...documentData } = req.body;

    const payload = {
        ...documentData,
    };
    const updatedDocument = await clinicalDocumentService.updateClinicalDocument(uuid, payload, req.user.id);
    res.status(200).json(updatedDocument);
}

async function updateClinicalDocumentStatusController(req, res) {
    const { uuid } = req.params;
    const { status } = req.body;

    const updated = await clinicalDocumentService.updateClinicalDocumentStatus(uuid, status);
    res.status(200).json({ updated });
}

async function updateClinicalAttachmentStatusController(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await clinicalDocumentService.updateClinicalAttachmentStatus(id, status);
    res.status(200).json({ updated });
}

module.exports = {
    createClinicalDocumentController,
    createClinicalAttachmentController,

    getClinicalDocumentsController,
    getFilteredClinicalDocumentsController,
    getClinicalDocumentController,
    getClinicalDocumentPlainController,
    getClinicalAttachmentController,

    updateClinicalDocumentStatusController,
    updateClinicalAttachmentStatusController,
    updateClinicalDocumentController,
};
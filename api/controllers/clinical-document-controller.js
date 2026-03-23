const clinicalDocumentService = require('../../modules/clinical-document-service');

// ===== CREATE =====

async function createClinicalDocumentController(req, res) {
    const { attachments, entities, users, ...documentData } = req.body;
    const mappedEntities =
        entities?.map((ent) => ({
            id: ent.id,
            type: ent.type, // e.g., 'diagnosis' or 'treatment'
        })) || [];

    const mappedUsers = users.map((p) => ({
        user: { id: p.user.id, role: p.role },
    }));

    const document = await clinicalDocumentService.createClinicalDocument(
        documentData,
        attachments,
        mappedEntities,
        mappedUsers,
    );
    res.status(201).json(document);
}

async function createClinicalAttachment(req, res) {
    const file = req.file; // actual file

    if (!file) {
        return res.status(400).json({ error: 'File is required' });
    }

    console.log(file)

    const attachment = await clinicalDocumentService.createClinicalAttachment({
        storageKey: req.storageKey.split('.')[0],   
        fileName: file.originalname,  
        mimeType: file.mimetype,
        fileSize: file.size,
    });
    res.status(201).json(attachment);
}

// ===== READ =====

async function getClinicalDocumentsController(req, res) {
    const documents = await clinicalDocumentService.getClinicalDocuments();
    res.status(200).json(documents);
}

async function getClinicalDocumentsPlainController(req, res) {
    const documents = await clinicalDocumentService.getClinicalDocumentsPlain();
    res.status(200).json(documents);
}

async function getClinicalDocumentWithAttachmentsController(req, res) {
    const documents = await clinicalDocumentService.getClinicalDocumentsWithAttachments();
    res.status(200).json(documents);
}

async function getClinicalDocumentByIdController(req, res) {
    const { id } = req.params;
    const document = await clinicalDocumentService.getClinicalDocumentById(id);
    res.status(200).json(document);
}

async function getClinicalDocumentController(req, res) {
    const { uuid } = req.params;
    const document = await clinicalDocumentService.getClinicalDocument(uuid);
    res.status(200).json(document);
}

async function getFilteredClinicalDocumentsController(req, res) {
    const query = req.query.query || '';
    const limit = parseInt(req.query.limit) || 20;
    const documents = await clinicalDocumentService.getFilteredClinicalDocuments(query, limit);
    res.status(200).json(documents);
}

async function getClinicalAttachment(req, res) {
    const {id} = req.params;
    const { fileBuffer, mimeType, fileName } = await clinicalDocumentService.getClinicalAttachment(id);


    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(fileBuffer);
}

// ===== UPDATE =====

async function updateClinicalDocumentStateController(req, res) {
    const { uuid } = req.params;
    const { state } = req.body;
    const updated = await clinicalDocumentService.updateClinicalDocumentState(uuid, state);
    res.status(200).json({ updated });
}

async function updateClinicalAttachmentStateController(req, res) {
    const { uuid } = req.params;
    const { state } = req.body;
    const updated = await clinicalDocumentService.updateClinicalAttachmentState(uuid, state);
    res.status(200).json({ updated });
}

module.exports = {
    createClinicalDocumentController,
    createClinicalAttachment,

    getClinicalDocumentsController,
    getClinicalDocumentsPlainController,
    getClinicalDocumentWithAttachmentsController,
    getClinicalDocumentByIdController,
    getClinicalDocumentController,
    getFilteredClinicalDocumentsController,

    getClinicalAttachment,

    updateClinicalDocumentStateController,
    updateClinicalAttachmentStateController,
};

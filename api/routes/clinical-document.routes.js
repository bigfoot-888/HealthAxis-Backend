const express = require('express');
const router = express.Router();

const { upload } = require('../../utils/multer');

const clinicalDocumentController = require('../controllers/clinical-document.controller');
const {
    createClinicalDocumentRules,
    createClinicalAttachmentRules,
} = require('../validators/clinical-document.validators');

const validateRequest = require('../../middlewares/request-validator.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const { validateUuidParam } = require('../../middlewares/valid-uuid.middleware');

router.post(
    '/',
    createClinicalDocumentRules,
    validateRequest,
    asyncHandler(clinicalDocumentController.createClinicalDocumentController),
);
router.post(
    '/attachments',
    upload.single('file'),
    createClinicalAttachmentRules,
    validateRequest,
    asyncHandler(clinicalDocumentController.createClinicalAttachmentController),
);

router.get('/', asyncHandler(clinicalDocumentController.getClinicalDocumentsController));
router.get('/filtered', asyncHandler(clinicalDocumentController.getFilteredClinicalDocumentsController));

router.get(
    '/attachments/:uuid/download',
    validateUuidParam('uuid'),
    asyncHandler(clinicalDocumentController.getClinicalAttachmentController),
);
router.get('/:uuid', validateUuidParam('uuid'), asyncHandler(clinicalDocumentController.getClinicalDocumentController));
router.get(
    '/:uuid/plain',
    validateUuidParam('uuid'),
    asyncHandler(clinicalDocumentController.getClinicalDocumentPlainController),
);

router.patch(
    '/:uuid/status',
    validateUuidParam('uuid'),
    asyncHandler(clinicalDocumentController.updateClinicalDocumentStatusController),
);
router.patch(
    '/attachments/:uuid/status',
    validateUuidParam('uuid'),
    asyncHandler(clinicalDocumentController.updateClinicalAttachmentStatusController),
);

module.exports = router;

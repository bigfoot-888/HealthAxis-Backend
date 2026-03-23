const express = require('express');
const router = express.Router();

const {upload} = require('../../utils/multer')


const clinicalDocumentController = require('../controllers/clinical-document-controller');
const {
    createClinicalDocumentRules,
    createClinicalDocumentEntityRules,
    createClinicalAttachmentRules,
} = require('../validators/clinical-document-validators');
const validateRequest = require('../../middlewares/validate-requests');
const asyncHandler = require('../../middlewares/async-handler');

router.post(
    '/new',
    createClinicalDocumentRules,
    validateRequest,
    asyncHandler(clinicalDocumentController.createClinicalDocumentController),
);

router.post(
    '/attachments/new',
    upload.single('file'),
    createClinicalAttachmentRules,
    validateRequest,
    asyncHandler(clinicalDocumentController.createClinicalAttachment),
);

router.get(
    '/attachments/:id/download',
    asyncHandler(clinicalDocumentController.getClinicalAttachment)
)

router.get('/', asyncHandler(clinicalDocumentController.getClinicalDocumentsController));

router.get('/filtered', asyncHandler(clinicalDocumentController.getFilteredClinicalDocumentsController));

router.patch('/:uuid/update/state', asyncHandler(clinicalDocumentController.updateClinicalDocumentStateController));
router.patch(
    '/attachments/:uuid//update/state',
    asyncHandler(clinicalDocumentController.updateClinicalAttachmentStateController),
);

router.get('/:uuid', asyncHandler(clinicalDocumentController.getClinicalDocumentController));

router.get('/:uuid/plain', asyncHandler(clinicalDocumentController.getClinicalDocumentPlainController));

module.exports = router;

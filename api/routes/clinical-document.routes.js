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

const requirePermission = require('../../middlewares/permissions.middleware'); 
const {requireAuth} = require('../../middlewares/auth.middleware'); 

router.use(requireAuth); 

router.post(
    '/',
    requirePermission("clinical-document:create"), 
    createClinicalDocumentRules,
    validateRequest,
    asyncHandler(clinicalDocumentController.createClinicalDocumentController),
);
router.post(
    '/attachments',
    requirePermission("clinical-document:create"), 
    upload.single('file'),
    createClinicalAttachmentRules,
    validateRequest,
    asyncHandler(clinicalDocumentController.createClinicalAttachmentController),
);

router.get('/', requirePermission("clinical-document:read"), asyncHandler(clinicalDocumentController.getClinicalDocumentsController));
router.get('/filtered', requirePermission("clinical-document:read"), asyncHandler(clinicalDocumentController.getFilteredClinicalDocumentsController));

router.get(
    '/attachments/:uuid/download',
    requirePermission("clinical-document:read"), 
    validateUuidParam('uuid'),
    asyncHandler(clinicalDocumentController.getClinicalAttachmentController),
);
router.get('/:uuid', requirePermission("clinical-document:read"), validateUuidParam('uuid'), asyncHandler(clinicalDocumentController.getClinicalDocumentController));
router.get(
    '/:uuid/plain',
    requirePermission("clinical-document:read"), 
    validateUuidParam('uuid'),
    asyncHandler(clinicalDocumentController.getClinicalDocumentPlainController),
);

router.patch(
    '/:uuid/status',
    requirePermission("clinical-document:update"), 
    validateUuidParam('uuid'),
    asyncHandler(clinicalDocumentController.updateClinicalDocumentStatusController),
);
router.patch(
    '/attachments/:uuid/status',
    requirePermission("clinical-document:update"), 
    validateUuidParam('uuid'),
    asyncHandler(clinicalDocumentController.updateClinicalAttachmentStatusController),
);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const assetController = require('../controllers/assetController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

router.get('/', assetController.getAssets);
router.get('/availability/matrix', assetController.getAvailabilityMatrix);
router.post('/check-availability', assetController.checkAvailability);
router.get('/:id/availability', assetController.getAvailability);
router.get('/:id', assetController.getAsset);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  [
    body('name').trim().notEmpty().withMessage('Asset name is required.'),
    body('type').isIn(['BILLBOARD', 'UNIPOLE', 'HOARDING', 'GANTRY', 'OTHER']).withMessage('Invalid asset type.'),
    body('sizeWidth').isFloat({ min: 0.1 }).withMessage('Width must be a positive number.'),
    body('sizeHeight').isFloat({ min: 0.1 }).withMessage('Height must be a positive number.'),
    body('locationAddress').trim().notEmpty().withMessage('Address is required.'),
    body('locationCity').trim().notEmpty().withMessage('City is required.'),
    body('locationDistrict').trim().notEmpty().withMessage('District is required.'),
    body('monthlyRate').isFloat({ min: 0 }).withMessage('Monthly rate must be a positive number.'),
    body('zoneId').isInt({ min: 1 }).withMessage('Zone is required.'),
    body('illumination').optional().isIn(['FRONTLIT', 'BACKLIT', 'NONLIT', 'LED']),
    body('condition').optional().isIn(['GOOD', 'FAIR', 'POOR']),
    body('ownership').optional().isIn(['OWNED', 'LEASED', 'THIRD_PARTY']),
    body('status').optional().isIn(['AVAILABLE', 'BOOKED', 'UNDER_MAINTENANCE', 'BLOCKED']),
  ],
  assetController.createAsset
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  [
    body('name').optional().trim().notEmpty(),
    body('type').optional().isIn(['BILLBOARD', 'UNIPOLE', 'HOARDING', 'GANTRY', 'OTHER']),
    body('sizeWidth').optional().isFloat({ min: 0.1 }),
    body('sizeHeight').optional().isFloat({ min: 0.1 }),
    body('monthlyRate').optional().isFloat({ min: 0 }),
    body('illumination').optional().isIn(['FRONTLIT', 'BACKLIT', 'NONLIT', 'LED']),
    body('condition').optional().isIn(['GOOD', 'FAIR', 'POOR']),
    body('ownership').optional().isIn(['OWNED', 'LEASED', 'THIRD_PARTY']),
    body('status').optional().isIn(['AVAILABLE', 'BOOKED', 'UNDER_MAINTENANCE', 'BLOCKED']),
  ],
  assetController.updateAsset
);

router.delete('/:id', authorize('ADMIN', 'MANAGER'), assetController.deleteAsset);

// Image routes
router.post('/:id/images', authorize('ADMIN', 'MANAGER'), upload.array('images', 10), assetController.uploadImages);
router.put('/:id/images/:imageId', authorize('ADMIN', 'MANAGER'), assetController.updateImage);
router.delete('/:id/images/:imageId', authorize('ADMIN', 'MANAGER'), assetController.deleteImage);

module.exports = router;

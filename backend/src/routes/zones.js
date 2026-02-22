const express = require('express');
const { body } = require('express-validator');
const zoneController = require('../controllers/zoneController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', zoneController.getZones);
router.get('/:id', zoneController.getZone);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  [
    body('name').trim().notEmpty().withMessage('Zone name is required.'),
    body('city').trim().notEmpty().withMessage('City is required.'),
    body('district').trim().notEmpty().withMessage('District is required.'),
    body('state').optional().trim(),
    body('description').optional().trim(),
  ],
  zoneController.createZone
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  [
    body('name').optional().trim().notEmpty(),
    body('city').optional().trim().notEmpty(),
    body('district').optional().trim().notEmpty(),
  ],
  zoneController.updateZone
);

router.delete('/:id', authorize('ADMIN'), zoneController.deleteZone);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const quotationController = require('../controllers/quotationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', quotationController.getQuotations);
router.get('/stats', quotationController.getStats);
router.get('/:id', quotationController.getQuotation);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  [
    body('clientId').isInt({ min: 1 }).withMessage('Client is required.'),
    body('startDate').optional().isISO8601().withMessage('Start date must be a valid date.'),
    body('endDate').optional().isISO8601().withMessage('End date must be a valid date.'),
    body('validUntil').isISO8601().withMessage('Valid until date is required.'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required.'),
    body('items.*.description').trim().notEmpty().withMessage('Item description is required.'),
    body('items.*.monthlyRate').isFloat({ min: 0 }).withMessage('Monthly rate must be a positive number.'),
    body('items.*.months').optional().isInt({ min: 1 }),
  ],
  quotationController.createQuotation
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  [
    body('clientId').optional().isInt({ min: 1 }),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('validUntil').optional().isISO8601(),
    body('status').optional().isIn(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
    body('taxRate').optional().isFloat({ min: 0, max: 100 }),
    body('items').optional().isArray({ min: 1 }),
    body('items.*.description').optional().trim().notEmpty(),
    body('items.*.monthlyRate').optional().isFloat({ min: 0 }),
    body('items.*.months').optional().isInt({ min: 1 }),
  ],
  quotationController.updateQuotation
);

router.delete('/:id', authorize('ADMIN'), quotationController.deleteQuotation);

module.exports = router;

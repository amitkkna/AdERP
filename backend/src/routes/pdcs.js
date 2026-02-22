const express = require('express');
const { body } = require('express-validator');
const pdcController = require('../controllers/pdcController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/',       pdcController.getPDCs);
router.get('/stats',  pdcController.getStats);
router.get('/:id',    pdcController.getPDC);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  [
    body('invoiceId').isInt({ min: 1 }).withMessage('Invoice is required.'),
    body('chequeNumber').trim().notEmpty().withMessage('Cheque number is required.'),
    body('bankName').trim().notEmpty().withMessage('Bank name is required.'),
    body('chequeDate').isISO8601().withMessage('Valid cheque date is required.'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0.'),
  ],
  pdcController.createPDC
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  [
    body('status').optional().isIn(['HELD', 'DEPOSITED', 'CLEARED', 'BOUNCED', 'CANCELLED']).withMessage('Invalid status.'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0.'),
    body('chequeDate').optional().isISO8601().withMessage('Valid cheque date required.'),
    body('penaltyAmount').optional({ nullable: true }).isFloat({ min: 0 }),
  ],
  pdcController.updatePDC
);

router.delete('/:id', authorize('ADMIN', 'MANAGER'), pdcController.deletePDC);

module.exports = router;

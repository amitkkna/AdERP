const express = require('express');
const { body } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', invoiceController.getInvoices);
router.get('/payments', invoiceController.getPayments);
router.get('/:id', invoiceController.getInvoice);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  [
    body('bookingId').isInt({ min: 1 }).withMessage('Booking is required.'),
    body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a positive number.'),
    body('dueDate').isISO8601().withMessage('Valid due date is required.'),
    body('taxRate').optional().isFloat({ min: 0, max: 100 }),
  ],
  invoiceController.createInvoice
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  [
    body('status').optional().isIn(['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']),
    body('subtotal').optional().isFloat({ min: 0 }),
    body('taxRate').optional().isFloat({ min: 0, max: 100 }),
    body('dueDate').optional().isISO8601(),
  ],
  invoiceController.updateInvoice
);

// Payment routes
router.post(
  '/:id/payments',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be positive.'),
    body('method').optional().isIn(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'ONLINE']),
    body('paymentDate').optional().isISO8601(),
  ],
  invoiceController.addPayment
);

module.exports = router;

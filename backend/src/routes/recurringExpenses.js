const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/recurringExpenseController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/upcoming', controller.getUpcomingDues);
router.get('/', controller.getRecurringExpenses);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  [
    body('assetId').isInt({ gt: 0 }).withMessage('Asset is required.'),
    body('category').notEmpty().withMessage('Category is required.'),
    body('frequency').isIn(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']).withMessage('Valid frequency is required.'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0.'),
    body('startDate').notEmpty().withMessage('Start date is required.'),
  ],
  controller.createRecurringExpense
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  [
    body('amount').optional().isFloat({ gt: 0 }),
    body('frequency').optional().isIn(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']),
  ],
  controller.updateRecurringExpense
);

router.post('/:id/mark-paid', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), controller.markAsPaid);
router.delete('/:id', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), controller.deleteRecurringExpense);

module.exports = router;

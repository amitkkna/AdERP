const express = require('express');
const { body } = require('express-validator');
const expenseController = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', expenseController.getExpenses);
router.get('/asset/:assetId/summary', expenseController.getAssetExpenseSummary);
router.get('/asset/:assetId/profitability', expenseController.getAssetProfitability);
router.get('/:id', expenseController.getExpense);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  [
    body('category').notEmpty().withMessage('Category is required.'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0.'),
    body('date').notEmpty().withMessage('Date is required.'),
    body('assetId').isInt({ gt: 0 }).withMessage('Asset is required.'),
  ],
  expenseController.createExpense
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  [
    body('category').optional().notEmpty(),
    body('amount').optional().isFloat({ gt: 0 }),
    body('date').optional().notEmpty(),
    body('assetId').optional().isInt({ gt: 0 }),
  ],
  expenseController.updateExpense
);

router.delete('/:id', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), expenseController.deleteExpense);

module.exports = router;

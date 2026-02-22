const express = require('express');
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBooking);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  [
    body('clientId').isInt({ min: 1 }).withMessage('Client is required.'),
    body('assets').isArray({ min: 1 }).withMessage('At least one asset is required.'),
    body('assets.*.assetId').isInt({ min: 1 }).withMessage('Each asset must have a valid ID.'),
    body('assets.*.monthlyRate').isFloat({ min: 0 }).withMessage('Each asset must have a valid monthly rate.'),
    body('startDate').isISO8601().withMessage('Valid start date is required.'),
    body('endDate').isISO8601().withMessage('Valid end date is required.'),
  ],
  bookingController.createBooking
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  [
    body('status').optional().isIn(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  bookingController.updateBooking
);

module.exports = router;

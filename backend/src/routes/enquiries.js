const express = require('express');
const { body } = require('express-validator');
const enquiryController = require('../controllers/enquiryController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// List & stats
router.get('/', enquiryController.getEnquiries);
router.get('/stats', enquiryController.getStats);

// Campaign PDF data (with images as base64)
router.get('/:id/campaign', enquiryController.getCampaignData);

// Single
router.get('/:id', enquiryController.getEnquiry);

// Create
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  [
    body('clientName').trim().notEmpty().withMessage('Client/company name is required.'),
    body('contactPerson').trim().notEmpty().withMessage('Contact person is required.'),
    body('phone').trim().notEmpty().withMessage('Phone number is required.'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Valid email is required.'),
    body('budget').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Budget must be a positive number.'),
    body('clientId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Invalid client ID.'),
  ],
  enquiryController.createEnquiry
);

// Update
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  [
    body('clientName').optional().trim().notEmpty().withMessage('Client name cannot be empty.'),
    body('contactPerson').optional().trim().notEmpty().withMessage('Contact person cannot be empty.'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty.'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Valid email is required.'),
    body('status').optional().isIn(['NEW', 'WON', 'LOST']).withMessage('Invalid status.'),
    body('budget').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Budget must be a positive number.'),
  ],
  enquiryController.updateEnquiry
);

// Delete
router.delete('/:id', authorize('ADMIN'), enquiryController.deleteEnquiry);

// Add activity note
router.post(
  '/:id/activities',
  authorize('ADMIN', 'MANAGER'),
  [
    body('type')
      .isIn(['NOTE', 'CALL', 'EMAIL', 'MEETING'])
      .withMessage('Type must be NOTE, CALL, EMAIL, or MEETING.'),
    body('description').trim().notEmpty().withMessage('Description is required.'),
  ],
  enquiryController.addActivity
);

// Convert won enquiry to booking
router.post(
  '/:id/convert',
  authorize('ADMIN', 'MANAGER'),
  [
    body('clientId').isInt({ min: 1 }).withMessage('A valid client is required.'),
    body('startDate').isISO8601().withMessage('Valid start date is required.'),
    body('endDate').isISO8601().withMessage('Valid end date is required.'),
    body('assets').isArray({ min: 1 }).withMessage('At least one asset is required.'),
    body('assets.*.assetId').isInt({ min: 1 }).withMessage('Each asset must have a valid ID.'),
    body('assets.*.monthlyRate').isFloat({ min: 0 }).withMessage('Valid monthly rate is required.'),
  ],
  enquiryController.convertToBooking
);

module.exports = router;

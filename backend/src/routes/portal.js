const express = require('express');
const { body } = require('express-validator');
const portalController = require('../controllers/portalController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Client portal dashboard (CLIENT role)
router.get('/dashboard', authorize('CLIENT'), portalController.getDashboard);

// Admin: link a user account to a client record
router.put(
  '/link-client',
  authorize('ADMIN', 'MANAGER'),
  [
    body('userId').isInt({ min: 1 }).withMessage('User ID is required.'),
    body('clientId').optional({ nullable: true }).isInt({ min: 1 }),
  ],
  portalController.linkClient
);

module.exports = router;

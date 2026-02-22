const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('phone').optional().trim(),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  authController.login
);

router.get('/me', authenticate, authController.getMe);

router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('phone').optional().trim(),
    body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
  ],
  authController.updateProfile
);

module.exports = router;

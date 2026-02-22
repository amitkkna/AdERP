const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'CLIENT']),
    body('password').optional().isLength({ min: 6 }),
    body('isActive').optional().isBoolean(),
  ],
  userController.updateUser
);

router.delete('/:id', userController.deleteUser);

module.exports = router;

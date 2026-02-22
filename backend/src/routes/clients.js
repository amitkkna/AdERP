const express = require('express');
const { body } = require('express-validator');
const clientController = require('../controllers/clientController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', clientController.getClients);
router.get('/all', clientController.getAllClients);
router.get('/:id', clientController.getClient);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  [
    body('companyName').trim().notEmpty().withMessage('Company name is required.'),
    body('contactPerson').trim().notEmpty().withMessage('Contact person is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('phone').trim().notEmpty().withMessage('Phone number is required.'),
    body('address').trim().notEmpty().withMessage('Address is required.'),
    body('city').trim().notEmpty().withMessage('City is required.'),
  ],
  clientController.createClient
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  [
    body('companyName').optional().trim().notEmpty(),
    body('contactPerson').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().trim().notEmpty(),
  ],
  clientController.updateClient
);

router.delete('/:id', authorize('ADMIN', 'MANAGER'), clientController.deleteClient);

module.exports = router;

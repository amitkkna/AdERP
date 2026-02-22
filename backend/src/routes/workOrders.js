const express = require('express');
const workOrderController = require('../controllers/workOrderController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', workOrderController.getWorkOrders);
router.get('/stats', workOrderController.getStats);
router.get('/:id', workOrderController.getWorkOrder);
router.put('/:id', authorize('ADMIN', 'MANAGER'), workOrderController.updateWorkOrder);

module.exports = router;

const express = require('express');
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/asset-profitability', reportsController.getAssetProfitability);
router.get('/monthly-revenue', reportsController.getMonthlyRevenue);
router.get('/client-revenue', reportsController.getClientRevenue);
router.get('/occupancy', reportsController.getOccupancyReport);
router.get('/invoice-ageing', reportsController.getInvoiceAgeing);
router.get('/alerts', reportsController.getAlerts);

module.exports = router;

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenantMiddleware');

// Apply authentication and tenant middleware to all routes
router.use(authenticate);
router.use(tenantContext);

// Dashboard overview routes
router.get('/overview', dashboardController.getDashboardOverview.bind(dashboardController));
router.get('/metrics', dashboardController.getDashboardMetrics.bind(dashboardController));
router.get('/revenue', dashboardController.getRevenueAnalytics.bind(dashboardController));
router.get('/customers', dashboardController.getCustomerAnalytics.bind(dashboardController));
router.get('/products', dashboardController.getProductAnalytics.bind(dashboardController));

// Data listing routes
router.get('/orders', dashboardController.getOrders.bind(dashboardController));
router.get('/customers/list', dashboardController.getCustomers.bind(dashboardController));
router.get('/products/list', dashboardController.getProducts.bind(dashboardController));

// Sync management
router.get('/sync/status', dashboardController.getSyncStatus.bind(dashboardController));
router.post('/sync/trigger', dashboardController.triggerSync.bind(dashboardController));

module.exports = router;
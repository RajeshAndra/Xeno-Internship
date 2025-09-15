const express = require('express');
const router = express.Router();
const shopifyController = require('../controllers/shopifyController');
const { authenticate } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenantMiddleware');

// Apply authentication and tenant middleware (except for webhooks)
router.use('/webhook', shopifyController.handleWebhook); // Webhooks don't need auth

router.use(authenticate);
router.use(tenantContext);

// Store management routes
router.post('/stores/connect', shopifyController.connectStore);
router.get('/stores', shopifyController.getStores);
router.get('/stores/:storeId', shopifyController.getStore);
router.put('/stores/:storeId', shopifyController.updateStore);
router.delete('/stores/:storeId', shopifyController.disconnectStore);

// Store testing and configuration
router.post('/stores/:storeId/test', shopifyController.testConnection);
router.get('/stores/:storeId/webhooks', shopifyController.getWebhookStatus);
router.post('/stores/:storeId/webhooks', shopifyController.setupWebhooks);

// Debug: fetch products
router.get('/stores/:storeId/products', shopifyController.listProducts);

// Webhook handling (public endpoints)
router.post('/webhook/:storeId/:topic', shopifyController.handleWebhook);

module.exports = router;
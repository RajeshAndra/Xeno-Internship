const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { authenticate } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenantMiddleware');

// Apply authentication and tenant middleware to all routes
router.use(authenticate);
router.use(tenantContext);

// Sync status and history
router.get('/history', syncController.getSyncHistory);
router.get('/status', syncController.getSyncStatus);
router.get('/statistics', syncController.getSyncStatistics);

// Sync operations
router.post('/full', syncController.startFullSync);
router.post('/incremental', syncController.startIncrementalSync);
router.post('/:syncId/cancel', syncController.cancelSync);
router.post('/:syncId/retry', syncController.retrySync);

// Sync configuration
router.put('/stores/:storeId/settings', syncController.updateSyncSettings);

// Sync logs
router.get('/:syncId/logs', syncController.getSyncLogs);

module.exports = router;
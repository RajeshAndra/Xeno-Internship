const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticate } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenantMiddleware');

// Apply authentication and tenant middleware to all routes
router.use(authenticate);
router.use(tenantContext);

// Tenant management
router.get('/', tenantController.getCurrentTenant);
router.put('/', tenantController.updateTenant);
router.get('/statistics', tenantController.getTenantStatistics);
router.put('/settings', tenantController.updateSettings);

// User management within tenant
router.get('/users', tenantController.getTenantUsers);
router.post('/users/invite', tenantController.inviteUser);
router.put('/users/:userId/role', tenantController.updateUserRole);
router.delete('/users/:userId', tenantController.removeUser);

// Billing and subscription
router.get('/billing', tenantController.getBillingInfo);
router.put('/subscription', tenantController.updateSubscription);

module.exports = router;
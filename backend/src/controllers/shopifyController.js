const { ShopifyService } = require('../services/shopifyService');
const { SyncService } = require('../services/syncService');
const { ShopifyStore } = require('../models');
const logger = require('../utils/logger');

class ShopifyController {
  constructor() {
    this.shopifyService = new ShopifyService();
    this.syncService = new SyncService();
  }

  // Connect new Shopify store
  async connectStore(req, res, next) {
    try {
      const { shopDomain, accessToken } = req.body;
      const tenantId = req.tenantId;

      if (!shopDomain || !accessToken) {
        return res.status(400).json({
          success: false,
          message: 'Shop domain and access token are required'
        });
      }

      const validDomain = shopDomain.includes('.myshopify.com') ? 
        shopDomain : `${shopDomain}.myshopify.com`;

      const shopInfo = await this.shopifyService.verifyConnection(validDomain, accessToken);
      
      const existingStore = await ShopifyStore.findOne({
        where: { shop_domain: validDomain, tenant_id: tenantId }
      });

      if (existingStore) {
        return res.status(400).json({
          success: false,
          message: 'Store is already connected'
        });
      }

      const store = await ShopifyStore.create({
        tenant_id: tenantId,
        shop_domain: validDomain,
        shopify_store_id: shopInfo.id,
        store_name: shopInfo.name,
        access_token: accessToken,
        currency: shopInfo.currency,
        timezone: shopInfo.timezone,
        status: 'connected',
        is_connected: true
      });

      logger.info(`Shopify store connected: ${validDomain} for tenant ${tenantId}`);
      
      res.status(201).json({
        success: true,
        message: 'Store connected successfully',
        data: { store: { ...store.toJSON(), access_token: undefined } }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get connected stores
  async getStores(req, res, next) {
    try {
      const tenantId = req.tenantId;

      const stores = await ShopifyStore.findAll({
        where: { tenant_id: tenantId },
        attributes: { exclude: ['access_token', 'deletedAt'] },
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: { stores }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single store details
  async getStore(req, res, next) {
    try {
      const { storeId } = req.params;
      const tenantId = req.tenantId;

      const store = await ShopifyStore.findOne({
        where: { 
          id: storeId,
          tenant_id: tenantId 
        },
        attributes: { exclude: ['access_token', 'deletedAt'] }
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      res.json({
        success: true,
        data: { store }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update store settings
  async updateStore(req, res, next) {
    try {
      const { storeId } = req.params;
      const tenantId = req.tenantId;
      
      const allowedFields = ['sync_frequency', 'store_settings', 'webhook_endpoints'];
      const updateData = {};
      
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      const store = await ShopifyStore.findOne({
        where: { 
          id: storeId,
          tenant_id: tenantId 
        }
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      await store.update(updateData);
      
      logger.info(`Store settings updated: ${store.shop_domain}`);
      
      res.json({
        success: true,
        message: 'Store updated successfully',
        data: { store: { ...store.toJSON(), access_token: undefined } }
      });
    } catch (error) {
      next(error);
    }
  }

  // Disconnect store
  async disconnectStore(req, res, next) {
    try {
      const { storeId } = req.params;
      const tenantId = req.tenantId;

      const store = await ShopifyStore.findOne({
        where: { 
          id: storeId,
          tenant_id: tenantId 
        }
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      await store.update({
        is_connected: false,
        status: 'disconnected',
        access_token: null
      });
      
      logger.info(`Store disconnected: ${store.shop_domain}`);
      
      res.json({
        success: true,
        message: 'Store disconnected successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Test store connection
  async testConnection(req, res, next) {
    try {
      const { storeId } = req.params;
      const tenantId = req.tenantId;

      const store = await ShopifyStore.findOne({
        where: { 
          id: storeId,
          tenant_id: tenantId 
        }
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      const connectionTest = await this.shopifyService.testConnection(
        store.shop_domain, 
        store.access_token
      );
      
      res.json({
        success: true,
        data: { connectionTest }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get store webhook status
  async getWebhookStatus(req, res, next) {
    try {
      const { storeId } = req.params;
      const tenantId = req.tenantId;

      const store = await ShopifyStore.findOne({
        where: { 
          id: storeId,
          tenant_id: tenantId 
        }
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      const webhooks = await this.shopifyService.getWebhooks(
        store.shop_domain, 
        store.access_token
      );
      
      res.json({
        success: true,
        data: { webhooks }
      });
    } catch (error) {
      next(error);
    }
  }

  // Setup webhooks
  async setupWebhooks(req, res, next) {
    try {
      const { storeId } = req.params;
      const tenantId = req.tenantId;

      const store = await ShopifyStore.findOne({
        where: { 
          id: storeId,
          tenant_id: tenantId 
        }
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      const webhooks = await this.shopifyService.setupWebhooks(
        store.shop_domain, 
        store.access_token,
        storeId
      );

      await store.update({
        webhook_endpoints: webhooks
      });
      
      logger.info(`Webhooks setup for store: ${store.shop_domain}`);
      
      res.json({
        success: true,
        message: 'Webhooks setup successfully',
        data: { webhooks }
      });
    } catch (error) {
      next(error);
    }
  }

  // Handle webhook
  async handleWebhook(req, res, next) {
    try {
      const { storeId } = req.params;
      const webhookTopic = req.get('X-Shopify-Topic');
      const webhookData = req.body;

      await this.shopifyService.processWebhook(storeId, webhookTopic, webhookData);
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      res.status(200).json({ success: false });
    }
  }

  // Quick products fetch for debugging
  async listProducts(req, res, next) {
    try {
      const { storeId } = req.params;
      const tenantId = req.tenantId;

      const store = await ShopifyStore.findOne({ where: { id: storeId, tenant_id: tenantId } });
      if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found' });
      }

      const connection = await this.shopifyService.testConnection(store.shop_domain, store.access_token);
      logger.info(`Shopify testConnection for ${store.shop_domain}: ${JSON.stringify(connection)}`);
      if (connection.status !== 'connected') {
        return res.status(400).json({ success: false, message: `Connection failed: ${connection.error}` });
      }

      const products = await this.shopifyService.fetchProducts(store.shop_domain, store.access_token, { limit: 5 });
      logger.info(`Fetched ${products.length} products from Shopify for store ${store.id}`);
      res.json({ success: true, data: { products } });
    } catch (error) {
      logger.error('Products fetch failed:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
    }
  }
}

module.exports = new ShopifyController();
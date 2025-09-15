const { Op } = require('sequelize');
const { ShopifyService } = require('./shopifyService');
const { ShopifyStore, Customer, Product, Order, OrderItem } = require('../models');
const logger = require('../utils/logger');

class SyncService {
  constructor() {
    this.shopifyService = new ShopifyService();
    this.activeSyncs = new Map(); // Track active sync processes
  }

  // Get sync status for a tenant
  async getSyncStatus(tenantId, storeId = null) {
    try {
      const whereClause = { tenantId };
      if (storeId) whereClause.id = storeId;

      const stores = await ShopifyStore.findAll({
        where: whereClause,
        attributes: ['id', 'storeName', 'shopDomain', 'isConnected', 'lastSync', 'status', 'syncFrequency']
      });

      const syncStatus = stores.map(store => {
        const isActive = this.activeSyncs.has(store.id);
        return {
          storeId: store.id,
          storeName: store.storeName,
          shopDomain: store.shopDomain,
          isConnected: store.isConnected,
          lastSync: store.lastSync,
          status: store.status,
          syncFrequency: store.syncFrequency,
          isActivelySyncing: isActive,
          activeSyncType: isActive ? this.activeSyncs.get(store.id).type : null
        };
      });

      return {
        stores: syncStatus,
        totalStores: stores.length,
        connectedStores: stores.filter(s => s.isConnected).length,
        activeSyncs: this.activeSyncs.size
      };
    } catch (error) {
      logger.error('Error getting sync status:', error);
      throw new Error('Failed to get sync status');
    }
  }

  // Trigger manual sync
  async triggerManualSync(tenantId, storeId, syncType = 'full') {
    try {
      const store = await ShopifyStore.findOne({
        where: { id: storeId, tenantId }
      });

      if (!store) {
        throw new Error('Store not found');
      }

      if (!store.isConnected || !store.accessToken) {
        throw new Error('Store is not connected or missing access token');
      }

      if (this.activeSyncs.has(storeId)) {
        throw new Error('Sync is already in progress for this store');
      }

      const syncJob = {
        id: require('uuid').v4(),
        storeId,
        tenantId,
        type: syncType,
        status: 'started',
        startedAt: new Date(),
        progress: 0,
        totalItems: 0,
        processedItems: 0,
        errors: []
      };

      this.activeSyncs.set(storeId, syncJob);

      // Run sync in background
      this.executeSyncJob(store, syncJob).catch(error => {
        logger.error('Sync job failed:', error);
        syncJob.status = 'failed';
        syncJob.error = error.message;
        syncJob.completedAt = new Date();
        this.activeSyncs.delete(storeId);
      });

      return syncJob;
    } catch (error) {
      logger.error('Error triggering manual sync:', error);
      throw error;
    }
  }

  // Start full sync
  async startFullSync(storeId) {
    const store = await ShopifyStore.findByPk(storeId);
    if (!store) throw new Error('Store not found');

    return this.triggerManualSync(store.tenantId, storeId, 'full');
  }

  // Start incremental sync
  async startIncrementalSync(storeId) {
    const store = await ShopifyStore.findByPk(storeId);
    if (!store) throw new Error('Store not found');

    return this.triggerManualSync(store.tenantId, storeId, 'incremental');
  }

  // Execute sync job
  async executeSyncJob(store, syncJob) {
    try {
      syncJob.status = 'running';
      
      logger.info(`Starting ${syncJob.type} sync for store ${store.shopDomain}`);

      const { shopDomain, accessToken, tenantId } = store;

      // Determine sync date range
      let sinceDate = null;
      if (syncJob.type === 'incremental' && store.lastSync) {
        sinceDate = new Date(store.lastSync);
        sinceDate.setHours(sinceDate.getHours() - 1); // 1 hour overlap for safety
      }

      // Sync customers
      await this.syncCustomers(shopDomain, accessToken, tenantId, store.id, syncJob, sinceDate);
      
      // Sync products
      await this.syncProducts(shopDomain, accessToken, tenantId, store.id, syncJob, sinceDate);
      
      // Sync orders
      await this.syncOrders(shopDomain, accessToken, tenantId, store.id, syncJob, sinceDate);

      // Update store last sync time
      await store.update({ 
        lastSync: new Date(),
        status: 'active'
      });

      syncJob.status = 'completed';
      syncJob.completedAt = new Date();
      syncJob.progress = 100;

      logger.info(`Sync completed for store ${store.shopDomain}`);

    } catch (error) {
      syncJob.status = 'failed';
      syncJob.error = error.message;
      syncJob.completedAt = new Date();
      
      await store.update({ status: 'error' });
      
      throw error;
    } finally {
      this.activeSyncs.delete(store.id);
    }
  }

  // Sync customers
  async syncCustomers(shopDomain, accessToken, tenantId, storeId, syncJob, sinceDate = null) {
    try {
      logger.info('Syncing customers...');
      
      let allCustomers = [];
      let hasNextPage = true;
      let sinceId = null;

      while (hasNextPage) {
        const options = { limit: 250 };
        if (sinceId) options.sinceId = sinceId;
        if (sinceDate) options.createdAtMin = sinceDate.toISOString();

        const customers = await this.shopifyService.fetchCustomers(shopDomain, accessToken, options);
        
        if (customers.length === 0) {
          hasNextPage = false;
          break;
        }

        allCustomers = allCustomers.concat(customers);
        sinceId = customers[customers.length - 1].id;
        hasNextPage = customers.length === 250;

        // Update progress
        syncJob.totalItems += customers.length;
        syncJob.progress = Math.min(25, (allCustomers.length / 1000) * 25); // Customers take 25% of progress
      }

      // Process customers in batches
      const batchSize = 100;
      for (let i = 0; i < allCustomers.length; i += batchSize) {
        const batch = allCustomers.slice(i, i + batchSize);
        await this.procesCustomerBatch(batch, tenantId, storeId);
        syncJob.processedItems += batch.length;
      }

      logger.info(`Synced ${allCustomers.length} customers`);
    } catch (error) {
      logger.error('Error syncing customers:', error);
      syncJob.errors.push(`Customer sync failed: ${error.message}`);
    }
  }

  // Sync products
  async syncProducts(shopDomain, accessToken, tenantId, storeId, syncJob, sinceDate = null) {
    try {
      logger.info('Syncing products...');
      
      let allProducts = [];
      let hasNextPage = true;
      let sinceId = null;

      while (hasNextPage) {
        const options = { limit: 250 };
        if (sinceId) options.sinceId = sinceId;

        const products = await this.shopifyService.fetchProducts(shopDomain, accessToken, options);
        
        if (products.length === 0) {
          hasNextPage = false;
          break;
        }

        allProducts = allProducts.concat(products);
        sinceId = products[products.length - 1].id;
        hasNextPage = products.length === 250;

        // Update progress
        syncJob.totalItems += products.length;
        syncJob.progress = Math.min(50, 25 + (allProducts.length / 1000) * 25); // Products take 25% of progress
      }

      // Process products in batches
      const batchSize = 50;
      for (let i = 0; i < allProducts.length; i += batchSize) {
        const batch = allProducts.slice(i, i + batchSize);
        await this.processProductBatch(batch, tenantId, storeId);
        syncJob.processedItems += batch.length;
      }

      logger.info(`Synced ${allProducts.length} products`);
    } catch (error) {
      logger.error('Error syncing products:', error);
      syncJob.errors.push(`Product sync failed: ${error.message}`);
    }
  }

  // Sync orders
  async syncOrders(shopDomain, accessToken, tenantId, storeId, syncJob, sinceDate = null) {
    try {
      logger.info('Syncing orders...');
      
      let allOrders = [];
      let hasNextPage = true;
      let sinceId = null;

      while (hasNextPage) {
        const options = { limit: 250, status: 'any' };
        if (sinceId) options.sinceId = sinceId;
        if (sinceDate) options.createdAtMin = sinceDate.toISOString();

        const orders = await this.shopifyService.fetchOrders(shopDomain, accessToken, options);
        
        if (orders.length === 0) {
          hasNextPage = false;
          break;
        }

        allOrders = allOrders.concat(orders);
        sinceId = orders[orders.length - 1].id;
        hasNextPage = orders.length === 250;

        // Update progress
        syncJob.totalItems += orders.length;
        syncJob.progress = Math.min(100, 50 + (allOrders.length / 1000) * 50); // Orders take 50% of progress
      }

      // Process orders in batches
      const batchSize = 50;
      for (let i = 0; i < allOrders.length; i += batchSize) {
        const batch = allOrders.slice(i, i + batchSize);
        await this.processOrderBatch(batch, tenantId, storeId);
        syncJob.processedItems += batch.length;
      }

      logger.info(`Synced ${allOrders.length} orders`);
    } catch (error) {
      logger.error('Error syncing orders:', error);
      syncJob.errors.push(`Order sync failed: ${error.message}`);
    }
  }

  // Process customer batch
  async procesCustomerBatch(customers, tenantId, storeId) {
    const customerData = customers.map(customer => 
      this.shopifyService.transformCustomerData(customer, tenantId, storeId)
    );

    await Customer.bulkCreate(customerData, {
      updateOnDuplicate: [
        'firstName', 'lastName', 'email', 'phone', 'state', 'totalSpent',
        'ordersCount', 'lastOrderId', 'lastOrderName', 'note', 'verifiedEmail',
        'taxExempt', 'tags', 'currency', 'addresses', 'defaultAddress',
        'shopifyUpdatedAt', 'updatedAt'
      ]
    });
  }

  // Process product batch
  async processProductBatch(products, tenantId, storeId) {
    const productData = products.map(product => 
      this.shopifyService.transformProductData(product, tenantId, storeId)
    );

    await Product.bulkCreate(productData, {
      updateOnDuplicate: [
        'title', 'bodyHtml', 'vendor', 'productType', 'handle', 'status',
        'publishedScope', 'tags', 'variants', 'options', 'images', 'image',
        'price', 'compareAtPrice', 'inventoryQuantity', 'inventoryPolicy',
        'inventoryManagement', 'publishedAt', 'shopifyUpdatedAt', 'updatedAt'
      ]
    });
  }

  // Process order batch
  async processOrderBatch(orders, tenantId, storeId) {
    for (const order of orders) {
      const orderData = this.shopifyService.transformOrderData(order, tenantId, storeId);
      
      // Create or update order
      await Order.upsert(orderData);

      // Process line items
      if (order.line_items) {
        const lineItemData = order.line_items.map(item => 
          this.shopifyService.transformOrderItemData(item, orderData.id)
        );

        await OrderItem.bulkCreate(lineItemData, {
          updateOnDuplicate: [
            'shopifyProductId', 'shopifyVariantId', 'title', 'name', 'variantTitle',
            'vendor', 'productType', 'sku', 'quantity', 'price', 'totalDiscount',
            'grams', 'taxable', 'requiresShipping', 'fulfillmentStatus',
            'fulfillmentService', 'properties', 'updatedAt'
          ]
        });
      }
    }
  }

  // Cancel sync
  async cancelSync(syncId, tenantId) {
    for (const [storeId, syncJob] of this.activeSyncs.entries()) {
      if (syncJob.id === syncId && syncJob.tenantId === tenantId) {
        syncJob.status = 'cancelled';
        syncJob.completedAt = new Date();
        this.activeSyncs.delete(storeId);
        return true;
      }
    }
    return false;
  }

  // Get current sync status
  async getCurrentSyncStatus(tenantId, storeId = null) {
    const activeSyncs = [];
    
    for (const [activeStoreId, syncJob] of this.activeSyncs.entries()) {
      if (syncJob.tenantId === tenantId && (!storeId || activeStoreId === storeId)) {
        activeSyncs.push({
          ...syncJob,
          storeId: activeStoreId
        });
      }
    }

    return {
      activeSyncs,
      hasActiveSyncs: activeSyncs.length > 0
    };
  }

  // Get sync history (placeholder - would typically use a database table)
  async getSyncHistory(tenantId, options = {}) {
    // This would typically fetch from a sync_logs table
    // For now, return empty array
    return {
      syncs: [],
      pagination: {
        page: options.page || 1,
        limit: options.limit || 20,
        total: 0,
        totalPages: 0
      }
    };
  }

  // Get sync logs (placeholder)
  async getSyncLogs(syncId, tenantId, options = {}) {
    // This would typically fetch detailed logs from a database
    return {
      logs: [],
      pagination: {
        page: options.page || 1,
        limit: options.limit || 50,
        total: 0,
        totalPages: 0
      }
    };
  }

  // Get sync statistics
  async getSyncStatistics(tenantId, options = {}) {
    try {
      const { storeId, period = '30d' } = options;
      const dateRange = this.getDateRange(period);
      
      const whereClause = { tenantId };
      if (storeId) whereClause.shopifyStoreId = storeId;

      const [ordersCount, customersCount, productsCount] = await Promise.all([
        Order.count({
          where: {
            ...whereClause,
            shopifyCreatedAt: {
              [Op.between]: [dateRange.start, dateRange.end]
            }
          }
        }),
        Customer.count({
          where: {
            ...whereClause,
            shopifyCreatedAt: {
              [Op.between]: [dateRange.start, dateRange.end]
            }
          }
        }),
        Product.count({ where: whereClause })
      ]);

      return {
        ordersCount,
        customersCount,
        productsCount,
        period,
        lastSyncDate: await this.getLastSyncDate(tenantId, storeId)
      };
    } catch (error) {
      logger.error('Error getting sync statistics:', error);
      throw new Error('Failed to get sync statistics');
    }
  }

  // Update sync schedule
  async updateSyncSchedule(storeId, frequency) {
    // This would integrate with a job scheduler like Bull or Agenda
    logger.info(`Sync schedule updated for store ${storeId}: ${frequency}`);
    return true;
  }

  // Retry failed sync
  async retryFailedSync(syncId, tenantId) {
    // This would typically look up the failed sync and retry it
    // For now, return null
    return null;
  }

  // Helper methods
  getDateRange(period) {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return { start, end };
  }

  async getLastSyncDate(tenantId, storeId = null) {
    const whereClause = { tenantId };
    if (storeId) whereClause.id = storeId;

    const store = await ShopifyStore.findOne({
      where: whereClause,
      order: [['lastSync', 'DESC']],
      attributes: ['lastSync']
    });

    return store?.lastSync || null;
  }
}

module.exports = { SyncService };
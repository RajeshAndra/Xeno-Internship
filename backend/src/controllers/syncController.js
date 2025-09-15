const { SyncService } = require('../services/syncService');
const { ShopifyStore } = require('../models');
const logger = require('../utils/logger');

class SyncController {
  constructor() {
    this.syncService = new SyncService();
  }

  // Get sync history
  async getSyncHistory(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { storeId, page = 1, limit = 20 } = req.query;

      const syncHistory = await this.syncService.getSyncHistory(tenantId, {
        storeId,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: syncHistory
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current sync status
  async getSyncStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { storeId } = req.query;

      const syncStatus = await this.syncService.getCurrentSyncStatus(tenantId, storeId);
      
      res.json({
        success: true,
        data: syncStatus
      });
    } catch (error) {
      next(error);
    }
  }

  // Start full sync
  async startFullSync(req, res, next) {
    try {
      const { storeId } = req.body;
      const tenantId = req.user.tenantId;

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      const store = await ShopifyStore.findOne({
        where: { 
          id: storeId,
          tenantId 
        }
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      const syncJob = await this.syncService.startFullSync(storeId);
      
      logger.info(`Full sync started by ${req.user.email} for store ${storeId}`);
      
      res.json({
        success: true,
        message: 'Full sync started successfully',
        data: { syncJob }
      });
    } catch (error) {
      next(error);
    }
  }

  // Start incremental sync
  async startIncrementalSync(req, res, next) {
    try {
      const { storeId } = req.body;
      const tenantId = req.user.tenantId;

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      const store = await ShopifyStore.findOne({
        where: { 
          id: storeId,
          tenantId 
        }
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      const syncJob = await this.syncService.startIncrementalSync(storeId);
      
      logger.info(`Incremental sync started by ${req.user.email} for store ${storeId}`);
      
      res.json({
        success: true,
        message: 'Incremental sync started successfully',
        data: { syncJob }
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel sync
  async cancelSync(req, res, next) {
    try {
      const { syncId } = req.params;
      const tenantId = req.user.tenantId;

      const result = await this.syncService.cancelSync(syncId, tenantId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Sync job not found or cannot be cancelled'
        });
      }

      logger.info(`Sync cancelled by ${req.user.email}: ${syncId}`);
      
      res.json({
        success: true,
        message: 'Sync cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get sync logs
  async getSyncLogs(req, res, next) {
    try {
      const { syncId } = req.params;
      const tenantId = req.user.tenantId;
      const { page = 1, limit = 50 } = req.query;

      const logs = await this.syncService.getSyncLogs(syncId, tenantId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }

  // Update sync settings
  async updateSyncSettings(req, res, next) {
    try {
      const { storeId } = req.params;
      const tenantId = req.user.tenantId;
      const { syncFrequency, autoSync, syncOptions } = req.body;

      const store = await ShopifyStore.findOne({
        where: { 
          id: storeId,
          tenantId 
        }
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      const updateData = {};
      if (syncFrequency) updateData.syncFrequency = syncFrequency;
      
      if (syncOptions) {
        updateData.storeSettings = {
          ...store.storeSettings,
          syncOptions
        };
      }

      await store.update(updateData);
      
      // Update sync scheduler if needed
      if (syncFrequency) {
        await this.syncService.updateSyncSchedule(storeId, syncFrequency);
      }

      logger.info(`Sync settings updated for store ${storeId}`);
      
      res.json({
        success: true,
        message: 'Sync settings updated successfully',
        data: { 
          store: { 
            ...store.toJSON(), 
            accessToken: undefined 
          } 
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get sync statistics
  async getSyncStatistics(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { storeId, period = '30d' } = req.query;

      const statistics = await this.syncService.getSyncStatistics(tenantId, {
        storeId,
        period
      });
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  // Retry failed sync
  async retrySync(req, res, next) {
    try {
      const { syncId } = req.params;
      const tenantId = req.user.tenantId;

      const syncJob = await this.syncService.retryFailedSync(syncId, tenantId);
      
      if (!syncJob) {
        return res.status(404).json({
          success: false,
          message: 'Sync job not found or cannot be retried'
        });
      }

      logger.info(`Sync retry started by ${req.user.email}: ${syncId}`);
      
      res.json({
        success: true,
        message: 'Sync retry started successfully',
        data: { syncJob }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SyncController();
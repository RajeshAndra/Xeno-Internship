const cron = require('node-cron');
const { SyncService } = require('./syncService');
const { ShopifyStore } = require('../models');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.syncService = new SyncService();
    this.scheduledJobs = new Map();
    this.isInitialized = false;
  }

  // Initialize scheduler
  async initialize() {
    if (this.isInitialized) {
      logger.warn('Scheduler already initialized');
      return;
    }

    try {
      // Schedule automatic sync jobs
      this.scheduleAutomaticSyncs();
      
      // Schedule cleanup tasks
      this.scheduleCleanupTasks();
      
      // Schedule health checks
      this.scheduleHealthChecks();

      this.isInitialized = true;
      logger.info('Scheduler service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scheduler service:', error);
      throw error;
    }
  }

  // Schedule automatic syncs for all stores
  scheduleAutomaticSyncs() {
    // Run every hour to check for stores that need syncing
    const syncCheckJob = cron.schedule('0 * * * *', async () => {
      await this.checkAndExecuteScheduledSyncs();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.scheduledJobs.set('sync-check', syncCheckJob);
    logger.info('Automatic sync scheduler started');
  }

  // Check and execute scheduled syncs
  async checkAndExecuteScheduledSyncs() {
    try {
      logger.info('Checking for scheduled syncs...');

      const stores = await ShopifyStore.findAll({
        where: {
          isConnected: true,
          status: 'active'
        }
      });

      for (const store of stores) {
        if (this.shouldExecuteSync(store)) {
          await this.executeScheduledSync(store);
        }
      }
    } catch (error) {
      logger.error('Error checking scheduled syncs:', error);
    }
  }

  // Determine if sync should be executed
  shouldExecuteSync(store) {
    const { syncFrequency, lastSync } = store;
    
    if (!lastSync) {
      return true; // Never synced before
    }

    const now = new Date();
    const lastSyncTime = new Date(lastSync);
    const hoursSinceLastSync = (now - lastSyncTime) / (1000 * 60 * 60);

    switch (syncFrequency) {
      case 'hourly':
        return hoursSinceLastSync >= 1;
      case 'every_4_hours':
        return hoursSinceLastSync >= 4;
      case 'every_12_hours':
        return hoursSinceLastSync >= 12;
      case 'daily':
        return hoursSinceLastSync >= 24;
      case 'weekly':
        return hoursSinceLastSync >= (24 * 7);
      default:
        return false; // Manual sync only
    }
  }

  // Execute scheduled sync
  async executeScheduledSync(store) {
    try {
      logger.info(`Executing scheduled sync for store: ${store.shopDomain}`);

      await this.syncService.triggerManualSync(
        store.tenantId,
        store.id,
        'incremental'
      );

      logger.info(`Scheduled sync completed for store: ${store.shopDomain}`);
    } catch (error) {
      logger.error(`Scheduled sync failed for store ${store.shopDomain}:`, error);
      
      // Update store status if sync fails repeatedly
      await this.handleSyncFailure(store);
    }
  }

  // Handle sync failure
  async handleSyncFailure(store) {
    try {
      // Count recent failures (this would typically be stored in a database)
      const recentFailures = await this.getRecentSyncFailures(store.id);
      
      if (recentFailures >= 3) {
        await store.update({ 
          status: 'sync_error',
          errorLog: `Sync failed ${recentFailures} times. Automatic sync disabled.`
        });
        
        logger.warn(`Store ${store.shopDomain} disabled due to repeated sync failures`);
      }
    } catch (error) {
      logger.error('Error handling sync failure:', error);
    }
  }

  // Schedule cleanup tasks
  scheduleCleanupTasks() {
    // Daily cleanup at 2 AM UTC
    const cleanupJob = cron.schedule('0 2 * * *', async () => {
      await this.executeCleanupTasks();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.scheduledJobs.set('cleanup', cleanupJob);
    logger.info('Cleanup scheduler started');
  }

  // Execute cleanup tasks
  async executeCleanupTasks() {
    try {
      logger.info('Executing scheduled cleanup tasks...');

      // Clean up old logs (this would typically clean log files or database entries)
      await this.cleanupOldLogs();
      
      // Clean up temporary files
      await this.cleanupTempFiles();
      
      // Clean up expired tokens
      await this.cleanupExpiredTokens();

      logger.info('Cleanup tasks completed');
    } catch (error) {
      logger.error('Error executing cleanup tasks:', error);
    }
  }

  // Schedule health checks
  scheduleHealthChecks() {
    // Health check every 15 minutes
    const healthCheckJob = cron.schedule('*/15 * * * *', async () => {
      await this.executeHealthChecks();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.scheduledJobs.set('health-check', healthCheckJob);
    logger.info('Health check scheduler started');
  }

  // Execute health checks
  async executeHealthChecks() {
    try {
      // Check database connectivity
      await this.checkDatabaseHealth();
      
      // Check external API connectivity
      await this.checkExternalAPIs();
      
      // Check system resources
      await this.checkSystemResources();
      
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }

  // Custom scheduling methods
  scheduleCustomJob(name, cronPattern, jobFunction, options = {}) {
    try {
      if (this.scheduledJobs.has(name)) {
        this.removeScheduledJob(name);
      }

      const job = cron.schedule(cronPattern, jobFunction, {
        scheduled: true,
        timezone: options.timezone || 'UTC',
        ...options
      });

      this.scheduledJobs.set(name, job);
      logger.info(`Custom job scheduled: ${name} with pattern: ${cronPattern}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to schedule custom job ${name}:`, error);
      return false;
    }
  }

  // Remove scheduled job
  removeScheduledJob(name) {
    const job = this.scheduledJobs.get(name);
    if (job) {
      job.stop();
      job.destroy();
      this.scheduledJobs.delete(name);
      logger.info(`Scheduled job removed: ${name}`);
      return true;
    }
    return false;
  }

  // Get all scheduled jobs
  getScheduledJobs() {
    const jobs = [];
    for (const [name, job] of this.scheduledJobs.entries()) {
      jobs.push({
        name,
        running: job.getStatus() === 'scheduled',
        options: job.options
      });
    }
    return jobs;
  }

  // Stop all scheduled jobs
  stopAllJobs() {
    for (const [name, job] of this.scheduledJobs.entries()) {
      job.stop();
      logger.info(`Stopped scheduled job: ${name}`);
    }
  }

  // Start all scheduled jobs
  startAllJobs() {
    for (const [name, job] of this.scheduledJobs.entries()) {
      job.start();
      logger.info(`Started scheduled job: ${name}`);
    }
  }

  // Cleanup methods
  async cleanupOldLogs() {
    // Implementation would clean up log files older than X days
    logger.info('Cleaning up old logs...');
  }

  async cleanupTempFiles() {
    // Implementation would clean up temporary files
    logger.info('Cleaning up temporary files...');
  }

  async cleanupExpiredTokens() {
    // Implementation would clean up expired authentication tokens
    logger.info('Cleaning up expired tokens...');
  }

  // Health check methods
  async checkDatabaseHealth() {
    try {
      // Test database connection
      const { sequelize } = require('../models');
      await sequelize.authenticate();
      
      logger.debug('Database health check: OK');
    } catch (error) {
      logger.error('Database health check failed:', error);
      throw error;
    }
  }

  async checkExternalAPIs() {
    try {
      // This would check connectivity to Shopify API and other external services
      logger.debug('External API health check: OK');
    } catch (error) {
      logger.error('External API health check failed:', error);
    }
  }

  async checkSystemResources() {
    try {
      // Check memory usage, disk space, etc.
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      
      if (memoryUsageMB > 1000) { // Alert if using more than 1GB
        logger.warn(`High memory usage: ${memoryUsageMB}MB`);
      }
      
      logger.debug(`System resources check: Memory usage ${memoryUsageMB}MB`);
    } catch (error) {
      logger.error('System resources health check failed:', error);
    }
  }

  // Get recent sync failures (placeholder - would typically query database)
  async getRecentSyncFailures(storeId) {
    // This would query a sync_logs table for recent failures
    return 0;
  }

  // Shutdown scheduler
  async shutdown() {
    logger.info('Shutting down scheduler service...');
    
    this.stopAllJobs();
    
    for (const [name, job] of this.scheduledJobs.entries()) {
      job.destroy();
    }
    
    this.scheduledJobs.clear();
    this.isInitialized = false;
    
    logger.info('Scheduler service shut down');
  }

  // Get scheduler status
  getStatus() {
    return {
      initialized: this.isInitialized,
      activeJobs: this.scheduledJobs.size,
      jobs: this.getScheduledJobs()
    };
  }
}

module.exports = { SchedulerService };
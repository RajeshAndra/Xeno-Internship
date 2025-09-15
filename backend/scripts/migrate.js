#!/usr/bin/env node

/**
 * Production Database Migration Script
 * Handles database initialization and schema migrations for production deployment
 */

require('dotenv').config();
const { sequelize, Tenant } = require('../src/models');
const logger = require('../src/utils/logger');

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      logger.info('Running production database sync...');
      await sequelize.sync({ alter: true });
    } else {
      logger.info('Running development database sync...');
      await sequelize.sync({ force: false, alter: false });
    }

    logger.info('Database migrations completed successfully.');

    // Ensure at least one tenant exists
    const tenantCount = await Tenant.count();
    if (tenantCount === 0) {
      logger.info('Creating default tenant...');
      await Tenant.create({
        name: 'Default Tenant',
        slug: 'default',
        email: 'default@example.com',
        status: 'active',
        subscription_plan: 'free'
      });
      logger.info('Default tenant created successfully.');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
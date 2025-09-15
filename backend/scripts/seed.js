#!/usr/bin/env node

/**
 * Database Seeding Script
 * Populates database with sample data for development and testing
 */

require('dotenv').config();
const { sequelize, Tenant, User, ShopifyStore, Product, Customer } = require('../src/models');
const logger = require('../src/utils/logger');

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    if (process.env.NODE_ENV === 'production') {
      logger.warn('Skipping seeding in production environment');
      return;
    }

    // Ensure DB is connected
    await sequelize.authenticate();

    // Create sample tenant
    const [tenant] = await Tenant.findOrCreate({
      where: { slug: 'demo' },
      defaults: {
        name: 'Demo Tenant',
        slug: 'demo',
        email: 'demo@example.com',
        status: 'active',
        subscription_plan: 'free'
      }
    });

    // Create sample user
    const [user] = await User.findOrCreate({
      where: { email: 'demo@example.com' },
      defaults: {
        email: 'demo@example.com',
        password: 'password123',
        first_name: 'Demo',
        last_name: 'User',
        role: 'owner',
        status: 'active',
        tenant_id: tenant.id
      }
    });

    // Create sample Shopify store
    const [store] = await ShopifyStore.findOrCreate({
      where: { shop_domain: 'https://demo-store.myshopify.com' },
      defaults: {
        shop_domain: 'https://demo-store.myshopify.com',
        store_name: 'Demo Store',
        is_connected: true,
        status: 'connected',
        tenant_id: tenant.id,
        store_settings: { syncEnabled: true }
      }
    });

    // Sample products
    const sampleProducts = [
      {
        shopify_product_id: 1001,
        title: 'Premium Wireless Headphones',
        handle: 'premium-wireless-headphones',
        status: 'active',
        price: 199.99,
        inventory_quantity: 50,
        shopify_store_id: store.id,
        tenant_id: tenant.id
      },
      {
        shopify_product_id: 1002,
        title: 'Smart Fitness Tracker',
        handle: 'smart-fitness-tracker',
        status: 'active',
        price: 129.99,
        inventory_quantity: 75,
        shopify_store_id: store.id,
        tenant_id: tenant.id
      },
      {
        shopify_product_id: 1003,
        title: 'Eco-Friendly Water Bottle',
        handle: 'eco-friendly-water-bottle',
        status: 'active',
        price: 24.99,
        inventory_quantity: 200,
        shopify_store_id: store.id,
        tenant_id: tenant.id
      }
    ];

    for (const productData of sampleProducts) {
      await Product.findOrCreate({
        where: { shopify_product_id: productData.shopify_product_id, shopify_store_id: store.id },
        defaults: productData
      });
    }

    // Sample customers
    const sampleCustomers = [
      {
        shopify_customer_id: 2001,
        email: 'customer1@example.com',
        first_name: 'John',
        last_name: 'Smith',
        total_spent: 299.98,
        shopify_store_id: store.id,
        tenant_id: tenant.id
      },
      {
        shopify_customer_id: 2002,
        email: 'customer2@example.com',
        first_name: 'Jane',
        last_name: 'Johnson',
        total_spent: 154.99,
        shopify_store_id: store.id,
        tenant_id: tenant.id
      }
    ];

    for (const customerData of sampleCustomers) {
      await Customer.findOrCreate({
        where: { shopify_customer_id: customerData.shopify_customer_id, shopify_store_id: store.id },
        defaults: customerData
      });
    }

    logger.info('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
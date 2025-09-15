/**
 * Sequelize Models Index
 * Initializes all models and their associations
 */

const { sequelize, testConnection } = require('../config/database');

// Import models
const Tenant = require('./tenant');
const User = require('./user');
const ShopifyStore = require('./shopifyStore');
const Customer = require('./customer');
const Product = require('./product');
const Order = require('./order');
const OrderItem = require('./orderItem');

// Initialize models
const models = {
  Tenant: Tenant(sequelize),
  User: User(sequelize),
  ShopifyStore: ShopifyStore(sequelize),
  Customer: Customer(sequelize),
  Product: Product(sequelize),
  Order: Order(sequelize),
  OrderItem: OrderItem(sequelize)
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Sync database
const syncDatabase = async (force = false) => {
  try {
    // Use simple sync without alter to avoid infinite loops
    await sequelize.sync({ force: false, alter: false });
    console.log('Database models synchronized.');
    return true;
  } catch (error) {
    console.error('Database sync failed:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  ...models
};

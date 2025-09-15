/**
 * ShopifyStore Model
 * Shopify store connection and configuration
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ShopifyStore = sequelize.define('ShopifyStore', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id'
      }
    },
    shop_domain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isUrl: true
      }
    },
    shopify_store_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true
    },
    store_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    scope: {
      type: DataTypes.STRING,
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('connected', 'disconnected', 'error', 'pending'),
      defaultValue: 'pending'
    },
    is_connected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_sync: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sync_frequency: {
      type: DataTypes.ENUM('hourly', 'daily', 'weekly'),
      defaultValue: 'daily'
    },
    webhook_endpoints: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    store_settings: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    error_log: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'shopify_stores',
    indexes: [
      { fields: ['shop_domain'] },
      { fields: ['tenant_id'] },
      { fields: ['status'] },
      { fields: ['is_connected'] }
    ]
  });

  ShopifyStore.associate = (models) => {
    ShopifyStore.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant'
    });
    ShopifyStore.hasMany(models.Customer, {
      foreignKey: 'shopify_store_id',
      as: 'customers'
    });
    ShopifyStore.hasMany(models.Product, {
      foreignKey: 'shopify_store_id',
      as: 'products'
    });
    ShopifyStore.hasMany(models.Order, {
      foreignKey: 'shopify_store_id',
      as: 'orders'
    });
  };

  return ShopifyStore;
};

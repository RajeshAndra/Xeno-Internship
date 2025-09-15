/**
 * Tenant Model
 * Multi-tenant architecture base model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isAlphanumeric: true,
        len: [2, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'inactive'),
      defaultValue: 'active'
    },
    subscription_plan: {
      type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
      defaultValue: 'free'
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    billing_info: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'tenants',
    indexes: [
      { fields: ['email'] },
      { fields: ['slug'] },
      { fields: ['status'] }
    ]
  });

  Tenant.associate = (models) => {
    Tenant.hasMany(models.User, { 
      foreignKey: 'tenant_id',
      as: 'users'
    });
    Tenant.hasMany(models.ShopifyStore, {
      foreignKey: 'tenant_id',
      as: 'shopifyStores'
    });
    Tenant.hasMany(models.Customer, {
      foreignKey: 'tenant_id',
      as: 'customers'
    });
    Tenant.hasMany(models.Product, {
      foreignKey: 'tenant_id',
      as: 'products'
    });
    Tenant.hasMany(models.Order, {
      foreignKey: 'tenant_id',
      as: 'orders'
    });
  };

  return Tenant;
};

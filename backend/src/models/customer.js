/**
 * Customer Model
 * Shopify customer data
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
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
    shopify_customer_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    shopify_store_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'shopify_stores',
        key: 'id'
      }
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.ENUM('disabled', 'invited', 'enabled', 'declined'),
      defaultValue: 'enabled'
    },
    total_spent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    orders_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_order_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    last_order_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    verified_email: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    multipass_identifier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tax_exempt: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    addresses: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    default_address: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    marketing_opt_in_level: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email_marketing_consent: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    sms_marketing_consent: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    shopify_created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shopify_updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'customers',
    indexes: [
      { 
        fields: ['tenant_id', 'shopify_customer_id'], 
        unique: true 
      },
      { fields: ['tenant_id'] },
      { fields: ['email'] },
      { fields: ['state'] },
      { fields: ['total_spent'] },
      { fields: ['orders_count'] },
      { fields: ['shopify_created_at'] }
    ]
  });

  Customer.associate = (models) => {
    Customer.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant'
    });
    Customer.belongsTo(models.ShopifyStore, {
      foreignKey: 'shopify_store_id',
      as: 'shopifyStore'
    });
    Customer.hasMany(models.Order, {
      foreignKey: 'customer_id',
      as: 'orders'
    });
  };

  return Customer;
};

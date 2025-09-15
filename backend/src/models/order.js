/**
 * Order Model
 * Shopify order data
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
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
    shopify_order_id: {
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
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    order_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    financial_status: {
      type: DataTypes.ENUM(
        'pending', 'authorized', 'partially_paid', 'paid', 
        'partially_refunded', 'refunded', 'voided'
      ),
      allowNull: true
    },
    fulfillment_status: {
      type: DataTypes.ENUM(
        'fulfilled', 'null', 'partial', 'restocked'
      ),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    subtotal_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    total_weight: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    taxes_included: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    total_discounts: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    total_line_items_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    total_tip_received: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    test: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    order_status_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gateway: {
      type: DataTypes.STRING,
      allowNull: true
    },
    checkout_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    checkout_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cart_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    source_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    landing_site: {
      type: DataTypes.STRING,
      allowNull: true
    },
    referring_site: {
      type: DataTypes.STRING,
      allowNull: true
    },
    source_identifier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    source_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    device_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    location_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    note_attributes: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    discount_codes: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    discount_applications: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    payment_details: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    shipping_address: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    billing_address: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    shipping_lines: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    tax_lines: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancel_reason: {
      type: DataTypes.STRING,
      allowNull: true
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
    tableName: 'orders',
    indexes: [
      { 
        fields: ['tenant_id', 'shopify_order_id'], 
        unique: true 
      },
      { fields: ['tenant_id'] },
      { fields: ['customer_id'] },
      { fields: ['financial_status'] },
      { fields: ['fulfillment_status'] },
      { fields: ['total_price'] },
      { fields: ['shopify_created_at'] },
      { fields: ['processed_at'] },
      { fields: ['test'] }
    ]
  });

  Order.associate = (models) => {
    Order.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant'
    });
    Order.belongsTo(models.ShopifyStore, {
      foreignKey: 'shopify_store_id',
      as: 'shopifyStore'
    });
    Order.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer'
    });
    Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      as: 'orderItems'
    });
  };

  return Order;
};

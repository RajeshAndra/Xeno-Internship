/**
 * OrderItem Model
 * Shopify order line items
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    shopify_line_item_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    shopify_product_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    shopify_variant_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    variant_title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    product_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true
    },
    variant_inventory_management: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fulfillment_status: {
      type: DataTypes.ENUM('fulfilled', 'null', 'partial', 'not_eligible'),
      allowNull: true
    },
    fulfillment_service: {
      type: DataTypes.STRING,
      defaultValue: 'manual'
    },
    requires_shipping: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    taxable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    gift_card: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    compare_at_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    total_discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    grams: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    admin_graphql_api_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    variant_option1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    variant_option2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    variant_option3: {
      type: DataTypes.STRING,
      allowNull: true
    },
    properties: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    product_exists: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    applied_discounts: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    discount_allocations: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    tax_lines: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    origin_location: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    destination_location: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    duties: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    tableName: 'order_items',
    indexes: [
      { fields: ['order_id'] },
      { fields: ['product_id'] },
      { fields: ['shopify_product_id'] },
      { fields: ['shopify_variant_id'] },
      { fields: ['sku'] },
      { fields: ['fulfillment_status'] }
    ]
  });

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order'
    });
    OrderItem.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return OrderItem;
};

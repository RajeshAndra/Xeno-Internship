/**
 * Product Model
 * Shopify product data
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
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
    shopify_product_id: {
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
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    body_html: {
      type: DataTypes.TEXT,
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
    handle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'draft'),
      defaultValue: 'active'
    },
    published_scope: {
      type: DataTypes.STRING,
      defaultValue: 'web'
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    admin_graphql_api_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    variants: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    options: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    image: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    seo_title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    seo_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Calculated fields for analytics
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    compare_at_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    inventory_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    inventory_policy: {
      type: DataTypes.STRING,
      defaultValue: 'deny'
    },
    inventory_management: {
      type: DataTypes.STRING,
      allowNull: true
    },
    published_at: {
      type: DataTypes.DATE,
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
    tableName: 'products',
    indexes: [
      { 
        fields: ['tenant_id', 'shopify_product_id'], 
        unique: true 
      },
      { fields: ['tenant_id'] },
      { fields: ['status'] },
      { fields: ['vendor'] },
      { fields: ['product_type'] },
      { fields: ['price'] },
      { fields: ['inventory_quantity'] },
      { fields: ['shopify_created_at'] }
    ]
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant'
    });
    Product.belongsTo(models.ShopifyStore, {
      foreignKey: 'shopify_store_id',
      as: 'shopifyStore'
    });
    Product.hasMany(models.OrderItem, {
      foreignKey: 'product_id',
      as: 'orderItems'
    });
  };

  return Product;
};

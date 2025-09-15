const Shopify = require('shopify-api-node');
const { ShopifyStore, Customer, Product, Order, OrderItem } = require('../models');
const logger = require('../utils/logger');

class ShopifyService {
  constructor() {}

  createClient(shopDomain, accessToken) {
    return new Shopify({
      shopName: shopDomain.replace('https://', '').replace('http://', '').replace('.myshopify.com', ''),
      accessToken,
      apiVersion: '2023-10'
    });
  }

  async verifyConnection(shopDomain, accessToken) {
    try {
      const client = this.createClient(shopDomain, accessToken);
      const shop = await client.shop.get();
      return shop;
    } catch (error) {
      logger.error('Shopify connection verification failed:', error.message);
      throw new Error('Invalid shop domain or access token');
    }
  }

  async testConnection(shopDomain, accessToken) {
    try {
      const client = this.createClient(shopDomain, accessToken);
      const shop = await client.shop.get();
      const [ordersCount, productsCount, customersCount] = await Promise.all([
        client.order.count(),
        client.product.count(),
        client.customer.count()
      ]);
      return {
        status: 'connected',
        shop,
        dataAvailable: { orders: ordersCount, products: productsCount, customers: customersCount },
        lastTested: new Date()
      };
    } catch (error) {
      logger.error('Shopify connection test failed:', error.message);
      return { status: 'failed', error: error.message, lastTested: new Date() };
    }
  }

  async getWebhooks(shopDomain, accessToken) {
    const client = this.createClient(shopDomain, accessToken);
    return client.webhook.list();
  }

  async setupWebhooks(shopDomain, accessToken, storeId) {
    const client = this.createClient(shopDomain, accessToken);
    const topics = [
      'orders/create','orders/updated','orders/delete',
      'customers/create','customers/update','customers/delete',
      'products/create','products/update','products/delete'
    ];
    const base = `${process.env.WEBHOOK_BASE_URL}/api/shopify/webhook/${storeId}`;
    const created = [];
    for (const topic of topics) {
      try {
        const webhook = await client.webhook.create({
          topic,
          address: `${base}/${topic.replace('/', '-')}`,
          format: 'json'
        });
        created.push(webhook);
      } catch (e) {
        logger.error(`Webhook create failed for ${topic}:`, e.message);
      }
    }
    return created;
  }

  async processWebhook(storeId, topic, data) {
    try {
      logger.info(`Processing webhook: ${topic} for store ${storeId}`);
      if (topic.startsWith('orders/')) {
        await this.processOrderWebhook(storeId, data, topic === 'orders/create');
      } else if (topic.startsWith('customers/')) {
        await this.processCustomerWebhook(storeId, data, topic === 'customers/create');
      } else if (topic.startsWith('products/')) {
        await this.processProductWebhook(storeId, data, topic === 'products/create');
      }
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      throw error;
    }
  }

  async fetchOrders(shopDomain, accessToken, options = {}) {
    const client = this.createClient(shopDomain, accessToken);
    const params = { limit: options.limit || 250, status: options.status || 'any' };
    if (options.sinceId) params.since_id = options.sinceId;
    if (options.createdAtMin) params.created_at_min = options.createdAtMin;
    return client.order.list(params);
  }

  async fetchProducts(shopDomain, accessToken, options = {}) {
    const client = this.createClient(shopDomain, accessToken);
    const params = { limit: options.limit || 250, published_status: options.publishedStatus || 'published' };
    if (options.sinceId) params.since_id = options.sinceId;
    return client.product.list(params);
  }

  async fetchCustomers(shopDomain, accessToken, options = {}) {
    const client = this.createClient(shopDomain, accessToken);
    const params = { limit: options.limit || 250 };
    if (options.sinceId) params.since_id = options.sinceId;
    if (options.createdAtMin) params.created_at_min = options.createdAtMin;
    return client.customer.list(params);
  }

  // Transformations and delete methods remain the same as previously refactored
  transformOrderData(orderData, tenantId, storeId) {
    return {
      id: require('uuid').v4(),
      tenant_id: tenantId,
      shopify_order_id: orderData.id,
      shopify_store_id: storeId,
      order_number: orderData.order_number,
      name: orderData.name,
      email: orderData.email,
      phone: orderData.phone,
      financial_status: orderData.financial_status,
      fulfillment_status: orderData.fulfillment_status,
      currency: orderData.currency,
      total_price: parseFloat(orderData.total_price || 0),
      subtotal_price: parseFloat(orderData.subtotal_price || 0),
      total_weight: orderData.total_weight,
      total_tax: parseFloat(orderData.total_tax || 0),
      taxes_included: orderData.taxes_included,
      total_discounts: parseFloat(orderData.total_discounts || 0),
      confirmed: orderData.confirmed,
      test: orderData.test,
      gateway: orderData.gateway,
      source_name: orderData.source_name,
      landing_site: orderData.landing_site,
      referring_site: orderData.referring_site,
      note: orderData.note,
      tags: orderData.tags,
      processed_at: orderData.processed_at,
      shopify_created_at: orderData.created_at,
      shopify_updated_at: orderData.updated_at
    };
  }

  transformCustomerData(customerData, tenantId, storeId) {
    return {
      id: require('uuid').v4(),
      tenant_id: tenantId,
      shopify_customer_id: customerData.id,
      shopify_store_id: storeId,
      first_name: customerData.first_name,
      last_name: customerData.last_name,
      email: customerData.email,
      phone: customerData.phone,
      state: customerData.state,
      total_spent: parseFloat(customerData.total_spent || 0),
      orders_count: customerData.orders_count || 0,
      last_order_id: customerData.last_order_id,
      last_order_name: customerData.last_order_name,
      note: customerData.note,
      verified_email: customerData.verified_email,
      tax_exempt: customerData.tax_exempt,
      tags: customerData.tags,
      currency: customerData.currency,
      addresses: customerData.addresses || [],
      default_address: customerData.default_address || {},
      shopify_created_at: customerData.created_at,
      shopify_updated_at: customerData.updated_at
    };
  }

  transformProductData(productData, tenantId, storeId) {
    const mainVariant = productData.variants?.[0] || {};
    
    return {
      id: require('uuid').v4(),
      tenant_id: tenantId,
      shopify_product_id: productData.id,
      shopify_store_id: storeId,
      title: productData.title,
      body_html: productData.body_html,
      vendor: productData.vendor,
      product_type: productData.product_type,
      handle: productData.handle,
      status: productData.status,
      published_scope: productData.published_scope,
      tags: productData.tags,
      variants: productData.variants || [],
      options: productData.options || [],
      images: productData.images || [],
      image: productData.image || {},
      price: parseFloat(mainVariant.price || 0),
      compare_at_price: parseFloat(mainVariant.compare_at_price || 0),
      inventory_quantity: mainVariant.inventory_quantity || 0,
      inventory_policy: mainVariant.inventory_policy,
      inventory_management: mainVariant.inventory_management,
      published_at: productData.published_at,
      shopify_created_at: productData.created_at,
      shopify_updated_at: productData.updated_at
    };
  }

  transformOrderItemData(lineItemData, orderId) {
    return {
      id: require('uuid').v4(),
      order_id: orderId,
      shopify_line_item_id: lineItemData.id,
      shopify_product_id: lineItemData.product_id,
      shopify_variant_id: lineItemData.variant_id,
      title: lineItemData.title,
      name: lineItemData.name,
      variant_title: lineItemData.variant_title,
      vendor: lineItemData.vendor,
      product_type: lineItemData.product_type,
      sku: lineItemData.sku,
      quantity: lineItemData.quantity,
      price: parseFloat(lineItemData.price || 0),
      total_discount: parseFloat(lineItemData.total_discount || 0),
      grams: lineItemData.grams,
      taxable: lineItemData.taxable,
      requires_shipping: lineItemData.requires_shipping,
      fulfillment_status: lineItemData.fulfillment_status,
      fulfillment_service: lineItemData.fulfillment_service,
      properties: lineItemData.properties || []
    };
  }

  async deleteOrder(storeId, shopifyOrderId) {
    await Order.destroy({ where: { shopify_order_id: shopifyOrderId, shopify_store_id: storeId } });
  }
  async deleteCustomer(storeId, shopifyCustomerId) {
    await Customer.destroy({ where: { shopify_customer_id: shopifyCustomerId, shopify_store_id: storeId } });
  }
  async deleteProduct(storeId, shopifyProductId) {
    await Product.destroy({ where: { shopify_product_id: shopifyProductId, shopify_store_id: storeId } });
  }
}

module.exports = { ShopifyService };
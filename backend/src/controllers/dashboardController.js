const { Op, Sequelize } = require('sequelize');
const { AnalyticsService } = require('../services/analyticsService');
const { SyncService } = require('../services/syncService');
const { Order, Customer, Product, ShopifyStore } = require('../models');
const logger = require('../utils/logger');

const USE_SYNTHETIC = String(process.env.USE_SYNTHETIC_DATA || '').toLowerCase() === 'true';

class DashboardController {
  constructor() {
    this.analyticsService = new AnalyticsService();
    this.syncService = new SyncService();
  }

  // Get dashboard overview data
  async getDashboardOverview(req, res, next) {
    try {
      if (USE_SYNTHETIC) {
        const data = this.buildSyntheticOverview();
        return res.json({ success: true, data });
      }

      const tenantId = req.tenantId;
      const { period = '30d' } = req.query;

      const overview = await this.analyticsService.getDashboardOverview(tenantId, period);
      
      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      next(error);
    }
  }

  // Get dashboard metrics (real or synthetic)
  async getDashboardMetrics(req, res, next) {
    try {
      if (USE_SYNTHETIC) {
        const days = parseInt(req.query.days || '30', 10);
        const payload = this.buildSyntheticMetrics(days);
        return res.json({ success: true, data: payload });
      }

      const tenantId = req.tenantId;
      const days = parseInt(req.query.days || '30', 10);
      const period = days <= 7 ? '7d' : days <= 30 ? '30d' : days <= 90 ? '90d' : '1y';

      const [overview, revenueAnalytics, customerAnalytics] = await Promise.all([
        this.analyticsService.getDashboardOverview(tenantId, period),
        this.analyticsService.getRevenueAnalytics(tenantId, { period, groupBy: 'day' }),
        this.analyticsService.getCustomerAnalytics(tenantId, period)
      ]);

      const totalRevenue = overview.metrics.totalRevenue || 0;
      const totalOrders = overview.metrics.totalOrders || 0;
      const totalCustomers = overview.metrics.totalCustomers || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const revenueData = (revenueAnalytics.timeSeries || []).map(p => ({
        date: p.date,
        revenue: Number(p.revenue) || 0,
        orders: Number(p.orderCount) || 0
      }));

      const customerTrend = customerAnalytics.customerGrowth || [];
      const customerData = customerTrend.map(p => ({
        date: p.date || p.Date || p.day || '',
        newCustomers: Number(p.newCustomers) || 0,
        returningCustomers: 0,
        totalCustomers: Number(p.newCustomers) || 0
      }));

      const topProducts = (revenueAnalytics.topProducts || []).map(tp => ({
        name: tp.title || 'Unknown',
        revenue: Number(tp.totalRevenue) || 0,
        quantity: Number(tp.totalQuantity) || 0
      }));

      const recentOrdersRaw = await Order.findAll({
        where: { tenant_id: req.tenantId },
        include: [{ model: Customer, as: 'customer', attributes: ['first_name', 'last_name'] }],
        order: [Sequelize.literal('`Order`.`shopify_created_at` DESC')],
        limit: 5
      });

      const recentOrders = recentOrdersRaw.map(o => ({
        id: o.id,
        customerName: o.customer ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim() : (o.name || 'Unknown'),
        total: Number(o.total_price) || 0,
        status: o.financial_status || 'unknown',
        date: o.shopify_created_at || o.createdAt
      }));

      const payload = {
        currency: 'INR',
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        revenueGrowth: {
          value: 0,
          percentage: overview.metrics.revenueGrowth || 0,
          isPositive: (overview.metrics.revenueGrowth || 0) >= 0
        },
        ordersGrowth: {
          value: 0,
          percentage: overview.metrics.orderGrowth || 0,
          isPositive: (overview.metrics.orderGrowth || 0) >= 0
        },
        customersGrowth: {
          value: 0,
          percentage: 0,
          isPositive: true
        },
        aovGrowth: {
          value: 0,
          percentage: 0,
          isPositive: true
        },
        revenueData,
        customerData,
        topProducts,
        recentOrders
      };
      
      res.json({ success: true, data: payload });
    } catch (error) {
      next(error);
    }
  }

  // Get revenue analytics
  async getRevenueAnalytics(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { period = '30d', groupBy = 'day' } = req.query;

      const revenueData = await this.analyticsService.getRevenueAnalytics(tenantId, {
        period,
        groupBy
      });
      
      res.json({
        success: true,
        data: revenueData
      });
    } catch (error) {
      next(error);
    }
  }

  // Get customer analytics
  async getCustomerAnalytics(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { period = '30d' } = req.query;

      const customerData = await this.analyticsService.getCustomerAnalytics(tenantId, period);
      
      res.json({
        success: true,
        data: customerData
      });
    } catch (error) {
      next(error);
    }
  }

  // Get product analytics
  async getProductAnalytics(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { period = '30d', limit = 10 } = req.query;

      const productData = await this.analyticsService.getProductAnalytics(tenantId, {
        period,
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: productData
      });
    } catch (error) {
      next(error);
    }
  }

  // Get orders with pagination
  async getOrders(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { 
        page = 1, 
        limit = 20, 
        status, 
        search,
        sortBy = 'shopify_created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = { tenant_id: tenantId };

      if (status) {
        whereClause.financial_status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Customer,
            attributes: ['first_name', 'last_name', 'email']
          }
        ],
        order: [[sortBy, String(sortOrder).toUpperCase()]],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get customers with pagination
  async getCustomers(req, res, next) {
    try {
      if (USE_SYNTHETIC) {
        const page = parseInt(String(req.query.page || '1'), 10);
        const limit = parseInt(String(req.query.limit || '20'), 10);
        const all = [
          { id: 'CUS-1001', first_name: 'Aarav', last_name: 'Sharma', email: 'aarav.sharma@example.in', phone: '+91 98765 43210', orders_count: 12, total_spent: 84500.75, state: 'enabled', city: 'Mumbai', joined_at: '2024-03-15' },
          { id: 'CUS-1002', first_name: 'Isha', last_name: 'Patel', email: 'isha.patel@example.in', phone: '+91 99887 66554', orders_count: 8, total_spent: 51200.00, state: 'enabled', city: 'Ahmedabad', joined_at: '2024-05-22' },
          { id: 'CUS-1003', first_name: 'Kabir', last_name: 'Singh', email: 'kabir.singh@example.in', phone: '+91 91234 56780', orders_count: 5, total_spent: 23550.25, state: 'enabled', city: 'Delhi', joined_at: '2024-07-09' },
          { id: 'CUS-1004', first_name: 'Riya', last_name: 'Verma', email: 'riya.verma@example.in', phone: '+91 90012 34567', orders_count: 9, total_spent: 62999.00, state: 'enabled', city: 'Bengaluru', joined_at: '2024-09-10' },
          { id: 'CUS-1005', first_name: 'Devansh', last_name: 'Rao', email: 'devansh.rao@example.in', phone: '+91 98989 12345', orders_count: 3, total_spent: 9800.00, state: 'enabled', city: 'Hyderabad', joined_at: '2025-01-04' }
        ];
        const start = (page - 1) * limit;
        const items = all.slice(start, start + limit);
        return res.json({
          success: true,
          data: {
            customers: items,
            pagination: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) }
          }
        });
      }

      const tenantId = req.tenantId;
      const { 
        page = 1, 
        limit = 20, 
        search,
        sortBy = 'shopify_created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = { tenant_id: tenantId };

      if (search) {
        whereClause[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: customers } = await Customer.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['deletedAt'] },
        order: [[sortBy, String(sortOrder).toUpperCase()]],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get products with pagination
  async getProducts(req, res, next) {
    try {
      if (USE_SYNTHETIC) {
        const page = parseInt(String(req.query.page || '1'), 10);
        const limit = parseInt(String(req.query.limit || '20'), 10);
        const all = [
          { id: 'PRD-2001', title: 'Classic Cotton Kurta', vendor: 'IndiWear', product_type: 'Apparel', price: 1499.00, inventory_quantity: 120, status: 'active' },
          { id: 'PRD-2002', title: 'Handloom Saree', vendor: 'VastraCraft', product_type: 'Apparel', price: 3499.00, inventory_quantity: 45, status: 'active' },
          { id: 'PRD-2003', title: 'Leather Jutti', vendor: 'DesiFoot', product_type: 'Footwear', price: 1999.00, inventory_quantity: 80, status: 'active' },
          { id: 'PRD-2004', title: 'Ayurvedic Skincare Kit', vendor: 'HerbalGlow', product_type: 'Beauty', price: 1299.00, inventory_quantity: 200, status: 'active' },
          { id: 'PRD-2005', title: 'Masala Tea Pack', vendor: 'ChaiCo', product_type: 'Grocery', price: 299.00, inventory_quantity: 350, status: 'active' }
        ];
        const start = (page - 1) * limit;
        const items = all.slice(start, start + limit);
        return res.json({
          success: true,
          data: {
            products: items,
            pagination: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) }
          }
        });
      }

      const tenantId = req.tenantId;
      const { 
        page = 1, 
        limit = 20, 
        search,
        status = 'active',
        sortBy = 'shopify_created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = { tenant_id: tenantId };

      if (status !== 'all') {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { vendor: { [Op.like]: `%${search}%` } },
          { product_type: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['deletedAt', 'body_html'] },
        order: [[sortBy, String(sortOrder).toUpperCase()]],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get sync status
  async getSyncStatus(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      const stores = await ShopifyStore.findAll({
        where: { tenant_id: tenantId },
        attributes: ['id', 'store_name', 'shop_domain', 'is_connected', 'last_sync', 'status']
      });

      const syncStatus = await this.syncService.getSyncStatus(tenantId);
      
      res.json({
        success: true,
        data: {
          stores,
          syncStatus
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Trigger manual sync
  async triggerSync(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { storeId, syncType = 'full' } = req.body;

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      const syncJob = await this.syncService.triggerManualSync(tenantId, storeId, syncType);
      
      logger.info(`Manual sync triggered by ${req.user.email} for store ${storeId}`);
      
      res.json({
        success: true,
        message: 'Sync triggered successfully',
        data: { syncJob }
      });
    } catch (error) {
      next(error);
    }
  }

  buildSyntheticOverview() {
    return {
      metrics: {
        totalRevenue: 12894500,
        totalOrders: 742,
        totalCustomers: 3120,
        totalProducts: 184,
        revenueGrowth: 6.4,
        orderGrowth: 4.9
      },
      period: '30d',
      lastUpdated: new Date()
    };
  }

  buildSyntheticMetrics(days) {
    const rng = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
    const today = new Date();
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      series.push({
        date: d.toISOString().slice(0, 10),
        revenue: rng(50000, 250000),
        orders: Math.floor(rng(10, 60))
      });
    }

    const customerSeries = series.map(s => ({
      date: s.date,
      newCustomers: Math.floor(rng(5, 35)),
      returningCustomers: Math.floor(rng(3, 22)),
      totalCustomers: 0
    }));
    customerSeries.forEach((c, idx) => {
      c.totalCustomers = customerSeries.slice(0, idx + 1).reduce((acc, v) => acc + v.newCustomers, 0);
    });

    const topProducts = [
      { name: 'Classic Cotton Kurta', revenue: 1250000, quantity: 420 },
      { name: 'Handloom Saree', revenue: 980000, quantity: 310 },
      { name: 'Leather Jutti', revenue: 750000, quantity: 265 },
      { name: 'Ayurvedic Skincare Kit', revenue: 510000, quantity: 180 },
      { name: 'Masala Tea Pack', revenue: 365000, quantity: 240 }
    ];

    const recentOrders = [
      { id: 'ORD-12091', customerName: 'Aarav Sharma', total: 3499, status: 'paid', date: new Date() },
      { id: 'ORD-12090', customerName: 'Isha Patel', total: 2199, status: 'paid', date: new Date(Date.now() - 86400000) },
      { id: 'ORD-12089', customerName: 'Kabir Singh', total: 5899, status: 'fulfilled', date: new Date(Date.now() - 2*86400000) },
      { id: 'ORD-12088', customerName: 'Riya Verma', total: 1299, status: 'paid', date: new Date(Date.now() - 3*86400000) },
      { id: 'ORD-12087', customerName: 'Devansh Rao', total: 7499, status: 'paid', date: new Date(Date.now() - 4*86400000) }
    ];

    return {
      currency: 'INR',
      totalRevenue: series.reduce((a, v) => a + v.revenue, 0),
      totalOrders: series.reduce((a, v) => a + v.orders, 0),
      totalCustomers: customerSeries[customerSeries.length - 1].totalCustomers,
      averageOrderValue: Math.round((series.reduce((a, v) => a + v.revenue, 0) / Math.max(1, series.reduce((a, v) => a + v.orders, 0))) * 100) / 100,
      revenueGrowth: { value: 0, percentage: 6.4, isPositive: true },
      ordersGrowth: { value: 0, percentage: 4.9, isPositive: true },
      customersGrowth: { value: 0, percentage: 5.1, isPositive: true },
      aovGrowth: { value: 0, percentage: 3.2, isPositive: true },
      revenueData: series,
      customerData: customerSeries,
      topProducts,
      recentOrders
    };
  }
}

module.exports = new DashboardController();
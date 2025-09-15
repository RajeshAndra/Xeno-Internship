const { Op } = require('sequelize');
const { Tenant, User, ShopifyStore, Order, Customer, Product } = require('../models');
const logger = require('../utils/logger');

class TenantService {
  // Get tenant by ID
  async getTenantById(tenantId) {
    try {
      const tenant = await Tenant.findByPk(tenantId, {
        attributes: { exclude: ['deletedAt'] }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      return tenant;
    } catch (error) {
      logger.error('Error getting tenant:', error);
      throw new Error('Failed to fetch tenant');
    }
  }

  // Update tenant
  async updateTenant(tenantId, updateData) {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Handle slug update
      if (updateData.slug) {
        const existingTenant = await Tenant.findOne({
          where: {
            slug: updateData.slug,
            id: { [Op.ne]: tenantId }
          }
        });

        if (existingTenant) {
          throw new Error('Slug already exists');
        }
      }

      // Handle email update
      if (updateData.email) {
        const existingTenant = await Tenant.findOne({
          where: {
            email: updateData.email,
            id: { [Op.ne]: tenantId }
          }
        });

        if (existingTenant) {
          throw new Error('Email already exists');
        }
      }

      await tenant.update(updateData);
      
      return tenant;
    } catch (error) {
      logger.error('Error updating tenant:', error);
      throw error;
    }
  }

  // Get tenant users
  async getTenantUsers(tenantId, options = {}) {
    try {
      const { page = 1, limit = 20, role, status } = options;
      const offset = (page - 1) * limit;
      
      const whereClause = { tenantId };
      if (role) whereClause.role = role;
      if (status) whereClause.status = status;

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password', 'deletedAt'] },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        }
      };
    } catch (error) {
      logger.error('Error getting tenant users:', error);
      throw new Error('Failed to fetch tenant users');
    }
  }

  // Invite user to tenant
  async inviteUser(tenantId, userData) {
    try {
      const { email, firstName, lastName, role, invitedBy } = userData;

      // Check if user already exists in this tenant
      const existingUser = await User.findOne({
        where: { email, tenantId }
      });

      if (existingUser) {
        throw new Error('User already exists in this tenant');
      }

      // Generate temporary password and invitation token
      const tempPassword = this.generateTempPassword();
      const invitationToken = this.generateInvitationToken();

      const user = await User.create({
        tenantId,
        firstName,
        lastName,
        email,
        password: tempPassword, // This should be hashed by the model
        role,
        status: 'invited',
        emailVerificationToken: invitationToken
      });

      // In a real implementation, you would send an invitation email here
      logger.info(`User invitation created: ${email} invited to tenant ${tenantId}`);

      return {
        user: { ...user.toJSON(), password: undefined },
        invitationToken,
        invitedBy
      };
    } catch (error) {
      logger.error('Error inviting user:', error);
      throw error;
    }
  }

  // Get billing information
  async getBillingInfo(tenantId) {
    try {
      const tenant = await Tenant.findByPk(tenantId, {
        attributes: ['subscriptionPlan', 'billingInfo', 'createdAt']
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Get usage statistics for billing
      const [storeCount, userCount, orderCount] = await Promise.all([
        ShopifyStore.count({ where: { tenantId } }),
        User.count({ where: { tenantId } }),
        Order.count({ where: { tenantId } })
      ]);

      const billingInfo = {
        subscriptionPlan: tenant.subscriptionPlan,
        billingInfo: tenant.billingInfo,
        usage: {
          stores: storeCount,
          users: userCount,
          orders: orderCount
        },
        memberSince: tenant.createdAt,
        planLimits: this.getPlanLimits(tenant.subscriptionPlan)
      };

      return billingInfo;
    } catch (error) {
      logger.error('Error getting billing info:', error);
      throw new Error('Failed to fetch billing information');
    }
  }

  // Update subscription plan
  async updateSubscriptionPlan(tenantId, plan) {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate plan
      const validPlans = ['free', 'basic', 'premium', 'enterprise'];
      if (!validPlans.includes(plan)) {
        throw new Error('Invalid subscription plan');
      }

      // Check plan limits before upgrading/downgrading
      const currentUsage = await this.getCurrentUsage(tenantId);
      const newPlanLimits = this.getPlanLimits(plan);

      if (currentUsage.stores > newPlanLimits.stores) {
        throw new Error('Current store count exceeds new plan limits');
      }

      if (currentUsage.users > newPlanLimits.users) {
        throw new Error('Current user count exceeds new plan limits');
      }

      await tenant.update({ subscriptionPlan: plan });

      logger.info(`Subscription plan updated for tenant ${tenantId}: ${plan}`);

      return {
        tenant,
        previousPlan: tenant.subscriptionPlan,
        newPlan: plan,
        effectiveDate: new Date()
      };
    } catch (error) {
      logger.error('Error updating subscription plan:', error);
      throw error;
    }
  }

  // Get tenant statistics
  async getTenantStatistics(tenantId) {
    try {
      const [
        userCount,
        storeCount,
        orderCount,
        customerCount,
        productCount,
        totalRevenue
      ] = await Promise.all([
        User.count({ where: { tenantId } }),
        ShopifyStore.count({ where: { tenantId } }),
        Order.count({ where: { tenantId } }),
        Customer.count({ where: { tenantId } }),
        Product.count({ where: { tenantId } }),
        Order.sum('totalPrice', { where: { tenantId, test: false } })
      ]);

      const connectedStores = await ShopifyStore.count({
        where: { tenantId, isConnected: true }
      });

      const recentOrders = await Order.count({
        where: {
          tenantId,
          shopifyCreatedAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      return {
        users: userCount,
        stores: {
          total: storeCount,
          connected: connectedStores
        },
        orders: {
          total: orderCount,
          recent: recentOrders
        },
        customers: customerCount,
        products: productCount,
        revenue: {
          total: totalRevenue || 0,
          currency: 'USD' // This could be dynamic based on store currencies
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error getting tenant statistics:', error);
      throw new Error('Failed to fetch tenant statistics');
    }
  }

  // Update tenant settings
  async updateTenantSettings(tenantId, settings) {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Merge with existing settings
      const currentSettings = tenant.settings || {};
      const updatedSettings = { ...currentSettings, ...settings };

      await tenant.update({ settings: updatedSettings });

      return tenant;
    } catch (error) {
      logger.error('Error updating tenant settings:', error);
      throw new Error('Failed to update tenant settings');
    }
  }

  // Helper methods
  generateTempPassword() {
    return Math.random().toString(36).slice(-12);
  }

  generateInvitationToken() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  getPlanLimits(plan) {
    const limits = {
      free: {
        stores: 1,
        users: 2,
        orders: 1000,
        features: ['basic_analytics', 'basic_sync']
      },
      basic: {
        stores: 3,
        users: 5,
        orders: 10000,
        features: ['basic_analytics', 'basic_sync', 'advanced_reporting']
      },
      premium: {
        stores: 10,
        users: 15,
        orders: 50000,
        features: ['basic_analytics', 'basic_sync', 'advanced_reporting', 'custom_integrations']
      },
      enterprise: {
        stores: -1, // Unlimited
        users: -1, // Unlimited
        orders: -1, // Unlimited
        features: ['all_features', 'priority_support', 'custom_development']
      }
    };

    return limits[plan] || limits.free;
  }

  async getCurrentUsage(tenantId) {
    const [storeCount, userCount, orderCount] = await Promise.all([
      ShopifyStore.count({ where: { tenantId } }),
      User.count({ where: { tenantId } }),
      Order.count({ where: { tenantId } })
    ]);

    return {
      stores: storeCount,
      users: userCount,
      orders: orderCount
    };
  }

  // Create tenant (used during registration)
  async createTenant(tenantData) {
    try {
      const { name, slug, email, phone, website, industry } = tenantData;

      // Check if slug or email already exists
      const existingTenant = await Tenant.findOne({
        where: {
          [Op.or]: [
            { slug },
            { email }
          ]
        }
      });

      if (existingTenant) {
        if (existingTenant.slug === slug) {
          throw new Error('Tenant slug already exists');
        }
        if (existingTenant.email === email) {
          throw new Error('Tenant email already exists');
        }
      }

      const tenant = await Tenant.create({
        name,
        slug,
        email,
        phone,
        website,
        industry,
        status: 'active',
        subscriptionPlan: 'free'
      });

      logger.info(`New tenant created: ${name} (${slug})`);

      return tenant;
    } catch (error) {
      logger.error('Error creating tenant:', error);
      throw error;
    }
  }

  // Delete tenant (soft delete)
  async deleteTenant(tenantId) {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      await tenant.destroy(); // This will soft delete due to paranoid: true

      logger.info(`Tenant deleted: ${tenant.name} (${tenantId})`);

      return true;
    } catch (error) {
      logger.error('Error deleting tenant:', error);
      throw new Error('Failed to delete tenant');
    }
  }

  // Restore tenant
  async restoreTenant(tenantId) {
    try {
      const tenant = await Tenant.findOne({
        where: { id: tenantId },
        paranoid: false // Include deleted records
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      if (!tenant.deletedAt) {
        throw new Error('Tenant is not deleted');
      }

      await tenant.restore();

      logger.info(`Tenant restored: ${tenant.name} (${tenantId})`);

      return tenant;
    } catch (error) {
      logger.error('Error restoring tenant:', error);
      throw new Error('Failed to restore tenant');
    }
  }
}

module.exports = { TenantService };
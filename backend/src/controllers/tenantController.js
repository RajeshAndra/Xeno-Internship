const { TenantService } = require('../services/tenantService');
const { Tenant, User } = require('../models');
const logger = require('../utils/logger');

class TenantController {
  constructor() {
    this.tenantService = new TenantService();
  }

  // Get current tenant details
  async getCurrentTenant(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      
      const tenant = await this.tenantService.getTenantById(tenantId);
      
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      res.json({
        success: true,
        data: { tenant }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update tenant details
  async updateTenant(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const allowedFields = ['name', 'email', 'phone', 'website', 'industry', 'settings'];
      
      const updateData = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      const tenant = await this.tenantService.updateTenant(tenantId, updateData);
      
      logger.info(`Tenant updated: ${tenant.name} (${tenantId})`);
      
      res.json({
        success: true,
        message: 'Tenant updated successfully',
        data: { tenant }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get tenant users
  async getTenantUsers(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { page = 1, limit = 20, role, status } = req.query;

      const users = await this.tenantService.getTenantUsers(tenantId, {
        page: parseInt(page),
        limit: parseInt(limit),
        role,
        status
      });

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  // Invite user to tenant
  async inviteUser(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { email, firstName, lastName, role = 'viewer' } = req.body;

      if (!email || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'Email, first name, and last name are required'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { 
          email,
          tenantId 
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists in this tenant'
        });
      }

      const invitation = await this.tenantService.inviteUser(tenantId, {
        email,
        firstName,
        lastName,
        role,
        invitedBy: req.user.id
      });

      logger.info(`User invited: ${email} to tenant ${tenantId} by ${req.user.email}`);
      
      res.status(201).json({
        success: true,
        message: 'User invited successfully',
        data: { invitation }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user role
  async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const tenantId = req.user.tenantId;

      if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Valid role is required (admin, editor, viewer)'
        });
      }

      const user = await User.findOne({
        where: { 
          id: userId,
          tenantId 
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check permissions (only admin can change roles)
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can change user roles'
        });
      }

      await user.update({ role });
      
      logger.info(`User role updated: ${user.email} to ${role} by ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'User role updated successfully',
        data: { user: { ...user.toJSON(), password: undefined } }
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove user from tenant
  async removeUser(req, res, next) {
    try {
      const { userId } = req.params;
      const tenantId = req.user.tenantId;

      // Check permissions (only admin can remove users)
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can remove users'
        });
      }

      const user = await User.findOne({
        where: { 
          id: userId,
          tenantId 
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Cannot remove yourself
      if (user.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove yourself'
        });
      }

      await user.destroy();
      
      logger.info(`User removed: ${user.email} from tenant ${tenantId} by ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'User removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get tenant billing information
  async getBillingInfo(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      
      const billingInfo = await this.tenantService.getBillingInfo(tenantId);
      
      res.json({
        success: true,
        data: billingInfo
      });
    } catch (error) {
      next(error);
    }
  }

  // Update subscription plan
  async updateSubscription(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { plan } = req.body;

      if (!plan || !['free', 'basic', 'premium', 'enterprise'].includes(plan)) {
        return res.status(400).json({
          success: false,
          message: 'Valid subscription plan is required'
        });
      }

      const result = await this.tenantService.updateSubscriptionPlan(tenantId, plan);
      
      logger.info(`Subscription updated: ${plan} for tenant ${tenantId}`);
      
      res.json({
        success: true,
        message: 'Subscription updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get tenant statistics
  async getTenantStatistics(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      
      const statistics = await this.tenantService.getTenantStatistics(tenantId);
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  // Update tenant settings
  async updateSettings(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { settings } = req.body;

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Valid settings object is required'
        });
      }

      const tenant = await this.tenantService.updateTenantSettings(tenantId, settings);
      
      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: { tenant }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TenantController();
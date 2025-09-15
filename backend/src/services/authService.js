/**
 * Authentication Service
 * User registration, login, and authentication logic
 */

const bcrypt = require('bcryptjs');
const { User, Tenant } = require('../models');
const { generateToken } = require('../middleware/auth');
const { generateRandomString, generateSlug, isValidEmail } = require('../utils/helpers');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Register new user and tenant
   */
  static async register(userData) {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      tenantName, 
      tenantSlug,
      phone,
      website,
      industry 
    } = userData;

    // Validate input
    if (!firstName || !lastName || !email || !password || !tenantName) {
      throw new Error('Missing required fields');
    }

    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Generate tenant slug if not provided
    const slug = tenantSlug || generateSlug(tenantName);

    // Check if tenant slug is available
    const existingTenant = await Tenant.findOne({ where: { slug } });
    if (existingTenant) {
      throw new Error('Tenant name is already taken');
    }

    // Check if user email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    try {
      // Create tenant first
      const tenant = await Tenant.create({
        name: tenantName,
        slug,
        email,
        phone,
        website,
        industry,
        status: 'active',
        subscription_plan: 'free'
      });

      // Create user as tenant owner
      const user = await User.create({
        tenant_id: tenant.id,
        first_name: firstName,
        last_name: lastName,
        email,
        password, // Will be hashed by the model hook
        role: 'owner',
        status: 'active',
        email_verified: false,
        email_verification_token: generateRandomString(32)
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        tenantId: tenant.id,
        role: user.role
      });

      // Return user data without password
      const userData = await User.findByPk(user.id, {
        include: [{
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'slug', 'status', 'subscription_plan']
        }],
        attributes: { exclude: ['password', 'email_verification_token'] }
      });

      logger.info(`New user registered: ${email} for tenant: ${tenantName}`);

      return {
        user: userData,
        tenant,
        token
      };

    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    try {
      // Find user with tenant
      const user = await User.findOne({
        where: { email },
        include: [{
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'slug', 'status', 'subscription_plan']
        }]
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Check user status
      if (user.status !== 'active') {
        throw new Error('User account is not active');
      }

      // Check tenant status
      if (user.tenant && user.tenant.status !== 'active') {
        throw new Error('Tenant account is not active');
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        tenantId: user.tenant_id,
        role: user.role
      });

      // Return user data without password
      const userData = {
        ...user.toJSON(),
        password: undefined,
        email_verification_token: undefined,
        password_reset_token: undefined
      };

      logger.info(`User logged in: ${email}`);

      return {
        user: userData,
        token
      };

    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'slug', 'email', 'status', 'subscription_plan']
        }],
        attributes: { exclude: ['password', 'email_verification_token', 'password_reset_token'] }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;

    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updateData) {
    const allowedFields = ['first_name', 'last_name', 'phone', 'preferences'];
    
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Filter allowed fields
      const filteredData = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });

      await user.update(filteredData);

      // Return updated user data
      return await this.getProfile(userId);

    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await user.update({ password: newPassword });

      logger.info(`Password changed for user: ${user.email}`);

      return { message: 'Password changed successfully' };

    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }
}

module.exports = AuthService;

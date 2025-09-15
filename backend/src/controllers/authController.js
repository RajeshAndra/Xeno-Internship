const { AuthService } = require('../services/authService');
const { validateRegistration, validateLogin } = require('../utils/helpers');
const logger = require('../utils/logger');

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  // Register new user and tenant
  async register(req, res, next) {
    try {
      const { error } = validateRegistration(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(detail => detail.message)
        });
      }

      const result = await this.authService.register(req.body);
      
      logger.info(`New user registered: ${req.body.email}`);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          tenant: result.tenant,
          token: result.token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user
  async login(req, res, next) {
    try {
      const { error } = validateLogin(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(detail => detail.message)
        });
      }

      const result = await this.authService.login(req.body);
      
      logger.info(`User logged in: ${req.body.email}`);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          tenant: result.tenant,
          token: result.token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  async getProfile(req, res, next) {
    try {
      const user = await this.authService.getUserProfile(req.user.id);
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  async updateProfile(req, res, next) {
    try {
      const allowedFields = ['firstName', 'lastName', 'preferences'];
      const updateData = {};
      
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      const user = await this.authService.updateUserProfile(req.user.id, updateData);
      
      logger.info(`User profile updated: ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      await this.authService.changePassword(req.user.id, currentPassword, newPassword);
      
      logger.info(`Password changed for user: ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout (invalidate token)
  async logout(req, res, next) {
    try {
      // In a more sophisticated implementation, you might want to blacklist the token
      logger.info(`User logged out: ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh token
  async refreshToken(req, res, next) {
    try {
      const { token } = await this.authService.refreshToken(req.user.id);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { token }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
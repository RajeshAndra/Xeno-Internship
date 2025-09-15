/**
 * Authentication Routes
 * /api/auth endpoints
 */

const express = require('express');
const Joi = require('joi');
const AuthService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const { apiResponse, asyncHandler } = require('../utils/helpers');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(255).required(),
  tenantName: Joi.string().min(2).max(100).required(),
  tenantSlug: Joi.string().alphanum().min(2).max(50).optional(),
  phone: Joi.string().optional(),
  website: Joi.string().uri().optional(),
  industry: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  first_name: Joi.string().min(1).max(50).optional(),
  last_name: Joi.string().min(1).max(50).optional(),
  phone: Joi.string().optional(),
  preferences: Joi.object().optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(255).required()
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new user and tenant
 * @access  Public
 */
router.post('/register', asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json(
      apiResponse(false, 'Validation failed', null, {
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      })
    );
  }

  try {
    const result = await AuthService.register(value);
    
    res.status(201).json(
      apiResponse(true, 'Registration successful', {
        user: result.user,
        tenant: result.tenant,
        token: result.token
      })
    );

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(400).json(
      apiResponse(false, error.message)
    );
  }
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json(
      apiResponse(false, 'Validation failed', null, {
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      })
    );
  }

  try {
    const result = await AuthService.login(value.email, value.password);
    
    res.json(
      apiResponse(true, 'Login successful', {
        user: result.user,
        token: result.token
      })
    );

  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json(
      apiResponse(false, error.message)
    );
  }
}));

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  try {
    const profile = await AuthService.getProfile(req.user.id);
    
    res.json(
      apiResponse(true, 'Profile retrieved successfully', profile)
    );

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(404).json(
      apiResponse(false, error.message)
    );
  }
}));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    return res.status(400).json(
      apiResponse(false, 'Validation failed', null, {
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      })
    );
  }

  try {
    const profile = await AuthService.updateProfile(req.user.id, value);
    
    res.json(
      apiResponse(true, 'Profile updated successfully', profile)
    );

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(400).json(
      apiResponse(false, error.message)
    );
  }
}));

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json(
      apiResponse(false, 'Validation failed', null, {
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      })
    );
  }

  try {
    const result = await AuthService.changePassword(
      req.user.id, 
      value.currentPassword, 
      value.newPassword
    );
    
    res.json(
      apiResponse(true, result.message)
    );

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(400).json(
      apiResponse(false, error.message)
    );
  }
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // In a JWT implementation, logout is typically handled client-side
  // by removing the token. Server-side logout would require token blacklisting.
  
  logger.info(`User logged out: ${req.user.email}`);
  
  res.json(
    apiResponse(true, 'Logout successful')
  );
}));

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify JWT token
 * @access  Private
 */
router.get('/verify-token', authenticate, asyncHandler(async (req, res) => {
  res.json(
    apiResponse(true, 'Token is valid', {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        tenant: req.tenant
      }
    })
  );
}));

module.exports = router;

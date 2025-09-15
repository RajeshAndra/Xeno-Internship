/**
 * Authentication Middleware
 * JWT token validation and user authentication
 */

const jwt = require('jsonwebtoken');
const { User, Tenant } = require('../models');
const { apiResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

/**
 * Generate JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json(
        apiResponse(false, 'Access denied. No token provided.')
      );
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Tenant,
        as: 'tenant',
        attributes: ['id', 'name', 'slug', 'status']
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json(
        apiResponse(false, 'Token is not valid.')
      );
    }

    if (user.status !== 'active') {
      return res.status(401).json(
        apiResponse(false, 'User account is not active.')
      );
    }

    if (user.tenant && user.tenant.status !== 'active') {
      return res.status(401).json(
        apiResponse(false, 'Tenant account is not active.')
      );
    }

    // Add user and tenant to request
    req.user = user;
    req.tenant = user.tenant;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json(
      apiResponse(false, 'Token is not valid.')
    );
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        apiResponse(false, 'Access denied. Please authenticate.')
      );
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        apiResponse(false, 'Access denied. Insufficient permissions.')
      );
    }

    next();
  };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.userId, {
        include: [{
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'slug', 'status']
        }],
        attributes: { exclude: ['password'] }
      });

      if (user && user.status === 'active') {
        req.user = user;
        req.tenant = user.tenant;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth
};

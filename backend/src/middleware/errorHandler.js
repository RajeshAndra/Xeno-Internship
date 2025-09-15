/**
 * Error Handling Middleware
 */

const logger = require('../utils/logger');
const { apiResponse } = require('../utils/helpers');

/**
 * Validation error handler
 */
const validationError = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = {};
    
    if (err.errors) {
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });
    }

    return res.status(400).json(
      apiResponse(false, 'Validation failed', null, { errors })
    );
  }

  if (err.name === 'SequelizeValidationError') {
    const errors = {};
    
    err.errors.forEach(error => {
      errors[error.path] = error.message;
    });

    return res.status(400).json(
      apiResponse(false, 'Validation failed', null, { errors })
    );
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    const value = err.errors[0].value;
    
    return res.status(409).json(
      apiResponse(false, `${field} '${value}' already exists`)
    );
  }

  next(err);
};

/**
 * Database error handler
 */
const databaseError = (err, req, res, next) => {
  if (err.name && err.name.startsWith('Sequelize')) {
    logger.error('Database error:', err);
    
    return res.status(500).json(
      apiResponse(false, 'Database operation failed')
    );
  }

  next(err);
};

/**
 * JWT error handler
 */
const jwtError = (err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      apiResponse(false, 'Invalid token')
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      apiResponse(false, 'Token expired')
    );
  }

  next(err);
};

/**
 * Not found error handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  next(error);
};

/**
 * Global error handler
 */
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Global error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  let message = 'Internal server error';
  let statusCode = 500;

  // Check for specific error types
  if (err.status) {
    statusCode = err.status;
    message = err.message;
  }

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json(
      apiResponse(false, message, null, {
        error: err.message,
        stack: err.stack
      })
    );
  }

  // Production error response
  res.status(statusCode).json(
    apiResponse(false, message)
  );
};

/**
 * Async error wrapper
 */
const asyncErrorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  validationError,
  databaseError,
  jwtError,
  notFound,
  globalErrorHandler,
  asyncErrorHandler
};

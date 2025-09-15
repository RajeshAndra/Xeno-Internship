/**
 * Tenant Middleware
 * Multi-tenant isolation and context
 */

const { Tenant } = require('../models');
const { apiResponse } = require('../utils/helpers');

/**
 * Tenant context middleware
 * Ensures all operations are scoped to the current tenant
 */
const tenantContext = (req, res, next) => {
  if (!req.user || !req.tenant) {
    return res.status(401).json(
      apiResponse(false, 'Tenant context required. Please authenticate.')
    );
  }

  // Add tenant ID to query context for all database operations
  req.tenantId = req.tenant.id;
  
  next();
};

/**
 * Tenant owner authorization
 * Ensures only tenant owners can perform certain actions
 */
const tenantOwnerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json(
      apiResponse(false, 'Access denied. Tenant owner privileges required.')
    );
  }
  
  next();
};

/**
 * Tenant admin authorization
 * Ensures only tenant admins and owners can perform certain actions
 */
const tenantAdminOnly = (req, res, next) => {
  if (!req.user || !['owner', 'admin'].includes(req.user.role)) {
    return res.status(403).json(
      apiResponse(false, 'Access denied. Tenant admin privileges required.')
    );
  }
  
  next();
};

/**
 * Inject tenant filter into queries
 */
const withTenantFilter = (baseWhere = {}) => {
  return (req) => {
    return {
      ...baseWhere,
      tenant_id: req.tenantId
    };
  };
};

module.exports = {
  tenantContext,
  tenantOwnerOnly,
  tenantAdminOnly,
  withTenantFilter
};

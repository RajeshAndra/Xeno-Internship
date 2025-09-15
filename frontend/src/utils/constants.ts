/**
 * Application Constants
 */

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Authentication
export const AUTH_TOKEN_KEY = 'auth_token';
export const TOKEN_EXPIRY_DAYS = 7;

// App Configuration
export const APP_NAME = 'Shopify Insights Platform';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Multi-tenant Shopify Data Ingestion & Insights Service';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Chart Colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',
};

// Date Formats
export const DATE_FORMATS = {
  short: 'MMM dd',
  medium: 'MMM dd, yyyy',
  long: 'MMMM dd, yyyy',
  time: 'HH:mm',
  datetime: 'MMM dd, yyyy HH:mm',
  iso: 'yyyy-MM-dd',
};

// Analytics Periods
export const ANALYTICS_PERIODS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'Last year', value: '1y' },
];

// User Roles
export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  VIEWER: 'viewer',
} as const;

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

// Product Status
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
} as const;

// Customer Status
export const CUSTOMER_STATUS = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  INVITED: 'invited',
  DECLINED: 'declined',
} as const;

// Navigation Links
export const NAVIGATION_LINKS = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'BarChart3',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: 'TrendingUp',
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: 'Users',
  },
  {
    name: 'Products',
    href: '/products',
    icon: 'Package',
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: 'ShoppingCart',
  },
  {
    name: 'Stores',
    href: '/stores',
    icon: 'Store',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
];

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  SELECTED_PERIOD: 'selected_period',
  DASHBOARD_LAYOUT: 'dashboard_layout',
} as const;

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 50,
  TENANT_NAME_MIN_LENGTH: 2,
  TENANT_NAME_MAX_LENGTH: 100,
  SLUG_REGEX: /^[a-z0-9-]+$/,
} as const;

// Feature Flags
export const FEATURES = {
  MULTI_STORE: true,
  REAL_TIME_SYNC: true,
  ADVANCED_ANALYTICS: true,
  CUSTOM_REPORTS: false,
  WHITE_LABEL: false,
} as const;

export default {
  API_BASE_URL,
  AUTH_TOKEN_KEY,
  TOKEN_EXPIRY_DAYS,
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  CHART_COLORS,
  DATE_FORMATS,
  ANALYTICS_PERIODS,
  USER_ROLES,
  SUBSCRIPTION_PLANS,
  ORDER_STATUS,
  PRODUCT_STATUS,
  CUSTOMER_STATUS,
  NAVIGATION_LINKS,
  STORAGE_KEYS,
  TOAST_TYPES,
  HTTP_STATUS,
  VALIDATION_RULES,
  FEATURES,
};

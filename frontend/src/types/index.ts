import { ComponentType } from 'react';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

// User and Authentication Types
export interface User {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  last_login?: string;
  email_verified: boolean;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  status: 'active' | 'suspended' | 'inactive';
  subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  settings?: Record<string, any>;
  billing_info?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  tenant?: Tenant;
}

export interface VerifyTokenResponse {
  user: User;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  tenantName: string;
  tenantSlug?: string;
  phone?: string;
  website?: string;
  industry?: string;
}

export interface AuthResponse {
  user: User;
  tenant?: Tenant;
  token: string;
}

// Shopify Types
export interface ShopifyStore {
  id: string;
  tenant_id: string;
  shop_domain: string;
  shopify_store_id?: number;
  store_name: string;
  access_token?: string;
  scope?: string;
  currency: string;
  timezone?: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  is_connected: boolean;
  last_sync?: string;
  sync_frequency: 'hourly' | 'daily' | 'weekly';
  webhook_endpoints?: Record<string, any>;
  store_settings?: Record<string, any>;
  error_log?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  shopify_customer_id: number;
  shopify_store_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  state: 'disabled' | 'invited' | 'enabled' | 'declined';
  total_spent: number;
  orders_count: number;
  last_order_id?: number;
  last_order_name?: string;
  note?: string;
  verified_email: boolean;
  tax_exempt: boolean;
  tags?: string;
  currency: string;
  addresses?: any[];
  default_address?: Record<string, any>;
  shopify_created_at?: string;
  shopify_updated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  shopify_product_id: number;
  shopify_store_id?: string;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  handle?: string;
  status: 'active' | 'archived' | 'draft';
  published_scope: string;
  tags?: string;
  variants?: any[];
  options?: any[];
  images?: any[];
  image?: Record<string, any>;
  price?: number;
  compare_at_price?: number;
  inventory_quantity: number;
  inventory_policy: string;
  inventory_management?: string;
  published_at?: string;
  shopify_created_at?: string;
  shopify_updated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  shopify_order_id: number;
  shopify_store_id?: string;
  customer_id?: string;
  order_number?: number;
  name?: string;
  email?: string;
  phone?: string;
  financial_status?: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
  fulfillment_status?: 'fulfilled' | 'null' | 'partial' | 'restocked';
  currency: string;
  total_price: number;
  subtotal_price: number;
  total_weight: number;
  total_tax: number;
  taxes_included: boolean;
  total_discounts: number;
  total_line_items_price: number;
  confirmed: boolean;
  test: boolean;
  gateway?: string;
  source_name?: string;
  tags?: string;
  note?: string;
  shipping_address?: Record<string, any>;
  billing_address?: Record<string, any>;
  shipping_lines?: any[];
  tax_lines?: any[];
  processed_at?: string;
  closed_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  shopify_created_at?: string;
  shopify_updated_at?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  orderItems?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  shopify_line_item_id: number;
  shopify_product_id?: number;
  shopify_variant_id?: number;
  title: string;
  name?: string;
  variant_title?: string;
  vendor?: string;
  product_type?: string;
  sku?: string;
  fulfillment_status?: 'fulfilled' | 'null' | 'partial' | 'not_eligible';
  fulfillment_service: string;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  quantity: number;
  price: number;
  compare_at_price?: number;
  total_discount: number;
  grams: number;
  properties?: any[];
  product_exists: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
}

// Analytics Types
export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  productsGrowth: number;
  averageOrderValue: number;
  conversionRate: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface TopProduct {
  id: string;
  title: string;
  revenue: number;
  quantity_sold: number;
  orders_count: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  email: string;
  total_spent: number;
  orders_count: number;
}

// UI Component Types
export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ComponentType<{ className?: string }>;
  loading?: boolean;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Form Types
export interface FormError {
  field: string;
  message: string;
}

// Hook Types
export interface UseAuthReturn {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// API Client Types
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  errors?: FormError[];
}

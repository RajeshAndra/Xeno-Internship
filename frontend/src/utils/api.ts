/**
 * API Client Utility
 * Handles HTTP requests to the backend API
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { ApiResponse, ApiError, VerifyTokenResponse, AuthResponse, User } from '../types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        const apiError: ApiError = {
          message: 'An error occurred',
          status: error.response?.status,
        };

        if (error.response?.data) {
          apiError.message = error.response.data.message || apiError.message;
          apiError.errors = error.response.data.meta?.errors;
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
          this.clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        return Promise.reject(apiError);
      }
    );
  }

  // Authentication methods
  setAuthToken(token: string) {
    Cookies.set('auth_token', token, { expires: 7, secure: process.env.NODE_ENV === 'production' });
  }

  clearAuth() {
    Cookies.remove('auth_token');
  }

  getAuthToken(): string | undefined {
    return Cookies.get('auth_token');
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // Authentication API methods
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.post('/auth/login', { email, password });
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    tenantName: string;
    tenantSlug?: string;
    phone?: string;
    website?: string;
    industry?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.post('/auth/register', data);
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.clearAuth();
    }
  }

  async getProfile() {
    return this.get('/auth/profile');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.put('/auth/profile', data);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post('/auth/change-password', { currentPassword, newPassword });
  }

  async verifyToken(): Promise<ApiResponse<VerifyTokenResponse>> {
    return this.get('/auth/verify-token');
  }

  // Tenant API methods
  async getCurrentTenant() {
    return this.get('/tenants/current');
  }

  async updateTenant(data: any) {
    return this.put('/tenants/current', data);
  }

  async getTenantUsers() {
    return this.get('/tenants/users');
  }

  async createTenantUser(data: any) {
    return this.post('/tenants/users', data);
  }

  // Analytics API methods
  async getDashboardMetrics() {
    return this.get('/analytics/dashboard');
  }

  async getRevenueData(period: string = '30d') {
    return this.get(`/analytics/revenue?period=${period}`);
  }

  async getCustomerMetrics() {
    return this.get('/analytics/customers');
  }

  async getProductMetrics() {
    return this.get('/analytics/products');
  }

  async getOrderMetrics() {
    return this.get('/analytics/orders');
  }

  async getTopProducts(limit: number = 10) {
    return this.get(`/analytics/top-products?limit=${limit}`);
  }

  async getTopCustomers(limit: number = 10) {
    return this.get(`/analytics/top-customers?limit=${limit}`);
  }

  // Shopify API methods
  async connectShopifyStore(data: {
    shop_domain: string;
    access_token: string;
  }) {
    return this.post('/shopify/connect', data);
  }

  async disconnectShopifyStore() {
    return this.delete('/shopify/disconnect');
  }

  async syncShopifyData() {
    return this.post('/shopify/sync');
  }

  async getShopifyStatus() {
    return this.get('/shopify/status');
  }

  async getShopifyStores() {
    return this.get('/shopify/stores');
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;

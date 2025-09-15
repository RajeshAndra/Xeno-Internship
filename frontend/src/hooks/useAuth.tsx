/**
 * Authentication Hook
 * Manages user authentication state and operations
 */

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import apiClient from '../utils/api';
import { User, Tenant, LoginCredentials, RegisterData, UseAuthReturn, ApiError } from '../types';

interface AuthContextType extends UseAuthReturn {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check for existing authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = apiClient.getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await apiClient.verifyToken();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setTenant(response.data.user.tenant || null);
      } else {
        apiClient.clearAuth();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      apiClient.clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiClient.login(credentials.email, credentials.password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        apiClient.setAuthToken(token);
        setUser(user);
        setTenant(user.tenant || null);
        
        toast.success('Login successful!');
        router.push('/dashboard');
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiClient.register(data);
      
      if (response.success && response.data) {
        const { user, tenant, token } = response.data;
        apiClient.setAuthToken(token);
        setUser(user);
        setTenant(tenant || user.tenant || null);
        
        toast.success('Registration successful!');
        router.push('/dashboard');
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      apiClient.logout();
      setUser(null);
      setTenant(null);
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state anyway
      apiClient.clearAuth();
      setUser(null);
      setTenant(null);
      router.push('/login');
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const response = await apiClient.updateProfile(data);
      
      if (response.success && response.data) {
        setUser(response.data);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to update profile');
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      const response = await apiClient.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        toast.success('Password changed successfully');
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to change password');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    tenant,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC to protect routes
interface WithAuthProps {
  fallback?: ReactNode;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthProps = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [user, loading, router]);

    if (loading) {
      return options.fallback ? (
        options.fallback
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Hook to check permissions
export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.indexOf(user.role) !== -1;
  };

  const isOwner = (): boolean => hasRole(['owner']);
  const isAdmin = (): boolean => hasRole(['owner', 'admin']);
  const isManager = (): boolean => hasRole(['owner', 'admin', 'manager']);
  const canView = (): boolean => hasRole(['owner', 'admin', 'manager', 'viewer']);

  return {
    hasRole,
    isOwner,
    isAdmin,
    isManager,
    canView,
    userRole: user?.role,
  };
}

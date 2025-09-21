import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthState } from '@/features/auth/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company?: string;
  role?: string;
}

interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'yasp-auth-token';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiry

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Initialize authentication state from stored token
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (authState.isAuthenticated) {
      const interval = setInterval(checkTokenExpiry, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [authState.isAuthenticated]);

  const initializeAuth = async () => {
    try {
      const storedTokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedTokenData) {
        const tokenData: AuthToken = JSON.parse(storedTokenData);

        // Check if token is still valid
        if (Date.now() < tokenData.expiresAt) {
          setAuthState({
            user: tokenData.user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });

          // Schedule refresh if needed
          if (Date.now() > tokenData.expiresAt - TOKEN_REFRESH_THRESHOLD) {
            await refreshToken();
          }
        } else {
          // Token expired, clear it
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: 'Failed to initialize authentication',
      });
    }
  };

  const checkTokenExpiry = async () => {
    const storedTokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedTokenData) {
      const tokenData: AuthToken = JSON.parse(storedTokenData);

      // If token expires soon, refresh it
      if (Date.now() > tokenData.expiresAt - TOKEN_REFRESH_THRESHOLD) {
        const refreshSuccess = await refreshToken();
        if (!refreshSuccess) {
          logout();
        }
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call - replace with actual authentication
      const response = await simulateLogin(email, password);

      if (response.success && response.data) {
        const tokenData: AuthToken = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: Date.now() + (response.data.expiresIn * 1000),
          user: response.data.user,
        };

        // Store token securely
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));

        setAuthState({
          user: response.data.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        return { success: true };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Login failed',
        }));
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call - replace with actual registration
      const response = await simulateSignup(userData);

      if (response.success && response.data) {
        const tokenData: AuthToken = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: Date.now() + (response.data.expiresIn * 1000),
          user: response.data.user,
        };

        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));

        setAuthState({
          user: response.data.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        return { success: true };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Signup failed',
        }));
        return { success: false, error: response.error || 'Signup failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const storedTokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedTokenData) return false;

      const tokenData: AuthToken = JSON.parse(storedTokenData);

      // Simulate refresh API call
      const response = await simulateTokenRefresh(tokenData.refreshToken);

      if (response.success && response.data) {
        const newTokenData: AuthToken = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: Date.now() + (response.data.expiresIn * 1000),
          user: response.data.user,
        };

        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newTokenData));

        setAuthState(prev => ({
          ...prev,
          user: response.data.user,
        }));

        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        signup,
        refreshToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Simulated API functions - replace with actual API calls
const simulateLogin = async (email: string, password: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Basic validation
  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  if (password.length < 8) {
    return { success: false, error: 'Invalid credentials' };
  }

  // Simulate successful login
  const mockUser: User = {
    id: '1',
    email,
    firstName: 'Test',
    lastName: 'User',
    company: 'YASP Corp',
    role: 'Developer',
    emailVerified: true,
    twoFactorEnabled: false,
    socialAccounts: [],
    notificationPreferences: {
      emailNotifications: true,
      apiUpdates: true,
      securityAlerts: true,
      marketingEmails: false,
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  return {
    success: true,
    data: {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresIn: 3600, // 1 hour
      user: mockUser,
    },
  };
};

const simulateSignup = async (userData: SignupData) => {
  await new Promise(resolve => setTimeout(resolve, 1200));

  if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
    return { success: false, error: 'All required fields must be filled' };
  }

  if (userData.password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  const mockUser: User = {
    id: '1',
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    company: userData.company,
    role: userData.role,
    emailVerified: false,
    twoFactorEnabled: false,
    socialAccounts: [],
    notificationPreferences: {
      emailNotifications: true,
      apiUpdates: true,
      securityAlerts: true,
      marketingEmails: false,
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  return {
    success: true,
    data: {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresIn: 3600,
      user: mockUser,
    },
  };
};

const simulateTokenRefresh = async (refreshToken: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!refreshToken) {
    return { success: false, error: 'Invalid refresh token' };
  }

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    company: 'YASP Corp',
    role: 'Developer',
    emailVerified: true,
    twoFactorEnabled: false,
    socialAccounts: [],
    notificationPreferences: {
      emailNotifications: true,
      apiUpdates: true,
      securityAlerts: true,
      marketingEmails: false,
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  return {
    success: true,
    data: {
      accessToken: 'mock-access-token-refreshed-' + Date.now(),
      refreshToken: 'mock-refresh-token-refreshed-' + Date.now(),
      expiresIn: 3600,
      user: mockUser,
    },
  };
};
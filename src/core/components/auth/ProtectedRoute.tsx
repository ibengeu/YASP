import React, { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/core/context/auth-context';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  fallbackPath?: string;
}

/**
 * ProtectedRoute component that ensures only authenticated users can access protected pages
 * Implements proper authorization controls and redirects unauthorized users
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/auth',
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the attempted URL for redirect after login
      const redirectUrl = location.pathname + location.search;
      navigate(fallbackPath, {
        state: { from: redirectUrl },
        replace: true,
      });
    }
  }, [isAuthenticated, isLoading, navigate, fallbackPath, location]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRole && user) {
      // Check if user has required role
      if (user.role !== requiredRole) {
        // Redirect to unauthorized page or dashboard
        navigate('/specs', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, navigate]);

  // Show loading spinner while authentication state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  // Don't render children if role check fails (will be redirected)
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  // User is authenticated and authorized, render the protected content
  return <>{children}</>;
};

/**
 * Higher-order component version of ProtectedRoute for more flexible usage
 */
export const withAuthProtection = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: string;
    fallbackPath?: string;
  }
) => {
  const ProtectedComponent: React.FC<P> = (props) => {
    return (
      <ProtectedRoute
        requiredRole={options?.requiredRole}
        fallbackPath={options?.fallbackPath}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withAuthProtection(${Component.displayName || Component.name})`;
  return ProtectedComponent;
};

/**
 * Hook for checking authentication status and permissions within components
 */
export const useAuthGuard = (requiredRole?: string) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const checkAccess = () => {
    if (!isLoading && !isAuthenticated) {
      const redirectUrl = location.pathname + location.search;
      navigate('/auth', {
        state: { from: redirectUrl },
        replace: true,
      });
      return false;
    }

    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      navigate('/specs', { replace: true });
      return false;
    }

    return isAuthenticated;
  };

  return {
    isAuthenticated,
    isAuthorized: !requiredRole || user?.role === requiredRole,
    isLoading,
    user,
    checkAccess,
  };
};
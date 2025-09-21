import React, { useState, useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { AuthView, LoginFormData, SignUpFormData, ResetPasswordFormData, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/core/context/auth-context';
import { useNavigate, useLocation } from 'react-router';

interface AuthScreenProps {
  onAuthSuccess?: (user: User) => void;
  initialView?: AuthView;
}

export function AuthScreen({ onAuthSuccess, initialView = 'login' }: AuthScreenProps) {
  const [currentView, setCurrentView] = useState<AuthView>(initialView);
  const { login, signup, isLoading, error, clearError, isAuthenticated, user } = useAuth();
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from || '/specs';
      onAuthSuccess?.(user);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state, onAuthSuccess]);

  const clearMessages = () => {
    clearError();
    setSuccess(null);
  };

  const handleLogin = async (data: LoginFormData) => {
    clearMessages();

    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        toast.success('Welcome back! You have successfully signed in.');
        // Navigation will be handled by the useEffect above
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      toast.error(errorMessage);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    clearMessages();

    try {
      const signupData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        company: data.company,
        role: data.role,
      };

      const result = await signup(signupData);

      if (result.success) {
        toast.success('Account created successfully! Welcome to YASP.');
        // Navigation will be handled by the useEffect above
      } else {
        toast.error(result.error || 'Signup failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      toast.error(errorMessage);
    }
  };

  const handleForgotPassword = () => {
    setCurrentView('forgot-password');
    clearMessages();
  };

  const handleResetPassword = async (_data: ResetPasswordFormData) => {
    clearMessages();

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock reset password logic
      setSuccess('Password reset email sent successfully!');
      toast.success('Password reset link sent to your email address.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
      toast.error(errorMessage);
    }
  };

  // Auto-clear messages after 5 seconds
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'login' && (
              <div className="p-8">
                <LoginForm
                  onSubmit={handleLogin}
                  onForgotPassword={handleForgotPassword}
                  onSignUp={() => {
                    setCurrentView('signup');
                    clearMessages();
                  }}
                  loading={isLoading}
                  error={error}
                />
              </div>
            )}

            {currentView === 'signup' && (
              <div className="p-8">
                <SignUpForm
                  onSubmit={handleSignUp}
                  onSignIn={() => {
                    setCurrentView('login');
                    clearMessages();
                  }}
                  loading={isLoading}
                  error={error}
                />
              </div>
            )}

            {currentView === 'forgot-password' && (
              <div className="p-8">
                <ForgotPasswordForm
                  onSubmit={handleResetPassword}
                  onBackToLogin={() => {
                    setCurrentView('login');
                    clearMessages();
                  }}
                  loading={isLoading}
                  error={error}
                  success={!!success}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <button className="text-primary hover:text-primary/80 underline">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-primary hover:text-primary/80 underline">
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { AuthView, LoginFormData, SignUpFormData, User } from '../types';
import { generateMockUser } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
  initialView?: AuthView;
  user?: User | null;
}

export function AuthScreen({ onAuthSuccess, initialView = 'login', user }: AuthScreenProps) {
  const [currentView, setCurrentView] = useState<AuthView>(user ? 'profile' : initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [, setCurrentUser] = useState<User | null>(user || null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    clearMessages();

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock authentication logic
      if (data.email === 'admin@example.com' && data.password === 'password') {
        const mockUser = generateMockUser();
        setCurrentUser(mockUser);
        onAuthSuccess(mockUser);
        toast.success('Welcome back! You have successfully signed in.');
      } else {
        throw new Error('Invalid email or password. Try admin@example.com / password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setLoading(true);
    clearMessages();

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock user creation
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        role: data.role,
        avatar: '',
        emailVerified: false,
        twoFactorEnabled: false,
        socialAccounts: [],
        notificationPreferences: {
          emailNotifications: true,
          apiUpdates: true,
          securityAlerts: true,
          marketingEmails: false
        },
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      setCurrentUser(newUser);
      onAuthSuccess(newUser);
      toast.success('Account created successfully! Welcome to YASP.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setCurrentView('forgot-password');
    clearMessages();
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
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'login' && (
              <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-lg">
                <LoginForm
                  onSubmit={handleLogin}
                  onForgotPassword={handleForgotPassword}
                  onSignUp={() => {
                    setCurrentView('signup');
                    clearMessages();
                  }}
                  loading={loading}
                  error={error}
                />
              </div>
            )}

            {currentView === 'signup' && (
              <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-lg">
                <SignUpForm
                  onSubmit={handleSignUp}
                  onSignIn={() => {
                    setCurrentView('login');
                    clearMessages();
                  }}
                  loading={loading}
                  error={error}
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
import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { EmailVerificationScreen } from './EmailVerificationScreen';
import { ProfileScreen } from './ProfileScreen';
import { AuthView, LoginFormData, SignUpFormData, ResetPasswordFormData, User, ProfileFormData, ChangePasswordFormData, NotificationPreferences } from './types';
import { generateMockUser } from './utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';

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
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const [emailForVerification, setEmailForVerification] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

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
      setEmailForVerification(data.email);
      setCurrentView('verify-email');
      toast.success('Account created successfully! Please verify your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (data: ResetPasswordFormData) => {
    setLoading(true);
    clearMessages();

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setResetPasswordSuccess(true);
      toast.success('Password reset email sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    clearMessages();

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Verification email resent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerificationContinue = () => {
    if (currentUser) {
      // Simulate email verification
      setEmailVerified(true);
      const verifiedUser = { ...currentUser, emailVerified: true };
      setCurrentUser(verifiedUser);
      onAuthSuccess(verifiedUser);
      toast.success('Email verified successfully! Welcome to the platform.');
    }
  };

  const handleUpdateProfile = async (data: ProfileFormData) => {
    if (!currentUser) return;

    setLoading(true);
    clearMessages();

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser = {
        ...currentUser,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        company: data.company,
        role: data.role
      };
      
      setCurrentUser(updatedUser);
      setSuccess('Profile updated successfully!');
      toast.success('Your profile has been updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    setLoading(true);
    clearMessages();

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Password changed successfully!');
      toast.success('Your password has been updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async (preferences: NotificationPreferences) => {
    if (!currentUser) return;

    try {
      const updatedUser = {
        ...currentUser,
        notificationPreferences: preferences
      };
      
      setCurrentUser(updatedUser);
      toast.success('Notification preferences updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notifications');
    }
  };

  const handleUploadAvatar = async (file: File) => {
    if (!currentUser) return;

    setLoading(true);
    clearMessages();

    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would upload to a file storage service
      const mockAvatarUrl = URL.createObjectURL(file);
      
      const updatedUser = {
        ...currentUser,
        avatar: mockAvatarUrl
      };
      
      setCurrentUser(updatedUser);
      toast.success('Profile picture updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentUser) return;

    try {
      const updatedUser = {
        ...currentUser,
        avatar: ''
      };
      
      setCurrentUser(updatedUser);
      toast.success('Profile picture removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove avatar');
    }
  };

  const handleConnectSocial = async (provider: string) => {
    console.log(`Connecting to ${provider}`);
    toast.info(`${provider} connection would be handled by OAuth flow`);
  };

  const handleDisconnectSocial = async (provider: string) => {
    console.log(`Disconnecting from ${provider}`);
    toast.success(`Disconnected from ${provider}`);
  };

  const handleDeleteAccount = async () => {
    console.log('Deleting account');
    toast.success('Account deletion request submitted');
  };

  const handleBackToDashboard = () => {
    if (currentUser) {
      onAuthSuccess(currentUser);
    }
  };

  // Auto-clear messages after 5 seconds
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const getPageTitle = () => {
    switch (currentView) {
      case 'login':
        return 'Sign In';
      case 'signup':
        return 'Sign Up';
      case 'forgot-password':
        return 'Reset Password';
      case 'verify-email':
        return 'Verify Email';
      case 'profile':
        return 'Profile Settings';
      default:
        return 'Authentication';
    }
  };

  if (currentView === 'profile' && currentUser) {
    return (
      <ProfileScreen
        user={currentUser}
        onUpdateProfile={handleUpdateProfile}
        onChangePassword={handleChangePassword}
        onUpdateNotifications={handleUpdateNotifications}
        onUploadAvatar={handleUploadAvatar}
        onRemoveAvatar={handleRemoveAvatar}
        onConnectSocial={handleConnectSocial}
        onDisconnectSocial={handleDisconnectSocial}
        onDeleteAccount={handleDeleteAccount}
        onBackToDashboard={handleBackToDashboard}
        loading={loading}
        error={error}
        success={success}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(15,98,254,0.08)_0%,_transparent_50%)] bg-no-repeat" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(36,161,72,0.06)_0%,_transparent_50%)] bg-no-repeat" />
      
      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'login' && (
              <div className="bg-card border border-border rounded-none p-8 card-shadow">
                <LoginForm
                  onSubmit={handleLogin}
                  onForgotPassword={() => {
                    setCurrentView('forgot-password');
                    clearMessages();
                  }}
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
              <div className="bg-card border border-border rounded-none p-8 card-shadow">
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

            {currentView === 'forgot-password' && (
              <div className="bg-card border border-border rounded-none p-8 card-shadow">
                <ForgotPasswordForm
                  onSubmit={handleForgotPassword}
                  onBackToLogin={() => {
                    setCurrentView('login');
                    clearMessages();
                    setResetPasswordSuccess(false);
                  }}
                  loading={loading}
                  error={error}
                  success={resetPasswordSuccess}
                />
              </div>
            )}

            {currentView === 'verify-email' && (
              <div className="bg-card border border-border rounded-none p-8 card-shadow">
                <EmailVerificationScreen
                  email={emailForVerification}
                  onResendEmail={handleResendVerification}
                  onContinue={handleEmailVerificationContinue}
                  loading={loading}
                  error={error}
                  verified={emailVerified}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-muted-foreground">
            By continuing, you agree to our{' '}
            <button className="text-primary hover:text-primary/80 underline underline-offset-2">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-primary hover:text-primary/80 underline underline-offset-2">
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
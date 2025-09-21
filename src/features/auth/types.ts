export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  role?: string;
  avatar?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  socialAccounts: SocialAccount[];
  notificationPreferences: NotificationPreferences;
  createdAt: string;
  lastLogin: string;
}

export interface SocialAccount {
  provider: 'google' | 'github' | 'microsoft';
  id: string;
  email: string;
  connectedAt: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  apiUpdates: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  company?: string;
  role?: string;
  acceptTerms: boolean;
  captchaToken?: string;
}

export interface ResetPasswordFormData {
  email: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  role?: string;
}

export type AuthView = 'login' | 'signup' | 'forgot-password' | 'verify-email' | 'profile';

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}
// Auth components
export { AuthScreen } from './components/AuthScreen';
export { LoginForm } from './components/LoginForm';
export { SignUpForm } from './components/SignUpForm';
export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export { SocialAuthButtons } from './components/SocialAuthButtons';
export { PasswordStrengthMeter } from './components/PasswordStrengthMeter';

// Auth types
export type {
  User,
  SocialAccount,
  NotificationPreferences,
  AuthState,
  LoginFormData,
  SignUpFormData,
  ResetPasswordFormData,
  ChangePasswordFormData,
  ProfileFormData,
  AuthView,
  PasswordStrength,
  ValidationError
} from './types';

// Auth utilities
export {
  validateEmail,
  validatePassword,
  checkPasswordStrength,
  validateName,
  validatePasswordMatch,
  getPasswordStrengthColor,
  getPasswordStrengthText,
  formatName,
  getInitials,
  formatDate,
  generateMockUser
} from './utils';
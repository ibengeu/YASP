import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { SocialAuthButtons } from './SocialAuthButtons';
import { LoginFormData, ValidationError } from './types';
import { validateEmail, validatePassword } from './utils';
import { motion } from 'motion/react';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
  loading?: boolean;
  error?: string | null;
}

export function LoginForm({ 
  onSubmit, 
  onForgotPassword, 
  onSignUp, 
  loading = false, 
  error 
}: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: ValidationError[] = [];
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.push(emailError);
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.push(passwordError);
    
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (touched[field]) {
      setValidationErrors(prev => prev.filter(error => error.field !== field));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: string) => {
    return validationErrors.find(error => error.field === field);
  };

  const handleSocialAuth = async (provider: string) => {
    console.log(`Authenticating with ${provider}`);

    // Mock social auth - simulate successful login
    const mockUserData = {
      email: `user@${provider}.com`,
      password: 'social-auth', // Not used for social auth
      rememberMe: true
    };

    // Call the parent's onSubmit with mock data to trigger login flow
    onSubmit(mockUserData);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-sans text-2xl font-normal leading-tight tracking-0">Welcome back</h1>
        <p className="font-sans text-base font-normal leading-normal tracking-0 text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive" className="border-destructive bg-destructive/10">
            <AlertDescription className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px]">{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Social Auth */}
      <SocialAuthButtons
        onGoogleAuth={() => handleSocialAuth('google')}
        onGithubAuth={() => handleSocialAuth('github')}
        loading={loading}
        mode="signin"
      />

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={`font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] ${
              getFieldError('email') ? 'border-destructive' : ''
            }`}
            disabled={loading}
            autoComplete="email"
            aria-describedby={getFieldError('email') ? 'email-error' : undefined}
          />
          {getFieldError('email') && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="email-error"
              className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-destructive"
            >
              {getFieldError('email')?.message}
            </motion.p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              className={`font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] pr-12 ${
                getFieldError('password') ? 'border-destructive' : ''
              }`}
              disabled={loading}
              autoComplete="current-password"
              aria-describedby={getFieldError('password') ? 'password-error' : undefined}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
              disabled={loading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {getFieldError('password') && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="password-error"
              className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-destructive"
            >
              {getFieldError('password')?.message}
            </motion.p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => handleInputChange('rememberMe', !!checked)}
              disabled={loading}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label 
              htmlFor="remember" 
              className="text-sm font-normal cursor-pointer"
            >
              Remember me
            </Label>
          </div>
          
          <Button
            type="button"
            variant="link"
            onClick={onForgotPassword}
            className="p-0 h-auto text-sm text-primary hover:text-primary/80"
            disabled={loading}
          >
            Forgot password?
          </Button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              <span>Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </form>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Button
            type="button"
            variant="link"
            onClick={onSignUp}
            className="p-0 h-auto text-sm text-primary hover:text-primary/80 font-medium"
            disabled={loading}
          >
            Sign up
          </Button>
        </p>
      </div>
    </div>
  );
}
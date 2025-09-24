import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Building, Briefcase, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { SocialAuthButtons } from './SocialAuthButtons';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { SignUpFormData, ValidationError, PasswordStrength } from './types';
import { validateEmail, validateName, validatePassword, validatePasswordMatch, checkPasswordStrength } from './utils';
import { motion } from 'motion/react';

interface SignUpFormProps {
  onSubmit: (data: SignUpFormData) => void;
  onSignIn: () => void;
  loading?: boolean;
  error?: string | null;
}

export function SignUpForm({ 
  onSubmit, 
  onSignIn, 
  loading = false, 
  error 
}: SignUpFormProps) {
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: '',
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: ValidationError[] = [];
    
    const firstNameError = validateName(formData.firstName, 'firstName');
    if (firstNameError) errors.push(firstNameError);
    
    const lastNameError = validateName(formData.lastName, 'lastName');
    if (lastNameError) errors.push(lastNameError);
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.push(emailError);
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.push(passwordError);
    
    const passwordMatchError = validatePasswordMatch(formData.password, formData.confirmPassword);
    if (passwordMatchError) errors.push(passwordMatchError);
    
    if (!formData.acceptTerms) {
      errors.push({ field: 'acceptTerms', message: 'You must accept the Terms of Service and Privacy Policy' });
    }
    
    setValidationErrors(errors);
    
    if (errors.length === 0 && passwordStrength.isValid) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof SignUpFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update password strength for password field
    if (field === 'password' && typeof value === 'string') {
      setPasswordStrength(checkPasswordStrength(value));
    }
    
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
    console.log(`Signing up with ${provider}`);

    // Mock social auth - simulate successful signup
    const mockUserData = {
      firstName: 'Social',
      lastName: 'User',
      email: `user@${provider}.com`,
      password: 'social-auth', // Not used for social auth
      confirmPassword: 'social-auth',
      company: '',
      role: '',
      acceptTerms: true
    };

    // Call the parent's onSubmit with mock data to trigger signup flow
    onSubmit(mockUserData);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-sans text-2xl font-normal leading-tight tracking-0">Create your account</h1>
        <p className="font-sans text-base font-normal leading-normal tracking-0 text-muted-foreground">
          Join us to start managing your APIs
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
        mode="signup"
      />

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              onBlur={() => handleBlur('firstName')}
              className={`font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] ${
                getFieldError('firstName') ? 'border-destructive' : ''
              }`}
              disabled={loading}
              autoComplete="given-name"
              aria-describedby={getFieldError('firstName') ? 'firstName-error' : undefined}
            />
            {getFieldError('firstName') && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                id="firstName-error"
                className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-destructive"
              >
                {getFieldError('firstName')?.message}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              onBlur={() => handleBlur('lastName')}
              className={`font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] ${
                getFieldError('lastName') ? 'border-destructive' : ''
              }`}
              disabled={loading}
              autoComplete="family-name"
              aria-describedby={getFieldError('lastName') ? 'lastName-error' : undefined}
            />
            {getFieldError('lastName') && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                id="lastName-error"
                className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-destructive"
              >
                {getFieldError('lastName')?.message}
              </motion.p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
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

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] pr-12 ${
                  getFieldError('password') ? 'border-destructive' : ''
                }`}
                disabled={loading}
                autoComplete="new-password"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className={`font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] pr-12 ${
                  getFieldError('confirmPassword') ? 'border-destructive' : ''
                }`}
                disabled={loading}
                autoComplete="new-password"
                aria-describedby={getFieldError('confirmPassword') ? 'confirmPassword-error' : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
                disabled={loading}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {getFieldError('confirmPassword') && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                id="confirmPassword-error"
                className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-destructive"
              >
                {getFieldError('confirmPassword')?.message}
              </motion.p>
            )}
          </div>
        </div>

        {/* Password Strength Meter */}
        <PasswordStrengthMeter strength={passwordStrength} password={formData.password} />

        {/* Optional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company (optional)</Label>
            <Input
              id="company"
              type="text"
              placeholder="Acme Corp"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px]"
              disabled={loading}
              autoComplete="organization"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role (optional)</Label>
            <Input
              id="role"
              type="text"
              placeholder="Developer"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px]"
              disabled={loading}
              autoComplete="organization-title"
            />
          </div>
        </div>

        {/* Terms Acceptance */}
        <div className="space-y-2">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="acceptTerms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => handleInputChange('acceptTerms', !!checked)}
              disabled={loading}
              className={`mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary ${
                getFieldError('acceptTerms') ? 'border-destructive' : ''
              }`}
              aria-describedby={getFieldError('acceptTerms') ? 'acceptTerms-error' : undefined}
            />
            <Label 
              htmlFor="acceptTerms" 
              className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] cursor-pointer"
            >
              I agree to the{' '}
              <Button variant="link" className="p-0 h-auto font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-primary hover:text-primary/80">
                Terms of Service
              </Button>{' '}
              and{' '}
              <Button variant="link" className="p-0 h-auto font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-primary hover:text-primary/80">
                Privacy Policy
              </Button>
            </Label>
          </div>
          {getFieldError('acceptTerms') && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="acceptTerms-error"
              className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-destructive ml-8"
            >
              {getFieldError('acceptTerms')?.message}
            </motion.p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !passwordStrength.isValid}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              <span>Creating account...</span>
            </div>
          ) : (
            <span>Create Account</span>
          )}
        </Button>
      </form>

      {/* Sign In Link */}
      <div className="text-center">
        <p className="font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-muted-foreground">
          Already have an account?{' '}
          <Button
            type="button"
            variant="link"
            onClick={onSignIn}
            className="p-0 h-auto font-sans text-sm font-normal leading-[1.29] tracking-[0.16px] text-primary hover:text-primary/80"
            disabled={loading}
          >
            Sign in
          </Button>
        </p>
      </div>
    </div>
  );
}
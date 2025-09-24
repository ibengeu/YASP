import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Building, Briefcase, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/core/components/ui/tooltip';
import { SocialAuthButtons } from './SocialAuthButtons';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { SignUpFormData, ValidationError, PasswordStrength } from '../types';
import { validateEmail, validateName, validatePassword, validatePasswordMatch, checkPasswordStrength } from '../utils';
import { motion } from 'framer-motion';

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

  const handleSocialAuth = (provider: string) => {
    console.log(`Signing up with ${provider}`);
    // In a real app, this would trigger OAuth flow
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl tracking-tight">Create your account</h1>
        <p className="text-muted-foreground">
          Join us to start managing your APIs
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Social Auth */}
      <SocialAuthButtons
        onGoogleAuth={() => handleSocialAuth('google')}
        onGithubAuth={() => handleSocialAuth('github')}
        onMicrosoftAuth={() => handleSocialAuth('microsoft')}
        loading={loading}
        mode="signup"
      />

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                onBlur={() => handleBlur('firstName')}
                className={`pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 ${
                  getFieldError('firstName') ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
                }`}
                disabled={loading}
                autoComplete="given-name"
                aria-describedby={getFieldError('firstName') ? 'firstName-error' : undefined}
              />
            </div>
            {getFieldError('firstName') && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                id="firstName-error"
                className="text-sm text-destructive"
              >
                {getFieldError('firstName')?.message}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                onBlur={() => handleBlur('lastName')}
                className={`pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 ${
                  getFieldError('lastName') ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
                }`}
                disabled={loading}
                autoComplete="family-name"
                aria-describedby={getFieldError('lastName') ? 'lastName-error' : undefined}
              />
            </div>
            {getFieldError('lastName') && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                id="lastName-error"
                className="text-sm text-destructive"
              >
                {getFieldError('lastName')?.message}
              </motion.p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={`pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 rounded-xl ${
                getFieldError('email') ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
              }`}
              disabled={loading}
              autoComplete="email"
              aria-describedby={getFieldError('email') ? 'email-error' : undefined}
            />
          </div>
          {getFieldError('email') && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="email-error"
              className="text-sm text-destructive"
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
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`pl-12 pr-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 ${
                  getFieldError('password') ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
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
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-secondary/50"
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                id="password-error"
                className="text-sm text-destructive"
              >
                {getFieldError('password')?.message}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className={`pl-12 pr-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 ${
                  getFieldError('confirmPassword') ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
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
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-secondary/50"
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                id="confirmPassword-error"
                className="text-sm text-destructive"
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
            <div className="flex items-center gap-2">
              <Label htmlFor="company">Company</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Optional - helps us understand your use case</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="company"
                type="text"
                placeholder="Acme Corp (optional)"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30"
                disabled={loading}
                autoComplete="organization"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="role">Role</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your job title or role in your organization</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="role"
                type="text"
                placeholder="Developer (optional)"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30"
                disabled={loading}
                autoComplete="organization-title"
              />
            </div>
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
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              I agree to the{' '}
              <Button variant="link" className="p-0 h-auto text-sm text-primary hover:text-primary/80">
                Terms of Service
              </Button>{' '}
              and{' '}
              <Button variant="link" className="p-0 h-auto text-sm text-primary hover:text-primary/80">
                Privacy Policy
              </Button>
            </Label>
          </div>
          {getFieldError('acceptTerms') && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="acceptTerms-error"
              className="text-sm text-destructive ml-8"
            >
              {getFieldError('acceptTerms')?.message}
            </motion.p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !passwordStrength.isValid}
          className="w-full h-12 bg-primary hover:bg-primary/90 card-shadow-sm"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              <span>Creating account...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </form>

      {/* Sign In Link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Button
            type="button"
            variant="link"
            onClick={onSignIn}
            className="p-0 h-auto text-sm text-primary hover:text-primary/80 font-medium"
            disabled={loading}
          >
            Sign in
          </Button>
        </p>
      </div>
    </div>
  );
}
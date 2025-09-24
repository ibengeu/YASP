import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { ResetPasswordFormData, ValidationError } from '../types';
import { validateEmail } from '../utils';
import { motion } from 'framer-motion';

interface ForgotPasswordFormProps {
  onSubmit: (data: ResetPasswordFormData) => void;
  onBackToLogin: () => void;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
}

export function ForgotPasswordForm({
  onSubmit,
  onBackToLogin,
  loading = false,
  error,
  success = false
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setValidationErrors([emailError]);
      return;
    }

    setValidationErrors([]);
    onSubmit({ email });
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);

    // Clear validation error if field was touched
    if (touched) {
      setValidationErrors([]);
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const getFieldError = () => {
    return validationErrors.find(error => error.field === 'email');
  };

  if (success) {
    return (
      <div className="space-y-8">
        {/* Success State */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto"
          >
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-3xl tracking-tight">Check your email</h1>
            <p className="text-muted-foreground leading-relaxed">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <AlertDescription className="text-sm">
              <strong>Didn't receive the email?</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Check your spam or junk folder</li>
                <li>• Make sure the email address is correct</li>
                <li>• The link will expire in 15 minutes</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => onSubmit({ email })}
            variant="outline"
            disabled={loading}
            className="w-full h-12 border-border/50 hover:bg-secondary/50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Resending...</span>
              </div>
            ) : (
              'Resend email'
            )}
          </Button>

          <Button
            onClick={onBackToLogin}
            variant="ghost"
            className="w-full h-12 hover:bg-secondary/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to sign in
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl tracking-tight">Reset your password</h1>
        <p className="text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password
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

      {/* Reset Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleBlur}
              className={`pl-12 h-12 bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 ${
                getFieldError() ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''
              }`}
              disabled={loading}
              autoComplete="email"
              autoFocus
              aria-describedby={getFieldError() ? 'email-error' : undefined}
            />
          </div>
          {getFieldError() && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              id="email-error"
              className="text-sm text-destructive"
            >
              {getFieldError()?.message}
            </motion.p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !email}
          className="w-full h-12 bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              <span>Sending reset link...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Send reset link</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </form>

      {/* Back to Login */}
      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          onClick={onBackToLogin}
          className="text-sm text-muted-foreground hover:text-foreground"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
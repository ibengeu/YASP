import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { motion } from 'motion/react';

interface EmailVerificationScreenProps {
  email: string;
  onResendEmail: () => void;
  onContinue: () => void;
  loading?: boolean;
  error?: string | null;
  verified?: boolean;
}

export function EmailVerificationScreen({ 
  email,
  onResendEmail,
  onContinue,
  loading = false,
  error,
  verified = false
}: EmailVerificationScreenProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  const handleResend = () => {
    onResendEmail();
    setTimeLeft(60);
    setCanResend(false);
  };

  if (verified) {
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
            <h1 className="text-3xl tracking-tight">Email verified!</h1>
            <p className="text-muted-foreground leading-relaxed">
              Your email address has been successfully verified. You can now access all features.
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={onContinue}
            className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl card-shadow-sm"
          >
            <span>Continue to dashboard</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto"
        >
          <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-3xl tracking-tight">Verify your email</h1>
          <p className="text-muted-foreground leading-relaxed">
            We've sent a verification link to <strong>{email}</strong>
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5 rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 rounded-xl">
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium">Please check your email and click the verification link.</p>
              <div className="text-sm space-y-1">
                <p><strong>Didn't receive the email?</strong></p>
                <ul className="space-y-1 text-xs">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure the email address is correct</li>
                  <li>• The link will expire in 24 hours</li>
                </ul>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        {/* Resend Button */}
        <Button
          onClick={handleResend}
          variant="outline"
          disabled={loading || !canResend}
          className="w-full h-12 border-border/50 hover:bg-secondary/50 rounded-xl"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Resending...</span>
            </div>
          ) : canResend ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Resend verification email</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Resend in {timeLeft}s</span>
            </div>
          )}
        </Button>

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          variant="ghost"
          className="w-full h-12 hover:bg-secondary/50 rounded-xl"
        >
          I'll verify later
        </Button>
      </motion.div>

      {/* Footer note */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          You can use the platform with limited features until your email is verified.
        </p>
      </div>
    </div>
  );
}
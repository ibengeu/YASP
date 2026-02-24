import { useState, useCallback } from 'react';
import {
  incrementAction,
  shouldShowEmailGate,
  markEmailCaptured,
  dismissEmailGate,
  hasLeadEmail,
} from '@/lib/action-tracker';

export function useActionTracker() {
  const [showGate, setShowGate] = useState(false);

  const trackAction = useCallback(() => {
    incrementAction();
    if (shouldShowEmailGate()) {
      setShowGate(true);
    }
  }, []);

  const captureEmail = useCallback((email: string) => {
    markEmailCaptured(email);
    setShowGate(false);
  }, []);

  const dismiss = useCallback(() => {
    dismissEmailGate();
    setShowGate(false);
  }, []);

  const hasCapturedEmail = useCallback(() => {
    return hasLeadEmail();
  }, []);

  return { showGate, trackAction, captureEmail, dismiss, hasCapturedEmail };
}

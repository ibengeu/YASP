/**
 * TDD Cycle 3: Action Tracker (localStorage-based)
 * Tests for action counting, gate logic, dismiss/re-prompt
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  incrementAction,
  getActionCount,
  shouldShowEmailGate,
  markEmailCaptured,
  dismissEmailGate,
  hasLeadEmail,
} from '@yasp/core/lib/action-tracker';

describe('action-tracker', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('incrementAction / getActionCount', () => {
    it('should start at 0', () => {
      expect(getActionCount()).toBe(0);
    });

    it('should increment by 1 each call', () => {
      incrementAction();
      expect(getActionCount()).toBe(1);
      incrementAction();
      expect(getActionCount()).toBe(2);
    });
  });

  describe('shouldShowEmailGate', () => {
    it('should return false when action count < 3', () => {
      incrementAction();
      incrementAction();
      expect(shouldShowEmailGate()).toBe(false);
    });

    it('should return true when action count >= 3', () => {
      incrementAction();
      incrementAction();
      incrementAction();
      expect(shouldShowEmailGate()).toBe(true);
    });

    it('should return false if email already captured', () => {
      incrementAction();
      incrementAction();
      incrementAction();
      markEmailCaptured('test@example.com');
      expect(shouldShowEmailGate()).toBe(false);
    });

    it('should return false immediately after dismiss', () => {
      incrementAction();
      incrementAction();
      incrementAction();
      dismissEmailGate();
      expect(shouldShowEmailGate()).toBe(false);
    });

    it('should re-prompt after 3 more actions post-dismiss', () => {
      // First round: 3 actions → gate
      incrementAction();
      incrementAction();
      incrementAction();
      expect(shouldShowEmailGate()).toBe(true);

      // Dismiss
      dismissEmailGate();
      expect(shouldShowEmailGate()).toBe(false);

      // 2 more actions — not enough
      incrementAction();
      incrementAction();
      expect(shouldShowEmailGate()).toBe(false);

      // 3rd action after dismiss — gate again
      incrementAction();
      expect(shouldShowEmailGate()).toBe(true);
    });
  });

  describe('markEmailCaptured / hasLeadEmail', () => {
    it('should return false when no email captured', () => {
      expect(hasLeadEmail()).toBe(false);
    });

    it('should return true after email capture', () => {
      markEmailCaptured('user@example.com');
      expect(hasLeadEmail()).toBe(true);
    });

    it('should persist email in localStorage', () => {
      markEmailCaptured('user@example.com');
      expect(localStorage.getItem('yasp_lead_email')).toBe('user@example.com');
    });
  });
});

/**
 * Circuit Breaker Tests
 * Automatic provider failover for AI API reliability
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CircuitBreaker, CircuitBreakerState } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 5000, // 5 seconds for testing
    });
  });

  afterEach(() => {
    // Clean up any timers
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should have zero failures', () => {
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe('success handling', () => {
    it('should remain CLOSED on successful call', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      await circuitBreaker.execute(fn);

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });

    it('should reset failure count on success', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      try {
        await circuitBreaker.execute(fn);
      } catch {}

      expect(circuitBreaker.getFailureCount()).toBe(1);

      await circuitBreaker.execute(fn);

      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe('failure handling', () => {
    it('should increment failure count on error', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      try {
        await circuitBreaker.execute(fn);
      } catch {}

      expect(circuitBreaker.getFailureCount()).toBe(1);
    });

    it('should open circuit after threshold failures', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch {}
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should reject immediately when circuit is OPEN', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch {}
      }

      // Try one more time
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');

      // Function should not have been called (4th time)
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('half-open state', () => {
    it('should transition to HALF_OPEN after reset timeout', async () => {
      const shortCircuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 100, // 100ms for faster test
      });

      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await shortCircuitBreaker.execute(fn);
        } catch {}
      }

      expect(shortCircuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Wait for transition
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortCircuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);

      shortCircuitBreaker.reset();
    });

    it('should close circuit on successful call in HALF_OPEN', async () => {
      const shortCircuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 100,
      });

      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await shortCircuitBreaker.execute(fn);
        } catch {}
      }

      // Wait for half-open
      await new Promise(resolve => setTimeout(resolve, 150));

      // Successful call should close circuit
      await shortCircuitBreaker.execute(fn);

      expect(shortCircuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(shortCircuitBreaker.getFailureCount()).toBe(0);

      shortCircuitBreaker.reset();
    });

    it('should reopen circuit on failure in HALF_OPEN', async () => {
      const shortCircuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 100,
      });

      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await shortCircuitBreaker.execute(fn);
        } catch {}
      }

      // Wait for half-open
      await new Promise(resolve => setTimeout(resolve, 150));

      // Failed call should reopen circuit
      try {
        await shortCircuitBreaker.execute(fn);
      } catch {}

      expect(shortCircuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      shortCircuitBreaker.reset();
    });
  });

  describe('edge cases', () => {
    it('should handle synchronous errors', async () => {
      const fn = vi.fn(() => {
        throw new Error('sync error');
      });

      try {
        await circuitBreaker.execute(fn);
      } catch {}

      expect(circuitBreaker.getFailureCount()).toBe(1);
    });

    it('should handle 429 rate limit errors', async () => {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;
      const fn = vi.fn().mockRejectedValue(error);

      try {
        await circuitBreaker.execute(fn);
      } catch {}

      expect(circuitBreaker.getFailureCount()).toBe(1);
    });

    it('should handle 500 server errors', async () => {
      const error = new Error('Server error');
      (error as any).status = 500;
      const fn = vi.fn().mockRejectedValue(error);

      try {
        await circuitBreaker.execute(fn);
      } catch {}

      expect(circuitBreaker.getFailureCount()).toBe(1);
    });
  });

  describe('manual control', () => {
    it('should allow manual reset', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch {}
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });
});

/**
 * TDD Cycle 4: Email Validation
 * Security: OWASP A07:2025 — Injection prevention via strict validation
 */

import { describe, it, expect } from 'vitest';
import { validateEmail, sanitizeEmail } from '@yasp/core/lib/email-validation';

describe('validateEmail', () => {
  it('should accept valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('name.surname@company.co.uk')).toBe(true);
    expect(validateEmail('user+tag@gmail.com')).toBe(true);
    expect(validateEmail('user123@test.io')).toBe(true);
  });

  it('should reject emails without @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('should reject emails without domain', () => {
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user@.')).toBe(false);
  });

  it('should reject emails without local part', () => {
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('should reject emails longer than 254 characters', () => {
    const longLocal = 'a'.repeat(246);
    expect(validateEmail(`${longLocal}@test.com`)).toBe(false);
  });

  it('should reject emails with injection characters', () => {
    // OWASP A07:2025 — Prevent header injection via email field
    expect(validateEmail('user\n@example.com')).toBe(false);
    expect(validateEmail('user\r@example.com')).toBe(false);
    expect(validateEmail('user<script>@example.com')).toBe(false);
    expect(validateEmail('user>@example.com')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe('sanitizeEmail', () => {
  it('should trim whitespace', () => {
    expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('should lowercase', () => {
    expect(sanitizeEmail('User@EXAMPLE.Com')).toBe('user@example.com');
  });

  it('should trim and lowercase together', () => {
    expect(sanitizeEmail('  User@Test.IO  ')).toBe('user@test.io');
  });
});

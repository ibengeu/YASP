/**
 * Email Validation & Sanitization
 * Security: OWASP A07:2025 — Strict validation prevents header injection
 */

const MAX_EMAIL_LENGTH = 254;

// RFC-compliant enough for practical use; blocks injection chars
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Mitigation: OWASP A07:2025 — Block characters used in header/HTML injection
const INJECTION_CHARS = /[\r\n<>]/;

export function validateEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;
  if (INJECTION_CHARS.test(email)) return false;
  return EMAIL_REGEX.test(email);
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

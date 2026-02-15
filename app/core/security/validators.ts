import { BLOCKED_METADATA_HOSTS, FILE_SIZE_LIMITS } from '@/lib/constants';

/**
 * Input Validation Service
 * Validates user inputs and prevents injection attacks
 *
 * Security: OWASP A03:2025 - Injection prevention
 * Security: OWASP A09:2025 - SSRF prevention
 */

/**
 * Validate URL for SSRF protection
 * Blocks cloud metadata endpoints only — localhost and private IPs are allowed
 * for local API development and testing.
 *
 * Security Mitigation: OWASP A09:2025 - Server-Side Request Forgery (SSRF)
 * - Block cloud metadata endpoints (169.254.169.254, metadata.google.internal, etc.)
 * - Block non-HTTP protocols
 */
export function validateApiUrl(url: string, _allowedDomains?: string[]): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block common cloud metadata endpoints
    if (BLOCKED_METADATA_HOSTS.includes(hostname as any)) {
      return { valid: false, error: 'Access to cloud metadata endpoints is not allowed' };
    }

    // Block metadata hostname keywords
    if (hostname.includes('metadata') || hostname.includes('instance-data')) {
      return { valid: false, error: 'Access to cloud metadata endpoints is not allowed' };
    }

    // Block cloud metadata IP range (169.254.0.0/16 — link-local, AWS metadata)
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = hostname.match(ipv4Pattern);
    if (ipv4Match) {
      const octets = ipv4Match.slice(1, 5).map(Number);
      if (octets[0] === 169 && octets[1] === 254) {
        return { valid: false, error: 'Cloud metadata IP range (169.254.0.0/16) is not allowed' };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate spec content size
 * Prevents DoS attacks via large file uploads
 *
 * Security Mitigation: OWASP A04:2025 - Insecure Design
 * - Enforce max file size limits to prevent memory exhaustion
 */
export function validateSpecContent(content: string): { valid: boolean; error?: string } {
  const MAX_SIZE = FILE_SIZE_LIMITS.maxInput;
  const byteSize = new Blob([content]).size;

  if (byteSize > MAX_SIZE) {
    return {
      valid: false,
      error: `Spec content exceeds maximum size of ${MAX_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validate string field length
 * Prevents injection attacks and database overflow
 */
export function validateStringLength(
  value: string,
  field: string,
  maxLength: number
): { valid: boolean; error?: string } {
  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${field} exceeds maximum length of ${maxLength} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validate allowed protocols
 */
export function validateProtocol(url: string): { valid: boolean; error?: string } {
  const ALLOWED_PROTOCOLS = ['http:', 'https:'];

  try {
    const parsed = new URL(url);
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return {
        valid: false,
        error: `Only ${ALLOWED_PROTOCOLS.join(', ')} protocols are allowed`,
      };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate workspace type
 */
export function validateWorkspaceType(type: string): type is 'personal' | 'team' | 'partner' | 'public' {
  return ['personal', 'team', 'partner', 'public'].includes(type);
}

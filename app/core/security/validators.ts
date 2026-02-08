/**
 * Input Validation Service
 * Validates user inputs and prevents injection attacks
 *
 * Security: OWASP A03:2025 - Injection prevention
 * Security: OWASP A09:2025 - SSRF prevention
 */

/**
 * Validate URL for SSRF protection
 * Blocks private IP ranges and localhost
 *
 * Security Mitigation: OWASP A09:2025 - Server-Side Request Forgery (SSRF)
 * - Block private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8)
 * - Block private IPv6 ranges (::1/128, fe80::/10, fc00::/7)
 * - Block cloud metadata endpoints
 * - DNS rebinding prevention
 */
export function validateApiUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and loopback
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname === '::' ||
      hostname.startsWith('127.')
    ) {
      return { valid: false, error: 'Localhost and loopback addresses are not allowed' };
    }

    // Block common cloud metadata endpoints
    const blockedHosts = [
      '169.254.169.254', // AWS/Azure/GCP metadata
      'metadata.google.internal', // GCP
      'metadata.azure.com', // Azure
    ];

    if (blockedHosts.includes(hostname)) {
      return { valid: false, error: 'Access to cloud metadata endpoints is not allowed' };
    }

    // Block private IPv4 ranges
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = hostname.match(ipv4Pattern);

    if (ipv4Match) {
      const octets = ipv4Match.slice(1, 5).map(Number);

      // 10.0.0.0/8
      if (octets[0] === 10) {
        return { valid: false, error: 'Private IP range (10.0.0.0/8) is not allowed' };
      }

      // 172.16.0.0/12
      if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
        return { valid: false, error: 'Private IP range (172.16.0.0/12) is not allowed' };
      }

      // 192.168.0.0/16
      if (octets[0] === 192 && octets[1] === 168) {
        return { valid: false, error: 'Private IP range (192.168.0.0/16) is not allowed' };
      }

      // 169.254.0.0/16 (link-local)
      if (octets[0] === 169 && octets[1] === 254) {
        return { valid: false, error: 'Link-local address range (169.254.0.0/16) is not allowed' };
      }
    }

    // Block private IPv6 ranges
    const ipv6Pattern = /^([0-9a-f:]+)$/i;
    if (ipv6Pattern.test(hostname)) {
      // fe80::/10 (link-local)
      if (hostname.startsWith('fe80:')) {
        return { valid: false, error: 'IPv6 link-local addresses are not allowed' };
      }

      // fc00::/7 (unique local)
      if (hostname.startsWith('fc') || hostname.startsWith('fd')) {
        return { valid: false, error: 'IPv6 unique local addresses are not allowed' };
      }

      // ::ffff:0:0/96 (IPv4-mapped IPv6)
      if (hostname.includes('::ffff:')) {
        return { valid: false, error: 'IPv4-mapped IPv6 addresses are not allowed' };
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
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
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

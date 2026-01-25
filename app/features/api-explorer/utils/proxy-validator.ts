/**
 * Proxy URL Validator
 * SSRF Protection for API Explorer
 *
 * Security: OWASP A10:2021 (SSRF)
 * References:
 * - https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
 * - https://owasp.org/Top10/2021/A10_2021-Server-Side_Request_Forgery_(SSRF)/
 *
 * Strategy: Allowlist-first approach
 * - Allow: Public HTTP/HTTPS APIs only
 * - Block: Private IPs, localhost, internal networks, metadata endpoints
 */

import { isIP } from 'node:net';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const ALLOWED_PORTS = [80, 443, 8080, 8443];

// Mitigation: OWASP A10:2021 (SSRF) - Block dangerous hostname keywords
const BLOCKED_HOSTNAME_KEYWORDS = [
  'localhost',
  'local',
  'internal',
  'intranet',
  'metadata',
  'instance-data',
];

/**
 * Validate URL for proxy requests
 * Prevents SSRF attacks by blocking private/internal network access
 *
 * @param url - Target URL to validate
 * @returns Validation result with error message if invalid
 */
export async function validateProxyUrl(url: string): Promise<ValidationResult> {
  // Step 1: Parse URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Step 2: Protocol validation
  // Mitigation: OWASP A10:2021 - Block dangerous protocols (file://, ftp://, gopher://)
  if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
    return {
      valid: false,
      error: `Protocol not allowed. Only HTTP/HTTPS permitted (got: ${parsedUrl.protocol})`,
    };
  }

  // Step 3: Hostname validation
  // Mitigation: OWASP A10:2021 - Block internal hostnames
  const hostname = parsedUrl.hostname.toLowerCase();
  for (const keyword of BLOCKED_HOSTNAME_KEYWORDS) {
    if (hostname.includes(keyword)) {
      return {
        valid: false,
        error: `Hostname blocked: Contains restricted keyword "${keyword}" (SSRF protection)`,
      };
    }
  }

  // Step 4: Port validation
  // Mitigation: OWASP A10:2021 - Restrict ports to prevent internal service scanning
  const port = parsedUrl.port
    ? parseInt(parsedUrl.port, 10)
    : parsedUrl.protocol === 'https:'
    ? 443
    : 80;

  if (!isAllowedPort(port)) {
    return {
      valid: false,
      error: `Port ${port} not allowed. Permitted ports: ${ALLOWED_PORTS.join(', ')}`,
    };
  }

  // Step 5: IP address validation
  // Mitigation: OWASP A10:2021 - Block private/internal IP addresses
  // Check if hostname is already an IP address (handles both IPv4 and IPv6)
  // For IPv6, URL constructor includes brackets [::1], so we need to strip them
  const hostnameWithoutBrackets = hostname.replace(/^\[|\]$/g, '');
  const ipVersion = isIP(hostnameWithoutBrackets);
  if (ipVersion !== 0) {
    // Hostname is an IP address
    if (isPrivateIP(hostnameWithoutBrackets)) {
      return {
        valid: false,
        error: 'Request blocked: IP address is in private/internal range. Only public APIs allowed for security.',
      };
    }
  }

  // DNS resolution would happen server-side in production
  // For now, we validate the direct IP if provided
  // In full implementation: resolve hostname → validate all IPs → check for DNS rebinding

  return { valid: true };
}

/**
 * Check if IP address is private/internal
 * Covers IPv4 and IPv6 private ranges
 *
 * Mitigation: OWASP A10:2021 (SSRF) - Block all private/internal IP ranges
 *
 * @param ip - IP address to check
 * @returns true if IP is private/internal
 */
export function isPrivateIP(ip: string): boolean {
  const ipVersion = isIP(ip);

  if (ipVersion === 4) {
    return isPrivateIPv4(ip);
  } else if (ipVersion === 6) {
    return isPrivateIPv6(ip);
  }

  // Not a valid IP
  return false;
}

/**
 * Check if IPv4 address is private
 * Covers: RFC 1918 private ranges + special-use ranges
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);

  // Mitigation: OWASP A10:2021 - Block private IPv4 ranges
  // 10.0.0.0/8
  if (parts[0] === 10) return true;

  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 127.0.0.0/8 (loopback)
  if (parts[0] === 127) return true;

  // 169.254.0.0/16 (link-local, AWS metadata)
  if (parts[0] === 169 && parts[1] === 254) return true;

  // 0.0.0.0/8 (current network)
  if (parts[0] === 0) return true;

  // 100.64.0.0/10 (shared address space)
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

  // 224.0.0.0/4 (multicast)
  if (parts[0] >= 224 && parts[0] <= 239) return true;

  // 240.0.0.0/4 (reserved)
  if (parts[0] >= 240 && parts[0] <= 255) return true;

  return false;
}

/**
 * Check if IPv6 address is private
 * Covers: Loopback, link-local, ULA, IPv4-mapped
 */
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();

  // Mitigation: OWASP A10:2021 - Block private IPv6 ranges
  // ::1 (loopback)
  if (lower === '::1' || lower === '0000:0000:0000:0000:0000:0000:0000:0001') {
    return true;
  }

  // fe80::/10 (link-local)
  if (lower.startsWith('fe80:')) return true;

  // fc00::/7 (unique local addresses - private)
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

  // ff00::/8 (multicast)
  if (lower.startsWith('ff')) return true;

  // ::ffff:0:0/96 (IPv4-mapped IPv6)
  // Check both with colons and with dots
  if (lower.includes('::ffff:')) {
    // Try to extract IPv4 part (e.g., ::ffff:127.0.0.1)
    const ipv4Match = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
    if (ipv4Match && ipv4Match[1]) {
      return isPrivateIPv4(ipv4Match[1]);
    }
    // If no dot notation found, it might be in hex (::ffff:7f00:1)
    // For simplicity, block all ::ffff: as they're IPv4-mapped
    return true;
  }

  return false;
}

/**
 * Check if port is allowed for proxy requests
 * Mitigation: OWASP A10:2021 - Restrict ports to common HTTP/HTTPS ports
 *
 * @param port - Port number
 * @returns true if port is allowed
 */
export function isAllowedPort(port: number): boolean {
  return ALLOWED_PORTS.includes(port);
}

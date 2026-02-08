/**
 * Server-Side Spec Fetch Action
 * Fetches OpenAPI specifications from external URLs, bypassing CORS.
 *
 * Security:
 * - OWASP A09:2025 (SSRF): URL validation blocks private IPs, internal hostnames, non-HTTP protocols
 * - OWASP A04:2025 (Insecure Design): 30s timeout, 5MB response size limit
 * - OWASP A07:2025 (Injection): URL parsed via new URL(), no string interpolation
 */

import { isPrivateIP } from '@/features/api-explorer/utils/proxy-validator';

export interface FetchSpecResult {
  content?: string;
  error?: string;
}

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT_MS = 30_000; // 30 seconds

// Mitigation: OWASP A09:2025 (SSRF) - Block dangerous hostname keywords
const BLOCKED_HOSTNAME_KEYWORDS = [
  'localhost',
  'local',
  'internal',
  'intranet',
  'metadata',
  'instance-data',
];

/**
 * Fetch an OpenAPI specification from an external URL (server-side).
 * Unlike the API proxy (executeApiRequest), this does NOT restrict ports,
 * since Swagger/OpenAPI specs commonly run on non-standard ports (8025, 5000, 3000, etc.).
 */
export async function fetchSpec(url: string): Promise<FetchSpecResult> {
  // Step 1: Parse and validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { error: 'Invalid URL format' };
  }

  // Step 2: Protocol validation
  // Mitigation: OWASP A09:2025 (SSRF) - Only allow HTTP/HTTPS
  if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
    return {
      error: `Protocol not allowed. Only HTTP/HTTPS permitted (got: ${parsedUrl.protocol})`,
    };
  }

  // Step 3: Hostname validation
  // Mitigation: OWASP A09:2025 (SSRF) - Block internal hostnames
  const hostname = parsedUrl.hostname.toLowerCase();
  for (const keyword of BLOCKED_HOSTNAME_KEYWORDS) {
    if (hostname.includes(keyword)) {
      return {
        error: `Hostname blocked: Contains restricted keyword "${keyword}" (SSRF protection)`,
      };
    }
  }

  // Step 4: IP address validation
  // Mitigation: OWASP A09:2025 (SSRF) - Block private/internal IP addresses
  const hostnameWithoutBrackets = hostname.replace(/^\[|\]$/g, '');
  if (isPrivateIP(hostnameWithoutBrackets)) {
    return {
      error: 'Request blocked: IP address is in private/internal range. Only public APIs allowed for security.',
    };
  }

  // Step 5: Fetch the spec
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        error: `HTTP error ${response.status}: ${response.statusText}`,
      };
    }

    // Step 6: Check response size before reading body
    // Mitigation: OWASP A04:2025 (Insecure Design) - Prevent oversized responses
    const contentLength = response.headers?.get?.('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      return {
        error: `Response too large (${Math.round(parseInt(contentLength, 10) / 1024 / 1024)}MB). Maximum size is 5MB.`,
      };
    }

    const content = await response.text();

    // Also check actual content size
    if (content.length > MAX_RESPONSE_SIZE) {
      return {
        error: 'Response too large. Maximum size is 5MB.',
      };
    }

    return { content };
  } catch (error: unknown) {
    // DOMException may not extend Error in all environments
    const name = error instanceof Error ? error.name : (error as { name?: string })?.name;
    if (name === 'AbortError') {
      return { error: 'Request timeout (30s exceeded)' };
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch specification';
    return { error: message };
  }
}

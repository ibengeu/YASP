/**
 * Resolve Server URL Utility
 *
 * Resolves relative OpenAPI server URLs against the source URL
 * from which the spec was fetched.
 *
 * Security: OWASP A09:2025 (SSRF) - Uses URL constructor for safe URL manipulation,
 * no string interpolation. All existing SSRF protections (private IP blocking,
 * hostname keyword blocking, protocol validation) remain in the proxy validator.
 */

/**
 * Resolve a potentially relative server URL against the source URL.
 *
 * If serverUrl is already absolute (starts with http:// or https://), returns as-is.
 * Otherwise, derives scheme + host + port from sourceUrl and prepends it.
 *
 * @param serverUrl - The server URL from the OpenAPI spec (may be relative)
 * @param sourceUrl - The URL from which the spec was fetched (optional)
 * @returns The resolved absolute URL, or the original if resolution isn't possible
 */
export function resolveServerUrl(serverUrl: string, sourceUrl?: string): string {
  if (!serverUrl) {
    return serverUrl;
  }

  // Already absolute — return as-is
  if (serverUrl.startsWith('http://') || serverUrl.startsWith('https://')) {
    return serverUrl;
  }

  // No source URL to resolve against — return original
  if (!sourceUrl) {
    return serverUrl;
  }

  // Mitigation for OWASP A07:2025 (Injection): Use URL constructor for safe parsing
  try {
    const source = new URL(sourceUrl);
    // Derive origin (scheme + host + port)
    const origin = source.origin;

    // Ensure the relative path starts with /
    const path = serverUrl.startsWith('/') ? serverUrl : `/${serverUrl}`;

    return `${origin}${path}`;
  } catch {
    // If sourceUrl is invalid, return original serverUrl unchanged
    return serverUrl;
  }
}

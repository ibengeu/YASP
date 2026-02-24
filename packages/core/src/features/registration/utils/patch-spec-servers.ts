/**
 * Patch Spec Servers Utility
 *
 * Ensures the stored spec content always has a servers array with the correct
 * base URL. Handles three cases:
 * 1. Spec has servers → patch with resolved URLs
 * 2. Spec has no servers → inject the user's endpoint as the server
 * 3. User's endpoint differs from spec servers → prepend it
 *
 * Security: OWASP A07:2025 (Injection) - Uses parse-modify-serialize pattern,
 * never string interpolation.
 */

import yaml from 'yaml';
import type { ServerConfig } from './spec-inference';

/**
 * Patch server URLs in spec content.
 *
 * @param content - The raw spec content string (JSON or YAML)
 * @param resolvedServers - Server configs with resolved absolute URLs from inferAllData (may be empty)
 * @param endpoint - The user's Base URL from the registration form
 * @returns The patched content string in the same format (JSON or YAML)
 */
export function patchSpecServers(
  content: string,
  resolvedServers: ServerConfig[],
  endpoint: string,
): string {
  // Detect format and parse
  const isJson = isJsonContent(content);
  let parsed: any;

  try {
    parsed = isJson ? JSON.parse(content) : yaml.parse(content);
  } catch {
    // If parsing fails, return content unchanged
    return content;
  }

  const isAsyncAPI = !!parsed.asyncapi;
  const normalizedEndpoint = endpoint.replace(/\/+$/, '');

  if (isAsyncAPI) {
    // Case: AsyncAPI (Servers is an object)
    if (!parsed.servers || typeof parsed.servers !== 'object') {
      parsed.servers = {};
    }

    const serverEntries = Object.entries(parsed.servers);
    const hasEndpoint = serverEntries.some(
      ([_, s]: [string, any]) => s.url?.replace(/\/+$/, '') === normalizedEndpoint
    );

    if (!hasEndpoint && normalizedEndpoint) {
      // Inject user's endpoint as a new server
      parsed.servers['production'] = {
        url: normalizedEndpoint,
        description: 'Production server provided during import'
      };
    }
  } else {
    // Case: OpenAPI (Servers is an array)
    const specServers = parsed.servers as Array<{ url: string; description?: string }> | undefined;

    if (specServers && Array.isArray(specServers) && specServers.length > 0) {
      // Patch existing resolved URLs
      if (resolvedServers.length > 0) {
        for (let i = 0; i < specServers.length && i < resolvedServers.length; i++) {
          specServers[i].url = resolvedServers[i].url;
        }
      }

      const hasEndpoint = specServers.some(
        (s) => s.url?.replace(/\/+$/, '') === normalizedEndpoint
      );
      if (!hasEndpoint && normalizedEndpoint) {
        specServers.unshift({ url: normalizedEndpoint });
      }
    } else if (endpoint) {
      parsed.servers = [{ url: normalizedEndpoint }];
    }
  }

  // Re-serialize in original format
  // Mitigation for OWASP A07:2025 (Injection): Serialize via library, not string interpolation
  return isJson ? JSON.stringify(parsed, null, 2) : yaml.stringify(parsed);
}

/**
 * Detect whether content is JSON (vs YAML)
 */
function isJsonContent(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

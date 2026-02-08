/**
 * Patch Spec Servers Utility
 *
 * Replaces server URLs in stored spec content (JSON or YAML) with resolved
 * absolute URLs. This ensures that downstream consumers (editor, Try It Out)
 * get correct absolute URLs when re-parsing the stored content.
 *
 * Security: OWASP A07:2025 (Injection) - Uses parse-modify-serialize pattern,
 * never string interpolation. Content is parsed, modified as objects, then
 * re-serialized in the original format.
 */

import yaml from 'yaml';
import type { ServerConfig } from './spec-inference';

/**
 * Patch server URLs in spec content with resolved absolute URLs.
 *
 * @param content - The raw spec content string (JSON or YAML)
 * @param resolvedServers - Server configs with resolved absolute URLs from inferAllData
 * @returns The patched content string in the same format (JSON or YAML)
 */
export function patchSpecServers(content: string, resolvedServers: ServerConfig[]): string {
  if (!resolvedServers || resolvedServers.length === 0) {
    return content;
  }

  // Detect format and parse
  const isJson = isJsonContent(content);
  let parsed: any;

  try {
    parsed = isJson ? JSON.parse(content) : yaml.parse(content);
  } catch {
    // If parsing fails, return content unchanged
    return content;
  }

  // Only patch if spec has servers array
  if (!parsed.servers || !Array.isArray(parsed.servers)) {
    return content;
  }

  // Replace server URLs with resolved URLs (by index)
  for (let i = 0; i < parsed.servers.length && i < resolvedServers.length; i++) {
    parsed.servers[i].url = resolvedServers[i].url;
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

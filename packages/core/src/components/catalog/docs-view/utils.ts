import type { ParsedOpenAPISpec, ParsedEndpoint, EndpointGroup, SchemaEntry } from './types';
import type { ParameterObject } from '@/types/openapi-spec';

// Expanded to include all HTTP methods per OpenAPI 3.x spec
const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'] as const;

/**
 * Merge path-level and operation-level parameters.
 * Operation-level params override path-level by name+in key.
 * Mitigation for OWASP A04:2025 – Insecure Design: merged params provide accurate
 * constraint info to UI, preventing incorrect validation assumptions.
 */
function mergeParameters(pathParams: ParameterObject[], opParams: ParameterObject[]): ParameterObject[] {
  const map = new Map<string, ParameterObject>();
  pathParams.forEach((p) => map.set(`${p.name}:${p.in}`, p));
  opParams.forEach((p) => map.set(`${p.name}:${p.in}`, p)); // op-level overrides path-level
  return Array.from(map.values());
}

// Parse endpoints from spec
export function parseEndpoints(spec: ParsedOpenAPISpec): ParsedEndpoint[] {
  if (!spec?.paths) return [];

  const endpoints: ParsedEndpoint[] = [];
  Object.entries(spec.paths).forEach(([path, pathItem]: [string, any]) => {
    const pathLevelParams: ParameterObject[] = pathItem.parameters || [];
    HTTP_METHODS.forEach((method) => {
      if (pathItem[method]) {
        const op = pathItem[method];
        const opParams: ParameterObject[] = op.parameters || [];
        const mergedParams = mergeParameters(pathLevelParams, opParams);
        endpoints.push({
          path,
          method: method.toUpperCase(),
          operation: { ...op, parameters: mergedParams },
          summary: op.summary,
          tags: op.tags || ['Reference'],
        });
      }
    });
  });
  return endpoints;
}

// Group endpoints by tag
export function groupByTag(endpoints: ParsedEndpoint[]): EndpointGroup[] {
  const grouped = new Map<string, ParsedEndpoint[]>();
  endpoints.forEach((endpoint) => {
    const tag = endpoint.tags?.[0] || 'Reference';
    if (!grouped.has(tag)) grouped.set(tag, []);
    grouped.get(tag)!.push(endpoint);
  });
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, eps]) => ({ tag, endpoints: eps, count: eps.length }));
}

/**
 * Extract data models (schemas) with their schema objects.
 * Returns SchemaEntry[] instead of string[] for full schema access.
 */
export function extractDataModels(spec: ParsedOpenAPISpec): SchemaEntry[] {
  if (!spec?.components?.schemas) return [];
  return Object.entries(spec.components.schemas).map(([name, schema]) => ({ name, schema }));
}

/**
 * Substitute OpenAPI server variable placeholders with their default values.
 * Mitigation for OWASP A07:2025 – Injection: only substitutes spec-defined defaults,
 * never user-supplied input. Unmatched placeholders are left intact.
 */
export function substituteServerVariables(
  url: string,
  variables: Record<string, { default: string; enum?: string[] }>
): string {
  return url.replace(/\{([^}]+)\}/g, (match, varName) => {
    const variable = variables[varName];
    return variable?.default ?? match;
  });
}

/**
 * Re-export resolveRef for docs-view consumers.
 * Mitigation for OWASP A04:2025 – Insecure Design: only follows local '#/' refs,
 * preventing resolution of external or malicious references.
 */
export { resolveRef as resolveInlineRef } from '@/components/api-details/utils';

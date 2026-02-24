/**
 * Utility functions for API Detail Drawer components
 */

import {DEFAULT_FALLBACK_URL} from '@/lib/constants';
import type {BodyContentType, FieldInputType, FormField, ParsedOpenAPISpec} from './types';
import type {SchemaObject, ReferenceObject, OperationObject, ParameterObject} from '@/types/openapi-spec';

/**
 * Infer input type from field key name and schema property definition
 * Fallback strategy: name hints → schema type → default to text
 */
export function inferInputType(key: string, schemaProp: SchemaObject | ReferenceObject | undefined): FieldInputType {
    // Normalize inputs for safe access
    const keyLower = (key || '').toLowerCase();
    const prop = schemaProp as SchemaObject;
    const propType = prop?.type;
    const propFormat = prop?.format;

    // 1. Check schema format (highest priority)
    if (propFormat === 'binary' || propFormat === 'base64') return 'file';
    if (propFormat === 'email') return 'email';
    if (propFormat === 'phone') return 'tel';
    if (propFormat === 'uri' || propFormat === 'url') return 'url';
    if (propFormat === 'uuid') return 'text';

    // 2. Check schema type
    if (propType === 'boolean') return 'checkbox';
    if (propType === 'number' || propType === 'integer') return 'number';
    if (propType === 'string') {
        // Sub-check: if string but with format, format already handled above
        return 'text';
    }

    // 3. Name-based heuristics (fallback)
    // File upload hints
    if (
        keyLower.includes('file') ||
        keyLower.includes('upload') ||
        keyLower.includes('attachment') ||
        keyLower.includes('image') ||
        keyLower.includes('document')
    ) {
        return 'file';
    }

    // Email hints
    if (keyLower.includes('email') || keyLower.includes('mail')) {
        return 'email';
    }

    // Phone hints
    if (keyLower.includes('phone') || keyLower.includes('tel')) {
        return 'tel';
    }

    // URL hints
    if (keyLower.includes('url') || keyLower.includes('website') || keyLower.includes('link')) {
        return 'url';
    }

    // Number hints
    if (keyLower.includes('count') || keyLower.includes('quantity') || keyLower.includes('amount')) {
        return 'number';
    }

    // Boolean hints (flags, toggles)
    if (
        keyLower.includes('is') ||
        keyLower.includes('has') ||
        keyLower.includes('should') ||
        keyLower.includes('enable') ||
        keyLower.includes('disable')
    ) {
        return 'checkbox';
    }

    // Default to text
    return 'text';
}

/**
 * Normalize schema to handle edge cases:
 * - Missing type/properties
 * - Non-standard schema structures
 * - Graceful fallbacks
 */
export function normalizeSchema(schema: SchemaObject | ReferenceObject | undefined): { properties: Record<string, SchemaObject | ReferenceObject> } {
    if (!schema) {
        return { properties: {} };
    }

    const s = schema as SchemaObject;

    // Already properly structured
    if (s.properties && typeof s.properties === 'object') {
        return {
            properties: s.properties,
        };
    }

    // Schema is the properties object itself (loose structure)
    if (typeof s === 'object' && !s.type && !s.properties) {
        // Check if all values look like property definitions
        const looksLikeProperties = Object.values(s).some(
            (val: unknown) =>
                val && typeof val === 'object' && ('type' in val || 'format' in val || 'example' in val || 'description' in val)
        );

        if (looksLikeProperties) {
            return { properties: s as Record<string, SchemaObject | ReferenceObject> };
        }
    }

    // Schema has only type but no properties (e.g., type: 'object' with no structure)
    if (s.type === 'object' && !s.properties) {
        return { properties: {} };
    }

    // Fallback: wrap schema as properties
    return { properties: { value: s } };
}

/**
 * Extract form fields from endpoint schema with full type info
 * Handles both OpenAPI 3.x and Swagger 2.0
 */
export function extractFormFields(
    endpoint: { operation?: OperationObject },
    spec?: ParsedOpenAPISpec
): FormField[] {
    let fields: FormField[] = [];
    let selectedSchema: SchemaObject | ReferenceObject | null = null;

    // 1. OpenAPI 3.x: requestBody
    if (endpoint.operation?.requestBody) {
        let requestBody = endpoint.operation.requestBody;
        // Resolve $ref on the requestBody object itself
        if ((requestBody as ReferenceObject).$ref && spec) {
            requestBody = resolveRef((requestBody as ReferenceObject).$ref, spec) as RequestBodyObject ?? requestBody;
        }
        
        const content = (requestBody as RequestBodyObject).content || {};

        // Prefer form-data > form-urlencoded
        const selectedContent = content['multipart/form-data'] || content['application/x-www-form-urlencoded'];

        if (selectedContent?.schema) {
            selectedSchema = selectedContent.schema;
        }
    }

    // 2. Swagger 2.0: formData parameters or body
    if (endpoint.operation?.parameters) {
        const params = endpoint.operation.parameters;

        // Check for in: 'formData' parameters (Swagger 2.0)
        const formDataParams = params.filter(p => (p as ParameterObject).in === ('formData' as unknown)) as ParameterObject[];
        if (formDataParams.length > 0) {
            return formDataParams.map(param => ({
                key: param.name,
                value: param.default?.toString() || '',
                type: inferInputType(param.name, param.schema),
                required: param.required || false,
                description: param.description,
            }));
        }

        // Fallback: body parameter if consumes is form-like
        const consumes = (endpoint.operation as Record<string, unknown>)?.consumes as string[] || [];
        const isFormType = consumes.some(
            (c: string) => c.includes('form-data') || c.includes('urlencoded')
        );

        if (isFormType) {
            const bodyParam = params.find(p => (p as ParameterObject).in === ('body' as unknown)) as ParameterObject;
            if (bodyParam?.schema) {
                selectedSchema = bodyParam.schema;
            }
        }
    }

    // Always normalize schema (handles missing properties, loose structures, etc.)
    if (selectedSchema) {
        // Resolve top-level ref if present
        if ((selectedSchema as ReferenceObject).$ref && spec) {
            selectedSchema = resolveRef((selectedSchema as ReferenceObject).$ref, spec);
        }

        const normalized = normalizeSchema(selectedSchema);
        const requiredFields = (selectedSchema as SchemaObject)?.required || [];

        fields = Object.entries(normalized.properties).map(([key, propSchema]) => {
            let prop = propSchema;
            // Resolve property-level ref if present
            if ((prop as ReferenceObject).$ref && spec) {
                prop = resolveRef((prop as ReferenceObject).$ref, spec);
            }

            const p = prop as SchemaObject;
            const rawValue = p?.example ?? p?.default ?? '';
            let stringValue = '';

            if (rawValue !== '') {
                stringValue = typeof rawValue === 'string' ? rawValue : String(rawValue);
            }

            return {
                key,
                value: stringValue,
                type: inferInputType(key, p),
                required: requiredFields.includes(key) || p?.required || false,
                description: p?.description,
            };
        });
    }

    return fields;
}

/**
 * Resolve a $ref pointer within the spec
 * Handles local references like '#/components/schemas/Pet'
 */
export function resolveRef(ref: string, spec: ParsedOpenAPISpec): unknown {
    if (!ref || !ref.startsWith('#/')) return null;
    const parts = ref.slice(2).split('/');
    let current: unknown = spec;
    for (const part of parts) {
        if (!current || typeof current !== 'object') return null;
        current = (current as Record<string, unknown>)[part];
    }
    return current || null;
}

/**
 * Generate example JSON from OpenAPI schema.
 * Mitigation for OWASP A04:2025 - Insecure Design: Provides valid example data structure.
 *
 * Handles: $ref, allOf/anyOf/oneOf, nested objects, arrays, primitives, examples.
 */
export function generateExampleFromSchema(schema: SchemaObject | ReferenceObject | undefined, depth = 0, spec?: ParsedOpenAPISpec): string {
    if (depth > 5) return '{}';
    if (!schema || typeof schema !== 'object') return '{}';

    const s = schema as SchemaObject;
    const ref = schema as ReferenceObject;

    // Resolve $ref first — may be the only key or alongside other keys
    if (ref.$ref && spec) {
        const resolved = resolveRef(ref.$ref, spec);
        if (resolved) return generateExampleFromSchema(resolved, depth, spec);
    }

    // allOf: merge all sub-schemas into one object
    if (s.allOf) {
        const merged: Record<string, unknown> = {};
        for (const sub of s.allOf) {
            try {
                const part = JSON.parse(generateExampleFromSchema(sub, depth + 1, spec));
                if (part && typeof part === 'object' && !Array.isArray(part)) {
                    Object.assign(merged, part);
                }
            } catch { /* skip unparseable sub-schema */ }
        }
        return JSON.stringify(merged, null, 2);
    }

    // anyOf / oneOf: use the first concrete sub-schema
    if (s.anyOf || s.oneOf) {
        const variants = (s.anyOf || s.oneOf) as (SchemaObject | ReferenceObject)[];
        for (const variant of variants) {
            const result = generateExampleFromSchema(variant, depth + 1, spec);
            if (result !== '{}' && result !== '') return result;
        }
        return '{}';
    }

    // Prefer inline example/default at the schema level
    if (s.example !== undefined) return JSON.stringify(s.example, null, 2);
    if (s.default !== undefined) return JSON.stringify(s.default, null, 2);

    if (s.type === 'object' || (!s.type && (s.properties || (s as SchemaObject & { additionalProperties?: unknown }).additionalProperties))) {
        const obj: Record<string, unknown> = {};
        if (s.properties) {
            for (const [key, propSchema] of Object.entries(s.properties)) {
                const propRef = propSchema as ReferenceObject;
                const prop = propSchema as SchemaObject;

                // Resolve nested $ref
                const resolved = propRef.$ref && spec ? (resolveRef(propRef.$ref, spec) as SchemaObject) ?? prop : prop;
                if (!resolved) { obj[key] = null; continue; }

                if (resolved.example !== undefined) { obj[key] = resolved.example; continue; }
                if (resolved.default !== undefined) { obj[key] = resolved.default; continue; }

                // Recurse for nested objects/arrays/refs rather than only handling one level
                if (resolved.type === 'object' || resolved.properties || (resolved as ReferenceObject).$ref || resolved.allOf || resolved.anyOf || resolved.oneOf) {
                    try { obj[key] = JSON.parse(generateExampleFromSchema(resolved, depth + 1, spec)); }
                    catch { obj[key] = {}; }
                } else if (resolved.type === 'array') {
                    if (resolved.items) {
                        const itemExample = generateExampleFromSchema(resolved.items, depth + 1, spec);
                        try { obj[key] = [JSON.parse(itemExample)]; } catch { obj[key] = []; }
                    } else { obj[key] = []; }
                } else if (resolved.type === 'string') {
                    obj[key] = resolved.enum?.[0]
                        ?? (resolved.format === 'date-time' ? new Date().toISOString()
                        : resolved.format === 'date' ? new Date().toISOString().split('T')[0]
                        : resolved.format === 'email' ? 'user@example.com'
                        : (resolved.format === 'uri' || resolved.format === 'url') ? 'https://example.com'
                        : resolved.default ?? 'string');
                } else if (resolved.type === 'number' || resolved.type === 'integer') {
                    obj[key] = resolved.minimum ?? resolved.default ?? 0;
                } else if (resolved.type === 'boolean') {
                    obj[key] = resolved.default ?? true;
                } else {
                    obj[key] = null;
                }
            }
        }
        return JSON.stringify(obj, null, 2);
    }

    if (s.type === 'array') {
        if (s.items) {
            const itemExample = generateExampleFromSchema(s.items, depth + 1, spec);
            try { return JSON.stringify([JSON.parse(itemExample)], null, 2); }
            catch { return '[]'; }
        }
        return '[]';
    }

    if (s.type === 'string') {
        const val = s.enum?.[0]
            ?? (s.format === 'date-time' ? new Date().toISOString()
            : s.format === 'date' ? new Date().toISOString().split('T')[0]
            : s.format === 'email' ? 'user@example.com'
            : s.format === 'uri' || s.format === 'url' ? 'https://example.com'
            : s.default ?? 'string');
        return JSON.stringify(val);
    }
    if (s.type === 'number' || s.type === 'integer') return JSON.stringify(s.minimum ?? s.default ?? 0);
    if (s.type === 'boolean') return JSON.stringify(s.default ?? true);

    return '{}';
}

export function detectAuthFromSpec(spec: ParsedOpenAPISpec | null): { type: 'none' | 'api-key' | 'bearer' | 'basic' } {
    const securitySchemes = spec?.components?.securitySchemes as Record<string, { type?: string; scheme?: string }>;
    const globalSecurity = spec?.security;
    if (!securitySchemes || !globalSecurity || globalSecurity.length === 0) return {type: 'none'};
    const firstName = Object.keys(globalSecurity[0])[0];
    const scheme = securitySchemes[firstName];
    if (!scheme) return {type: 'none'};
    if (scheme.type === 'http' && scheme.scheme === 'bearer') return {type: 'bearer'};
    if (scheme.type === 'http' && scheme.scheme === 'basic') return {type: 'basic'};
    if (scheme.type === 'apiKey') return {type: 'api-key'};
    return {type: 'none'};
}

export function isDummyFallbackUrl(url: string, spec: ParsedOpenAPISpec | null): boolean {
    return url === DEFAULT_FALLBACK_URL && (!spec?.servers || spec.servers.length === 0);
}

/**
 * Detect the initial body content type from the spec's requestBody content keys
 * Handles both OpenAPI 3.x (requestBody) and Swagger 2.0 (body parameter or formData)
 */
export function detectBodyTypeFromSpec(operation: OperationObject | undefined, spec?: ParsedOpenAPISpec): BodyContentType {
    // 1. OpenAPI 3.x: requestBody
    let requestBody = operation?.requestBody;
    if (requestBody) {
        // Resolve $ref on the requestBody object itself
        if ((requestBody as ReferenceObject).$ref && spec) {
            requestBody = resolveRef((requestBody as ReferenceObject).$ref, spec) as RequestBodyObject ?? requestBody;
        }

        const content = (requestBody as RequestBodyObject).content || {};
        const contentTypes = Object.keys(content);
        if (contentTypes.length === 0) return 'none';

        // Prefer form types
        if (content['multipart/form-data']) return 'form-data';
        if (content['application/x-www-form-urlencoded']) return 'x-www-form-urlencoded';
        
        const first = contentTypes[0];
        if (first.includes('json')) return 'json';
        if (first.includes('form-data')) return 'form-data';
        if (first.includes('x-www-form-urlencoded')) return 'x-www-form-urlencoded';
        if (first.includes('octet-stream') || first.includes('binary')) return 'binary';
        return 'json';
    }

    // 2. Swagger 2.0: formData parameters
    const params = (operation?.parameters as (ParameterObject | ReferenceObject)[]) || [];
    const hasFormDataParams = params.some((p) => (p as ParameterObject).in === ('formData' as unknown));
    const consumes = (operation as Record<string, unknown>)?.consumes as string[] || [];

    if (hasFormDataParams) {
        if (consumes.some((c: string) => c.includes('x-www-form-urlencoded'))) return 'x-www-form-urlencoded';
        return 'form-data';
    }

    // 3. Swagger 2.0: body parameter with consumes
    const bodyParam = params.find((p) => (p as ParameterObject).in === ('body' as unknown)) as ParameterObject;
    if (bodyParam) {
        if (consumes.length > 0) {
            const first = consumes[0];
            if (first.includes('json')) return 'json';
            if (first.includes('form-data')) return 'form-data';
            if (first.includes('x-www-form-urlencoded')) return 'x-www-form-urlencoded';
            if (first.includes('octet-stream') || first.includes('binary')) return 'binary';
        }
        return 'json';
    }

    return 'none';
}

/**
 * Map body content type to Content-Type header value
 */
export function bodyTypeToContentType(bodyType: BodyContentType): string {
    switch (bodyType) {
        case 'json': return 'application/json';
        case 'form-data': return 'multipart/form-data';
        case 'x-www-form-urlencoded': return 'application/x-www-form-urlencoded';
        case 'binary': return 'application/octet-stream';
        case 'none': return '';
    }
}

/**
 * Try to prettify a JSON string. Returns the original string if it's not valid JSON.
 */
export function prettifyJson(input: string): string {
    try {
        return JSON.stringify(JSON.parse(input), null, 2);
    } catch {
        return input;
    }
}

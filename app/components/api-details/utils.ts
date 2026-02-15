/**
 * Utility functions for API Detail Drawer components
 */

import {DEFAULT_FALLBACK_URL} from '@/lib/constants';
import type {BodyContentType} from './types';

/**
 * Resolve a $ref pointer within the spec
 * Handles local references like '#/components/schemas/Pet'
 */
export function resolveRef(ref: string, spec: any): any {
    if (!ref || !ref.startsWith('#/')) return null;
    const parts = ref.slice(2).split('/');
    let current = spec;
    for (const part of parts) {
        if (!current || typeof current !== 'object') return null;
        current = current[part];
    }
    return current || null;
}

/**
 * Generate example JSON from OpenAPI schema
 * Mitigation for OWASP A04:2025 - Insecure Design: Provides valid example data structure
 */
export function generateExampleFromSchema(schema: any, depth = 0, spec?: any): string {
    if (depth > 5) return '{}';

    // Resolve $ref if present
    if (schema.$ref && spec) {
        const resolved = resolveRef(schema.$ref, spec);
        if (resolved) return generateExampleFromSchema(resolved, depth, spec);
    }

    if (schema.example !== undefined) return JSON.stringify(schema.example, null, 2);
    if (schema.type === 'object' && schema.properties) {
        const obj: any = {};
        for (const [key, propSchema] of Object.entries(schema.properties)) {
            const prop = propSchema as any;
            // Resolve nested $ref
            const resolved = prop.$ref && spec ? resolveRef(prop.$ref, spec) : prop;
            if (!resolved) { obj[key] = null; continue; }
            if (resolved.example !== undefined) obj[key] = resolved.example;
            else if (resolved.type === 'string') obj[key] = resolved.enum?.[0] || resolved.default || 'string';
            else if (resolved.type === 'number' || resolved.type === 'integer') obj[key] = resolved.default ?? 0;
            else if (resolved.type === 'boolean') obj[key] = resolved.default ?? true;
            else if (resolved.type === 'array') {
                if (resolved.items) {
                    const itemExample = generateExampleFromSchema(resolved.items, depth + 1, spec);
                    try { obj[key] = [JSON.parse(itemExample)]; } catch { obj[key] = []; }
                } else { obj[key] = []; }
            }
            else if (resolved.type === 'object') {
                try { obj[key] = JSON.parse(generateExampleFromSchema(resolved, depth + 1, spec)); }
                catch { obj[key] = {}; }
            }
            else obj[key] = null;
        }
        return JSON.stringify(obj, null, 2);
    }
    if (schema.type === 'array' && schema.items) {
        const itemExample = generateExampleFromSchema(schema.items, depth + 1, spec);
        try { return JSON.stringify([JSON.parse(itemExample)], null, 2); }
        catch { return '[]'; }
    }
    return '{\n  \n}';
}

export function detectAuthFromSpec(spec: any): { type: 'none' | 'api-key' | 'bearer' | 'basic' } {
    const securitySchemes = spec?.components?.securitySchemes;
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

export function isDummyFallbackUrl(url: string, spec: any): boolean {
    return url === DEFAULT_FALLBACK_URL && (!spec?.servers || spec.servers.length === 0);
}

/**
 * Detect the initial body content type from the spec's requestBody content keys
 */
export function detectBodyTypeFromSpec(operation: any): BodyContentType {
    const requestBody = operation?.requestBody;
    if (!requestBody) return 'none';
    const content = requestBody.content || {};
    const contentTypes = Object.keys(content);
    if (contentTypes.length === 0) return 'none';

    const first = contentTypes[0];
    if (first.includes('json')) return 'json';
    if (first.includes('form-data') || first === 'multipart/form-data') return 'form-data';
    if (first.includes('x-www-form-urlencoded')) return 'x-www-form-urlencoded';
    if (first.includes('octet-stream') || first.includes('binary')) return 'binary';
    return 'json';
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

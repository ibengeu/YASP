import {describe, it, expect} from 'vitest';
import {
    resolveRef,
    generateExampleFromSchema,
    detectAuthFromSpec,
    isDummyFallbackUrl,
    detectBodyTypeFromSpec,
    bodyTypeToContentType,
    prettifyJson,
} from '@/components/api-details/utils';

describe('resolveRef', () => {
    it('should resolve a valid $ref pointer', () => {
        const spec = {components: {schemas: {Pet: {type: 'object', properties: {name: {type: 'string'}}}}}};
        const result = resolveRef('#/components/schemas/Pet', spec);
        expect(result).toEqual({type: 'object', properties: {name: {type: 'string'}}});
    });

    it('should return null for empty ref', () => {
        expect(resolveRef('', {})).toBeNull();
    });

    it('should return null for non-local ref', () => {
        expect(resolveRef('http://external.com/schema', {})).toBeNull();
    });

    it('should return null for missing path', () => {
        expect(resolveRef('#/components/schemas/Missing', {components: {schemas: {}}})).toBeNull();
    });

    it('should handle deeply nested refs', () => {
        const spec = {a: {b: {c: {d: 'found'}}}};
        expect(resolveRef('#/a/b/c/d', spec)).toBe('found');
    });
});

describe('generateExampleFromSchema', () => {
    it('should use example value if present', () => {
        const schema = {example: {id: 1, name: 'test'}};
        const result = generateExampleFromSchema(schema);
        expect(JSON.parse(result)).toEqual({id: 1, name: 'test'});
    });

    it('should generate object from properties', () => {
        const schema = {
            type: 'object',
            properties: {
                name: {type: 'string'},
                age: {type: 'integer'},
                active: {type: 'boolean'},
            },
        };
        const result = JSON.parse(generateExampleFromSchema(schema));
        expect(result.name).toBe('string');
        expect(result.age).toBe(0);
        expect(result.active).toBe(true);
    });

    it('should generate array from items', () => {
        const schema = {
            type: 'array',
            items: {type: 'string', example: 'item'},
        };
        const result = JSON.parse(generateExampleFromSchema(schema));
        expect(result).toEqual(['item']);
    });

    it('should resolve $ref in schema', () => {
        const spec = {components: {schemas: {Name: {type: 'string', example: 'John'}}}};
        const schema = {$ref: '#/components/schemas/Name'};
        expect(generateExampleFromSchema(schema, 0, spec)).toBe('"John"');
    });

    it('should limit recursion depth', () => {
        const result = generateExampleFromSchema({type: 'object', properties: {}}, 6);
        expect(result).toBe('{}');
    });

    it('should use enum first value for string', () => {
        const schema = {
            type: 'object',
            properties: {
                status: {type: 'string', enum: ['active', 'inactive']},
            },
        };
        const result = JSON.parse(generateExampleFromSchema(schema));
        expect(result.status).toBe('active');
    });
});

describe('detectAuthFromSpec', () => {
    it('should return none when no security schemes', () => {
        expect(detectAuthFromSpec({})).toEqual({type: 'none'});
    });

    it('should return none when no global security', () => {
        const spec = {components: {securitySchemes: {api_key: {type: 'apiKey'}}}};
        expect(detectAuthFromSpec(spec)).toEqual({type: 'none'});
    });

    it('should detect bearer auth', () => {
        const spec = {
            components: {securitySchemes: {bearerAuth: {type: 'http', scheme: 'bearer'}}},
            security: [{bearerAuth: []}],
        };
        expect(detectAuthFromSpec(spec)).toEqual({type: 'bearer'});
    });

    it('should detect basic auth', () => {
        const spec = {
            components: {securitySchemes: {basicAuth: {type: 'http', scheme: 'basic'}}},
            security: [{basicAuth: []}],
        };
        expect(detectAuthFromSpec(spec)).toEqual({type: 'basic'});
    });

    it('should detect api-key auth', () => {
        const spec = {
            components: {securitySchemes: {apiKey: {type: 'apiKey', name: 'X-API-Key', in: 'header'}}},
            security: [{apiKey: []}],
        };
        expect(detectAuthFromSpec(spec)).toEqual({type: 'api-key'});
    });
});

describe('isDummyFallbackUrl', () => {
    it('should return true for fallback URL with no servers', () => {
        expect(isDummyFallbackUrl('https://api.example.com', {})).toBe(true);
    });

    it('should return false when servers exist', () => {
        const spec = {servers: [{url: 'https://real.api.com'}]};
        expect(isDummyFallbackUrl('https://api.example.com', spec)).toBe(false);
    });

    it('should return false for non-fallback URL', () => {
        expect(isDummyFallbackUrl('https://my-api.com', {})).toBe(false);
    });
});

describe('detectBodyTypeFromSpec', () => {
    it('should return none when no requestBody', () => {
        expect(detectBodyTypeFromSpec({})).toBe('none');
    });

    it('should detect json content type', () => {
        const operation = {requestBody: {content: {'application/json': {}}}};
        expect(detectBodyTypeFromSpec(operation)).toBe('json');
    });

    it('should detect form-data content type', () => {
        const operation = {requestBody: {content: {'multipart/form-data': {}}}};
        expect(detectBodyTypeFromSpec(operation)).toBe('form-data');
    });

    it('should detect x-www-form-urlencoded', () => {
        const operation = {requestBody: {content: {'application/x-www-form-urlencoded': {}}}};
        expect(detectBodyTypeFromSpec(operation)).toBe('x-www-form-urlencoded');
    });

    it('should detect binary content type', () => {
        const operation = {requestBody: {content: {'application/octet-stream': {}}}};
        expect(detectBodyTypeFromSpec(operation)).toBe('binary');
    });

    it('should return none for empty content', () => {
        const operation = {requestBody: {content: {}}};
        expect(detectBodyTypeFromSpec(operation)).toBe('none');
    });
});

describe('bodyTypeToContentType', () => {
    it('should map json to application/json', () => {
        expect(bodyTypeToContentType('json')).toBe('application/json');
    });

    it('should map form-data to multipart/form-data', () => {
        expect(bodyTypeToContentType('form-data')).toBe('multipart/form-data');
    });

    it('should map x-www-form-urlencoded', () => {
        expect(bodyTypeToContentType('x-www-form-urlencoded')).toBe('application/x-www-form-urlencoded');
    });

    it('should map binary to application/octet-stream', () => {
        expect(bodyTypeToContentType('binary')).toBe('application/octet-stream');
    });

    it('should return empty string for none', () => {
        expect(bodyTypeToContentType('none')).toBe('');
    });
});

describe('prettifyJson', () => {
    it('should prettify valid JSON', () => {
        expect(prettifyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    });

    it('should return original string for invalid JSON', () => {
        expect(prettifyJson('not json')).toBe('not json');
    });

    it('should handle already pretty JSON', () => {
        const pretty = '{\n  "a": 1\n}';
        expect(prettifyJson(pretty)).toBe(pretty);
    });
});

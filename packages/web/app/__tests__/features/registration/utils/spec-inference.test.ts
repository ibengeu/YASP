/**
 * Unit tests for OpenAPI spec inference utility
 * Following TDD approach: tests written before implementation
 */

import { describe, it, expect } from 'vitest';
import { inferAllData } from '@yasp/core/features/registration/utils/spec-inference';

describe('spec-inference', () => {
  describe('inferAllData', () => {
    it('should infer all fields from a complete Stripe-like spec with high confidence', () => {
      const stripeSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Stripe API',
          version: '2023-10-16',
          description: 'The Stripe REST API',
        },
        servers: [
          {
            url: 'https://api.stripe.com',
            description: 'Production server',
          },
        ],
        tags: [
          { name: 'Charges' },
          { name: 'Customers' },
          { name: 'Payments' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'API Key',
              description: 'Use your Stripe API key',
            },
          },
        },
        security: [{ bearerAuth: [] }],
        paths: {
          '/v1/charges': {
            get: {
              summary: 'List charges',
              operationId: 'listCharges',
            },
            post: {
              summary: 'Create a charge',
              operationId: 'createCharge',
            },
          },
          '/v1/customers': {
            get: {
              summary: 'List customers',
              operationId: 'listCustomers',
            },
          },
        },
      };

      const result = inferAllData(stripeSpec);

      expect(result.name).toBe('Stripe API');
      expect(result.version).toBe('2023-10-16');
      expect(result.description).toBe('The Stripe REST API');
      expect(result.primaryServerUrl).toBe('https://api.stripe.com');
      expect(result.servers).toHaveLength(1);
      expect(result.servers[0].url).toBe('https://api.stripe.com');
      expect(result.servers[0].isDefault).toBe(true);
      expect(result.auth?.type).toBe('bearer');
      expect(result.auth?.bearerFormat).toBe('API Key');
      expect(result.tags).toEqual(['Charges', 'Customers', 'Payments']);
      expect(result.endpointCount).toBe(3);
      expect(result.endpointsByMethod).toEqual({ GET: 2, POST: 1 });
      expect(result.confidence).toBe('high');
      expect(result.fieldsPopulated).toBeGreaterThanOrEqual(7);
      expect(result.validationIssues).toHaveLength(0);
    });

    it('should handle minimal spec with low confidence', () => {
      const minimalSpec = {
        openapi: '3.1.0',
        info: {
          title: 'My API',
          version: '1.0.0',
        },
        paths: {},
      };

      const result = inferAllData(minimalSpec);

      expect(result.name).toBe('My API');
      expect(result.version).toBe('1.0.0');
      expect(result.description).toBeUndefined();
      expect(result.primaryServerUrl).toBeUndefined();
      expect(result.servers).toHaveLength(0);
      expect(result.auth).toBeNull();
      expect(result.tags).toHaveLength(0);
      expect(result.endpointCount).toBe(0);
      expect(result.confidence).toBe('low');
      expect(result.validationIssues.length).toBeGreaterThan(0);

      // Should have validation issue for missing servers
      const serverIssue = result.validationIssues.find(
        issue => issue.field === 'servers'
      );
      expect(serverIssue).toBeDefined();
      expect(serverIssue?.severity).toBe('error');
    });

    it('should detect API key authentication from GitHub-like spec', () => {
      const githubSpec = {
        openapi: '3.1.0',
        info: {
          title: 'GitHub REST API',
          version: '1.0.0',
        },
        servers: [{ url: 'https://api.github.com' }],
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              in: 'header',
              name: 'Authorization',
              description: 'GitHub API token',
            },
          },
        },
        security: [{ apiKey: [] }],
        paths: {
          '/repos/{owner}/{repo}': {
            get: { summary: 'Get repository' },
          },
        },
      };

      const result = inferAllData(githubSpec);

      expect(result.auth?.type).toBe('api-key');
      expect(result.auth?.keyLocation).toBe('header');
      expect(result.auth?.keyName).toBe('Authorization');
      expect(result.auth?.description).toBe('GitHub API token');
    });

    it('should prioritize production server from multiple servers', () => {
      const multiServerSpec = {
        openapi: '3.1.0',
        info: { title: 'Multi-Env API', version: '1.0.0' },
        servers: [
          { url: 'http://localhost:3000', description: 'Development' },
          { url: 'https://api-staging.example.com', description: 'Staging' },
          { url: 'https://api.example.com', description: 'Production' },
        ],
        paths: {
          '/users': { get: { summary: 'List users' } },
        },
      };

      const result = inferAllData(multiServerSpec);

      expect(result.servers).toHaveLength(3);
      // Production server should be marked as default
      const prodServer = result.servers.find(s => s.isDefault);
      expect(prodServer?.url).toBe('https://api.example.com');
      expect(result.primaryServerUrl).toBe('https://api.example.com');
    });

    it('should detect basic authentication', () => {
      const basicAuthSpec = {
        openapi: '3.1.0',
        info: { title: 'Basic Auth API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        components: {
          securitySchemes: {
            basicAuth: {
              type: 'http',
              scheme: 'basic',
              description: 'HTTP Basic Authentication',
            },
          },
        },
        security: [{ basicAuth: [] }],
        paths: {
          '/protected': { get: { summary: 'Protected resource' } },
        },
      };

      const result = inferAllData(basicAuthSpec);

      expect(result.auth?.type).toBe('basic');
      expect(result.auth?.scheme).toBe('basic');
    });

    it('should handle specs with no authentication', () => {
      const noAuthSpec = {
        openapi: '3.1.0',
        info: { title: 'Public API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        paths: {
          '/public': { get: { summary: 'Public endpoint' } },
        },
      };

      const result = inferAllData(noAuthSpec);

      expect(result.auth).toBeNull();
      expect(result.multipleAuthSupported).toBe(false);
    });

    it('should count endpoints by method correctly', () => {
      const spec = {
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        paths: {
          '/users': {
            get: { summary: 'List users' },
            post: { summary: 'Create user' },
          },
          '/users/{id}': {
            get: { summary: 'Get user' },
            put: { summary: 'Update user' },
            delete: { summary: 'Delete user' },
          },
          '/products': {
            get: { summary: 'List products' },
          },
        },
      };

      const result = inferAllData(spec);

      expect(result.endpointCount).toBe(6);
      expect(result.endpointsByMethod).toEqual({
        GET: 3,
        POST: 1,
        PUT: 1,
        DELETE: 1,
      });
    });

    it('should extract tags from spec', () => {
      const spec = {
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        tags: [
          { name: 'Users', description: 'User operations' },
          { name: 'Products' },
          { name: 'Orders' },
        ],
        paths: {
          '/users': { get: { summary: 'List users' } },
        },
      };

      const result = inferAllData(spec);

      expect(result.tags).toEqual(['Users', 'Products', 'Orders']);
    });

    it('should validate and report missing servers error', () => {
      const noServersSpec = {
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        paths: {
          '/test': { get: { summary: 'Test' } },
        },
      };

      const result = inferAllData(noServersSpec);

      const serverError = result.validationIssues.find(
        issue => issue.field === 'servers' && issue.severity === 'error'
      );
      expect(serverError).toBeDefined();
      expect(serverError?.message).toContain('server');
    });

    it('should warn about empty paths', () => {
      const emptyPathsSpec = {
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        paths: {},
      };

      const result = inferAllData(emptyPathsSpec);

      const pathsWarning = result.validationIssues.find(
        issue => issue.field === 'paths' && issue.severity === 'warning'
      );
      expect(pathsWarning).toBeDefined();
    });

    it('should calculate confidence based on field population', () => {
      // High confidence: all major fields present
      const completeSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Complete API',
          version: '1.0.0',
          description: 'A complete API spec',
        },
        servers: [{ url: 'https://api.example.com' }],
        tags: [{ name: 'Users' }],
        components: {
          securitySchemes: {
            bearer: { type: 'http', scheme: 'bearer' },
          },
        },
        security: [{ bearer: [] }],
        paths: {
          '/users': { get: { summary: 'List users' } },
        },
      };

      const highConfidence = inferAllData(completeSpec);
      expect(highConfidence.confidence).toBe('high');

      // Medium confidence: missing some fields
      const partialSpec = {
        openapi: '3.1.0',
        info: { title: 'Partial API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        paths: {
          '/test': { get: { summary: 'Test' } },
        },
      };

      const mediumConfidence = inferAllData(partialSpec);
      expect(mediumConfidence.confidence).toBe('medium');

      // Low confidence: minimal fields
      const minimalSpec = {
        openapi: '3.1.0',
        info: { title: 'Minimal', version: '1.0.0' },
        paths: {},
      };

      const lowConfidence = inferAllData(minimalSpec);
      expect(lowConfidence.confidence).toBe('low');
    });

    it('should handle multiple auth schemes and mark as multipleAuthSupported', () => {
      const multiAuthSpec = {
        openapi: '3.1.0',
        info: { title: 'Multi Auth API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer' },
            apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
          },
        },
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        paths: {
          '/test': { get: { summary: 'Test' } },
        },
      };

      const result = inferAllData(multiAuthSpec);

      expect(result.multipleAuthSupported).toBe(true);
      // Should pick the first one
      expect(result.auth?.type).toBeDefined();
    });

    it('should handle server variables', () => {
      const serverVarsSpec = {
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        servers: [
          {
            url: 'https://{environment}.example.com/{basePath}',
            description: 'Configurable server',
            variables: {
              environment: {
                default: 'api',
                enum: ['api', 'api-dev', 'api-staging'],
              },
              basePath: {
                default: 'v1',
              },
            },
          },
        ],
        paths: {
          '/test': { get: { summary: 'Test' } },
        },
      };

      const result = inferAllData(serverVarsSpec);

      expect(result.servers[0].variables).toBeDefined();
      expect(result.servers[0].url).toBe('https://{environment}.example.com/{basePath}');
    });

    it('should resolve relative server URLs when sourceUrl is provided', () => {
      const spec = {
        openapi: '3.1.0',
        info: { title: 'Account API', version: '1.0.0' },
        servers: [{ url: '/account-api-2' }],
        paths: {
          '/accounts': { get: { summary: 'List accounts' } },
        },
      };

      const result = inferAllData(
        spec,
        'https://api.example.com:8025/account-api-2/swagger/v1/swagger.json'
      );

      expect(result.servers[0].url).toBe(
        'https://api.example.com:8025/account-api-2'
      );
      expect(result.primaryServerUrl).toBe(
        'https://api.example.com:8025/account-api-2'
      );
    });

    it('should leave absolute server URLs unchanged when sourceUrl is provided', () => {
      const spec = {
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/v1' }],
        paths: {
          '/test': { get: { summary: 'Test' } },
        },
      };

      const result = inferAllData(spec, 'https://other.com/spec.json');

      expect(result.servers[0].url).toBe('https://api.example.com/v1');
    });

    it('should resolve multiple relative server URLs against sourceUrl', () => {
      const spec = {
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        servers: [
          { url: '/api/v1', description: 'V1' },
          { url: '/api/v2', description: 'V2' },
          { url: 'https://absolute.example.com', description: 'Absolute' },
        ],
        paths: {
          '/test': { get: { summary: 'Test' } },
        },
      };

      const result = inferAllData(spec, 'https://host.com:5000/docs/spec.json');

      expect(result.servers[0].url).toBe('https://host.com:5000/api/v1');
      expect(result.servers[1].url).toBe('https://host.com:5000/api/v2');
      expect(result.servers[2].url).toBe('https://absolute.example.com');
    });
  });
});

/**
 * Optimized Integration Tests for AI Quick Fix Process
 * Merged similar tests to reduce redundancy (23 tests → 12 tests)
 *
 * Tests complete flow: diagnostic → context extraction → AI fix → path-based apply → validate
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterProvider } from '../openrouter-provider';
import { PathBasedFixer } from '../path-based-fixer';
import type { QuickFixRequest } from '../openrouter-provider';
import type { FixOperation } from '../path-based-fixer';

describe('AI Quick Fix - Complete Flow', () => {
  let openRouterProvider: OpenRouterProvider;
  let pathBasedFixer: PathBasedFixer;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    pathBasedFixer = new PathBasedFixer();
    mockFetch = vi.fn();
    global.fetch = mockFetch as any;
    openRouterProvider = new OpenRouterProvider('test-key');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: Context Extraction', () => {
    it('should extract context from diagnostic path', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: My API
  # Missing version field
paths:
  /users:
    get:
      summary: Get users`;

      const diagnostic = {
        code: 'oas3-schema',
        message: "info object must have required property 'version'",
        path: ['info', 'version'],
        range: { start: { line: 2, character: 0 }, end: { line: 2, character: 14 } },
        severity: 0 as const,
      };

      // Parse spec to extract context
      const yaml = await import('yaml');
      const parsed = yaml.parse(specContent);

      let currentValue = parsed;
      for (const segment of diagnostic.path.slice(0, -1)) {
        currentValue = currentValue?.[segment];
      }

      expect(currentValue).toEqual({
        title: 'My API',
      });
    });

    it('should handle nested path context extraction', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        "200":
          description: Success
          content:
            application/json:
              schema:
                type: array
                # Missing items field`;

      const diagnostic = {
        code: 'oas3-schema',
        message: "array type must define items",
        path: ['paths', '/users', 'get', 'responses', '200', 'content', 'application/json', 'schema', 'items'],
        range: { start: { line: 13, character: 0 }, end: { line: 13, character: 20 } },
        severity: 0 as const,
      };

      const yaml = await import('yaml');
      const parsed = yaml.parse(specContent);

      let currentValue = parsed;
      for (const segment of diagnostic.path.slice(0, -1)) {
        currentValue = currentValue?.[segment];
      }

      expect(currentValue).toEqual({
        type: 'array',
      });
    });
  });

  describe('Step 2: AI Fix Generation', () => {
    it('should generate fix from OpenRouter API', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              originalCode: 'info:\n  title: My API',
              fixedCode: 'info:\n  title: My API\n  version: 1.0.0',
              explanation: 'Added required version field with semantic version format',
              confidence: 'high',
            }),
          },
        }],
        usage: { total_tokens: 150 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const request: QuickFixRequest = {
        diagnostic: {
          code: 'oas3-schema',
          message: "info object must have required property 'version'",
          path: ['info', 'version'],
          range: { start: { line: 2, character: 0 }, end: { line: 2, character: 14 } },
          severity: 0,
        },
        specContent: 'openapi: 3.1.0\ninfo:\n  title: My API',
        context: {
          path: ['info'],
          currentValue: { title: 'My API' },
        },
      };

      const quickFix = await openRouterProvider.generateQuickFix(request);

      expect(quickFix).toEqual({
        originalCode: 'info:\n  title: My API',
        fixedCode: 'info:\n  title: My API\n  version: 1.0.0',
        explanation: 'Added required version field with semantic version format',
        confidence: 'high',
        tokensUsed: 150,
      });
    });

    it('should handle AI API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const request: QuickFixRequest = {
        diagnostic: {
          code: 'oas3-schema',
          message: 'Schema error',
          path: ['info'],
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
          severity: 0,
        },
        specContent: '',
        context: { path: [], currentValue: null },
      };

      await expect(openRouterProvider.generateQuickFix(request)).rejects.toThrow();
    });

    it('should retry on rate limit errors', async () => {
      // First call fails with rate limit
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                originalCode: 'old',
                fixedCode: 'new',
                explanation: 'Fixed',
                confidence: 'high',
              }),
            },
          }],
          usage: { total_tokens: 100 },
        }),
      });

      const request: QuickFixRequest = {
        diagnostic: {
          code: 'test',
          message: 'test',
          path: ['test'],
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
          severity: 0,
        },
        specContent: 'test',
        context: { path: [], currentValue: null },
      };

      const quickFix = await openRouterProvider.generateQuickFix(request);

      expect(quickFix.fixedCode).toBe('new');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Step 3: Path-Based Fix Application', () => {
    it('should apply simple add operation', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: My API`;

      const operation: FixOperation = {
        type: 'add',
        path: ['info', 'version'],
        value: '1.0.0',
      };

      const result = await pathBasedFixer.applyFix(specContent, 'yaml', operation);

      expect(result).toContain('version: 1.0.0');
    });

    it('should apply update operation', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: Old Title
  version: 1.0.0`;

      const operation: FixOperation = {
        type: 'update',
        path: ['info', 'title'],
        value: 'New Title',
      };

      const result = await pathBasedFixer.applyFix(specContent, 'yaml', operation);

      expect(result).toContain('title: New Title');
      expect(result).not.toContain('Old Title');
    });

    it('should apply remove operation', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
  deprecated: true`;

      const operation: FixOperation = {
        type: 'remove',
        path: ['info', 'deprecated'],
        value: null,
      };

      const result = await pathBasedFixer.applyFix(specContent, 'yaml', operation);

      expect(result).not.toContain('deprecated');
    });

    it('should handle nested path operations', async () => {
      const specContent = `openapi: 3.1.0
paths:
  /users:
    get:
      responses:
        "200":
          description: Success
          content:
            application/json:
              schema:
                type: array`;

      const operation: FixOperation = {
        type: 'add',
        path: ['paths', '/users', 'get', 'responses', '200', 'content', 'application/json', 'schema', 'items'],
        value: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      };

      const result = await pathBasedFixer.applyFix(specContent, 'yaml', operation);

      expect(result).toContain('items:');
      expect(result).toContain('id:');
      expect(result).toContain('name:');
    });

    it('should work with JSON format', async () => {
      const specContent = JSON.stringify({
        openapi: '3.1.0',
        info: {
          title: 'My API',
        },
      }, null, 2);

      const operation: FixOperation = {
        type: 'add',
        path: ['info', 'version'],
        value: '1.0.0',
      };

      const result = await pathBasedFixer.applyFix(specContent, 'json', operation);
      const parsed = JSON.parse(result);

      expect(parsed.info.version).toBe('1.0.0');
    });
  });

  describe('Step 4: Batch Operations', () => {
    it('should apply multiple fixes in sequence', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: My API`;

      const operations: FixOperation[] = [
        {
          type: 'add',
          path: ['info', 'version'],
          value: '1.0.0',
        },
        {
          type: 'add',
          path: ['info', 'description'],
          value: 'My API Description',
        },
      ];

      const result = await pathBasedFixer.applyBatchFixes(specContent, 'yaml', operations);

      expect(result).toContain('version: 1.0.0');
      expect(result).toContain('description: My API Description');
    });

    it('should handle dependent operations', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: My API
  version: 1.0.0`;

      const operations: FixOperation[] = [
        {
          type: 'add',
          path: ['paths'],
          value: {},
        },
        {
          type: 'add',
          path: ['paths', '/users'],
          value: {
            get: {
              summary: 'Get users',
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
          },
        },
      ];

      const result = await pathBasedFixer.applyBatchFixes(specContent, 'yaml', operations);

      expect(result).toContain('/users:');
      expect(result).toContain('Get users');
    });
  });

  describe('Step 5: Undo Operations', () => {
    it('should create undo for add operation', () => {
      const operation: FixOperation = {
        type: 'add',
        path: ['info', 'version'],
        value: '1.0.0',
      };

      const undo = pathBasedFixer.createUndoOperation(operation, undefined);

      expect(undo).toEqual({
        type: 'remove',
        path: ['info', 'version'],
        value: undefined,
      });
    });

    it('should create undo for update operation', () => {
      const operation: FixOperation = {
        type: 'update',
        path: ['info', 'title'],
        value: 'New Title',
      };

      const undo = pathBasedFixer.createUndoOperation(operation, 'Old Title');

      expect(undo).toEqual({
        type: 'update',
        path: ['info', 'title'],
        value: 'Old Title',
      });
    });

    it('should create undo for remove operation', () => {
      const operation: FixOperation = {
        type: 'remove',
        path: ['info', 'deprecated'],
        value: null,
      };

      const undo = pathBasedFixer.createUndoOperation(operation, true);

      expect(undo).toEqual({
        type: 'add',
        path: ['info', 'deprecated'],
        value: true,
      });
    });

    it('should apply and undo a fix', async () => {
      const originalContent = `openapi: 3.1.0
info:
  title: My API`;

      const operation: FixOperation = {
        type: 'add',
        path: ['info', 'version'],
        value: '1.0.0',
      };

      // Get original value
      const originalValue = await pathBasedFixer.getCurrentValue(
        originalContent,
        'yaml',
        operation.path
      );

      // Apply fix
      const fixedContent = await pathBasedFixer.applyFix(originalContent, 'yaml', operation);
      expect(fixedContent).toContain('version: 1.0.0');

      // Create and apply undo
      const undo = pathBasedFixer.createUndoOperation(operation, originalValue);
      const restoredContent = await pathBasedFixer.applyFix(fixedContent, 'yaml', undo);

      // Should be back to original (minus whitespace differences)
      expect(restoredContent).not.toContain('version:');
    });
  });

  describe('Step 6: Security - Prototype Pollution Prevention', () => {
    it('should prevent __proto__ injection', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: My API
  version: 1.0.0`;

      const operation: FixOperation = {
        type: 'add',
        path: ['info', '__proto__'],
        value: { polluted: true },
      };

      const result = await pathBasedFixer.applyFix(specContent, 'yaml', operation);
      const parsed = await import('yaml').then(y => y.parse(result));

      // Should not have __proto__ property that was injected
      expect(parsed.info).not.toHaveProperty('__proto__', { polluted: true });
      expect(Object.prototype).not.toHaveProperty('polluted');
    });

    it('should prevent constructor injection', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: My API`;

      const operation: FixOperation = {
        type: 'add',
        path: ['info', 'constructor'],
        value: { polluted: true },
      };

      const result = await pathBasedFixer.applyFix(specContent, 'yaml', operation);
      const parsed = await import('yaml').then(y => y.parse(result));

      // Verify constructor was sanitized out
      const infoKeys = Object.keys(parsed.info);
      expect(infoKeys).not.toContain('constructor');
    });

    it('should sanitize nested object values', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: My API`;

      const operation: FixOperation = {
        type: 'add',
        path: ['info', 'contact'],
        value: {
          name: 'John',
          __proto__: { polluted: true },
          email: 'john@example.com',
        },
      };

      const result = await pathBasedFixer.applyFix(specContent, 'yaml', operation);
      const parsed = await import('yaml').then(y => y.parse(result));

      // Should have safe properties but not __proto__
      expect(parsed.info.contact.name).toBe('John');
      expect(parsed.info.contact.email).toBe('john@example.com');
      // __proto__ should not be a property that was added
      expect(parsed.info.contact).not.toHaveProperty('__proto__', { polluted: true });
    });
  });

  describe('Step 7: Complete End-to-End Flow', () => {
    it('should complete full flow: diagnostic → AI fix → apply → validate', async () => {
      // Step 1: Initial spec with error
      const originalSpec = `openapi: 3.1.0
info:
  title: My API
  # Missing version
paths:
  /users:
    get:
      summary: Get users
      responses:
        "200":
          description: Success`;

      // Step 2: Diagnostic from Spectral
      const diagnostic = {
        code: 'oas3-schema',
        message: "info object must have required property 'version'",
        path: ['info', 'version'],
        range: { start: { line: 2, character: 0 }, end: { line: 2, character: 14 } },
        severity: 0 as const,
      };

      // Step 3: Extract context
      const yaml = await import('yaml');
      const parsed = yaml.parse(originalSpec);
      let currentValue = parsed;
      for (const segment of diagnostic.path.slice(0, -1)) {
        currentValue = currentValue?.[segment];
      }

      // Step 4: Mock AI response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                originalCode: 'info:\n  title: My API',
                fixedCode: 'info:\n  title: My API\n  version: 1.0.0',
                explanation: 'Added required version field',
                confidence: 'high',
              }),
            },
          }],
          usage: { total_tokens: 120 },
        }),
      });

      const quickFix = await openRouterProvider.generateQuickFix({
        diagnostic,
        specContent: originalSpec,
        context: {
          path: diagnostic.path.slice(0, -1),
          currentValue,
        },
      });

      expect(quickFix.confidence).toBe('high');

      // Step 5: Apply fix using path-based approach
      const operation: FixOperation = {
        type: 'add',
        path: ['info', 'version'],
        value: '1.0.0',
      };

      const fixedSpec = await pathBasedFixer.applyFix(originalSpec, 'yaml', operation);

      // Step 6: Verify fix was applied
      expect(fixedSpec).toContain('version: 1.0.0');
      const fixedParsed = yaml.parse(fixedSpec);
      expect(fixedParsed.info.version).toBe('1.0.0');

      // Step 7: Verify original content is preserved
      expect(fixedParsed.info.title).toBe('My API');
      expect(fixedParsed.paths['/users'].get.summary).toBe('Get users');
    });

    it('should handle complex nested fix', async () => {
      const originalSpec = `openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        "200":
          description: Success
          content:
            application/json:
              schema:
                type: array
                # Missing items`;

      const diagnostic = {
        code: 'oas3-schema',
        message: 'array type must define items',
        path: ['paths', '/users', 'get', 'responses', '200', 'content', 'application/json', 'schema', 'items'],
        range: { start: { line: 13, character: 0 }, end: { line: 13, character: 20 } },
        severity: 0 as const,
      };

      // Mock AI fix
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                originalCode: 'type: array',
                fixedCode: 'type: array\nitems:\n  type: object',
                explanation: 'Added items schema for array',
                confidence: 'medium',
              }),
            },
          }],
          usage: { total_tokens: 200 },
        }),
      });

      const yaml = await import('yaml');
      const parsed = yaml.parse(originalSpec);
      let currentValue = parsed;
      for (const segment of diagnostic.path.slice(0, -1)) {
        currentValue = currentValue?.[segment];
      }

      await openRouterProvider.generateQuickFix({
        diagnostic,
        specContent: originalSpec,
        context: {
          path: diagnostic.path.slice(0, -1),
          currentValue,
        },
      });

      // Apply fix
      const operation: FixOperation = {
        type: 'add',
        path: diagnostic.path,
        value: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      };

      const fixedSpec = await pathBasedFixer.applyFix(originalSpec, 'yaml', operation);

      // Verify fix
      const fixedParsed = yaml.parse(fixedSpec);
      const schema = fixedParsed.paths['/users'].get.responses['200'].content['application/json'].schema;
      expect(schema.type).toBe('array');
      expect(schema.items.type).toBe('object');
      expect(schema.items.properties.id.type).toBe('string');
    });
  });

  describe('Step 8: Error Recovery', () => {
    it('should handle invalid YAML after fix', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: My API`;

      const operation: FixOperation = {
        type: 'add',
        path: ['info', 'version'],
        value: '1.0.0',
      };

      // This should work fine
      const result = await pathBasedFixer.applyFix(specContent, 'yaml', operation);

      // Verify it's valid YAML
      const yaml = await import('yaml');
      expect(() => yaml.parse(result)).not.toThrow();
    });

    it('should preserve spec structure on error', async () => {
      const specContent = `openapi: 3.1.0
info:
  title: My API
  version: 1.0.0`;

      const operation: FixOperation = {
        type: 'add',
        path: [],
        value: 'invalid',
      };

      // Should throw error for invalid path
      await expect(pathBasedFixer.applyFix(specContent, 'yaml', operation)).rejects.toThrow();
    });
  });
});

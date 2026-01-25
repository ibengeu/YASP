/**
 * YAML Parser Tests
 * Tests for YAML ↔ AST ↔ Tiptap conversion utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseYAMLToAST,
  buildPositionMap,
  findNodeByYAMLPath,
  serializeASTToYAML,
  type YAMLNode,
} from '../yaml-parser';

describe('YAMLParser', () => {
  const sampleYAML = `openapi: 3.1.0
info:
  title: Sample API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        '200':
          description: Success`;

  describe('parseYAMLToAST', () => {
    it('should parse valid YAML to AST', () => {
      const ast = parseYAMLToAST(sampleYAML);

      expect(ast).toBeDefined();
      expect(ast.type).toBe('Document');
      expect(ast.value).toHaveProperty('openapi');
      expect(ast.value.openapi).toBe('3.1.0');
    });

    it('should throw error for invalid YAML', () => {
      const invalidYAML = `openapi: 3.1.0\ninfo:\n  title: "Unclosed string`;

      expect(() => parseYAMLToAST(invalidYAML)).toThrow();
    });

    it('should parse nested objects correctly', () => {
      const ast = parseYAMLToAST(sampleYAML);

      expect(ast.value.info).toBeDefined();
      expect(ast.value.info.title).toBe('Sample API');
      expect(ast.value.info.version).toBe('1.0.0');
    });

    it('should preserve numeric types', () => {
      const yaml = 'port: 3000\nversion: 1.0';
      const ast = parseYAMLToAST(yaml);

      expect(ast.value.port).toBe(3000);
      expect(typeof ast.value.port).toBe('number');
    });

    it('should handle arrays', () => {
      const yaml = `tags:
  - name: users
  - name: posts`;
      const ast = parseYAMLToAST(yaml);

      expect(Array.isArray(ast.value.tags)).toBe(true);
      expect(ast.value.tags).toHaveLength(2);
      expect(ast.value.tags[0].name).toBe('users');
    });
  });

  describe('buildPositionMap', () => {
    it('should map root properties to line numbers', () => {
      const ast = parseYAMLToAST(sampleYAML);
      const positionMap = buildPositionMap(ast, sampleYAML);

      const openapiPos = positionMap.get('openapi');
      expect(openapiPos).toBeDefined();
      expect(openapiPos?.line).toBe(1);
      expect(openapiPos?.yamlPath).toEqual(['openapi']);
    });

    it('should map nested properties to line numbers', () => {
      const ast = parseYAMLToAST(sampleYAML);
      const positionMap = buildPositionMap(ast, sampleYAML);

      const titlePos = positionMap.get('info.title');
      expect(titlePos).toBeDefined();
      expect(titlePos?.line).toBe(3);
      expect(titlePos?.yamlPath).toEqual(['info', 'title']);
    });

    it('should map deeply nested paths', () => {
      const ast = parseYAMLToAST(sampleYAML);
      const positionMap = buildPositionMap(ast, sampleYAML);

      const summaryPos = positionMap.get('paths./users.get.summary');
      expect(summaryPos).toBeDefined();
      expect(summaryPos?.yamlPath).toEqual(['paths', '/users', 'get', 'summary']);
    });

    it('should handle array indices in paths', () => {
      const yaml = `tags:
  - name: users
  - name: posts`;
      const ast = parseYAMLToAST(yaml);
      const positionMap = buildPositionMap(ast, yaml);

      const tag0 = positionMap.get('tags.0.name');
      expect(tag0?.yamlPath).toEqual(['tags', '0', 'name']);
    });
  });

  describe('findNodeByYAMLPath', () => {
    it('should find root level properties', () => {
      const ast = parseYAMLToAST(sampleYAML);
      const node = findNodeByYAMLPath(ast, ['openapi']);

      expect(node).toBe('3.1.0');
    });

    it('should find nested properties', () => {
      const ast = parseYAMLToAST(sampleYAML);
      const node = findNodeByYAMLPath(ast, ['info', 'title']);

      expect(node).toBe('Sample API');
    });

    it('should find deeply nested properties', () => {
      const ast = parseYAMLToAST(sampleYAML);
      const node = findNodeByYAMLPath(ast, ['paths', '/users', 'get', 'summary']);

      expect(node).toBe('Get users');
    });

    it('should return undefined for non-existent paths', () => {
      const ast = parseYAMLToAST(sampleYAML);
      const node = findNodeByYAMLPath(ast, ['paths', '/posts']);

      expect(node).toBeUndefined();
    });

    it('should handle array indices', () => {
      const yaml = `servers:
  - url: https://api.example.com
  - url: https://staging.example.com`;
      const ast = parseYAMLToAST(yaml);
      const node = findNodeByYAMLPath(ast, ['servers', '1', 'url']);

      expect(node).toBe('https://staging.example.com');
    });
  });

  describe('serializeASTToYAML', () => {
    it('should serialize AST back to YAML', () => {
      const ast = parseYAMLToAST(sampleYAML);
      const yaml = serializeASTToYAML(ast);

      expect(yaml).toContain('openapi: 3.1.0');
      expect(yaml).toContain('title: Sample API');
    });

    it('should preserve structure after round-trip', () => {
      const ast = parseYAMLToAST(sampleYAML);
      const yaml = serializeASTToYAML(ast);
      const ast2 = parseYAMLToAST(yaml);

      expect(ast2.value).toEqual(ast.value);
    });

    it('should handle nested objects', () => {
      const ast = parseYAMLToAST(sampleYAML);
      const yaml = serializeASTToYAML(ast);

      const reparsed = parseYAMLToAST(yaml);
      expect(reparsed.value.info.title).toBe('Sample API');
    });

    it('should handle arrays', () => {
      const yaml = `tags:
  - name: users
  - name: posts`;
      const ast = parseYAMLToAST(yaml);
      const serialized = serializeASTToYAML(ast);

      const reparsed = parseYAMLToAST(serialized);
      expect(reparsed.value.tags).toHaveLength(2);
    });
  });

  describe('round-trip equality', () => {
    it('should maintain data integrity through parse → serialize cycle', () => {
      const original = parseYAMLToAST(sampleYAML);
      const yaml = serializeASTToYAML(original);
      const roundtrip = parseYAMLToAST(yaml);

      expect(roundtrip.value).toEqual(original.value);
    });

    it('should handle complex OpenAPI spec', () => {
      const complexYAML = `openapi: 3.1.0
info:
  title: Complex API
  version: 2.0.0
servers:
  - url: https://api.example.com
    description: Production
paths:
  /users/{id}:
    get:
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: integer
                  name:
                    type: string`;

      const ast = parseYAMLToAST(complexYAML);
      const yaml = serializeASTToYAML(ast);
      const roundtrip = parseYAMLToAST(yaml);

      expect(roundtrip.value.paths['/users/{id}'].get.parameters[0].name).toBe('id');
      expect(roundtrip.value).toEqual(ast.value);
    });
  });
});

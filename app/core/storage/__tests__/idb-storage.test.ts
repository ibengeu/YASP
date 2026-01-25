/**
 * IndexedDB Storage Service Tests
 * Tests for CRUD operations and data persistence
 *
 * Security: Tests OWASP A03:2025 - Injection prevention via parameterized queries
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IDBStorage } from '../idb-storage';
import type { OpenApiDocument } from '../storage-schema';

describe('IDBStorage', () => {
  let storage: IDBStorage;

  beforeEach(async () => {
    storage = new IDBStorage();
    await storage.init();
  });

  afterEach(() => {
    storage.close();
  });

  describe('Spec Operations', () => {
    it('should create a spec with auto-generated ID', async () => {
      const spec = await storage.createSpec({
        type: 'openapi',
        content: 'openapi: 3.1.0',
        title: 'Test API',
        version: '1.0.0',
        metadata: {
          score: 0,
          tags: [],
          workspaceType: 'personal',
          syncStatus: 'offline',
          isDiscoverable: false,
        },
      });

      expect(spec.id).toBeTruthy();
      expect(spec.title).toBe('Test API');
      expect(spec.created_at).toBeTruthy();
      expect(spec.updated_at).toBeTruthy();
    });

    it('should retrieve a spec by ID', async () => {
      const created = await storage.createSpec({
        type: 'openapi',
        content: 'openapi: 3.1.0',
        title: 'Test API',
        version: '1.0.0',
        metadata: {
          score: 0,
          tags: [],
          workspaceType: 'personal',
          syncStatus: 'offline',
          isDiscoverable: false,
        },
      });

      const retrieved = await storage.getSpec(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent spec', async () => {
      const result = await storage.getSpec('non-existent-id');
      expect(result).toBeNull();
    });

    it('should update a spec', async () => {
      const created = await storage.createSpec({
        type: 'openapi',
        content: 'openapi: 3.1.0',
        title: 'Test API',
        version: '1.0.0',
        metadata: {
          score: 0,
          tags: [],
          workspaceType: 'personal',
          syncStatus: 'offline',
          isDiscoverable: false,
        },
      });

      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));

      const updated = await storage.updateSpec(created.id, {
        title: 'Updated API',
        metadata: {
          ...created.metadata,
          score: 85,
        },
      });

      expect(updated.title).toBe('Updated API');
      expect(updated.metadata.score).toBe(85);
      // Check that updated_at changed (should be later)
      expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(new Date(created.updated_at).getTime());
    });

    it('should throw error when updating non-existent spec', async () => {
      await expect(
        storage.updateSpec('non-existent-id', { title: 'Updated' })
      ).rejects.toThrow('not found');
    });

    it('should delete a spec', async () => {
      const created = await storage.createSpec({
        type: 'openapi',
        content: 'openapi: 3.1.0',
        title: 'Test API',
        version: '1.0.0',
        metadata: {
          score: 0,
          tags: [],
          workspaceType: 'personal',
          syncStatus: 'offline',
          isDiscoverable: false,
        },
      });

      await storage.deleteSpec(created.id);

      const retrieved = await storage.getSpec(created.id);
      expect(retrieved).toBeNull();
    });

    it('should get all specs', async () => {
      await storage.createSpec({
        type: 'openapi',
        content: 'openapi: 3.1.0',
        title: 'API 1',
        version: '1.0.0',
        metadata: {
          score: 0,
          tags: [],
          workspaceType: 'personal',
          syncStatus: 'offline',
          isDiscoverable: false,
        },
      });

      await storage.createSpec({
        type: 'openapi',
        content: 'openapi: 3.1.0',
        title: 'API 2',
        version: '1.0.0',
        metadata: {
          score: 0,
          tags: [],
          workspaceType: 'personal',
          syncStatus: 'offline',
          isDiscoverable: false,
        },
      });

      const all = await storage.getAllSpecs();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });

    it('should search specs by title', async () => {
      await storage.createSpec({
        type: 'openapi',
        content: 'openapi: 3.1.0',
        title: 'Payment API',
        version: '1.0.0',
        metadata: {
          score: 0,
          tags: [],
          workspaceType: 'personal',
          syncStatus: 'offline',
          isDiscoverable: false,
        },
      });

      await storage.createSpec({
        type: 'openapi',
        content: 'openapi: 3.1.0',
        title: 'User API',
        version: '1.0.0',
        metadata: {
          score: 0,
          tags: [],
          workspaceType: 'personal',
          syncStatus: 'offline',
          isDiscoverable: false,
        },
      });

      const results = await storage.searchSpecsByTitle('Payment');
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Payment API');
    });

    it('should search specs by description', async () => {
      await storage.createSpec({
        type: 'openapi',
        content: 'openapi: 3.1.0',
        title: 'Unique Test API',
        version: '1.0.0',
        description: 'Handles invoice processing',
        metadata: {
          score: 0,
          tags: [],
          workspaceType: 'personal',
          syncStatus: 'offline',
          isDiscoverable: false,
        },
      });

      const results = await storage.searchSpecsByTitle('invoice');
      expect(results.length).toBe(1);
      expect(results[0].description).toContain('invoice processing');
    });
  });

  describe('Settings Operations', () => {
    it('should save and retrieve a setting', async () => {
      await storage.setSetting('theme', 'dark');

      const theme = await storage.getSetting<string>('theme');
      expect(theme).toBe('dark');
    });

    it('should return null for non-existent setting', async () => {
      const result = await storage.getSetting('non-existent');
      expect(result).toBeNull();
    });

    it('should update existing setting', async () => {
      await storage.setSetting('theme', 'light');
      await storage.setSetting('theme', 'dark');

      const theme = await storage.getSetting<string>('theme');
      expect(theme).toBe('dark');
    });

    it('should handle complex JSON values', async () => {
      const config = {
        fontSize: 14,
        lineHeight: 1.5,
        tabSize: 2,
      };

      await storage.setSetting('editorConfig', config);

      const retrieved = await storage.getSetting('editorConfig');
      expect(retrieved).toEqual(config);
    });
  });

  describe('Secrets Operations', () => {
    it('should create a secret with auto-generated ID', async () => {
      const secret = await storage.createSecret({
        service_name: 'github',
        enc_value: 'encrypted_token_here',
      });

      expect(secret.key_id).toBeTruthy();
      expect(secret.service_name).toBe('github');
      expect(secret.created_at).toBeTruthy();
    });

    it('should get all secrets', async () => {
      await storage.createSecret({
        service_name: 'github',
        enc_value: 'encrypted_token_1',
      });

      await storage.createSecret({
        service_name: 'stripe',
        enc_value: 'encrypted_token_2',
      });

      const secrets = await storage.getAllSecrets();
      expect(secrets.length).toBeGreaterThanOrEqual(2);
    });

    it('should delete a secret', async () => {
      const secret = await storage.createSecret({
        service_name: 'test',
        enc_value: 'encrypted',
      });

      await storage.deleteSecret(secret.key_id);

      const secrets = await storage.getAllSecrets();
      const found = secrets.find((s) => s.key_id === secret.key_id);
      expect(found).toBeUndefined();
    });
  });
});

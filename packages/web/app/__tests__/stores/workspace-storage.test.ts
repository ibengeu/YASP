/**
 * TDD Cycle 1: IDB Workspace CRUD operations
 * Tests written FIRST — implementation follows
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IDBStorage } from '@yasp/core/core/storage/idb-storage';

describe('IDBStorage — Workspace CRUD', () => {
  let storage: IDBStorage;

  beforeEach(async () => {
    // Delete existing DB to avoid test leakage
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('yasp_db_v1');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    storage = new IDBStorage();
    await storage.init();
  });

  afterEach(() => {
    storage.close();
  });

  describe('createWorkspaceDoc', () => {
    it('should create a workspace with auto-generated id and timestamps', async () => {
      const ws = await storage.createWorkspaceDoc({
        name: 'My Project',
        description: 'Test workspace',
        specIds: [],
        isDefault: false,
      });

      expect(ws.id).toBeDefined();
      expect(ws.name).toBe('My Project');
      expect(ws.description).toBe('Test workspace');
      expect(ws.specIds).toEqual([]);
      expect(ws.isDefault).toBe(false);
      expect(ws.createdAt).toBeDefined();
      expect(ws.updatedAt).toBeDefined();
    });

    it('should persist workspace to IDB', async () => {
      const ws = await storage.createWorkspaceDoc({
        name: 'Persisted WS',
        specIds: [],
        isDefault: false,
      });

      const fetched = await storage.getWorkspaceDoc(ws.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.name).toBe('Persisted WS');
    });
  });

  describe('getWorkspaceDoc', () => {
    it('should return null for non-existent id', async () => {
      const result = await storage.getWorkspaceDoc('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getAllWorkspaceDocs', () => {
    it('should return empty array when no workspaces exist', async () => {
      const all = await storage.getAllWorkspaceDocs();
      expect(all).toEqual([]);
    });

    it('should return all created workspaces', async () => {
      await storage.createWorkspaceDoc({ name: 'WS1', specIds: [], isDefault: true });
      await storage.createWorkspaceDoc({ name: 'WS2', specIds: [], isDefault: false });

      const all = await storage.getAllWorkspaceDocs();
      expect(all).toHaveLength(2);
      expect(all.map((w) => w.name).sort()).toEqual(['WS1', 'WS2']);
    });
  });

  describe('updateWorkspaceDoc', () => {
    it('should update name and bump updatedAt', async () => {
      const ws = await storage.createWorkspaceDoc({
        name: 'Original',
        specIds: [],
        isDefault: false,
      });

      const updated = await storage.updateWorkspaceDoc(ws.id, { name: 'Renamed' });

      expect(updated.name).toBe('Renamed');
      expect(updated.id).toBe(ws.id);
      expect(updated.createdAt).toBe(ws.createdAt);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(ws.updatedAt).getTime()
      );
    });

    it('should throw for non-existent workspace', async () => {
      await expect(
        storage.updateWorkspaceDoc('bogus', { name: 'Fail' })
      ).rejects.toThrow('not found');
    });

    it('should preserve id and createdAt', async () => {
      const ws = await storage.createWorkspaceDoc({
        name: 'Keep',
        specIds: ['s1'],
        isDefault: false,
      });

      const updated = await storage.updateWorkspaceDoc(ws.id, { specIds: ['s1', 's2'] });

      expect(updated.id).toBe(ws.id);
      expect(updated.createdAt).toBe(ws.createdAt);
      expect(updated.specIds).toEqual(['s1', 's2']);
    });
  });

  describe('deleteWorkspaceDoc', () => {
    it('should remove workspace from store', async () => {
      const ws = await storage.createWorkspaceDoc({
        name: 'ToDelete',
        specIds: [],
        isDefault: false,
      });

      await storage.deleteWorkspaceDoc(ws.id);
      const result = await storage.getWorkspaceDoc(ws.id);
      expect(result).toBeNull();
    });
  });

  describe('removeSpecFromWorkspaces', () => {
    it('should remove specId from all workspaces containing it', async () => {
      const ws1 = await storage.createWorkspaceDoc({
        name: 'WS1',
        specIds: ['spec-a', 'spec-b'],
        isDefault: false,
      });
      const ws2 = await storage.createWorkspaceDoc({
        name: 'WS2',
        specIds: ['spec-b', 'spec-c'],
        isDefault: false,
      });

      await storage.removeSpecFromWorkspaces('spec-b');

      const updated1 = await storage.getWorkspaceDoc(ws1.id);
      const updated2 = await storage.getWorkspaceDoc(ws2.id);

      expect(updated1!.specIds).toEqual(['spec-a']);
      expect(updated2!.specIds).toEqual(['spec-c']);
    });

    it('should leave workspaces unchanged if specId not present', async () => {
      const ws = await storage.createWorkspaceDoc({
        name: 'WS',
        specIds: ['spec-x'],
        isDefault: false,
      });

      await storage.removeSpecFromWorkspaces('spec-missing');

      const fetched = await storage.getWorkspaceDoc(ws.id);
      expect(fetched!.specIds).toEqual(['spec-x']);
    });
  });
});

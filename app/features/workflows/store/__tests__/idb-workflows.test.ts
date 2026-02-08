import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IDBStorage } from '@/core/storage/idb-storage';

describe('IDB Workflow CRUD', () => {
  let storage: IDBStorage;

  beforeEach(async () => {
    // Delete existing DB to ensure clean state
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

  it('should create a workflow with generated id and timestamps', async () => {
    const workflow = await storage.createWorkflow({
      name: 'My Workflow',
      steps: [],
      serverUrl: 'https://api.example.com',
    });

    expect(workflow.id).toBeTruthy();
    expect(workflow.name).toBe('My Workflow');
    expect(workflow.created_at).toBeTruthy();
    expect(workflow.updated_at).toBeTruthy();
  });

  it('should get a workflow by id', async () => {
    const created = await storage.createWorkflow({
      name: 'My Workflow',
      steps: [],
      serverUrl: 'https://api.example.com',
    });

    const retrieved = await storage.getWorkflow(created.id);
    expect(retrieved).toEqual(created);
  });

  it('should return null for non-existent workflow', async () => {
    const result = await storage.getWorkflow('non-existent');
    expect(result).toBeNull();
  });

  it('should get all workflows', async () => {
    await storage.createWorkflow({
      name: 'Workflow A',
      steps: [],
      serverUrl: 'https://api.example.com',
    });
    await storage.createWorkflow({
      name: 'Workflow B',
      steps: [],
      serverUrl: 'https://api.example.com',
    });

    const all = await storage.getAllWorkflows();
    expect(all).toHaveLength(2);
    expect(all.map(w => w.name).sort()).toEqual(['Workflow A', 'Workflow B']);
  });

  it('should update a workflow', async () => {
    const created = await storage.createWorkflow({
      name: 'Original',
      steps: [],
      serverUrl: 'https://api.example.com',
    });

    // Use fake timers to guarantee different timestamp
    const laterTime = new Date(Date.now() + 10000).toISOString();
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValueOnce(laterTime);

    const updated = await storage.updateWorkflow(created.id, {
      name: 'Updated',
      steps: [
        {
          id: 's1',
          order: 0,
          name: 'Step 1',
          request: { method: 'GET', path: '/test', headers: {}, queryParams: {} },
          extractions: [],
        },
      ],
    });

    vi.restoreAllMocks();

    expect(updated.name).toBe('Updated');
    expect(updated.steps).toHaveLength(1);
    expect(updated.id).toBe(created.id);
    expect(updated.created_at).toBe(created.created_at);
    expect(updated.updated_at).toBe(laterTime);
  });

  it('should throw when updating non-existent workflow', async () => {
    await expect(
      storage.updateWorkflow('non-existent', { name: 'Test' })
    ).rejects.toThrow('Workflow with id non-existent not found');
  });

  it('should delete a workflow', async () => {
    const created = await storage.createWorkflow({
      name: 'To Delete',
      steps: [],
      serverUrl: 'https://api.example.com',
    });

    await storage.deleteWorkflow(created.id);
    const result = await storage.getWorkflow(created.id);
    expect(result).toBeNull();
  });

  describe('removeSpecFromWorkflows', () => {
    it('should delete workflow entirely if all steps reference the deleted spec', async () => {
      const wf = await storage.createWorkflow({
        name: 'WF 1',
        steps: [
          {
            id: 's1', order: 0, name: 'Step 1',
            request: { method: 'GET', path: '/test', headers: {}, queryParams: {} },
            extractions: [],
            specEndpoint: { specId: 'spec-1', path: '/test', method: 'get' },
          },
        ],
        serverUrl: 'https://api.example.com',
      });

      await storage.removeSpecFromWorkflows('spec-1');

      const result = await storage.getWorkflow(wf.id);
      expect(result).toBeNull();
    });

    it('should remove only steps referencing the deleted spec and keep others', async () => {
      const wf = await storage.createWorkflow({
        name: 'Mixed WF',
        steps: [
          {
            id: 's1', order: 0, name: 'From Spec 1',
            request: { method: 'GET', path: '/a', headers: {}, queryParams: {} },
            extractions: [],
            specEndpoint: { specId: 'spec-1', path: '/a', method: 'get' },
          },
          {
            id: 's2', order: 1, name: 'From Spec 2',
            request: { method: 'POST', path: '/b', headers: {}, queryParams: {} },
            extractions: [],
            specEndpoint: { specId: 'spec-2', path: '/b', method: 'post' },
          },
        ],
        serverUrl: 'https://api.example.com',
      });

      await storage.removeSpecFromWorkflows('spec-1');

      const updated = await storage.getWorkflow(wf.id);
      expect(updated).not.toBeNull();
      expect(updated!.steps).toHaveLength(1);
      expect(updated!.steps[0].specEndpoint?.specId).toBe('spec-2');
      expect(updated!.steps[0].order).toBe(0); // Reindexed
    });

    it('should not touch workflows with no matching steps', async () => {
      const wf = await storage.createWorkflow({
        name: 'Unrelated WF',
        steps: [
          {
            id: 's1', order: 0, name: 'From Spec 3',
            request: { method: 'GET', path: '/c', headers: {}, queryParams: {} },
            extractions: [],
            specEndpoint: { specId: 'spec-3', path: '/c', method: 'get' },
          },
        ],
        serverUrl: 'https://api.example.com',
      });

      await storage.removeSpecFromWorkflows('spec-1');

      const result = await storage.getWorkflow(wf.id);
      expect(result).not.toBeNull();
      expect(result!.steps).toHaveLength(1);
    });
  });
});

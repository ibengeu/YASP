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
      specId: 'spec-1',
      name: 'My Workflow',
      steps: [],
      serverUrl: 'https://api.example.com',
    });

    expect(workflow.id).toBeTruthy();
    expect(workflow.specId).toBe('spec-1');
    expect(workflow.name).toBe('My Workflow');
    expect(workflow.created_at).toBeTruthy();
    expect(workflow.updated_at).toBeTruthy();
  });

  it('should get a workflow by id', async () => {
    const created = await storage.createWorkflow({
      specId: 'spec-1',
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

  it('should get workflows by specId', async () => {
    await storage.createWorkflow({
      specId: 'spec-1',
      name: 'Workflow A',
      steps: [],
      serverUrl: 'https://api.example.com',
    });
    await storage.createWorkflow({
      specId: 'spec-1',
      name: 'Workflow B',
      steps: [],
      serverUrl: 'https://api.example.com',
    });
    await storage.createWorkflow({
      specId: 'spec-2',
      name: 'Workflow C',
      steps: [],
      serverUrl: 'https://api.example.com',
    });

    const spec1Workflows = await storage.getWorkflowsBySpecId('spec-1');
    expect(spec1Workflows).toHaveLength(2);
    expect(spec1Workflows.map(w => w.name).sort()).toEqual(['Workflow A', 'Workflow B']);

    const spec2Workflows = await storage.getWorkflowsBySpecId('spec-2');
    expect(spec2Workflows).toHaveLength(1);
  });

  it('should update a workflow', async () => {
    const created = await storage.createWorkflow({
      specId: 'spec-1',
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
      specId: 'spec-1',
      name: 'To Delete',
      steps: [],
      serverUrl: 'https://api.example.com',
    });

    await storage.deleteWorkflow(created.id);
    const result = await storage.getWorkflow(created.id);
    expect(result).toBeNull();
  });

  it('should cascade delete workflows by specId', async () => {
    await storage.createWorkflow({
      specId: 'spec-1',
      name: 'WF 1',
      steps: [],
      serverUrl: 'https://api.example.com',
    });
    await storage.createWorkflow({
      specId: 'spec-1',
      name: 'WF 2',
      steps: [],
      serverUrl: 'https://api.example.com',
    });
    await storage.createWorkflow({
      specId: 'spec-2',
      name: 'WF 3',
      steps: [],
      serverUrl: 'https://api.example.com',
    });

    await storage.deleteWorkflowsBySpecId('spec-1');

    const remaining = await storage.getWorkflowsBySpecId('spec-1');
    expect(remaining).toHaveLength(0);

    const untouched = await storage.getWorkflowsBySpecId('spec-2');
    expect(untouched).toHaveLength(1);
  });
});

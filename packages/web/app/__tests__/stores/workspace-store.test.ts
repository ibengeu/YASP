/**
 * TDD Cycle 2: Zustand Workspace Store
 * Tests for store actions, active workspace, spec management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useWorkspaceStore } from '@yasp/core/stores/workspace-store';
import { IDBStorage } from '@yasp/core/core/storage/idb-storage';

// Real IDB via fake-indexeddb
let storage: IDBStorage;

beforeEach(async () => {
  localStorage.clear();
  if (storage) storage.close();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('yasp_db_v1');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
  storage = new IDBStorage();
  await storage.init();
  useWorkspaceStore.setState({
    workspaces: [],
    activeWorkspaceId: null,
    isLoaded: false,
  });
});

afterEach(() => {
  storage.close();
});

describe('useWorkspaceStore', () => {
  describe('loadWorkspaces', () => {
    it('should load workspaces from IDB and set isLoaded', async () => {
      await storage.createWorkspaceDoc({ name: 'WS1', specIds: [], isDefault: true });

      await useWorkspaceStore.getState().loadWorkspaces(storage);

      const state = useWorkspaceStore.getState();
      expect(state.isLoaded).toBe(true);
      expect(state.workspaces).toHaveLength(1);
      expect(state.workspaces[0].name).toBe('WS1');
    });
  });

  describe('ensureDefaultWorkspace', () => {
    it('should create default "Personal" workspace if none exist', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);

      const state = useWorkspaceStore.getState();
      expect(state.workspaces).toHaveLength(1);
      expect(state.workspaces[0].name).toBe('Personal');
      expect(state.workspaces[0].isDefault).toBe(true);
      expect(state.activeWorkspaceId).toBe(state.workspaces[0].id);
    });

    it('should not create another default if one already exists', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);

      const state = useWorkspaceStore.getState();
      expect(state.workspaces).toHaveLength(1);
    });
  });

  describe('createWorkspace', () => {
    it('should add a new workspace and persist to IDB', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);
      await useWorkspaceStore.getState().createWorkspace(storage, 'Project Alpha');

      const state = useWorkspaceStore.getState();
      expect(state.workspaces).toHaveLength(2);
      expect(state.workspaces.find((w) => w.name === 'Project Alpha')).toBeDefined();

      const allDocs = await storage.getAllWorkspaceDocs();
      expect(allDocs).toHaveLength(2);
    });

    it('should reject a duplicate name (case-insensitive)', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);
      await useWorkspaceStore.getState().createWorkspace(storage, 'Team APIs');

      await expect(
        useWorkspaceStore.getState().createWorkspace(storage, 'team apis')
      ).rejects.toThrow(/already exists/i);

      expect(useWorkspaceStore.getState().workspaces).toHaveLength(2);
    });

    it('should trim whitespace from the name before duplicate check', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);
      await useWorkspaceStore.getState().createWorkspace(storage, 'My Collection');

      await expect(
        useWorkspaceStore.getState().createWorkspace(storage, '  My Collection  ')
      ).rejects.toThrow(/already exists/i);
    });
  });

  describe('addSpecToWorkspace', () => {
    it('should add spec to workspace specIds', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);
      const wsId = useWorkspaceStore.getState().activeWorkspaceId!;

      await useWorkspaceStore.getState().addSpecToWorkspace(storage, wsId, 'spec-1');

      const ws = useWorkspaceStore.getState().workspaces.find((w) => w.id === wsId)!;
      expect(ws.specIds).toContain('spec-1');
    });

    it('should not duplicate specId', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);
      const wsId = useWorkspaceStore.getState().activeWorkspaceId!;

      await useWorkspaceStore.getState().addSpecToWorkspace(storage, wsId, 'spec-1');
      await useWorkspaceStore.getState().addSpecToWorkspace(storage, wsId, 'spec-1');

      const ws = useWorkspaceStore.getState().workspaces.find((w) => w.id === wsId)!;
      expect(ws.specIds.filter((id) => id === 'spec-1')).toHaveLength(1);
    });
  });
});

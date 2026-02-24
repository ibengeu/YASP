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
  // Close previous storage if any
  if (storage) storage.close();
  // Delete existing DB to avoid test leakage
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

      // Verify IDB persistence
      const allDocs = await storage.getAllWorkspaceDocs();
      expect(allDocs).toHaveLength(2);
    });
  });

  describe('renameWorkspace', () => {
    it('should rename a workspace', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);
      await useWorkspaceStore.getState().createWorkspace(storage, 'Old Name');

      const ws = useWorkspaceStore.getState().workspaces.find((w) => w.name === 'Old Name')!;
      await useWorkspaceStore.getState().renameWorkspace(storage, ws.id, 'New Name');

      const renamed = useWorkspaceStore.getState().workspaces.find((w) => w.id === ws.id);
      expect(renamed!.name).toBe('New Name');
    });
  });

  describe('deleteWorkspace', () => {
    it('should delete a non-default workspace', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);
      await useWorkspaceStore.getState().createWorkspace(storage, 'Temp');

      const temp = useWorkspaceStore.getState().workspaces.find((w) => w.name === 'Temp')!;
      await useWorkspaceStore.getState().deleteWorkspace(storage, temp.id);

      const state = useWorkspaceStore.getState();
      expect(state.workspaces).toHaveLength(1);
      expect(state.workspaces[0].name).toBe('Personal');
    });

    it('should switch active to default when active workspace is deleted', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);
      await useWorkspaceStore.getState().createWorkspace(storage, 'Active One');

      const active = useWorkspaceStore.getState().workspaces.find((w) => w.name === 'Active One')!;
      useWorkspaceStore.setState({ activeWorkspaceId: active.id });

      await useWorkspaceStore.getState().deleteWorkspace(storage, active.id);

      const state = useWorkspaceStore.getState();
      const defaultWs = state.workspaces.find((w) => w.isDefault);
      expect(state.activeWorkspaceId).toBe(defaultWs!.id);
    });
  });

  describe('setActiveWorkspace', () => {
    it('should set activeWorkspaceId', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);
      await useWorkspaceStore.getState().createWorkspace(storage, 'Second');

      const second = useWorkspaceStore.getState().workspaces.find((w) => w.name === 'Second')!;
      useWorkspaceStore.getState().setActiveWorkspace(second.id);

      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(second.id);
    });
  });

  describe('addSpecToWorkspace / removeSpecFromWorkspace', () => {
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

    it('should remove spec from workspace specIds', async () => {
      await useWorkspaceStore.getState().ensureDefaultWorkspace(storage);
      const wsId = useWorkspaceStore.getState().activeWorkspaceId!;

      await useWorkspaceStore.getState().addSpecToWorkspace(storage, wsId, 'spec-1');
      await useWorkspaceStore.getState().removeSpecFromWorkspace(storage, wsId, 'spec-1');

      const ws = useWorkspaceStore.getState().workspaces.find((w) => w.id === wsId)!;
      expect(ws.specIds).not.toContain('spec-1');
    });
  });
});

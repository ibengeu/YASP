import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkspaceDocument } from '@/core/storage/storage-schema';
import type { IDBStorage } from '@/core/storage/idb-storage';

interface WorkspaceStore {
  workspaces: WorkspaceDocument[];
  activeWorkspaceId: string | null;
  isLoaded: boolean;

  loadWorkspaces: (storage: IDBStorage) => Promise<void>;
  ensureDefaultWorkspace: (storage: IDBStorage) => Promise<void>;
  createWorkspace: (storage: IDBStorage, name: string, description?: string) => Promise<WorkspaceDocument>;
  addSpecToWorkspace: (storage: IDBStorage, workspaceId: string, specId: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      isLoaded: false,

      loadWorkspaces: async (storage) => {
        const workspaces = await storage.getAllWorkspaceDocs();
        set({ workspaces, isLoaded: true });
      },

      ensureDefaultWorkspace: async (storage) => {
        await get().loadWorkspaces(storage);
        const { workspaces } = get();

        if (workspaces.some((w) => w.isDefault)) return;

        const defaultWs = await storage.createWorkspaceDoc({
          name: 'Personal',
          specIds: [],
          isDefault: true,
        });

        set((state) => ({
          workspaces: [...state.workspaces, defaultWs],
          activeWorkspaceId: state.activeWorkspaceId ?? defaultWs.id,
        }));
      },

      createWorkspace: async (storage, name, description) => {
        const { workspaces } = get();
        const nameLower = name.trim().toLowerCase();

        if (workspaces.some((w) => w.name.trim().toLowerCase() === nameLower)) {
          throw new Error(`A collection named "${name}" already exists.`);
        }

        const ws = await storage.createWorkspaceDoc({
          name: name.trim(),
          description,
          specIds: [],
          isDefault: false,
        });

        set((state) => ({ workspaces: [...state.workspaces, ws] }));
        return ws;
      },

      addSpecToWorkspace: async (storage, workspaceId, specId) => {
        const ws = get().workspaces.find((w) => w.id === workspaceId);
        if (!ws) return;
        if (ws.specIds.includes(specId)) return;

        const updatedSpecIds = [...ws.specIds, specId];
        await storage.updateWorkspaceDoc(workspaceId, { specIds: updatedSpecIds });
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, specIds: updatedSpecIds } : w
          ),
        }));
      },
    }),
    {
      name: 'yasp-workspace',
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
    }
  )
);

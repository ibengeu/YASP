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
  renameWorkspace: (storage: IDBStorage, id: string, name: string) => Promise<void>;
  deleteWorkspace: (storage: IDBStorage, id: string) => Promise<void>;
  setActiveWorkspace: (id: string) => void;
  addSpecToWorkspace: (storage: IDBStorage, workspaceId: string, specId: string) => Promise<void>;
  removeSpecFromWorkspace: (storage: IDBStorage, workspaceId: string, specId: string) => Promise<void>;
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
        const ws = await storage.createWorkspaceDoc({
          name,
          description,
          specIds: [],
          isDefault: false,
        });

        set((state) => ({ workspaces: [...state.workspaces, ws] }));
        return ws;
      },

      renameWorkspace: async (storage, id, name) => {
        await storage.updateWorkspaceDoc(id, { name });
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === id ? { ...w, name } : w
          ),
        }));
      },

      deleteWorkspace: async (storage, id) => {
        await storage.deleteWorkspaceDoc(id);
        set((state) => {
          const remaining = state.workspaces.filter((w) => w.id !== id);
          const needsSwitch = state.activeWorkspaceId === id;
          const defaultWs = remaining.find((w) => w.isDefault);
          return {
            workspaces: remaining,
            activeWorkspaceId: needsSwitch
              ? (defaultWs?.id ?? remaining[0]?.id ?? null)
              : state.activeWorkspaceId,
          };
        });
      },

      setActiveWorkspace: (id) => {
        set({ activeWorkspaceId: id });
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

      removeSpecFromWorkspace: async (storage, workspaceId, specId) => {
        const ws = get().workspaces.find((w) => w.id === workspaceId);
        if (!ws) return;

        const updatedSpecIds = ws.specIds.filter((id) => id !== specId);
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

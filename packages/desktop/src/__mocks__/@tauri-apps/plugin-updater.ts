// Stub for @tauri-apps/plugin-updater — overridden in tests via vi.mock()
export const check = () => Promise.resolve(null);
export type Update = {
  available: boolean;
  version: string;
  body?: string;
  downloadAndInstall: () => Promise<void>;
};

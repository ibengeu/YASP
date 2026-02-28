import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({ projects: ['./tsconfig.json', '../core/tsconfig.json'] }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      // Tauri plugins are unavailable in jsdom — alias to empty mocks so vi.mock() can take over.
      '@tauri-apps/plugin-updater': path.resolve(__dirname, 'src/__mocks__/@tauri-apps/plugin-updater.ts'),
      '@tauri-apps/plugin-process': path.resolve(__dirname, 'src/__mocks__/@tauri-apps/plugin-process.ts'),
      '@tauri-apps/api/core': path.resolve(__dirname, 'src/__mocks__/@tauri-apps/api/core.ts'),
    },
  },
});

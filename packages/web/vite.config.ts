import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
    plugins: [
        // Only load React Router plugin in non-test mode to avoid preamble errors
        mode !== 'test' && reactRouter(),
        tailwindcss(),
        tsconfigPaths({ projects: ['./tsconfig.json', '../core/tsconfig.json'] }),
    ].filter(Boolean) as any,
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        globals: true,
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/e2e/**',
            '**/.{idea,git,cache,output,temp}/**',
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        // OWASP A04:2025 - Insecure Design: Ensure consistent module resolution
        dedupe: ['@codemirror/state', '@codemirror/view', 'react-router'],
    },
    optimizeDeps: {
        // Pre-bundle CodeMirror packages to avoid instanceof issues
        include: [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/lang-yaml',
            '@codemirror/lang-json',
            '@codemirror/commands',
            '@codemirror/search',
            '@codemirror/autocomplete',
            '@codemirror/lint',
            '@codemirror/theme-one-dark',
        ],
    },
}));
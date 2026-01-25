import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => ({
    plugins: [
        // Only load React Router plugin in non-test mode to avoid preamble errors
        mode !== 'test' && reactRouter(),
        tailwindcss(),
        tsconfigPaths()
    ].filter(Boolean),
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
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./app"),
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
}));
/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import {defineConfig} from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import path from "path"

export default defineConfig({
    plugins: [tailwindcss(), react(), tsconfigPaths()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        globals: true, // Optional: Allows using `it`, `expect` without imports
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },

});
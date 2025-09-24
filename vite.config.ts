import {defineConfig} from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react-swc";
import path from "path"

export default defineConfig(async () => {
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    return {
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
            extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
    };
});
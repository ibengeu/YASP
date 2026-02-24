import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

const coreRoot = path.resolve(__dirname, "../core/src");
const desktopSrc = path.resolve(__dirname, "src");

/**
 * Context-aware @/ alias resolver for monorepo.
 *
 * Problem: @yasp/core files use `@/` to mean `core/src/`, but this Vite
 * instance is rooted in `packages/desktop/`. Without special handling, Vite
 * would resolve `@/` to `desktop/src/` for all files, breaking core imports.
 *
 * Solution: When the importing file lives inside core/src (or is the core
 * symlink), resolve `@/` to `core/src/`. Otherwise use `desktop/src/`.
 */
function contextualAlias(): Plugin {
    return {
        name: "yasp-contextual-alias",
        resolveId(id, importer) {
            if (!id.startsWith("@/")) return null;

            const suffix = id.slice(2); // strip "@/"

            // Determine if the importer is inside core's source tree.
            // Handle both the real path and the symlinked path through node_modules.
            const isFromCore =
                importer &&
                (importer.includes(coreRoot) ||
                    importer.includes("/packages/core/src/") ||
                    importer.includes("@yasp/core/"));

            const base = isFromCore ? coreRoot : desktopSrc;
            const resolved = path.resolve(base, suffix);

            // Try common extensions
            const exts = [".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"];
            for (const ext of exts) {
                const candidate = resolved + ext;
                if (fs.existsSync(candidate)) return candidate;
            }
            // Return without extension — let Vite handle it
            if (fs.existsSync(resolved)) return resolved;

            return null;
        },
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        contextualAlias(),
        // Include core/src so SWC injects HMR preamble for files served via @fs/
        // Include core/src so SWC handles HMR for files served via @fs/
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        react({
            include: [
                /packages\/desktop\/src\/.*\.[jt]sx?$/,
                /packages\/core\/src\/.*\.[jt]sx?$/,
            ],
        } as any),
        tailwindcss(),
    ],
    server: {
        port: 5173,
        strictPort: true,
        host: "localhost",
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        alias: {
            // Tauri plugins live in desktop/node_modules (not hoisted to root by Bun).
            // Alias them explicitly so Vite resolves them from the correct location.
            '@tauri-apps/plugin-updater': path.resolve(__dirname, 'node_modules/@tauri-apps/plugin-updater'),
            '@tauri-apps/plugin-process': path.resolve(__dirname, 'node_modules/@tauri-apps/plugin-process'),
        },
        // OWASP A04:2025 - deduplicate shared packages across workspace symlinks
        dedupe: [
            'react',
            'react-dom',
            'react-router',
            '@codemirror/state',
            '@codemirror/view',
        ],
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router',
            '@tauri-apps/plugin-updater',
            '@tauri-apps/plugin-process',
        ],
        entries: [
            './src/main.tsx',
            './src/App.tsx',
        ],
    },
    css: {
        // Resolve CSS @import "tailwindcss" from desktop's node_modules
        // when processing core/src/styles/index.css via workspace symlink
        preprocessorOptions: {},
        devSourcemap: true,
    },
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_ENV_'],
    build: {
        target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
        minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
        sourcemap: !!process.env.TAURI_ENV_DEBUG,
        outDir: 'dist',
    },
});

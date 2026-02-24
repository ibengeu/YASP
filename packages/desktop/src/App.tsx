import { HashRouter, Routes, Route, Navigate } from "react-router";
import { AppProvider } from "@yasp/core/providers/app-provider";
import { invoke } from "@tauri-apps/api/core";
import { lazy, Suspense } from "react";
import { useUpdateCheck } from "./hooks/useUpdateCheck";

// OWASP A09:2025 – SSRF: URL validation is enforced in the Rust `fetch_spec` command.
// This function is passed as a prop so @yasp/core stays platform-agnostic.
async function tauriFetchUrl(url: string): Promise<string> {
    return invoke<string>("fetch_spec", { url });
}

// Lazy-load route pages from @yasp/core
const CatalogPage = lazy(() => import("@yasp/core/pages/CatalogPage"));
const CatalogDocsPage = lazy(() => import("@yasp/core/pages/CatalogDocsPage"));
const EditorPage = lazy(() => import("@yasp/core/pages/EditorPage"));

function Loading() {
    return (
        <div className="h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
            Loading…
        </div>
    );
}

export default function App() {
    useUpdateCheck(); // no-ops in dev; checks on every cold start in production
    return (
        // HashRouter: recommended for Tauri (avoids server-side routing issues in packaged builds)
        <HashRouter>
            <AppProvider>
                <div className="h-screen flex flex-col overflow-hidden relative">
                    {/* Ambient background */}
                    <div className="ambient-glow">
                        <div className="glow-top" />
                        <div className="glow-bottom" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <Suspense fallback={<Loading />}>
                            <Routes>
                                <Route path="/" element={<Navigate to="/catalog" replace />} />
                                <Route path="/catalog" element={<CatalogPage fetchUrl={tauriFetchUrl} />} />
                                <Route path="/catalog/:id" element={<CatalogDocsPage />} />
                                <Route path="/editor/:id" element={<EditorPage />} />
                                <Route path="*" element={<Navigate to="/catalog" replace />} />
                            </Routes>
                        </Suspense>
                    </div>
                </div>
            </AppProvider>
        </HashRouter>
    );
}

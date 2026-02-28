/**
 * AppRoutes - Shared route definitions for all platforms.
 *
 * Desktop wraps this in HashRouter.
 * Web uses React Router v7 framework routing (routes.ts) and does NOT use this file —
 * it re-exports core pages directly from routes/.
 *
 * Adding a new page? Add it here AND in packages/web/app/routes.ts.
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router';

const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const CatalogDocsPage = lazy(() => import('./pages/CatalogDocsPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const WorkbenchPage = lazy(() => import('./pages/WorkbenchPage'));

interface AppRoutesProps {
  /** Platform-specific URL fetcher (web uses a fetch proxy, desktop uses Tauri invoke). */
  fetchUrl: (url: string) => Promise<string>;
}

function Loading() {
  return (
    <div className="h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
      Loading…
    </div>
  );
}

export function AppRoutes({ fetchUrl }: AppRoutesProps) {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Navigate to="/catalog" replace />} />
        <Route path="/catalog" element={<CatalogPage fetchUrl={fetchUrl} />} />
        <Route path="/catalog/:id" element={<CatalogDocsPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="/workbench" element={<WorkbenchPage />} />
        <Route path="*" element={<Navigate to="/catalog" replace />} />
      </Routes>
    </Suspense>
  );
}

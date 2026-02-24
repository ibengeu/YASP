import { type RouteConfig, index, route } from "@react-router/dev/routes";

/**
 * Route Configuration
 *
 * Routes use AppSidebar navigation with workbench layout.
 * All routes are flat - no nested layouts.
 */
export default [
  // Dashboard - API Governance Overview
  index("routes/_index.tsx"),

  // API Catalog - Browse and manage specifications
  route("catalog", "routes/catalog.tsx"),

  // Catalog Docs - Full-page documentation view for a single spec
  route("catalog/:id", "routes/catalog.$id.tsx"),

  // Spec Editor - Edit and test API specifications
  route("editor/:id", "routes/editor.$id.tsx"),

  // Prose Documentation
  route("docs", "routes/docs.tsx"),
  route("docs/:slug", "routes/docs.$slug.tsx"),

  // API Resource Routes (server actions only, no UI)
  route("api/execute-request", "routes/api.execute-request.ts"),
  route("api/fetch-spec", "routes/api.fetch-spec.ts"),
  route("api/leads", "routes/api.leads.ts"),
] satisfies RouteConfig;

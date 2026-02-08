import { type RouteConfig, index, route } from "@react-router/dev/routes";

/**
 * Route Configuration
 *
 * Routes use CommandDeck navigation (fixed header) instead of sidebar layout.
 * All routes are flat - no nested layouts.
 */
export default [
  // Dashboard - API Governance Overview
  index("routes/_index.tsx"),

  // API Catalog - Browse and manage specifications
  route("catalog", "routes/catalog.tsx"),

  // Spec Editor - Edit and test API specifications
  route("editor/:id", "routes/editor.$id.tsx"),

  // Workflow Builder
  route("workflows/:specId", "routes/workflows.$specId.tsx"),

  // API Resource Routes (server actions only, no UI)
  route("api/execute-request", "routes/api.execute-request.ts"),
  route("api/fetch-spec", "routes/api.fetch-spec.ts"),
] satisfies RouteConfig;

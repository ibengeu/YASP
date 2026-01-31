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

  // Policy Management - Configure governance rules
  route("quality-rules", "routes/quality-rules.tsx"),

  // Spec Editor - Edit and test API specifications
  route("editor/:id", "routes/editor.$id.tsx"),
] satisfies RouteConfig;

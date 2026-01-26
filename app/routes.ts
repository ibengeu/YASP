import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  // Main library/dashboard page
  index("routes/_index.tsx"),

  // TODO: Add more routes as features are implemented
  // route("spec/:id", "routes/spec.$id.tsx"),
  // route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;

import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Main library/dashboard page
  index("routes/_index.tsx"),

  // Spec editor with integrated features
  route("editor/:id", "routes/editor.$id.tsx"),
] satisfies RouteConfig;
